import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const reportsDir = resolve(root, "reports");
const args = process.argv.slice(2);

const failOnCritical =
  args.includes("--fail-on-critical") || process.env.FAIL_ON_CRITICAL === "1";
const noWrite = args.includes("--no-write");
const showHelp = args.includes("--help") || args.includes("-h");

const configuredVercelBin = process.env.VERCEL_CLI || "";
const defaultVercelBin = process.platform === "win32" ? "vercel.cmd" : "vercel";

const token = process.env.VERCEL_TOKEN || "";
const scope = process.env.VERCEL_SCOPE || "";
// Optional guardrail: set VERCEL_EXPECTED_SCOPE to warn if VERCEL_SCOPE
// ever points at the wrong team/account (e.g. a stale CI secret pointing
// at a personal account instead of an org). Empty by default so the
// check is a no-op until you opt in.
const expectedScope = process.env.VERCEL_EXPECTED_SCOPE || scope;
const expectedCliVersion = "53.1.1";
const cliVersionPin = process.env.VERCEL_GUARDIAN_CLI_VERSION || expectedCliVersion;

const commandTimeoutMs = Number(process.env.VERCEL_GUARDIAN_COMMAND_TIMEOUT_MS || 90_000);
const httpTimeoutMs = Number(process.env.VERCEL_GUARDIAN_HTTP_TIMEOUT_MS || 15_000);
const activitySince = process.env.VERCEL_GUARDIAN_ACTIVITY_SINCE || "24h";
const apiBase = process.env.VERCEL_API_BASE || "https://api.vercel.com";

let apiMode = "cli";
let activeTeamId = null;

function usage() {
  return `Vercel Guardian

Usage:
  node scripts/vercel-guardian.mjs [options]

Options:
  --fail-on-critical  Exit with code 1 when critical findings are present.
  --no-write          Print the report without writing files under reports/.
  -h, --help          Show this help without contacting Vercel or writing reports.

Environment:
  VERCEL_TOKEN                         Token for CI/non-interactive REST fallback.
  VERCEL_SCOPE                         Vercel team/account scope (required).
  VERCEL_EXPECTED_SCOPE                Optional guardrail scope to warn against drift.
  VERCEL_CLI                           Optional path to the Vercel CLI binary.
  VERCEL_GUARDIAN_CLI_VERSION          Pinned CLI version for npx fallback.
  VERCEL_GUARDIAN_COMMAND_TIMEOUT_MS   CLI command timeout in milliseconds.
  VERCEL_GUARDIAN_HTTP_TIMEOUT_MS      HTTP health-check timeout in milliseconds.
  VERCEL_GUARDIAN_ACTIVITY_SINCE       Activity window, defaults to 24h.
  FAIL_ON_CRITICAL                     Use 1 to enable strict exit behavior.
`;
}

if (showHelp) {
  console.log(usage());
  process.exit(0);
}

function vercelCommandCandidates() {
  const candidates = [];
  const add = (bin, prefixArgs = []) => {
    if (!bin) return;
    if (!candidates.some((candidate) => candidate.bin === bin && candidate.prefixArgs.join(" ") === prefixArgs.join(" "))) {
      candidates.push({ bin, prefixArgs });
    }
  };

  add(configuredVercelBin);
  add(resolve(root, "node_modules", ".bin", process.platform === "win32" ? "vercel.cmd" : "vercel"));
  add(defaultVercelBin);

  if (process.platform === "win32") {
    const appDataVercel = process.env.APPDATA
      ? resolve(process.env.APPDATA, "npm", "vercel.cmd")
      : null;
    add(appDataVercel);
    add("npx.cmd", ["--yes", `vercel@${cliVersionPin}`]);
  } else {
    add("npx", ["--yes", `vercel@${cliVersionPin}`]);
  }

  return candidates;
}

function runVercel(args, options = {}) {
  return runVercelCandidate(vercelCommandCandidates(), args, options);
}

async function runVercelCandidate(candidates, args, options = {}) {
  const errors = [];
  for (const candidate of candidates) {
    try {
      return await runVercelWithCommand(candidate, args, options);
    } catch (error) {
      errors.push(error);
      if (!isCliBootstrapError(error)) throw error;
    }
  }

  const error = errors.at(-1) || new Error("No Vercel CLI command candidates were available");
  error.candidateErrors = errors;
  throw error;
}

async function runVercelWithCommand(candidate, args, options = {}) {
  const finalArgs = [...candidate.prefixArgs, ...args];
  if (token) finalArgs.push("--token", token);
  if (scope) finalArgs.push("--scope", scope);
  const command =
    process.platform === "win32"
      ? process.env.ComSpec || "cmd.exe"
      : candidate.bin;
  const commandArgs =
    process.platform === "win32"
      ? ["/d", "/c", ["call", cmdCommand(candidate.bin), ...finalArgs.map(cmdArg)].join(" ")]
      : finalArgs;

  const env = {
    ...process.env,
    NO_UPDATE_NOTIFIER: process.env.NO_UPDATE_NOTIFIER || "1",
    VERCEL_TELEMETRY_DISABLED: process.env.VERCEL_TELEMETRY_DISABLED || "1",
  };
  const isNpx = /^npx(?:\.cmd)?$/i.test(String(candidate.bin));
  if (isNpx) {
    const cacheDir = resolve(root, ".npm-cache");
    await mkdir(cacheDir, { recursive: true });
    env.NPM_CONFIG_CACHE = cacheDir;
    env.NPM_CONFIG_UPDATE_NOTIFIER = "false";
  }

  return new Promise((resolvePromise, reject) => {
    execFile(
      command,
      commandArgs,
      {
        cwd: root,
        env,
        windowsHide: true,
        timeout: options.timeoutMs || commandTimeoutMs,
        maxBuffer: 100 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          error.stdout = stdout;
          error.stderr = stderr;
          reject(error);
          return;
        }
        resolvePromise({ stdout, stderr });
      },
    );
  });
}

function quoteCmdArg(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function cmdCommand(value) {
  const command = String(value);
  return /\s/.test(command) ? quoteCmdArg(command) : command;
}

function cmdArg(value) {
  const arg = String(value);
  return /^[A-Za-z0-9_./:=?,-@]+$/.test(arg) ? arg : quoteCmdArg(arg);
}

async function vercelJson(endpoint, extraArgs = []) {
  if (apiMode === "rest") return vercelRestJson(endpoint, { teamId: activeTeamId });
  const { stdout } = await runVercel(["api", endpoint, "--raw", ...extraArgs]);
  return JSON.parse(stdout);
}

async function vercelCliJson(args) {
  const { stdout } = await runVercel(args);
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  return JSON.parse(stdout.slice(start, end + 1));
}

async function vercelRestJson(endpoint, { teamId = null } = {}) {
  if (!token) throw new Error("VERCEL_TOKEN is required for REST API fallback");

  const url = new URL(endpoint, apiBase);
  if (teamId && !url.searchParams.has("teamId")) {
    url.searchParams.set("teamId", teamId);
  }

  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      "user-agent": "vercel-guardian/1.0",
    },
  });

  const body = await response.text();
  if (!response.ok) {
    const message = body ? `${response.status} ${response.statusText}: ${body}` : `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return body ? JSON.parse(body) : null;
}

function recordsFromResponse(response, key) {
  if (Array.isArray(response)) return response;
  return response?.[key] || [];
}

function nextPageCursor(response) {
  const next = response?.pagination?.next;
  return next === undefined || next === null || next === "" ? null : String(next);
}

async function vercelPagedJson(endpoint, key, { limit = 100 } = {}) {
  const records = [];
  let cursor = null;
  const seenCursors = new Set();

  do {
    const separator = endpoint.includes("?") ? "&" : "?";
    const cursorPart = cursor ? `&from=${encodeURIComponent(cursor)}` : "";
    const response = await vercelJson(`${endpoint}${separator}limit=${limit}${cursorPart}`);
    records.push(...recordsFromResponse(response, key));

    cursor = nextPageCursor(response);
    if (cursor && seenCursors.has(cursor)) break;
    if (cursor) seenCursors.add(cursor);
  } while (cursor);

  return records;
}

async function resolveRestIdentity() {
  let user = null;
  try {
    const userResponse = await vercelRestJson("/v2/user");
    const account = userResponse?.user || userResponse;
    user = account?.username || account?.email || account?.name || account?.id || null;
  } catch {
    user = "token-authenticated";
  }

  if (!scope) return { user, teamId: null, scope: null };
  if (/^team_/i.test(scope)) return { user, teamId: scope, scope };

  const teamsResponse = await vercelRestJson("/v2/teams");
  const teams = teamsResponse?.teams || [];
  const team = teams.find((candidate) =>
    [candidate.id, candidate.slug, candidate.name].filter(Boolean).includes(scope),
  );

  if (!team) {
    throw new Error(`Could not resolve VERCEL_SCOPE "${scope}" from accessible Vercel teams`);
  }

  return { user, teamId: team.id, scope: team.slug || team.name || team.id };
}

function isoFromMs(ms) {
  return ms ? new Date(ms).toISOString() : null;
}

function shortSha(sha) {
  return sha ? String(sha).slice(0, 8) : null;
}

function compactEnv(env = []) {
  return env.map((item) => ({
    key: item.key,
    type: item.type,
    target: item.target || [],
    branch: item.gitBranch || null,
    contentHint: item.contentHint?.type || null,
  }));
}

const secretNamePattern =
  /SECRET|TOKEN|KEY|PASSWORD|DATABASE_URL|POSTGRES|STRIPE|BINANCE|AUTH|JWT|COOKIE|RESEND|GOOGLE|SUPABASE|NEON|BLOB|OAUTH|API/i;

function sensitiveEnvFindings(project) {
  const findings = [];
  const affected = compactEnv(project.env).filter(
    (item) =>
      secretNamePattern.test(item.key) &&
      item.type !== "sensitive" &&
      item.target.some((target) => target === "production" || target === "preview"),
  );

  if (!affected.length) return findings;

  const grouped = new Map();
  for (const item of affected) {
    const targetKey = item.target.filter((target) => target === "production" || target === "preview").join("/");
    if (!grouped.has(item.key)) grouped.set(item.key, new Set());
    for (const target of targetKey.split("/").filter(Boolean)) grouped.get(item.key).add(target);
  }

  const evidence = [...grouped.entries()]
    .map(([key, targets]) => `${key} (${[...targets].join("/")})`)
    .slice(0, 12);
  const overflow = grouped.size > evidence.length ? `, +${grouped.size - evidence.length} more` : "";

  findings.push({
    severity: "critical",
    title: "Production/preview secret-like env vars are not sensitive",
    action: `Rotate at the source provider, then recreate as sensitive in Vercel: ${evidence.join(", ")}${overflow}.`,
  });

  return findings;
}

function primaryDeployment(project) {
  return (
    project.targets?.production ||
    project.latestDeployments?.find((deployment) => deployment.target === "production") ||
    project.latestDeployments?.[0] ||
    null
  );
}

function deploymentUrl(deployment) {
  if (!deployment?.url) return null;
  return deployment.url.startsWith("http") ? deployment.url : `https://${deployment.url}`;
}

function aliasUrls(deployment) {
  const aliases = deployment?.alias?.length
    ? deployment.alias
    : deployment?.automaticAliases?.length
      ? deployment.automaticAliases
      : deployment?.url
        ? [deployment.url]
        : [];
  return [...new Set(aliases)]
    .filter(Boolean)
    .slice(0, 3)
    .map((alias) => (alias.startsWith("http") ? alias : `https://${alias}`));
}

async function fetchWithTimeout(url, method) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), httpTimeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "user-agent": "vercel-guardian/1.0",
      },
    });
    return {
      ok: response.status < 400,
      status: response.status,
      ms: Date.now() - startedAt,
      location: response.headers.get("location"),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkHttp(url) {
  try {
    const head = await fetchWithTimeout(url, "HEAD");
    if (head.status !== 405) return { url, ...head };
    const get = await fetchWithTimeout(url, "GET");
    return { url, ...get };
  } catch (error) {
    return {
      url,
      ok: false,
      status: null,
      ms: null,
      error:
        error.name === "AbortError"
          ? "timeout"
          : error.cause?.code
            ? `${error.message}: ${error.cause.code}`
            : error.message,
    };
  }
}

async function deploymentErrorSummary(deployment) {
  if (!deployment?.id || deployment.readyState !== "ERROR") return [];
  try {
    const events = await vercelJson(`/v2/deployments/${deployment.id}/events`);
    return events
      .map((event) => event.payload?.text || event.text || "")
      .filter((line) =>
        /error|failed|exited|enoent|could not read|command|root directory|does not exist/i.test(line),
      )
      .slice(-8);
  } catch (error) {
    return [`Could not fetch build events: ${error.message}`];
  }
}

function assessProject(project, deployment, httpChecks, errorLines, deployHooks = []) {
  const findings = [];

  if (!deployment) {
    findings.push({
      severity: "critical",
      title: "No production deployment found",
      action: "Create or promote a production deployment.",
    });
  } else if (deployment.readyState !== "READY") {
    findings.push({
      severity: "critical",
      title: `Production deployment is ${deployment.readyState}`,
      action:
        deployment.errorMessage ||
        errorLines.at(-1) ||
        "Inspect build logs and fix the failing deployment.",
    });
  }

  if (httpChecks.length && !httpChecks.some((check) => check.ok)) {
    const allNetworkErrors = httpChecks.every(
      (check) =>
        check.status === null &&
        /timeout|fetch failed|connect_timeout|und_err_connect_timeout/i.test(
          check.error || "",
        ),
    );
    const allProtected = httpChecks.every((check) => [401, 403].includes(check.status));
    const allNetworkOrProtected = httpChecks.every(
      (check) =>
        [401, 403].includes(check.status) ||
        (check.status === null &&
          /timeout|fetch failed|connect_timeout|und_err_connect_timeout/i.test(
            check.error || "",
          )),
    );
    findings.push({
      severity: allNetworkErrors || allProtected || allNetworkOrProtected ? "warning" : "critical",
      title: allNetworkErrors
        ? "HTTP checks are inconclusive from this network"
        : allProtected
          ? "Production aliases are protected"
          : allNetworkOrProtected
            ? "HTTP checks are protected or inconclusive"
          : "Production aliases are not healthy over HTTP",
      action: allNetworkErrors
        ? "Re-run from another network or verify from Vercel Dashboard analytics/logs."
        : allProtected
          ? "Confirm this protection is intentional for public production traffic."
          : allNetworkOrProtected
            ? "Verify the custom production domain from another network or dashboard."
          : "Check deployment readiness, protection settings, and runtime logs.",
    });
  }

  if (!project.framework) {
    findings.push({
      severity: "warning",
      title: "Framework is not detected",
      action: "Set the project framework/root directory explicitly in Vercel.",
    });
  }

  if (!project.webAnalytics?.id) {
    findings.push({
      severity: "warning",
      title: "Web Analytics is not configured",
      action: "Enable Vercel Web Analytics or add an external analytics integration.",
    });
  }

  if (!project.speedInsights?.id) {
    findings.push({
      severity: "warning",
      title: "Speed Insights is not configured",
      action: "Enable Speed Insights to track real Core Web Vitals.",
    });
  }

  if (String(project.nodeVersion || "").startsWith("18")) {
    findings.push({
      severity: "warning",
      title: "Node runtime is behind current Vercel default",
      action: "Move to Node 24.x after local compatibility tests pass.",
    });
  }

  if (project.plan === "hobby") {
    findings.push({
      severity: "info",
      title: "Hobby plan limits central log drains",
      action: "Use CLI/runtime log checks now; upgrade to Pro before adding drains.",
    });
  }

  if (deployHooks.length) {
    findings.push({
      severity: "warning",
      title: "Deploy hooks are configured",
      action: `Review or remove ${deployHooks.length} deploy hook(s); deploy hook URLs can trigger builds if exposed.`,
    });
  }

  findings.push(...sensitiveEnvFindings(project));

  return findings;
}

function statusFromFindings(findings) {
  if (findings.some((finding) => finding.severity === "critical")) return "critical";
  if (findings.some((finding) => finding.severity === "warning")) return "warning";
  return "healthy";
}

function redactProject(project, deployment, httpChecks, errorLines, findings, deployHooks = []) {
  return {
    name: project.name,
    id: project.id,
    status: statusFromFindings(findings),
    framework: project.framework || null,
    nodeVersion: project.nodeVersion || null,
    plan: deployment?.plan || project.plan || null,
    rootDirectory: project.rootDirectory || null,
    buildCommand: project.buildCommand || null,
    installCommand: project.installCommand || null,
    outputDirectory: project.outputDirectory || null,
    git: project.link
      ? {
          provider: project.link.type,
          org: project.link.org,
          repo: project.link.repo,
          productionBranch: project.link.productionBranch,
        }
      : null,
    observability: {
      webAnalytics: Boolean(project.webAnalytics?.id),
      speedInsights: Boolean(project.speedInsights?.id),
      speedInsightsHasData: Boolean(project.speedInsights?.hasData),
      oidcEnabled: Boolean(project.oidcTokenConfig?.enabled),
      fluidCompute: Boolean(project.resourceConfig?.fluid || project.defaultResourceConfig?.fluid),
      functionRegions:
        project.resourceConfig?.functionDefaultRegions ||
        project.defaultResourceConfig?.functionDefaultRegions ||
        [],
    },
    env: compactEnv(project.env),
    cronDefinitions: project.crons?.definitions || [],
    deployHooks,
    productionDeployment: deployment
      ? {
          id: deployment.id,
          readyState: deployment.readyState,
          readySubstate: deployment.readySubstate || null,
          createdAt: isoFromMs(deployment.createdAt),
          readyAt: isoFromMs(deployment.readyAt),
          url: deploymentUrl(deployment),
          aliases: aliasUrls(deployment),
          commit: {
            repo: deployment.meta?.githubCommitRepo || null,
            ref: deployment.meta?.githubCommitRef || null,
            sha: shortSha(deployment.meta?.githubCommitSha),
            message: deployment.meta?.githubCommitMessage || null,
          },
          errorCode: deployment.errorCode || null,
          errorMessage: deployment.errorMessage || null,
          errorStep: deployment.errorStep || null,
        }
      : null,
    httpChecks,
    errorLines,
    findings,
  };
}

function redactDeployHook(hook) {
  return {
    id: hook.id || hook.uid || null,
    name: hook.name || null,
    ref: hook.ref || hook.branch || null,
    createdAt: isoFromMs(hook.createdAt || hook.created),
  };
}

async function projectDeployHooks(project) {
  if (apiMode !== "cli") return [];
  try {
    const parsed = await vercelCliJson(["deploy-hooks", "list", "--project", project.name]);
    return (parsed?.hooks || []).map(redactDeployHook);
  } catch {
    return [];
  }
}

function redactUrlSecrets(url) {
  if (!url) return null;
  const value = String(url);
  const sensitiveParamPattern =
    /(?:^|[-_])(?:token|secret|key|auth|authorization|password|pass|pwd|sig|signature|credential|api[-_]?key|access[-_]?token)(?:$|[-_])/i;
  const redactSensitivePathSegments = (candidate) =>
    candidate
      .replace(/(\/services\/[^/?#]+\/[^/?#]+\/)[^/?#]+/i, "$1[redacted]")
      .replace(/(\/hooks\/(?:[^/?#]+\/)+)[^/?#]+/i, "$1[redacted]");

  try {
    const parsed = new URL(value);
    if (parsed.username) parsed.username = "redacted";
    if (parsed.password) parsed.password = "redacted";

    for (const key of [...parsed.searchParams.keys()]) {
      if (sensitiveParamPattern.test(key)) parsed.searchParams.set(key, "[redacted]");
    }

    return redactSensitivePathSegments(parsed.toString()).replace(/%5Bredacted%5D/gi, "[redacted]");
  } catch {
    return redactSensitivePathSegments(
      value.replace(
        /([?&][^=&#\s]*(?:token|secret|key|auth|authorization|password|pass|pwd|sig|signature|credential|api[-_]?key|access[-_]?token)[^=&#\s]*=)[^&#\s]+/gi,
        "$1[redacted]",
      ),
    );
  }
}

function redactWebhook(webhook) {
  return {
    id: webhook.id || webhook.uid || null,
    url: redactUrlSecrets(webhook.url),
    events: webhook.events || webhook.eventTypes || [],
    projectIds: webhook.projectIds || webhook.projects || [],
    createdAt: isoFromMs(webhook.createdAt || webhook.created),
  };
}

async function accountWebhooks() {
  if (apiMode !== "cli") return [];
  try {
    const parsed = await vercelCliJson(["webhooks", "list"]);
    return (parsed?.webhooks || []).map(redactWebhook);
  } catch {
    return [];
  }
}

function parseAliasList(stdout) {
  const aliases = [];
  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (
      !trimmed ||
      trimmed.startsWith("source ") ||
      trimmed.startsWith("Fetching ") ||
      trimmed.startsWith("> ")
    ) {
      continue;
    }
    const match = trimmed.match(/^(\S+)\s+(\S+)\s+(\S+)$/);
    if (!match) continue;
    aliases.push({ source: match[1], url: match[2], age: match[3] });
  }
  return aliases;
}

async function accountAliases() {
  if (apiMode !== "cli") return [];
  try {
    const { stdout } = await runVercel(["alias", "list"]);
    return parseAliasList(stdout);
  } catch {
    return [];
  }
}

function staleAliases(aliases, projects) {
  const activeSources = new Set();
  const activeUrls = new Set();
  for (const project of projects) {
    const deployment = primaryDeployment(project);
    if (deployment?.url) activeSources.add(deployment.url);
    for (const alias of aliasUrls(deployment).map((url) => url.replace(/^https?:\/\//, ""))) {
      activeUrls.add(alias);
    }
  }

  return aliases.filter((alias) => {
    const branchAlias = /-git-(codex|code|feat|fix|test|wip|tmp|dev)-/i.test(alias.url);
    const legacyFrontend =
      /^frontend-/.test(alias.url) &&
      !activeUrls.has(alias.url) &&
      !activeSources.has(alias.source);
    return branchAlias || legacyFrontend;
  });
}

function reportEnvironment() {
  return {
    vercelTokenPresent: Boolean(token),
    vercelScopePresent: Boolean(scope),
    vercelScopeMatchesExpected: scope ? scope === expectedScope : false,
    expectedScope,
    expectedCliVersion,
  };
}

function redactTeam(team) {
  return {
    id: team.id || null,
    slug: team.slug || null,
    name: team.name || null,
    plan: team.plan || team.billing?.plan || null,
  };
}

function redactRecentDeployment(deployment) {
  return {
    id: deployment.uid || deployment.id || null,
    name: deployment.name || deployment.project?.name || null,
    url: deploymentUrl(deployment),
    readyState: deployment.readyState || deployment.state || null,
    target: deployment.target || null,
    createdAt: isoFromMs(deployment.createdAt || deployment.created),
    creator: deployment.creator?.username || deployment.creator?.email || deployment.creator?.uid || null,
  };
}

function activityActor(event) {
  return (
    event.principal?.username ||
    event.user?.username ||
    event.principal?.email ||
    event.user?.email ||
    event.userId ||
    null
  );
}

function isOwnerActivity(event, actor, currentUser) {
  return Boolean(
    /^You\b/i.test(event.text || "") ||
      (actor && currentUser && actor === currentUser),
  );
}

function activitySeverity(event, currentUser = null) {
  const type = event.type || "";
  const actor = activityActor(event);
  const ownerActivity = isOwnerActivity(event, actor, currentUser);

  if (ownerActivity && /env-variable-read|aliases-assigned|deployment|project-delete|project-created/i.test(type)) {
    return "info";
  }

  if (ownerActivity && /env-variable-(add|edit|delete)|project-domain|project-git-repository|alias/i.test(type)) {
    return "warning";
  }

  if (
    /env-variable-read|shared-env-variable-read|storage-view-secret|token|oauth|mfa|passkey|team-member|project-git-repository|project-domain|alias|deploy-hook|webhook|protection|sso/i.test(
      type,
    )
  ) {
    return "critical";
  }
  if (/deployment|aliases-assigned|project-created|env-variable-(add|edit|delete)/i.test(type)) {
    return "warning";
  }
  return "info";
}

function redactActivityEvent(event, currentUser = null) {
  const actor = activityActor(event);
  return {
    id: event.id || null,
    type: event.type || null,
    severity: activitySeverity(event, currentUser),
    createdAt: isoFromMs(event.createdAt || event.created),
    actor,
    project: event.payload?.projectName || event.payload?.project || event.payload?.name || null,
    text: event.text || null,
  };
}

async function recentActivity(currentUser = null) {
  if (apiMode !== "cli") return [];
  try {
    const args = ["activity", "--all", "--since", activitySince, "--limit", "100", "--format", "json"];
    if (scope || activeTeamId) args.push("--scope", scope || activeTeamId);
    const { stdout } = await runVercel(args, { timeoutMs: commandTimeoutMs });
    const parsed = JSON.parse(stdout.replace(/Fetching activity\.\.\.\s*$/m, ""));
    return (parsed.events || []).map((event) => redactActivityEvent(event, currentUser));
  } catch {
    return [];
  }
}

function severityRank(severity) {
  return { critical: 0, warning: 1, info: 2 }[severity] ?? 3;
}

function sanitizeError(error) {
  let message = String(error?.message || error);
  for (const output of [error?.stdout, error?.stderr]) {
    const trimmed = String(output || "").trim();
    if (trimmed && !message.includes(trimmed)) message += `\n${trimmed}`;
  }
  if (token) message = message.replaceAll(token, "[redacted-token]");
  return message
    .replace(/\s+--token\s+\S+/g, " --token [redacted-token]")
    .replace(/\s+--token=\S+/g, " --token=[redacted-token]");
}

function bootstrapDetail(error) {
  const message = sanitizeError(error);
  if (error?.candidateErrors?.length) {
    const globalDirError = error.candidateErrors.find((candidateError) =>
      /global directory[\s\S]*(?:EPERM|operation not permitted|Acceso denegado|Access is denied)/i.test(
        sanitizeError(candidateError),
      ),
    );
    if (globalDirError) {
      return `${sanitizeError(globalDirError)}. Vercel CLI cannot access its global config directory in this environment; provide VERCEL_TOKEN for REST fallback or run from a shell with access to the saved Vercel login.`;
    }

    const details = error.candidateErrors
      .map((candidateError) => sanitizeError(candidateError).split("\n")[0])
      .filter(Boolean)
      .slice(0, 4)
      .join(" | ");
    return `${message}. Tried Vercel CLI candidates without success: ${details}`;
  }
  if (/spawn(?:Sync)? .* EPERM|spawn EPERM/i.test(message)) {
    return `${message}. Node child_process execution is blocked in this environment.`;
  }
  if (/global directory[\s\S]*(?:EPERM|operation not permitted|Acceso denegado|Access is denied)/i.test(message)) {
    return `${message}. Vercel CLI cannot access its global config directory in this environment; provide VERCEL_TOKEN for REST fallback or run from a shell with access to the saved Vercel login.`;
  }
  if (/vercel(?:\.cmd)?[\s\S]*(?:not recognized|no se reconoce|not found|ENOENT)/i.test(message)) {
    return `${defaultVercelBin} is not available in PATH for this environment.`;
  }
  if (/registry\.npmjs\.org\/vercel[\s\S]*(?:EACCES|ENOTFOUND|ETIMEDOUT|ECONNRESET|fetch failed)/i.test(message)) {
    return `${message}. Vercel CLI is not installed locally and this environment cannot fetch the pinned CLI from npm.`;
  }
  return message;
}

function isCliBootstrapError(error) {
  const message = sanitizeError(error);
  if (/not authenticated|not logged in|log in|login required|please login/i.test(message)) {
    return false;
  }
  return (
    error?.code === "ENOENT" ||
    error?.code === "EPERM" ||
    /spawn EPERM|global directory[\s\S]*(?:EPERM|operation not permitted|Acceso denegado|Access is denied)|not recognized|no se reconoce|not found|ENOENT|EACCES/i.test(message)
  );
}

async function writeReport(report) {
  const stamp = report.generatedAt.replace(/[:.]/g, "-");
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const md = renderMarkdown(report);

  if (noWrite) {
    console.log(md);
    console.error("Dry run: report was not written because --no-write is enabled.");
    return;
  }

  await writeFile(resolve(reportsDir, "vercel-guardian.latest.json"), json);
  await writeFile(resolve(reportsDir, "vercel-guardian.latest.md"), md);
  await writeFile(resolve(reportsDir, `vercel-guardian.${stamp}.json`), json);
  await writeFile(resolve(reportsDir, `vercel-guardian.${stamp}.md`), md);

  console.log(md);
}

function blockedReport(generatedAt, error, overrides = {}) {
  return {
    generatedAt,
    account: {
      user: null,
      scope: scope || null,
      teamId: null,
      vercelCliVersion: null,
    },
    summary: {
      projects: 0,
      healthy: 0,
      warning: 0,
      critical: 1,
      drains: 0,
    },
    environment: {
      ...reportEnvironment(),
    },
    blockers: [
      {
        severity: "critical",
        title: overrides.title || "Vercel CLI/API unavailable",
        detail: bootstrapDetail(error),
        action:
          overrides.action ||
          "Install or expose Vercel CLI 53.1.1+ and provide VERCEL_TOKEN plus VERCEL_SCOPE for non-interactive audits.",
      },
    ],
    drains: [],
    projects: [],
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# Vercel Guardian Report");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Account: ${report.account.user || "unknown"}`);
  lines.push(`Scope: ${report.account.scope || "default"}`);
  lines.push(`Vercel CLI: ${report.account.vercelCliVersion || "unknown"}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Projects: ${report.summary.projects}`);
  lines.push(`- Healthy: ${report.summary.healthy}`);
  lines.push(`- Warning: ${report.summary.warning}`);
  lines.push(`- Critical: ${report.summary.critical}`);
  lines.push(`- Log drains: ${report.summary.drains}`);
  lines.push("");

  if (report.environment) {
    lines.push("## Environment");
    lines.push("");
    lines.push(`- Vercel token present: ${report.environment.vercelTokenPresent ? "yes" : "no"}`);
    lines.push(`- Vercel scope present: ${report.environment.vercelScopePresent ? "yes" : "no"}`);
    lines.push(
      `- Scope matches expected: ${report.environment.vercelScopeMatchesExpected ? "yes" : "no"}`,
    );
    lines.push(`- Expected scope: ${report.environment.expectedScope}`);
    lines.push(`- Expected CLI: ${report.environment.expectedCliVersion}+`);
    lines.push("");
  }

  if (report.blockers?.length) {
    lines.push("## Blockers");
    lines.push("");
    for (const blocker of report.blockers) {
      lines.push(`- [${blocker.severity}] ${blocker.title}: ${blocker.action}`);
      if (blocker.detail) lines.push(`  - Detail: ${blocker.detail}`);
    }
    lines.push("");
  }

  if (report.teams?.length) {
    lines.push("## Teams");
    lines.push("");
    for (const team of report.teams) {
      lines.push(`- ${team.slug || team.name || team.id}: ${team.plan || "plan unknown"}`);
    }
    lines.push("");
  }

  if (report.recentDeployments?.length) {
    lines.push("## Recent Deployments");
    lines.push("");
    for (const deployment of report.recentDeployments) {
      lines.push(
        `- ${deployment.name || deployment.id}: ${deployment.readyState || "unknown"}${deployment.target ? `/${deployment.target}` : ""} (${deployment.createdAt || "time unknown"})`,
      );
    }
    lines.push("");
  }

  if (report.webhooks?.length) {
    lines.push("## Webhooks");
    lines.push("");
    for (const webhook of report.webhooks) {
      lines.push(`- ${webhook.id || "unknown"}: ${webhook.url || "url redacted"} (${webhook.events?.join(", ") || "events unknown"})`);
    }
    lines.push("");
  }

  if (report.aliases?.stale?.length) {
    lines.push("## Alias Review");
    lines.push("");
    for (const alias of report.aliases.stale) {
      lines.push(`- [info] Stale alias candidate: ${alias.url} -> ${alias.source} (${alias.age})`);
    }
    lines.push("");
  }

  if (report.activity?.events?.length) {
    lines.push("## Recent Activity");
    lines.push("");
    lines.push(`- Window: ${report.activity.since}`);
    for (const event of report.activity.events) {
      lines.push(
        `- [${event.severity}] ${event.createdAt || "time unknown"} ${event.type || "unknown"}${event.project ? ` (${event.project})` : ""}: ${event.text || event.id || "no text"}`,
      );
    }
    lines.push("");
  }

  for (const project of report.projects) {
    lines.push(`## ${project.name} (${project.status})`);
    lines.push("");
    lines.push(`- Framework: ${project.framework || "not detected"}`);
    lines.push(`- Node: ${project.nodeVersion || "unknown"}`);
    lines.push(`- Root: ${project.rootDirectory || "."}`);
    lines.push(`- Install: ${project.installCommand || "Vercel default"}`);
    lines.push(`- Build: ${project.buildCommand || "Vercel default"}`);
    lines.push(`- Output: ${project.outputDirectory || "Vercel default"}`);
    if (project.git) {
      lines.push(
        `- Git: ${project.git.org}/${project.git.repo} (${project.git.productionBranch})`,
      );
    }
    if (project.productionDeployment) {
      const dep = project.productionDeployment;
      lines.push(`- Production: ${dep.readyState}${dep.readySubstate ? `/${dep.readySubstate}` : ""}`);
      lines.push(`- URL: ${dep.url}`);
      lines.push(
        `- Commit: ${dep.commit.sha || "unknown"} ${dep.commit.message ? `- ${dep.commit.message}` : ""}`,
      );
    }
    lines.push("");

    if (project.httpChecks.length) {
      lines.push("HTTP checks:");
      for (const check of project.httpChecks) {
        const status = check.status || check.error || "unknown";
        lines.push(`- ${check.url}: ${status}${check.ms ? ` in ${check.ms}ms` : ""}`);
      }
      lines.push("");
    }

    if (project.deployHooks?.length) {
      lines.push("Deploy hooks:");
      for (const hook of project.deployHooks) {
        lines.push(`- ${hook.name || hook.id || "unnamed"}${hook.ref ? ` (${hook.ref})` : ""}`);
      }
      lines.push("");
    }

    if (project.errorLines.length) {
      lines.push("Relevant error lines:");
      for (const line of project.errorLines) lines.push(`- ${line}`);
      lines.push("");
    }

    lines.push("Findings:");
    for (const finding of [...project.findings].sort(
      (a, b) => severityRank(a.severity) - severityRank(b.severity),
    )) {
      lines.push(`- [${finding.severity}] ${finding.title}: ${finding.action}`);
    }
    if (!project.findings.length) lines.push("- No findings.");
    lines.push("");
  }

  lines.push("## Automation");
  lines.push("");
  lines.push("- Local: `npm run guardian`");
  lines.push("- Strict CI: `npm run guardian:strict`");
  lines.push("- Report files: `reports/vercel-guardian.latest.md` and `.json`");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main() {
  await mkdir(reportsDir, { recursive: true });

  const generatedAt = new Date().toISOString();
  let cliVersion;
  let user;
  try {
    cliVersion = (await runVercel(["--version"])).stdout.trim().split(/\s+/).at(-1);
    user = (await runVercel(["whoami"])).stdout.trim();
  } catch (error) {
    if (!isCliBootstrapError(error)) throw error;
    if (!token) {
      const report = blockedReport(generatedAt, error, {
        action:
          "Install or expose Vercel CLI 53.1.1+, allow npm access to registry.npmjs.org, or provide VERCEL_TOKEN plus VERCEL_SCOPE so the REST fallback can audit non-interactively.",
      });
      await writeReport(report);
      if (failOnCritical) process.exitCode = 1;
      return;
    }

    try {
      apiMode = "rest";
      cliVersion = "unavailable (REST fallback)";
      const identity = await resolveRestIdentity();
      user = identity.user;
      activeTeamId = identity.teamId;
    } catch (restError) {
      const report = blockedReport(generatedAt, restError, {
        title: "Vercel REST API unavailable",
        action:
          "Verify VERCEL_TOKEN permissions and set VERCEL_SCOPE to the expected team slug or team id.",
      });
      await writeReport(report);
      if (failOnCritical) process.exitCode = 1;
      return;
    }
  }

  let teams = [];
  try {
    const teamsResponse = await vercelJson("/v2/teams");
    teams = (teamsResponse.teams || []).map(redactTeam);
  } catch {
    teams = [];
  }

  const projects = await vercelPagedJson("/v9/projects", "projects");
  const teamId = projects[0]?.accountId || projects[0]?.teamId || null;

  let drains = [];
  if (teamId) {
    try {
      const drainsResponse = await vercelJson(`/v1/drains?teamId=${teamId}`);
      drains = Array.isArray(drainsResponse) ? drainsResponse : drainsResponse.drains || [];
    } catch {
      drains = [];
    }
  }

  let recentDeployments = [];
  try {
    const deploymentsResponse = await vercelJson("/v13/deployments?limit=20");
    recentDeployments = (deploymentsResponse.deployments || [])
      .map(redactRecentDeployment)
      .filter((deployment) => deployment.id || deployment.url)
      .slice(0, 20);
  } catch {
    recentDeployments = [];
  }

  const activityEvents = await recentActivity(user);
  const webhooks = await accountWebhooks();
  const aliases = await accountAliases();
  const staleAliasCandidates = staleAliases(aliases, projects);

  const auditedProjects = [];
  for (const project of projects) {
    const deployment = primaryDeployment(project);
    const deployHooks = await projectDeployHooks(project);
    const httpChecks = [];
    if (deployment?.readyState === "READY") {
      for (const url of aliasUrls(deployment)) {
        httpChecks.push(await checkHttp(url));
      }
    }
    const errorLines = await deploymentErrorSummary(deployment);
    const findings = assessProject(project, deployment, httpChecks, errorLines, deployHooks);
    auditedProjects.push(redactProject(project, deployment, httpChecks, errorLines, findings, deployHooks));
  }

  auditedProjects.sort((a, b) => {
    const rank = { critical: 0, warning: 1, healthy: 2 };
    return rank[a.status] - rank[b.status] || a.name.localeCompare(b.name);
  });

  const summary = {
    projects: auditedProjects.length,
    healthy: auditedProjects.filter((project) => project.status === "healthy").length,
    warning: auditedProjects.filter((project) => project.status === "warning").length,
    critical: auditedProjects.filter((project) => project.status === "critical").length,
    drains: drains.length,
  };

  const report = {
    generatedAt,
    account: {
      user,
      scope:
        scope ||
        (apiMode === "rest" ? activeTeamId : null) ||
        projects[0]?.latestDeployments?.[0]?.oidcTokenClaims?.owner ||
        projects[0]?.targets?.production?.oidcTokenClaims?.owner ||
        null,
      teamId,
      vercelCliVersion: cliVersion,
    },
    summary,
    environment: reportEnvironment(),
    teams,
    recentDeployments,
    drains: drains.map((drain) => ({
      id: drain.id,
      type: drain.type,
      url: redactUrlSecrets(drain.url),
      sources: drain.sources || [],
      environments: drain.environments || [],
      disabledAt: drain.disabledAt || null,
    })),
    activity: {
      since: activitySince,
      events: activityEvents,
    },
    webhooks,
    aliases: {
      total: aliases.length,
      stale: staleAliasCandidates,
    },
    projects: auditedProjects,
  };

  await writeReport(report);

  if (failOnCritical && summary.critical > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

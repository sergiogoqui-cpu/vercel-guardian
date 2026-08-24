# Graph Report - vercel-guardian  (2026-08-24)

## Corpus Check
- 7 files · ~4,851 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 144 nodes · 225 edges · 14 communities
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.81)
- Token cost: 0 input · 60,000 output

## Community Hubs (Navigation)
- CI Workflow & Test Pipeline
- Audit Workflow (Scheduled Guardian Run)
- package.json Project Metadata
- Guardian CLI Core
- npm Dependency Tree
- Deployment Assessment & Redaction
- Vercel CLI Invocation & Error Handling
- Redaction Test Suite
- Webhook & Deploy Hook Redaction
- Report Generation & Alias Auditing
- Vercel REST API Client
- Vercel CLI Command Resolution
- Activity Log Redaction

## God Nodes (most connected - your core abstractions)
1. `main()` - 23 edges
2. `overrides` - 9 edges
3. `What It Checks Section` - 9 edges
4. `runVercel()` - 8 edges
5. `redactProject()` - 8 edges
6. `audit Job` - 7 edges
7. `vercelJson()` - 6 edges
8. `isoFromMs()` - 6 edges
9. `Run Vercel Guardian Step (npm run guardian:strict)` - 6 edges
10. `test Job` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Run Vercel Guardian Step (npm run guardian:strict)` --references--> `npm run guardian:strict Command`  [INFERRED]
  .github/workflows/audit.yml → README.md
- `Findings Ranking Mechanism (critical/warning/info rollup)` --conceptually_related_to--> `Run Vercel Guardian Step (npm run guardian:strict)`  [INFERRED]
  README.md → .github/workflows/audit.yml
- `.env.example File` --references--> `VERCEL_TOKEN Secret`  [INFERRED]
  README.md → .github/workflows/audit.yml
- `.env.example File` --references--> `VERCEL_SCOPE Repository Variable`  [INFERRED]
  README.md → .github/workflows/audit.yml
- `CI Section` --references--> `CI Workflow`  [EXTRACTED]
  README.md → .github/workflows/ci.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Both Workflows Validate The Same Guardian Script Before Running It** — scripts_vercel_guardian_script, _github_workflows_audit_validate_script_step, _github_workflows_ci_validate_script_step [INFERRED 0.80]
- **Secret Redaction Safety Net (mechanism + tests + documented rationale)** — readme_redacturlsecrets_mechanism, readme_redaction_test_suite, readme_deploy_hooks_check, readme_secret_safety_section [INFERRED 0.80]
- **Strict Mode CI Gating Pattern (command + ranking + secret + scheduled step)** — _github_workflows_audit_run_guardian_step, readme_npm_run_guardian_strict_command, readme_findings_ranking_mechanism, _github_workflows_audit_vercel_token_secret [INFERRED 0.75]

## Communities (14 total, 0 thin omitted)

### Community 0 - "CI Workflow & Test Pipeline"
Cohesion: 0.08
Nodes (27): Validate Guardian Script Step (node --check), Checkout Step (actions/checkout@v4), Install Dependencies Step (npm ci), pull_request Trigger, push Trigger (all branches), Run Tests Step (npm test), Setup Node Step (actions/setup-node@v4, node 24, npm cache), test Job (+19 more)

### Community 1 - "Audit Workflow (Scheduled Guardian Run)"
Cohesion: 0.13
Nodes (22): audit Job, Checkout Step (actions/checkout@v4), Concurrency Group 'vercel-guardian', Install Locked Dependencies Step (npm ci), Run Vercel Guardian Step (npm run guardian:strict), Schedule Trigger (cron: 0 */6 * * *), Setup Node Step (actions/setup-node@v4, node 24), Upload Reports Step (actions/upload-artifact@v4) (+14 more)

### Community 2 - "package.json Project Metadata"
Cohesion: 0.11
Nodes (17): description, devDependencies, vercel, engines, node, license, name, repository (+9 more)

### Community 3 - "Guardian CLI Core"
Cohesion: 0.18
Nodes (12): args, checkHttp(), commandTimeoutMs, __dirname, fetchWithTimeout(), httpTimeoutMs, noWrite, renderMarkdown() (+4 more)

### Community 4 - "npm Dependency Tree"
Cohesion: 0.22
Nodes (9): overrides, ajv, minimatch, path-to-regexp, smol-toml, srvx, tar, @tootallnate/once (+1 more)

### Community 5 - "Deployment Assessment & Redaction"
Cohesion: 0.25
Nodes (8): assessProject(), compactEnv(), deploymentUrl(), redactProject(), redactRecentDeployment(), sensitiveEnvFindings(), shortSha(), statusFromFindings()

### Community 6 - "Vercel CLI Invocation & Error Handling"
Cohesion: 0.29
Nodes (8): bootstrapDetail(), cmdArg(), cmdCommand(), isCliBootstrapError(), quoteCmdArg(), runVercelCandidate(), runVercelWithCommand(), sanitizeError()

### Community 7 - "Redaction Test Suite"
Cohesion: 0.29
Nodes (6): cases, failures, functionSource, match, sandbox, source

### Community 8 - "Webhook & Deploy Hook Redaction"
Cohesion: 0.33
Nodes (7): accountWebhooks(), isoFromMs(), projectDeployHooks(), redactDeployHook(), redactUrlSecrets(), redactWebhook(), vercelCliJson()

### Community 9 - "Report Generation & Alias Auditing"
Cohesion: 0.43
Nodes (7): aliasUrls(), blockedReport(), main(), primaryDeployment(), redactTeam(), reportEnvironment(), staleAliases()

### Community 10 - "Vercel REST API Client"
Cohesion: 0.29
Nodes (7): deploymentErrorSummary(), nextPageCursor(), recordsFromResponse(), resolveRestIdentity(), vercelJson(), vercelPagedJson(), vercelRestJson()

### Community 11 - "Vercel CLI Command Resolution"
Cohesion: 0.40
Nodes (5): accountAliases(), parseAliasList(), recentActivity(), runVercel(), vercelCommandCandidates()

### Community 12 - "Activity Log Redaction"
Cohesion: 0.67
Nodes (4): activityActor(), activitySeverity(), isOwnerActivity(), redactActivityEvent()

## Knowledge Gaps
- **52 isolated node(s):** `name`, `version`, `type`, `description`, `license` (+47 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vercel-guardian Project` connect `CI Workflow & Test Pipeline` to `Audit Workflow (Scheduled Guardian Run)`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `CI Section` connect `Audit Workflow (Scheduled Guardian Run)` to `CI Workflow & Test Pipeline`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `What It Checks Section` connect `CI Workflow & Test Pipeline` to `Audit Workflow (Scheduled Guardian Run)`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `main()` (e.g. with `redactRecentDeployment()` and `redactTeam()`) actually correct?**
  _`main()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _52 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CI Workflow & Test Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Audit Workflow (Scheduled Guardian Run)` be split into smaller, more focused modules?**
  _Cohesion score 0.12554112554112554 - nodes in this community are weakly interconnected._
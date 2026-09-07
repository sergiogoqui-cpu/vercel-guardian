# Graph Report - vercel-guardian  (2026-09-07)

## Corpus Check
- 7 files · ~4,935 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 147 nodes · 226 edges · 13 communities
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- README: Checks & Project Docs
- Package Manifest & Overrides
- Vercel Guardian Audit Workflow
- Guardian Core Assessment Helpers
- Guardian Run Config & npm Scripts
- Secret Redaction Functions
- Guardian Report & Alias Helpers
- Vercel REST API Client Helpers
- Vercel CLI Account & Alias Helpers
- Activity Event Redaction Helpers
- CLI Bootstrap Error Handling
- Vercel Command Execution Helpers

## God Nodes (most connected - your core abstractions)
1. `main()` - 23 edges
2. `overrides` - 9 edges
3. `What It Checks` - 9 edges
4. `audit Job` - 9 edges
5. `runVercel()` - 8 edges
6. `redactProject()` - 8 edges
7. `vercelJson()` - 6 edges
8. `isoFromMs()` - 6 edges
9. `vercel-guardian README` - 6 edges
10. `test Job` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Run Vercel Guardian Step` --references--> `guardian`  [EXTRACTED]
  .github/workflows/audit.yml → package.json
- `npm run guardian` --references--> `guardian`  [EXTRACTED]
  README.md → package.json
- `npm run guardian:strict` --references--> `guardian:strict`  [EXTRACTED]
  README.md → package.json
- `npm test Step` --references--> `test`  [EXTRACTED]
  .github/workflows/ci.yml → package.json
- `redactUrlSecrets Mechanism` --references--> `redactUrlSecrets()`  [EXTRACTED]
  README.md → scripts/vercel-guardian.mjs

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Secret Redaction Test & Audit Assurance** — readme_secret_redaction_rationale, readme_redacturlsecrets_mechanism, readme_redaction_test_suite, _github_workflows_ci_run_tests_step [EXTRACTED 0.90]
- **CI & Scheduled Audit Pipeline** — _github_workflows_ci_workflow, _github_workflows_audit_workflow, package_scripts_guardian, package_scripts_test [INFERRED 0.85]

## Communities (13 total, 0 thin omitted)

### Community 0 - "README: Checks & Project Docs"
Cohesion: 0.08
Nodes (23): vercel-guardian README, Deploy Hooks Check, Findings Ranked critical/warning/info, Framework Detection Check, HTTP Health Check, LICENSE File, License Section, Node Runtime Drift Check (+15 more)

### Community 1 - "Package Manifest & Overrides"
Cohesion: 0.09
Nodes (22): description, devDependencies, vercel, engines, node, license, name, overrides (+14 more)

### Community 2 - "Vercel Guardian Audit Workflow"
Cohesion: 0.10
Nodes (21): audit Job, Checkout Step (Audit Workflow), vercel-guardian Concurrency Group, npm ci Step (Audit Workflow), 6-Hour Cron Schedule, Setup Node 24 Step (Audit Workflow), Upload reports/ Artifact Step, node --check Validate Script Step (Audit Workflow) (+13 more)

### Community 3 - "Guardian Core Assessment Helpers"
Cohesion: 0.14
Nodes (16): args, assessProject(), checkHttp(), commandTimeoutMs, compactEnv(), __dirname, fetchWithTimeout(), httpTimeoutMs (+8 more)

### Community 4 - "Guardian Run Config & npm Scripts"
Cohesion: 0.13
Nodes (16): Why the Audit Step Runs Non-Strict, Run Vercel Guardian Step, VERCEL_GUARDIAN_CLI_VERSION Pin, VERCEL_TOKEN Secret, npm test Step, scripts, guardian, guardian:strict (+8 more)

### Community 5 - "Secret Redaction Functions"
Cohesion: 0.18
Nodes (13): redactUrlSecrets Mechanism, accountWebhooks(), deploymentUrl(), isoFromMs(), projectDeployHooks(), redactDeployHook(), redactProject(), redactRecentDeployment() (+5 more)

### Community 6 - "Guardian Report & Alias Helpers"
Cohesion: 0.43
Nodes (7): aliasUrls(), blockedReport(), main(), primaryDeployment(), redactTeam(), reportEnvironment(), staleAliases()

### Community 7 - "Vercel REST API Client Helpers"
Cohesion: 0.29
Nodes (7): deploymentErrorSummary(), nextPageCursor(), recordsFromResponse(), resolveRestIdentity(), vercelJson(), vercelPagedJson(), vercelRestJson()

### Community 8 - "Vercel CLI Account & Alias Helpers"
Cohesion: 0.40
Nodes (5): accountAliases(), parseAliasList(), recentActivity(), runVercel(), vercelCommandCandidates()

### Community 9 - "Activity Event Redaction Helpers"
Cohesion: 0.67
Nodes (4): activityActor(), activitySeverity(), isOwnerActivity(), redactActivityEvent()

### Community 10 - "CLI Bootstrap Error Handling"
Cohesion: 0.50
Nodes (4): bootstrapDetail(), isCliBootstrapError(), runVercelCandidate(), sanitizeError()

### Community 11 - "Vercel Command Execution Helpers"
Cohesion: 0.67
Nodes (4): cmdArg(), cmdCommand(), quoteCmdArg(), runVercelWithCommand()

## Knowledge Gaps
- **56 isolated node(s):** `name`, `version`, `type`, `description`, `license` (+51 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 62 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scripts` connect `Guardian Run Config & npm Scripts` to `Package Manifest & Overrides`?**
  _High betweenness centrality (0.285) - this node is a cross-community bridge._
- **Why does `audit Job` connect `Vercel Guardian Audit Workflow` to `Guardian Run Config & npm Scripts`?**
  _High betweenness centrality (0.279) - this node is a cross-community bridge._
- **Why does `test Job` connect `Vercel Guardian Audit Workflow` to `Guardian Run Config & npm Scripts`?**
  _High betweenness centrality (0.242) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `main()` (e.g. with `redactRecentDeployment()` and `redactTeam()`) actually correct?**
  _`main()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _56 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `README: Checks & Project Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `Package Manifest & Overrides` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
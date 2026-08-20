# Graph Report - vercel-guardian  (2026-08-20)

## Corpus Check
- Corpus is ~4,851 words - fits in a single context window. You may not need a graph.

## Summary
- 135 nodes · 209 edges · 13 communities
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.79)
- Token cost: 60,355 input · 0 output

## Community Hubs (Navigation)
- Package Configuration
- Guardian CLI Core
- Project Documentation Overview
- Audit Workflow Pipeline
- Vercel Deployment & Alias Resolution
- CLI Error Handling & Bootstrap
- CI Test Workflow
- Redaction Test Harness
- Webhook & Deploy Hook Redaction
- Deployment Status Redaction
- Activity Event Redaction
- Vercel API Pagination

## God Nodes (most connected - your core abstractions)
1. `main()` - 23 edges
2. `overrides` - 9 edges
3. `runVercel()` - 8 edges
4. `redactProject()` - 8 edges
5. `What It Checks (section)` - 8 edges
6. `audit job` - 8 edges
7. `test job` - 7 edges
8. `vercelJson()` - 6 edges
9. `isoFromMs()` - 6 edges
10. `vercel-guardian (README)` - 6 edges

## Surprising Connections (you probably didn't know these)
- `npm test step` --invokes--> `Redaction Test Suite (17 tests, npm test)`  [INFERRED]
  .github/workflows/ci.yml → README.md
- `vercel-guardian (README)` --references--> `CI workflow`  [EXTRACTED]
  README.md → .github/workflows/ci.yml
- `npm run guardian:strict command` --semantically_similar_to--> `Run Vercel Guardian step (npm run guardian:strict)`  [EXTRACTED] [semantically similar]
  README.md → .github/workflows/audit.yml
- `CI (section)` --references--> `Vercel Guardian Audit workflow`  [EXTRACTED]
  README.md → .github/workflows/audit.yml
- `CI (section)` --references--> `CI workflow`  [EXTRACTED]
  README.md → .github/workflows/ci.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CI/CD Pipeline Flow (README to Workflows to Script)** — readme_ci_section, github_workflows_audit, github_workflows_ci, scripts_vercel_guardian [EXTRACTED 0.85]
- **Secret Redaction Safety Pattern** — readme_secret_safety, readme_redact_url_secrets, readme_redaction_test_suite, github_workflows_ci_npm_test_step [EXTRACTED 0.80]
- **Guardian Audit Execution and Reporting Flow** — github_workflows_audit_job, github_workflows_audit_run_guardian_step, scripts_vercel_guardian, github_workflows_audit_upload_reports_step [EXTRACTED 0.85]

## Communities (13 total, 0 thin omitted)

### Community 0 - "Package Configuration"
Cohesion: 0.07
Nodes (26): description, devDependencies, vercel, engines, node, license, name, overrides (+18 more)

### Community 1 - "Guardian CLI Core"
Cohesion: 0.15
Nodes (15): args, assessProject(), checkHttp(), commandTimeoutMs, compactEnv(), __dirname, fetchWithTimeout(), httpTimeoutMs (+7 more)

### Community 2 - "Project Documentation Overview"
Cohesion: 0.13
Nodes (16): Vercel Guardian Audit workflow, CI workflow, LICENSE (MIT), vercel-guardian (README), CI (section), Deploy Hooks Check, Framework Detection Check, HTTP Health Check (+8 more)

### Community 3 - "Audit Workflow Pipeline"
Cohesion: 0.14
Nodes (16): Checkout step (actions/checkout@v4), audit job, Install locked dependencies (npm ci), reports/ directory, Run Vercel Guardian step (npm run guardian:strict), schedule trigger (cron 0 */6 * * *), Setup Node step (actions/setup-node@v4, node 24), Upload reports step (actions/upload-artifact@v4) (+8 more)

### Community 4 - "Vercel Deployment & Alias Resolution"
Cohesion: 0.22
Nodes (14): accountAliases(), aliasUrls(), deploymentErrorSummary(), main(), parseAliasList(), primaryDeployment(), recentActivity(), redactTeam() (+6 more)

### Community 5 - "CLI Error Handling & Bootstrap"
Cohesion: 0.22
Nodes (10): blockedReport(), bootstrapDetail(), cmdArg(), cmdCommand(), isCliBootstrapError(), quoteCmdArg(), reportEnvironment(), runVercelCandidate() (+2 more)

### Community 6 - "CI Test Workflow"
Cohesion: 0.25
Nodes (8): Checkout step (actions/checkout@v4), npm ci step, npm test step, pull_request trigger, push trigger (branches: **), Setup Node step (actions/setup-node@v4, node 24, npm cache), test job, node --check scripts/vercel-guardian.mjs step

### Community 7 - "Redaction Test Harness"
Cohesion: 0.29
Nodes (6): cases, failures, functionSource, match, sandbox, source

### Community 8 - "Webhook & Deploy Hook Redaction"
Cohesion: 0.33
Nodes (7): accountWebhooks(), isoFromMs(), projectDeployHooks(), redactDeployHook(), redactUrlSecrets(), redactWebhook(), vercelCliJson()

### Community 9 - "Deployment Status Redaction"
Cohesion: 0.40
Nodes (5): deploymentUrl(), redactProject(), redactRecentDeployment(), shortSha(), statusFromFindings()

### Community 10 - "Activity Event Redaction"
Cohesion: 0.67
Nodes (4): activityActor(), activitySeverity(), isOwnerActivity(), redactActivityEvent()

### Community 11 - "Vercel API Pagination"
Cohesion: 0.67
Nodes (3): nextPageCursor(), recordsFromResponse(), vercelPagedJson()

## Knowledge Gaps
- **56 isolated node(s):** `name`, `version`, `type`, `description`, `license` (+51 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Run Vercel Guardian step (npm run guardian:strict)` connect `Audit Workflow Pipeline` to `Guardian CLI Core`?**
  _High betweenness centrality (0.197) - this node is a cross-community bridge._
- **Why does `Usage (section)` connect `Audit Workflow Pipeline` to `Project Documentation Overview`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `main()` (e.g. with `redactRecentDeployment()` and `redactTeam()`) actually correct?**
  _`main()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _56 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Package Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `Project Documentation Overview` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `Audit Workflow Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.14166666666666666 - nodes in this community are weakly interconnected._
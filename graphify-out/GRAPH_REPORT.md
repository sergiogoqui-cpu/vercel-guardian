# Graph Report - vercel-guardian  (2026-08-23)

## Corpus Check
- Corpus is ~4,851 words - fits in a single context window. You may not need a graph.

## Summary
- 142 nodes · 232 edges · 14 communities
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.86)
- Token cost: 0 input · 113,079 output

## Community Hubs (Navigation)
- Audit Workflow Pipeline
- Package Manifest
- Guardian Core Assessment
- README Checks & Rationale
- Vercel API Data Fetching
- CI Workflow Pipeline
- Vercel CLI Bootstrap Handling
- Dependency Version Overrides
- Redaction Test Harness
- Webhook & Deploy-Hook Redaction
- Deployment Status Redaction
- Activity Event Redaction
- Paginated API Records

## God Nodes (most connected - your core abstractions)
1. `main()` - 23 edges
2. `What It Checks Section` - 10 edges
3. `overrides` - 9 edges
4. `runVercel()` - 8 edges
5. `redactProject()` - 8 edges
6. `audit Job` - 8 edges
7. `Run Vercel Guardian Step (npm run guardian:strict)` - 7 edges
8. `vercel-guardian Project` - 7 edges
9. `vercelJson()` - 6 edges
10. `isoFromMs()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `.env.example File` --conceptually_related_to--> `Run Vercel Guardian Step (npm run guardian:strict)`  [INFERRED]
  README.md → .github/workflows/audit.yml
- `What It Checks Section` --conceptually_related_to--> `Run Vercel Guardian Step (npm run guardian:strict)`  [INFERRED]
  README.md → .github/workflows/audit.yml
- `vercel-guardian Project` --conceptually_related_to--> `vercel-guardian.mjs Script`  [INFERRED]
  README.md → .github/workflows/audit.yml
- `Redaction Test Suite (17 isolated tests)` --conceptually_related_to--> `npm test Step`  [INFERRED]
  README.md → .github/workflows/ci.yml
- `CI Section` --references--> `VERCEL_SCOPE Configured Gate`  [EXTRACTED]
  README.md → .github/workflows/audit.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Guardian Script Validation Across Pipelines** — _github_workflows_audit_validate_guardian_script_step, _github_workflows_ci_validate_guardian_script_step, scripts_vercel_guardian_script [INFERRED 0.85]
- **Secret Redaction Guarantee** — readme_redacturlsecrets_mechanism, readme_redaction_test_suite, readme_deploy_hooks_check [INFERRED 0.85]
- **CI/CD Pipeline Overview** — readme_ci_section, _github_workflows_audit_workflow, _github_workflows_ci_workflow [EXTRACTED 1.00]

## Communities (14 total, 0 thin omitted)

### Community 0 - "Audit Workflow Pipeline"
Cohesion: 0.14
Nodes (21): audit Job, Checkout Step (actions/checkout@v4), vercel-guardian Concurrency Group, Install Locked Dependencies Step (npm ci), Run Vercel Guardian Step (npm run guardian:strict), Schedule Trigger (every 6 hours), Setup Node Step (actions/setup-node@v4, Node 24), Upload Reports Step (actions/upload-artifact@v4) (+13 more)

### Community 1 - "Package Manifest"
Cohesion: 0.11
Nodes (17): description, devDependencies, vercel, engines, node, license, name, repository (+9 more)

### Community 2 - "Guardian Core Assessment"
Cohesion: 0.15
Nodes (15): args, assessProject(), checkHttp(), commandTimeoutMs, compactEnv(), __dirname, fetchWithTimeout(), httpTimeoutMs (+7 more)

### Community 3 - "README Checks & Rationale"
Cohesion: 0.14
Nodes (16): Deploy Hooks Check, Findings Ranking (critical/warning/info), Framework Detection Check, HTTP Health Check, LICENSE File (MIT), License Section, Motivation for Building Guardian, Node Runtime Drift Check (+8 more)

### Community 4 - "Vercel API Data Fetching"
Cohesion: 0.22
Nodes (14): accountAliases(), aliasUrls(), deploymentErrorSummary(), main(), parseAliasList(), primaryDeployment(), recentActivity(), redactTeam() (+6 more)

### Community 5 - "CI Workflow Pipeline"
Cohesion: 0.29
Nodes (10): Checkout Step (actions/checkout@v4), npm ci Step, npm test Step, pull_request Trigger, push Trigger (all branches), Setup Node Step (actions/setup-node@v4, Node 24, npm cache), test Job, Validate Guardian Script Step (node --check) (+2 more)

### Community 6 - "Vercel CLI Bootstrap Handling"
Cohesion: 0.22
Nodes (10): blockedReport(), bootstrapDetail(), cmdArg(), cmdCommand(), isCliBootstrapError(), quoteCmdArg(), reportEnvironment(), runVercelCandidate() (+2 more)

### Community 7 - "Dependency Version Overrides"
Cohesion: 0.22
Nodes (9): overrides, ajv, minimatch, path-to-regexp, smol-toml, srvx, tar, @tootallnate/once (+1 more)

### Community 8 - "Redaction Test Harness"
Cohesion: 0.29
Nodes (6): cases, failures, functionSource, match, sandbox, source

### Community 9 - "Webhook & Deploy-Hook Redaction"
Cohesion: 0.33
Nodes (7): accountWebhooks(), isoFromMs(), projectDeployHooks(), redactDeployHook(), redactUrlSecrets(), redactWebhook(), vercelCliJson()

### Community 10 - "Deployment Status Redaction"
Cohesion: 0.40
Nodes (5): deploymentUrl(), redactProject(), redactRecentDeployment(), shortSha(), statusFromFindings()

### Community 11 - "Activity Event Redaction"
Cohesion: 0.67
Nodes (4): activityActor(), activitySeverity(), isOwnerActivity(), redactActivityEvent()

### Community 12 - "Paginated API Records"
Cohesion: 0.67
Nodes (3): nextPageCursor(), recordsFromResponse(), vercelPagedJson()

## Knowledge Gaps
- **49 isolated node(s):** `name`, `version`, `type`, `description`, `license` (+44 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vercel-guardian Project` connect `README Checks & Rationale` to `Audit Workflow Pipeline`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `What It Checks Section` connect `README Checks & Rationale` to `Audit Workflow Pipeline`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `Run Vercel Guardian Step (npm run guardian:strict)` connect `Audit Workflow Pipeline` to `README Checks & Rationale`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `main()` (e.g. with `redactRecentDeployment()` and `redactTeam()`) actually correct?**
  _`main()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _49 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Audit Workflow Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.1380952380952381 - nodes in this community are weakly interconnected._
- **Should `Package Manifest` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
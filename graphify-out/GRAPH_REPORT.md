# Graph Report - vercel-guardian  (2026-09-21)

## Corpus Check
- Corpus is ~4,935 words - fits in a single context window. You may not need a graph.

## Summary
- 117 nodes · 190 edges · 13 communities (12 shown, 1 thin omitted)
- Extraction: 96% EXTRACTED · 3% INFERRED · 1% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.83)
- Token cost: 0 input · 61,388 output

## Community Hubs (Navigation)
- Vercel API & Redaction Helpers
- Package Manifest & Scripts
- CI/CD Workflows & Docs
- Guardian CLI Core & HTTP Checks
- Transitive npm Dependencies
- Redaction Test Harness
- Deployment Reporting Helpers
- Vercel CLI Bootstrap & Errors
- Activity Event Redaction
- Vercel Command Construction
- Environment Variable Audit
- Audit Report Rendering

## God Nodes (most connected - your core abstractions)
1. `main()` - 23 edges
2. `vercel-guardian README` - 11 edges
3. `overrides` - 9 edges
4. `runVercel()` - 8 edges
5. `redactProject()` - 8 edges
6. `vercelJson()` - 6 edges
7. `isoFromMs()` - 6 edges
8. `vercelPagedJson()` - 5 edges
9. `redactActivityEvent()` - 5 edges
10. `audit job` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Non-strict audit mode` --references--> `guardian:strict command`  [AMBIGUOUS]
  .github/workflows/audit.yml → README.md
- `vercel-guardian README` --references--> `Vercel Guardian Audit Workflow`  [EXTRACTED]
  README.md → .github/workflows/audit.yml
- `vercel-guardian README` --references--> `CI Workflow`  [EXTRACTED]
  README.md → .github/workflows/ci.yml
- `audit job` --semantically_similar_to--> `test job`  [INFERRED] [semantically similar]
  .github/workflows/audit.yml → .github/workflows/ci.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Script validation shared across CI workflows** — github_workflows_audit_audit_job, github_workflows_ci_test_job, scripts_vercel_guardian [INFERRED 0.85]
- **Vercel Guardian audit checks catalog** — readme_production_deployment_check, readme_http_health_check, readme_framework_detection_check, readme_web_analytics_check, readme_node_runtime_drift_check, readme_deploy_hooks_check, readme_plan_level_limits_check [INFERRED 0.85]

## Communities (13 total, 1 thin omitted)

### Community 0 - "Vercel API & Redaction Helpers"
Cohesion: 0.14
Nodes (22): accountAliases(), accountWebhooks(), aliasUrls(), deploymentErrorSummary(), main(), nextPageCursor(), parseAliasList(), primaryDeployment() (+14 more)

### Community 1 - "Package Manifest & Scripts"
Cohesion: 0.11
Nodes (17): description, devDependencies, vercel, engines, node, license, name, repository (+9 more)

### Community 2 - "CI/CD Workflows & Docs"
Cohesion: 0.13
Nodes (17): Vercel Guardian Audit Workflow, audit job, VERCEL_SCOPE conditional gate, Non-strict audit mode, CI Workflow, test job, vercel-guardian README, Deploy hooks check (+9 more)

### Community 3 - "Guardian CLI Core & HTTP Checks"
Cohesion: 0.15
Nodes (12): ref_node_child_process, ref_node_path, ref_node_url, args, checkHttp(), commandTimeoutMs, __dirname, fetchWithTimeout() (+4 more)

### Community 4 - "Transitive npm Dependencies"
Cohesion: 0.22
Nodes (9): overrides, ajv, minimatch, path-to-regexp, smol-toml, srvx, tar, @tootallnate/once (+1 more)

### Community 5 - "Redaction Test Harness"
Cohesion: 0.22
Nodes (8): ref_node_fs, ref_node_vm, cases, failures, functionSource, match, sandbox, source

### Community 6 - "Deployment Reporting Helpers"
Cohesion: 0.33
Nodes (7): deploymentUrl(), isoFromMs(), redactDeployHook(), redactProject(), redactRecentDeployment(), shortSha(), statusFromFindings()

### Community 7 - "Vercel CLI Bootstrap & Errors"
Cohesion: 0.33
Nodes (6): blockedReport(), bootstrapDetail(), isCliBootstrapError(), reportEnvironment(), runVercelCandidate(), sanitizeError()

### Community 8 - "Activity Event Redaction"
Cohesion: 0.67
Nodes (4): activityActor(), activitySeverity(), isOwnerActivity(), redactActivityEvent()

### Community 9 - "Vercel Command Construction"
Cohesion: 0.67
Nodes (4): cmdArg(), cmdCommand(), quoteCmdArg(), runVercelWithCommand()

### Community 10 - "Environment Variable Audit"
Cohesion: 0.67
Nodes (3): assessProject(), compactEnv(), sensitiveEnvFindings()

### Community 11 - "Audit Report Rendering"
Cohesion: 0.67
Nodes (3): renderMarkdown(), severityRank(), writeReport()

## Ambiguous Edges - Review These
- `Non-strict audit mode` → `guardian:strict command`  [AMBIGUOUS]
  .github/workflows/audit.yml · relation: references

## Knowledge Gaps
- **42 isolated node(s):** `name`, `version`, `type`, `description`, `license` (+37 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 49 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Non-strict audit mode` and `guardian:strict command`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `audit job` connect `CI/CD Workflows & Docs` to `Guardian CLI Core & HTTP Checks`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `test job` connect `CI/CD Workflows & Docs` to `Guardian CLI Core & HTTP Checks`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `main()` (e.g. with `redactRecentDeployment()` and `redactTeam()`) actually correct?**
  _`main()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _42 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Vercel API & Redaction Helpers` be split into smaller, more focused modules?**
  _Cohesion score 0.13852813852813853 - nodes in this community are weakly interconnected._
- **Should `Package Manifest & Scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
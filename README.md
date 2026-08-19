# vercel-guardian

[![CI](https://github.com/sergiogoqui-cpu/vercel-guardian/actions/workflows/ci.yml/badge.svg)](https://github.com/sergiogoqui-cpu/vercel-guardian/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A local/CI auditor for Vercel projects: checks production deployment
health, config drift, and observability gaps — without ever printing a
secret value.

I built this after a client's production deployment sat broken for two
weeks because nobody was watching it. `vercel ls` tells you a
deployment exists; it doesn't tell you the production alias is actually
serving 200s, that Web Analytics silently isn't configured, or that a
deploy hook got added by someone you don't recognize.

## What it checks

For every project in scope:

- **Production deployment exists and is READY** — not building, not errored, not missing.
- **HTTP health** — the production URL actually returns a healthy status, not a network error or an unexpected auth wall.
- **Framework detection** — Vercel recognizes the project's framework (a common symptom of a broken build config).
- **Web Analytics / Speed Insights** — flags projects running blind, with no visibility into real traffic or Core Web Vitals.
- **Node runtime drift** — warns when a project is pinned to a runtime behind Vercel's current default.
- **Deploy hooks** — surfaces configured deploy hooks so an unexpected one doesn't go unnoticed (URLs are redacted, see below).
- **Plan-level limits** — e.g. flags when Hobby-plan log-drain restrictions apply.

Findings are ranked `critical` / `warning` / `info` and rolled up into a
per-project status, so a scheduled run can fail CI the moment something
in production actually breaks.

## Secret safety

Every URL that goes into a report — webhook URLs, log drain
destinations, anything with a query string — is passed through
`redactUrlSecrets` before it's written anywhere: query params matching
`token`/`secret`/`key`/`auth`/`password`/`sig`/`credential`-like names
are replaced with `[redacted]`, userinfo (`user:pass@host`) is
stripped, and provider webhook paths (Slack `/services/...`, generic
`/hooks/...`) have their trailing secret segment redacted. 17 isolated
tests (`npm test`) lock this behavior down — this is the one piece of
the tool I'd never want to regress silently.

## Usage

```bash
npm install
cp .env.example .env   # fill in VERCEL_TOKEN and VERCEL_SCOPE
npm run guardian        # human-readable report, writes to reports/
npm run guardian:strict # same, but exits 1 if anything is critical (for CI)
```

Local interactive use can skip `VERCEL_TOKEN` entirely and rely on
`vercel login` instead — the token is only required for non-interactive
CI runs.

## CI

`.github/workflows/audit.yml` runs the strict audit on a 6-hour
schedule once you set the `VERCEL_SCOPE` repository variable and a
`VERCEL_TOKEN` repository secret — until then it stays idle rather than
failing your Actions tab. `.github/workflows/ci.yml` runs the redaction
test suite on every push.

## License

MIT — see [LICENSE](LICENSE).

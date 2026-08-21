# ADR-0002: CI Pipeline and Backward-Compatibility Quality Gates

- **Status**: ACCEPTED
- **Date**: 2026-08-21
- **Author(s)**: Gabriel & Antigravity Agent
- **Deciders**: DevATS Engineering Team
- **Relevant SDDs**: [SDD-0002: CI Pipeline and Backward-Compatibility Guardrails](../sdd/0002-ci-pipeline-and-backward-compatibility-guardrails.md)


---

## 1. Context and Problem Statement
DevATS is a full-stack monorepo featuring a NestJS (Fastify) backend, Prisma ORM against PostgreSQL, and a React 19 Vite frontend. As features, migrations, and caching layers are added by both human developers and autonomous AI agents, we must prevent:

1. **Regressions & Broken Builds**: Code being merged into `master` with failing tests, broken TypeScript compilations, or syntax errors.
2. **Database Migration Drift & Backward Incompatibility**: Destructive or unapplied Prisma database migrations breaking existing database schemas or deployed APIs.
3. **CI Resource Waste & Queue Bloat**: Redundant CI runs executing on obsolete commits when rapid pushes occur on an active Pull Request.

We need an automated Continuous Integration (CI) quality gate system that executes on PR lifecycle events and `master` branch updates.

---

## 2. Decision Drivers
- **Comprehensive Verification**: Must validate backend unit tests, backend E2E tests, frontend Vitest tests, and production TypeScript bundle compilation.
- **Backward-Compatibility Guarantees**: Must explicitly verify Prisma migration integrity and detect breaking schema modifications.
- **Fast Feedback Loop (< 3 minutes)**: Maximize parallelism across backend and frontend jobs, leveraging dependency caching (`actions/cache` for npm).
- **Concurrency & In-Progress Cancellation**: Automatically cancel obsolete workflow runs when new commits are pushed to the same PR branch.
- **Isolated Service Dependencies**: Run real, isolated PostgreSQL 17 and Redis 7 service containers in CI rather than relying on brittle network mocks.

---

## 3. Considered Options

### Option 1: Monolithic Sequential CI Script
- A single shell script (`make test && make build`) running sequentially in a single CI runner container.

### Option 2: GitHub Actions Parallel Multi-Job Pipeline with Ephemeral Service Containers
- Multi-job workflow partitioned into parallel jobs (`typecheck-and-build`, `test-backend` with Postgres/Redis service containers, `test-frontend`, `migration-compatibility-check`, and a unified `ci-gate` status check).
- Concurrency group with `cancel-in-progress: true`.

### Option 3: Third-Party Managed CI (CircleCI / GitLab CI)
- External CI SaaS requiring external webhook and credentials management.

---

## 4. Decision Outcome

**Chosen Option**: **Option 2 — GitHub Actions Parallel Multi-Job Pipeline with Ephemeral Service Containers**.

### Rationale:
1. **Zero-Configuration Integration**: Native GitHub integration for PR status checks, branch protection rules, and security token management (`GITHUB_TOKEN`).
2. **True Backward-Compatibility Testing**: GitHub Actions supports native `services:` definitions, enabling live `postgres:17-alpine` and `redis:7-alpine` instances to execute real Prisma migrations and NestJS Fastify E2E tests.
3. **Concurrency Optimization**: Native `concurrency.cancel-in-progress` prevents queue congestion during rapid iteration.

---

## 5. Pros and Cons of the Options

### Option 1: Monolithic Sequential Script
- 🟢 **Pro**: Simple single-file definition.
- 🔴 **Con**: Slow wall-clock time; failure in step 1 hides failures in step 4.
- 🔴 **Con**: No granular job status indicators on GitHub PR UI.

### Option 2: GitHub Actions Multi-Job Pipeline (Chosen)
- 🟢 **Pro**: High concurrency; jobs run in parallel across isolated runners.
- 🟢 **Pro**: Clear, actionable error reporting per subsystem (Backend vs Frontend vs Migrations).
- 🟢 **Pro**: Ephemeral database & cache containers ensure deterministic, clean-state test runs.
- 🔴 **Con**: Slightly more complex YAML workflow structure.

---

## 6. Consequences & Architectural Guardrails

### Positive Consequences
- Every PR will be automatically gated before merge.
- Breaking database changes (e.g. dropping columns without nullable grace periods) will be caught automatically before hitting production.
- Devs and AI agents get instant feedback on PRs within ~2 minutes.

### 🛡️ Agentic Guardrails (Strict Rules for Developers & AI Agents):
1. **No Destructive Migrations Without Deprecation**: Any Prisma schema migration that removes a column or alters existing types MUST follow an expand-and-contract deprecation cycle.
2. **Unified Gate Status**: Branch protection on `master` MUST require the `ci-gate` job status to pass.
3. **Zero Network Calls to Third-Party ATS in CI**: Ingestion tests in CI must use mock adapters or fixture recordings to prevent external rate-limiting or flakiness.

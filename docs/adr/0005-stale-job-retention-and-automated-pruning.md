# ADR-0005: Stale Job Retention, Soft-Deletion Lifecycle, and Automated Pruning Architecture

- **Status**: ACCEPTED
- **Date**: 2026-08-21
- **Author(s)**: Gabriel & Antigravity Agent Swarm
- **Deciders**: DevATS Engineering Team
- **Relevant SDDs**: [SDD-0005: Stale Job Retention and Automated Pruning Subsystem](../sdd/0005-stale-job-retention-and-automated-pruning.md)

---

## 1. Context and Problem Statement
DevATS continuously ingests job postings across dozens of tech companies and multiple ATS providers (Greenhouse, Lever, Ashby). Over time, older job postings that are no longer actively listed or maintained accumulate in the PostgreSQL database. 

However, two competing engineering requirements exist:
1. **Search Feed Relevance & Index Performance**: Active job search feeds (`GET /api/v1/jobs`) and facet aggregations must not be cluttered with expired, months-old listings.
2. **Historical Market & Salary Intelligence**: Downstream analytics engines (e.g., ADR-0004 Salary & Tech Market Analytics) rely on comprehensive historical data to analyze multi-month compensation distributions, skill adoption rates, and hiring trends across tech stacks.

We need an automated, scheduled lifecycle pruning strategy that removes expired listings from active user discovery while preserving valuable historical data for analytics and ensuring zero-risk external access.

---

## 2. Decision Drivers
- **Data Preservation for Analytics**: Inactive postings must remain queryable for historical salary benchmarking and market intelligence.
- **Search Feed Hygiene**: Stale listings must be instantly omitted from primary job discovery feeds and facet calculations.
- **Deterministic Timestamp Criterion**: Ingestion timestamp (`firstSeenAt`) must be the authoritative reference boundary, eliminating dependency on inconsistent ATS-published timestamps (`postedAt` is nullable across some platforms).
- **Strict Security & VM Boundary Isolation**: The maintenance pruning endpoint must be strictly restricted to execution on the local host / VM machine (`127.0.0.1`, `::1`), preventing any external actor or web client from triggering bulk database mutations.
- **Zero-Ghost Cache Invalidation**: Pruning runs must reliably purge Redis facet and search caches (`devats:cache:jobs:*`) without disrupting running server instances.
- **Operational Simplicity**: Cron execution must integrate cleanly with Linux system crontab and existing platform operational scripts (`cron_daily_sync.sh`).

---

## 3. Considered Options

### Option 1: Hard Deletion (`DELETE FROM "Job"`)
- Physically deletes job rows older than 45 days.
- 🔴 **Con**: Permanently destroys historical compensation and market data, breaking long-term Salary Analytics trends (ADR-0004).
- 🔴 **Con**: Orphaned references in user bookmarks if not handled.

### Option 2: In-Process NestJS Schedule Module (`@nestjs/schedule`)
- Embeds `@Cron()` decorators directly within the Node.js API process.
- 🔴 **Con**: If multiple backend replicas run in cluster mode or containers, cron runs trigger concurrently without distributed locking (e.g. Redlock), leading to duplicate database queries.
- 🔴 **Con**: Tightly couples scheduled background maintenance with real-time HTTP server lifecycle.

### Option 3: Soft-Deletion (`isActive = false`) via Dedicated Localhost-Only API + Detached Shell Cron (**Chosen**)
- Marks jobs with `postedAt < NOW() - 45 days` or `firstSeenAt < NOW() - 45 days` as `isActive: false`.
- Pruning triggered via a protected endpoint `POST /api/v1/jobs/prune` guarded by `LocalhostOnlyGuard` and `RedisRateLimiterGuard`.
- Scheduled via a detached, standalone bash script (`cron_prune_stale_jobs.sh`) invoked by system crontab.
- Invalidates Redis caches (`devats:cache:jobs:*`, `devats:cache:analytics:*`) and resets in-memory facet caches immediately upon successful deactivation.

---

## 4. Decision Outcome

**Chosen Option**: **Option 3 — Soft-Deletion Lifecycle with Localhost-Restricted Admin API and Detached Shell Cron**.

### Rationale:
1. **Analytics Integrity**: Setting `isActive: false` ensures `GET /api/v1/jobs` (which filters by `where: { isActive: true }`) immediately hides stale listings from job seekers, while `AnalyticsService` can continue computing overall market salary distributions and historical insights.
2. **Comprehensive Stale Detection**: Evaluating both `postedAt` (original ATS publishing date) and `firstSeenAt` (ingestion timestamp) guarantees any job older than 45 days is reliably pruned regardless of whether upstream ATS payloads supplied a valid `postedAt` date.
3. **Defense in Depth**: `LocalhostOnlyGuard` ensures that only callers originating from `127.0.0.1`, `::1`, or `::ffff:127.0.0.1` can access the pruning endpoint, returning `403 Forbidden` to all external network traffic.
4. **Resilient Invalidation**: Synchronizes PostgreSQL state updates with Redis cache evictions to avoid serving stale facet counts.

---

## 5. Pros and Cons of the Options

### Option 3: Soft-Deletion + Localhost API + Detached Shell Cron
- 🟢 **Pro**: 100% preservation of historical salary and tech stack data for Market Intelligence.
- 🟢 **Pro**: Immediate exclusion from active search results and facet counts.
- 🟢 **Pro**: Isolated cron execution with file-based audit logging (`/var/log/findjobs_prune_cron.log`).
- 🟢 **Pro**: Network-level and application-level isolation to the local VM host.
- 🟢 **Pro**: Dry-run mode (`?dryRun=true`) enables pre-flight audit of candidate stale listings.
- 🔴 **Con**: Database storage footprint continues to grow; future database partitioning or cold storage archival can be introduced if dataset scales beyond 1M+ listings.

---

## 6. Consequences & Architectural Guardrails

- **Positive Consequences**:
  - Clean search results with 0 stale jobs older than 45 days in discovery feeds.
  - Full backward-compatibility with client-side bookmarks and market analytics.
  - Safe, automated operational maintenance via daily cron.
- **Agent Guardrails**:
  - *Rule 1*: All active job search queries in `JobsService` MUST maintain the `{ isActive: true }` filter.
  - *Rule 2*: The pruning endpoint `POST /api/v1/jobs/prune` MUST ALWAYS be protected with `LocalhostOnlyGuard`.
  - *Rule 3*: Any soft-deletion execution MUST trigger non-blocking Redis invalidation on `devats:cache:jobs:*` and reset `this.cachedFacets = null`.

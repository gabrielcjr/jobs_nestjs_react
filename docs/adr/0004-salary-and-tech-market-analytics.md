# ADR-0004: Salary Analytics and Tech Market Intelligence Architecture

- **Status**: PROPOSED
- **Date**: 2026-08-21
- **Author(s)**: Gabriel & Antigravity Agent Swarm
- **Deciders**: DevATS Engineering Team
- **Relevant SDDs**: [SDD-0004: Salary & Tech Market Analytics Subsystem](../sdd/0004-salary-and-tech-market-analytics.md)

---

## 1. Context and Problem Statement
DevATS ingests hundreds of engineering listings across Greenhouse, Lever, and Ashby. However, users currently only have a linear search feed. Job seekers and engineering managers lack high-level visibility into:
1. Compensation benchmarks across role categories (e.g. Backend vs. Frontend vs. AI/ML).
2. Most in-demand tech stack skills and their corresponding salary premiums.
3. Workplace distribution (Remote vs. Hybrid vs. Onsite) and LATAM USD remote eligibility.

We need an analytics engine that delivers instant market insights without overloading PostgreSQL or slowing down core job search APIs.

---

## 2. Decision Drivers
- **Query Performance (<10ms)**: Analytics dashboards must render in under 10ms for cached requests.
- **Minimal Infrastructure Overhead**: Avoid introducing dedicated OLAP warehouses (e.g., ClickHouse or Snowflake) for hundreds to thousands of records.
- **Agentic MCP Tooling**: Use Model Context Protocol (MCP) to allow agents to inspect live database schemas and validate aggregation query performance.
- **Cache-Aside Resiliency**: Cached in Redis with a 1-hour TTL (`devats:cache:analytics:*`) and automatically invalidated when new ATS jobs are ingested.
- **Fail-Open Fault Tolerance**: If Redis is offline, fallback seamlessly to direct PostgreSQL queries.

---

## 3. Considered Options

### Option 1: Client-Side Full Dataset Aggregation
- Download all raw job listings to the browser and calculate averages in JavaScript.
- 🔴 **Con**: Consumes massive bandwidth; crashes on mobile devices with large datasets.

### Option 2: Dedicated OLAP / Elasticsearch Data Pipeline
- Stream ingestion events to an external Elasticsearch or ClickHouse cluster.
- 🔴 **Con**: Severe operational overhead and synchronization lag for single-server/small cluster deployments.

### Option 3: PostgreSQL Native Aggregations with Cache-Aside Redis & MCP Exploration (Chosen)
- Use PostgreSQL's optimized aggregation functions (`AVG`, `COUNT`, `PERCENTILE_CONT`, `unnest(tags)`) backed by Prisma and wrapped in Redis cache with automated invalidation.

---

## 4. Decision Outcome

**Chosen Option**: **Option 3 — PostgreSQL Native Aggregations + Redis Cache-Aside + MCP Explorer**.

### Rationale:
1. **Performance & Simplicity**: Native PostgreSQL SQL queries execute in ~3ms on indexed tables; cached Redis responses return in <1ms.
2. **Cohesion**: Integrates cleanly with our existing `RedisCacheService` and `PrismaService`.
3. **Multi-Agent Decoupling**: Contracts are defined in SDD-0004 with typed DTOs, enabling frontend and backend specialists to work concurrently.

---

## 5. Agentic Guardrails & Quality Constraints

1. **Deterministic Cache Keys**: Analytics endpoints MUST use canonical cache keys (`devats:cache:analytics:overview`, `devats:cache:analytics:salary-by-role`, `devats:cache:analytics:tech-demand`).
2. **Invalidation Hook**: When `IngestionService.syncCompanyJobs()` runs, it MUST invalidate `devats:cache:analytics:*`.
3. **Data Integrity**: Salary aggregations MUST filter out `NULL` or negative salary entries (`WHERE "maxSalary" > 0`).

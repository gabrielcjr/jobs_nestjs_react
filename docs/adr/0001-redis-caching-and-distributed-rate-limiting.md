# ADR-0001: Redis Caching & Distributed Rate-Limiting Architecture

- **Status**: ACCEPTED
- **Date**: 2026-08-21
- **Author(s)**: Gabriel & Antigravity Agent
- **Deciders**: DevATS Engineering Team
- **Relevant SDDs**: [SDD-0001: Redis Cache and Rate Limiting Subsystem](../sdd/0001-redis-cache-and-rate-limiting-subsystem.md)



---

## 1. Context and Problem Statement
DevATS is a high-performance Software Engineering job board and multi-ATS ingestion platform. As traffic grows and background ingestion jobs discover hundreds of live ATS boards, two critical architectural challenges have emerged:

1. **Database Contention on Heavy Faceted Queries**: The primary read endpoint `GET /api/v1/jobs` executes complex multi-facet aggregations, keyword searches across multiple columns, and GIN array operations (`tags text[]`). Re-executing identical heavy queries on PostgreSQL on every user navigation creates unnecessary DB load and latency spikes (~150ms-300ms under load).
2. **Denial of Service & Scraper Vulnerability**: Public ATS discovery and syncing endpoints (`POST /api/v1/ingest/discover`, `POST /api/v1/ingest/sync`) make outbound HTTP requests to third-party ATS APIs (Greenhouse, Lever, Ashby). Without distributed rate limiting, malicious or runaway clients could trigger upstream IP bans or exhaust backend worker concurrency.

We need a unified caching and rate-limiting subsystem that integrates cleanly with our NestJS (Fastify engine) architecture.

---

## 2. Decision Drivers
- **Sub-millisecond read latency**: Instant cache hits (< 5ms) for frequent search filters, top tags, and job detail views.
- **Horizontal scalability**: State (cached query results, rate limit counters) must be shared across multiple backend container instances.
- **Graceful degradation (Fail-Open)**: If the cache/rate-limit infrastructure crashes or becomes unreachable, the backend MUST continue serving traffic via PostgreSQL without throwing 500 errors.
- **Deterministic cache invalidation**: Fresh ATS ingestion syncs must automatically invalidate or purge stale job facet caches.
- **Low operational footprint**: Simple setup within `docker-compose.yml` for local dev and production.

---

## 3. Considered Options

### Option 1: In-Process In-Memory Store (`node-cache` / Fastify memory store)
- Caching and rate limits stored directly in Node.js process memory heap.

### Option 2: Dedicated Redis Layer (`ioredis` + `@nestjs/throttler` with Redis storage)
- Centralized, high-throughput in-memory Redis instance shared by all backend replicas.
- Redis-backed Cache-Aside service with SHA-256 query hash keys.
- Distributed sliding-window rate limiters.

### Option 3: Edge / Reverse Proxy Caching (Cloudflare / Nginx microcaching)
- Offload caching and rate limiting entirely to the edge or API Gateway / Nginx reverse proxy.

---

## 4. Decision Outcome

**Chosen Option**: **Option 2 — Dedicated Redis Layer (`ioredis` + NestJS Cache/Throttler integration)**.

### Rationale:
1. **Dynamic Facet Invalidation**: Edge/Nginx caching cannot easily handle granular query parameter permutation hashing or trigger application-level invalidations when background ingestion discovers new jobs.
2. **Multi-Instance Consistency**: In-memory caching (Option 1) drifts across multiple backend processes and fails when scaling horizontally or restarting containers.
3. **Resilience & Control**: A custom NestJS `RedisService` wrapping `ioredis` allows fine-grained lifecycle management, graceful fallback try/catch wrappers, health checks, and unified metric tracking.

---

## 5. Pros and Cons of the Options

### Option 1: In-Process Memory Cache
- 🟢 **Pro**: Zero extra infrastructure or network hops.
- 🔴 **Con**: Inconsistent state across backend replicas; memory leaks under high key cardinality.
- 🔴 **Con**: Inability to coordinate rate limits across multiple container instances.

### Option 2: Dedicated Redis Layer (Chosen)
- 🟢 **Pro**: Distributed, ultra-low latency (< 1ms).
- 🟢 **Pro**: Native atomic operations (`INCR`, `EXPIRE`, `SCAN`, `DEL`) for sliding window rate limits.
- 🟢 **Pro**: Decoupled lifecycle — cache persists across backend code redeployments.
- 🔴 **Con**: Introduces an external service dependency (mitigated by fail-open architecture).

### Option 3: Edge / Reverse Proxy Caching
- 🟢 **Pro**: Drops traffic before hitting application servers.
- 🔴 **Con**: High configuration complexity for complex JSON query serialization.
- 🔴 **Con**: Poor observability and tight vendor coupling.

---

## 6. Consequences & Architectural Guardrails

### Positive Consequences
- Query response times for hot queries drop from ~180ms to < 4ms.
- PostgreSQL CPU and connection pool pressure reduced by up to 85%.
- Ingestion probe endpoints are protected against abuse via tiered rate-limit buckets.

### Negative Consequences / Operational Requirements
- Redis 7 service added to `docker-compose.yml` and environment variables.
- Requires maintenance of cache key hashing schemas and invalidation triggers.

### 🛡️ Agentic Guardrails (Strict Rules for Developers & AI Agents):
1. **Fail-Open Mandate**: Every cache read/write must be wrapped in a non-blocking try/catch. A Redis downtime MUST NEVER return HTTP 500 to end users.
2. **Deterministic Key Hashing**: Query cache keys MUST be generated by normalizing and sorting query keys before hashing to prevent cache fragmentation (e.g. `?limit=10&page=1` and `?page=1&limit=10` must produce the exact same cache key).
3. **Event-Driven Invalidation**: Any mutation to the `Job` database (via `ingest/sync` or manual mutations) MUST trigger `RedisCacheService.invalidatePattern('devats:cache:jobs:*')`.

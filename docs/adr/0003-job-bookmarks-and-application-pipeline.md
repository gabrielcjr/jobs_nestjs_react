# ADR-0003: Job Bookmarks and Application Pipeline State Strategy

- **Status**: ACCEPTED
- **Date**: 2026-08-21
- **Author(s)**: Gabriel & Antigravity Agent Swarm
- **Deciders**: DevATS Engineering Team
- **Relevant SDDs**: [SDD-0003: Job Bookmarks & Application Tracker Subsystem](../sdd/0003-job-bookmarks-and-application-pipeline.md)


---

## 1. Context and Problem Statement
DevATS users frequently browse hundreds of ingested engineering jobs across Greenhouse, Lever, and Ashby. Currently, users have no way to:
1. Bookmark jobs to review or apply to later.
2. Track which job offers they have already viewed/inspected to avoid redundant reading.
3. Filter the master job list to only view their saved jobs.
4. Track the lifecycle status of applications (e.g. `SAVED`, `APPLIED`, `INTERVIEWING`, `OFFER`, `REJECTED`).

We need a persistent, responsive, zero-friction state management architecture for job bookmarks, application status tracking, and viewed offers history.

---

## 2. Decision Drivers
- **Zero Login Friction**: Job seekers should be able to instantly save jobs, track applications, and see viewed indicators without being forced to create an account or authenticate first.
- **Sub-16ms Optimistic UI Updates**: Toggling bookmarks and marking jobs as viewed must feel instant with zero lag.
- **Persistence Across Sessions**: Saved jobs, viewed history, and application pipelines must persist across browser tab refreshes.

- **Cross-Component Reactivity**: Bookmarking a job in the right detail pane must instantly update the card indicator in the left master list and increment the header badge counter.
- **Multi-Agent Contract Decoupling**: Frontend and QA Browser agents must work against unambiguous TypeScript interfaces and DOM selectors.

---

## 3. Considered Options

### Option 1: Mandatory Server-Side JWT Authentication & PostgreSQL Storage
- Requires creating User, Session, and Bookmark tables, OAuth/Magic link flows, login modals, and token refresh interceptors.

### Option 2: Pure In-Memory React State
- Stored solely in React context; resets immediately upon page refresh.

### Option 3: Resilient Client-Side Storage (`localStorage` with Custom Reactive Hook & Sync Engine)
- Zero-friction client persistence using structured JSON serialization with automatic schema versioning, custom React Hook (`useBookmarks`), and broadcast sync across browser tabs.

---

## 4. Decision Outcome

**Chosen Option**: **Option 3 — Resilient Client-Side Storage (`localStorage` + Reactive State Hook & Filter Integration)**.

### Rationale:
1. **User Experience**: Job board visitors want immediate utility. Forcing authentication reduces feature adoption by >70%.
2. **Performance**: Zero network roundtrips for bookmarking operations; reads and writes happen in <1ms.
3. **Extensibility**: The storage layer is abstracted behind an `IBookmarkService` interface, enabling effortless future synchronization to a backend database once user authentication is introduced.

---

## 5. Pros and Cons of the Options

### Option 1: Server-Side Authentication
- 🟢 **Pro**: Syncs across multiple physical devices.
- 🔴 **Con**: High login friction; requires significant auth infrastructure before delivering value.

### Option 3: Resilient Client Storage (Chosen)
- 🟢 **Pro**: Instant, zero-friction, zero network latency.
- 🟢 **Pro**: Works offline and persists across browser refreshes.
- 🔴 **Con**: Bookmarks are scoped to the user's browser profile unless exported/imported.

---

## 6. Consequences & Multi-Agent Guardrails

### 🛡️ Agentic Guardrails (Strict Rules for Developers & AI Agents):
1. **Unique Element IDs**: All interactive bookmark buttons and status selectors MUST have deterministic `id` and `data-testid` attributes (e.g. `data-testid="bookmark-btn-${jobId}"`) so the **Browser Subagent** can target and test them reliably.
2. **Schema Versioning**: LocalStorage records MUST include a `version: 1` field to allow schema migration if saved payload structures evolve.
3. **Sanitization**: Bookmark notes and custom metadata MUST be sanitized before rendering to prevent client-side XSS.

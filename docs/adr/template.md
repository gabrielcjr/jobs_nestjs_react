# ADR-XXXX: [Short Title of Architectural Decision]

- **Status**: [PROPOSED | ACCEPTED | REJECTED | DEPRECATED | SUPERSEDED by ADR-YYYY]
- **Date**: YYYY-MM-DD
- **Author(s)**: [Name / AI Agent]
- **Deciders**: [Architects, Tech Leads, Engineering Team]
- **Relevant SDDs**: [Link to SDD-XXXX or N/A]

---

## 1. Context and Problem Statement
*What is the context, motivation, and problem we are trying to solve? What technical or business requirements make this decision necessary?*

---

## 2. Decision Drivers
*What key factors, metrics, and quality attributes influence this decision?*
- Driver 1 (e.g. Sub-millisecond latency under high concurrency)
- Driver 2 (e.g. Horizontal scalability across multiple node instances)
- Driver 3 (e.g. Zero downtime / graceful degradation on infra failure)
- Driver 4 (e.g. Developer ergonomics and maintenance cost)

---

## 3. Considered Options
*List all architectural options evaluated.*

1. **Option 1**: [Title / Approach]
2. **Option 2**: [Title / Approach]
3. **Option 3**: [Title / Approach]

---

## 4. Decision Outcome
*Chosen option and why it was selected over the alternatives.*

**Chosen Option**: [Option Name]

### Rationale:
*Explain the core reasoning why this option best satisfies the decision drivers.*

---

## 5. Pros and Cons of the Options

### Option 1: [Name]
- 🟢 **Pro**: [Advantage]
- 🟢 **Pro**: [Advantage]
- 🔴 **Con**: [Disadvantage / Trade-off]

### Option 2: [Name]
- 🟢 **Pro**: [Advantage]
- 🔴 **Con**: [Disadvantage / Trade-off]

---

## 6. Consequences & Architectural Guardrails
*What becomes easier, harder, or constrained because of this decision? What must subsequent agents and developers strictly uphold?*

- **Positive Consequences**: [Benefits realized]
- **Negative Consequences / Overhead**: [Costs, complexity, new operational dependencies]
- **Agent Guardrails**:
  - *Rule 1*: [E.g., Any new read endpoint must use the Cache-Aside helper]
  - *Rule 2*: [E.g., Never block the HTTP thread if Redis connection fails]

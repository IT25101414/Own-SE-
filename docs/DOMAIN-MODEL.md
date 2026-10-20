# Domain model

## Ubiquitous language

- **Repository:** a version-controlled software product under protection.
- **Dependency:** a direct or transitive third-party package used by a repository.
- **Scan:** an immutable observation of repository dependency risk at a point in time.
- **Finding:** a repository's exposure to a vulnerability through a dependency path.
- **Advisory:** externally sourced vulnerability intelligence, identified by CVE, GHSA, or OSV ID.
- **Policy:** a rule that turns security intent into a release decision.
- **Risk score:** a normalized 0–100 prioritization signal, not a probability of exploitation.
- **Audit event:** an append-only record of a user-visible state change.

## Bounded contexts

### Repository Inventory

Owns repository identity, ownership, ecosystem, default branch, and primary package metadata.

### Dependency Analysis

Owns scans, dependency counts, graph traversal, and the shortest path from an application to a vulnerable transitive package.

### Vulnerability Intelligence

Owns advisory identifiers, severity, CVSS, summaries, fixed versions, and OSV integration.

### Policy Management

Owns guardrail definitions, scope, action, and enabled state.

### Reporting

Projects repository, scan, finding, and policy data into the dashboard read model and export format.

### Audit Trail

Records repository creation, completed scans, and policy changes with an entity reference, actor, message, and timestamp.

## Invariants

- Every scan belongs to one existing repository.
- Every finding references one scan, one repository, and one known advisory.
- A risk score is always between 0 and 100.
- Repository names are unique in a workspace.
- A policy state change is timestamped.
- Every successful mutation produces an audit event.

## Graph algorithm

Dependency relationships form a directed graph. SupplyLens uses breadth-first search to identify the shortest known path from the repository root to a vulnerable package. This is useful because a shorter path usually gives developers a clearer remediation owner and fewer intermediate upgrades.

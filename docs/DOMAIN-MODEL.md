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
- **Scan comparison:** a derived view of dependency, finding, and risk-score movement between two immutable scans.
- **Policy gate:** a release decision made from evaluable enabled rules, with unsupported rules explicitly marked for review.

## Bounded contexts

### Repository Inventory

Owns repository identity, ownership, ecosystem, default branch, and primary package metadata.

### Dependency Analysis

Owns scans, normalized components, dependency edges, SBOM imports, graph traversal, and the shortest path from an application to a vulnerable transitive package.

An imported CycloneDX document becomes a directed graph. Components are identified by `bom-ref` and stored through their package URL (PURL). Repository-component relationships retain whether a package is direct, transitive, or isolated and its minimum breadth-first depth.

### Vulnerability Intelligence

Owns advisory identifiers, severity, CVSS, summaries, fixed versions, and OSV integration.

### Policy Management

Owns guardrail definitions, scope, action, and enabled state.

### Reporting

Projects repository, scan, finding, policy, alert, posture-timeline, and comparison data into the dashboard read model and export format.

### Audit Trail

Records repository creation, completed scans, and policy changes with an entity reference, actor, message, and timestamp.

## Invariants

- Every scan belongs to one existing repository.
- Every finding references one scan, one repository, and one known advisory.
- A risk score is always between 0 and 100.
- Repository names are unique in a workspace.
- A policy state change is timestamped.
- Every successful mutation produces an audit event.
- A scan comparison never claims package-level additions or removals unless component snapshots exist for both scans.
- The automated gate fails when any evaluable blocking rule fails, requests review when enabled rules cannot be evaluated safely, and passes only when all enabled rules are satisfied.

## Graph algorithm

Dependency relationships form a directed graph. SupplyLens uses breadth-first search to identify the shortest known path from the repository root to a vulnerable package. This is useful because a shorter path usually gives developers a clearer remediation owner and fewer intermediate upgrades.

The analyzer also uses a depth-first color walk to detect circular dependency chains without looping forever. Import metrics include component count, direct and transitive totals, isolated nodes, maximum depth, cycle count, and license coverage.

## Security insight calculations

The scan-diff engine compares the two latest persisted scans for each repository. It calculates dependency, finding, and risk-score deltas; introduced and resolved finding values are aggregate counts because the current schema does not preserve a component snapshot per scan. The UI states this limitation directly.

The policy-gate engine evaluates enabled vulnerability-blocking rules against open findings. Rules outside the currently supported rule type are returned as `review` decisions instead of being treated as passed.

## SBOM import invariants

- Only CycloneDX documents are accepted.
- A document contains 1–500 uniquely referenced components and stays within 512 KB at the HTTP boundary.
- Unknown dependency references are ignored instead of creating phantom components.
- If no root dependency list exists, declared components are conservatively treated as direct dependencies.
- PURLs are unique in the component catalog; repository relationships and edges remain repository-scoped.
- Imported vulnerabilities are converted into the same finding model used by scans, including severity, CVSS, remediation, directness, and the shortest dependency path.

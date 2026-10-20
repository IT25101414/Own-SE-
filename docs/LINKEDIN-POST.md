# LinkedIn launch kit

## Post draft

I’ve just completed **SupplyLens**, a full-stack software supply-chain security dashboard built as my second-year Software Engineering portfolio project.

I wanted to build something beyond a standard CRUD application, so I focused on a current engineering problem: understanding risk across the third-party packages that modern applications depend on.

SupplyLens can:

- inventory npm, Maven, and PyPI repositories
- visualize direct and transitive vulnerability exposure
- import CycloneDX SBOMs and turn them into a queryable dependency graph
- calculate graph depth, shortest vulnerable paths, cycles, isolated nodes, and license coverage
- explore dependencies through an interactive graph and component inspector
- query the live OSV vulnerability database
- prioritize findings using a risk-scoring domain service
- compare scans to explain risk movement using persisted evidence
- enforce configurable security policies through a PASS / FAIL / REVIEW gate
- present explainable remediation guidance and a focused security alert center
- persist repository, scan, and finding history
- record an audit trail for every backend mutation
- export a security report

On the engineering side, I used a modular-monolith architecture with Domain-Driven Design boundaries, strict Zod request contracts, application services, structured API errors, relational persistence, database migrations, breadth-first and depth-first graph algorithms, 16 automated tests, CI, and a responsive dark/light design system.

One of my biggest lessons was that good software engineering is not about adding the most technologies. It is about making deliberate decisions, documenting tradeoffs, and keeping business logic testable.

Tech: TypeScript, React, Next.js, Zod, Cloudflare Workers, D1, Drizzle ORM, OSV API, GitHub Actions.

I’d appreciate feedback—especially on the domain model and risk-prioritization approach.

#SoftwareEngineering #CyberSecurity #TypeScript #React #DomainDrivenDesign #DevSecOps #StudentDeveloper #BuildInPublic

## Suggested carousel

1. Hero screenshot: overview dashboard and risk posture.
2. Repository inventory: multiple ecosystems and scan actions.
3. SBOM Lab: ingestion pipeline, interactive dependency graph, normalized PURLs, and component inspector.
4. Vulnerability findings: CVSS, dependency paths, and explainable remediation drawer.
5. Scan comparison and policy gate: evidence-backed risk changes and release decisions.
6. Alert center: critical findings, policy failures, and audit activity.
7. Architecture view: bounded contexts and modular-monolith decision.
8. Closing card: technology, tests, live demo, and GitHub links.

## Short project description

SupplyLens is a full-stack dependency-risk command center that ingests CycloneDX SBOMs, analyzes software supply-chain graphs, compares security posture, explains vulnerable dependency paths, and enforces repeatable security policies.

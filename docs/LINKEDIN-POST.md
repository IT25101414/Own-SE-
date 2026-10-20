# LinkedIn launch kit

## Post draft

I’ve just completed **SupplyLens**, a full-stack software supply-chain security dashboard built as my second-year Software Engineering portfolio project.

I wanted to build something beyond a standard CRUD application, so I focused on a current engineering problem: understanding risk across the third-party packages that modern applications depend on.

SupplyLens can:

- inventory npm, Maven, and PyPI repositories
- visualize direct and transitive vulnerability exposure
- import CycloneDX SBOMs and turn them into a queryable dependency graph
- calculate graph depth, shortest vulnerable paths, cycles, isolated nodes, and license coverage
- query the live OSV vulnerability database
- prioritize findings using a risk-scoring domain service
- enforce configurable security policies
- persist repository, scan, and finding history
- record an audit trail for every backend mutation
- export a security report

On the engineering side, I used a modular-monolith architecture with Domain-Driven Design boundaries, strict Zod request contracts, application services, structured API errors, relational persistence, database migrations, breadth-first and depth-first graph algorithms, 13 automated tests, CI, and responsive UI design.

One of my biggest lessons was that good software engineering is not about adding the most technologies. It is about making deliberate decisions, documenting tradeoffs, and keeping business logic testable.

Tech: TypeScript, React, Next.js, Zod, Cloudflare Workers, D1, Drizzle ORM, OSV API, GitHub Actions.

I’d appreciate feedback—especially on the domain model and risk-prioritization approach.

#SoftwareEngineering #CyberSecurity #TypeScript #React #DomainDrivenDesign #DevSecOps #StudentDeveloper #BuildInPublic

## Suggested carousel

1. Hero screenshot: overview dashboard and risk posture.
2. Repository inventory: multiple ecosystems and scan actions.
3. SBOM Lab: ingestion pipeline, graph metrics, normalized PURLs, and audit trail.
4. Vulnerability findings: CVSS, dependency paths, and remediation.
5. Architecture view: bounded contexts and modular-monolith decision.
6. Closing card: technology, tests, live demo, and GitHub links.

## Short project description

SupplyLens is a full-stack dependency-risk dashboard that ingests CycloneDX SBOMs, analyzes software supply-chain graphs, explains vulnerable dependency paths, and enforces repeatable security policies.

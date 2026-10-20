import { getDb } from ".";
import {
  auditEvents, dependencyComponents, dependencyEdges, policies, repositories,
  repositoryDependencies, sbomImports, scans, scanFindings, vulnerabilities,
} from "./schema";

export async function ensureSeedData() {
  const db = getDb();

  await db.insert(repositories).values([
    { id: 1, name: "checkout-api", owner: "commerce", ecosystem: "Maven", branch: "main", primaryDependency: "org.springframework:spring-web", primaryVersion: "6.1.4", status: "at_risk", riskScore: 86, dependencyCount: 184, openFindings: 3, lastScanAt: "2026-10-19T15:42:00.000Z" },
    { id: 2, name: "customer-portal", owner: "experience", ecosystem: "npm", branch: "production", primaryDependency: "next", primaryVersion: "15.1.6", status: "review", riskScore: 48, dependencyCount: 312, openFindings: 2, lastScanAt: "2026-10-19T14:18:00.000Z" },
    { id: 3, name: "recommendation-worker", owner: "data-platform", ecosystem: "PyPI", branch: "main", primaryDependency: "fastapi", primaryVersion: "0.110.0", status: "passing", riskScore: 18, dependencyCount: 96, openFindings: 1, lastScanAt: "2026-10-19T11:06:00.000Z" },
    { id: 4, name: "identity-service", owner: "platform", ecosystem: "npm", branch: "main", primaryDependency: "express", primaryVersion: "4.18.2", status: "passing", riskScore: 12, dependencyCount: 147, openFindings: 0, lastScanAt: "2026-10-18T18:34:00.000Z" },
  ]).onConflictDoNothing();

  await db.insert(scans).values([
    { id: 1, repositoryId: 1, dependencyCount: 184, findingsCount: 3, riskScore: 86, durationMs: 4280, startedAt: "2026-10-19T15:41:55.000Z", completedAt: "2026-10-19T15:42:00.000Z" },
    { id: 2, repositoryId: 2, dependencyCount: 312, findingsCount: 2, riskScore: 48, durationMs: 6110, startedAt: "2026-10-19T14:17:53.000Z", completedAt: "2026-10-19T14:18:00.000Z" },
    { id: 3, repositoryId: 3, dependencyCount: 96, findingsCount: 1, riskScore: 18, durationMs: 2940, startedAt: "2026-10-19T11:05:56.000Z", completedAt: "2026-10-19T11:06:00.000Z" },
    { id: 4, repositoryId: 4, dependencyCount: 147, findingsCount: 0, riskScore: 12, durationMs: 3520, startedAt: "2026-10-18T18:33:56.000Z", completedAt: "2026-10-18T18:34:00.000Z" },
    { id: 5, repositoryId: 1, dependencyCount: 179, findingsCount: 6, riskScore: 92, durationMs: 4510, startedAt: "2026-10-16T09:28:00.000Z", completedAt: "2026-10-16T09:28:05.000Z" },
    { id: 6, repositoryId: 2, dependencyCount: 307, findingsCount: 3, riskScore: 58, durationMs: 5900, startedAt: "2026-10-15T16:12:00.000Z", completedAt: "2026-10-15T16:12:06.000Z" },
  ]).onConflictDoNothing();

  await db.insert(vulnerabilities).values([
    { id: "CVE-2026-31811", packageName: "spring-web", severity: "critical", cvss: 9.8, fixedVersion: "6.1.8", summary: "Path traversal through crafted resource locations", publishedAt: "2026-10-17T08:00:00.000Z" },
    { id: "CVE-2026-28704", packageName: "jackson-databind", severity: "high", cvss: 8.1, fixedVersion: "2.17.3", summary: "Unsafe polymorphic type handling can enable code execution", publishedAt: "2026-10-13T08:00:00.000Z" },
    { id: "GHSA-rv95-896h-c2vc", packageName: "next", severity: "high", cvss: 7.5, fixedVersion: "15.2.4", summary: "Cache poisoning in middleware request handling", publishedAt: "2026-10-10T08:00:00.000Z" },
    { id: "CVE-2026-25189", packageName: "urllib3", severity: "medium", cvss: 6.5, fixedVersion: "2.3.0", summary: "Redirect handling may expose authentication headers", publishedAt: "2026-10-08T08:00:00.000Z" },
    { id: "GHSA-3h5v-q93c-6h6q", packageName: "lodash", severity: "medium", cvss: 5.3, fixedVersion: "4.17.22", summary: "Resource exhaustion through deeply nested object paths", publishedAt: "2026-10-06T08:00:00.000Z" },
  ]).onConflictDoNothing();

  await db.insert(scanFindings).values([
    { id: 1, scanId: 1, repositoryId: 1, vulnerabilityId: "CVE-2026-31811", dependencyPath: "checkout-api → spring-web", direct: true, status: "open", detectedAt: "2026-10-19T15:42:00.000Z" },
    { id: 2, scanId: 1, repositoryId: 1, vulnerabilityId: "CVE-2026-28704", dependencyPath: "checkout-api → starter-json → jackson-databind", direct: false, status: "open", detectedAt: "2026-10-19T15:42:00.000Z" },
    { id: 3, scanId: 1, repositoryId: 1, vulnerabilityId: "GHSA-3h5v-q93c-6h6q", dependencyPath: "checkout-api → admin-ui → lodash", direct: false, status: "open", detectedAt: "2026-10-19T15:42:00.000Z" },
    { id: 4, scanId: 2, repositoryId: 2, vulnerabilityId: "GHSA-rv95-896h-c2vc", dependencyPath: "customer-portal → next", direct: true, status: "open", detectedAt: "2026-10-19T14:18:00.000Z" },
    { id: 5, scanId: 2, repositoryId: 2, vulnerabilityId: "GHSA-3h5v-q93c-6h6q", dependencyPath: "customer-portal → ui-kit → lodash", direct: false, status: "open", detectedAt: "2026-10-19T14:18:00.000Z" },
    { id: 6, scanId: 3, repositoryId: 3, vulnerabilityId: "CVE-2026-25189", dependencyPath: "recommendation-worker → requests → urllib3", direct: false, status: "open", detectedAt: "2026-10-19T11:06:00.000Z" },
  ]).onConflictDoNothing();

  await db.insert(policies).values([
    { id: 1, name: "Block critical vulnerabilities", description: "Fail a release when a critical finding has no accepted exception.", category: "Vulnerability", action: "Block", scope: "Production repositories", enabled: true, updatedAt: "2026-10-18T12:00:00.000Z" },
    { id: 2, name: "Require pinned versions", description: "Flag dependency ranges and unpinned container image tags.", category: "Integrity", action: "Review", scope: "All repositories", enabled: true, updatedAt: "2026-10-17T10:00:00.000Z" },
    { id: 3, name: "Detect abandoned packages", description: "Review packages without a release or maintainer activity for 24 months.", category: "Maintenance", action: "Review", scope: "All repositories", enabled: true, updatedAt: "2026-10-14T09:00:00.000Z" },
    { id: 4, name: "Approved license set", description: "Allow permissive licenses and flag unknown or restricted licenses.", category: "License", action: "Warn", scope: "Customer-facing apps", enabled: false, updatedAt: "2026-10-12T09:00:00.000Z" },
  ]).onConflictDoNothing();

  await db.insert(auditEvents).values([
    { id: 1, eventType: "workspace.seeded", entityType: "workspace", entityId: "demo", message: "Demo workspace initialized with representative supply-chain data.", createdAt: "2026-10-19T08:00:00.000Z" },
    { id: 2, eventType: "scan.completed", entityType: "repository", entityId: "1", message: "Completed dependency risk scan for checkout-api.", createdAt: "2026-10-19T15:42:00.000Z" },
    { id: 3, eventType: "policy.reviewed", entityType: "policy", entityId: "1", message: "Critical vulnerability release gate reviewed.", createdAt: "2026-10-18T12:00:00.000Z" },
  ]).onConflictDoNothing();

  const existingSbom = await db.select({ id: sbomImports.id }).from(sbomImports).limit(1);
  if (existingSbom.length === 0) {
    await db.insert(dependencyComponents).values([
      { id: 1, purl: "pkg:maven/org.springframework/spring-web@6.1.4", name: "spring-web", version: "6.1.4", ecosystem: "Maven", license: "Apache-2.0" },
      { id: 2, purl: "pkg:maven/com.fasterxml.jackson.core/jackson-databind@2.17.1", name: "jackson-databind", version: "2.17.1", ecosystem: "Maven", license: "Apache-2.0" },
      { id: 3, purl: "pkg:maven/org.slf4j/slf4j-api@2.0.12", name: "slf4j-api", version: "2.0.12", ecosystem: "Maven", license: "MIT" },
      { id: 4, purl: "pkg:maven/io.micrometer/micrometer-core@1.12.4", name: "micrometer-core", version: "1.12.4", ecosystem: "Maven", license: "Apache-2.0" },
      { id: 5, purl: "pkg:maven/org.yaml/snakeyaml@2.2", name: "snakeyaml", version: "2.2", ecosystem: "Maven", license: "Apache-2.0" },
    ]).onConflictDoNothing();

    await db.insert(repositoryDependencies).values([
      { id: 1, repositoryId: 1, dependencyId: 1, direct: true, depth: 1, componentRef: "spring-web" },
      { id: 2, repositoryId: 1, dependencyId: 2, direct: false, depth: 2, componentRef: "jackson-databind" },
      { id: 3, repositoryId: 1, dependencyId: 3, direct: false, depth: 2, componentRef: "slf4j-api" },
      { id: 4, repositoryId: 1, dependencyId: 4, direct: true, depth: 1, componentRef: "micrometer-core" },
      { id: 5, repositoryId: 1, dependencyId: 5, direct: false, depth: 2, componentRef: "snakeyaml" },
    ]).onConflictDoNothing();

    await db.insert(dependencyEdges).values([
      { id: 1, repositoryId: 1, parentRef: "checkout-api", childRef: "spring-web" },
      { id: 2, repositoryId: 1, parentRef: "spring-web", childRef: "jackson-databind" },
      { id: 3, repositoryId: 1, parentRef: "spring-web", childRef: "slf4j-api" },
      { id: 4, repositoryId: 1, parentRef: "checkout-api", childRef: "micrometer-core" },
      { id: 5, repositoryId: 1, parentRef: "spring-web", childRef: "snakeyaml" },
    ]).onConflictDoNothing();

    await db.insert(sbomImports).values({
      id: 1, repositoryId: 1, scanId: 1, format: "CycloneDX 1.5", serialNumber: "urn:uuid:supplylens-demo",
      componentCount: 5, directCount: 2, transitiveCount: 3, isolatedCount: 0, maxDepth: 2,
      cycleCount: 0, licenseCoverage: 100, importedAt: "2026-10-19T15:42:00.000Z",
    }).onConflictDoNothing();
  }
}

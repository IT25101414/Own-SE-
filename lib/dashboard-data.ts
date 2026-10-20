import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureSeedData } from "@/db/seed";
import {
  auditEvents, dependencyComponents, dependencyEdges, policies, repositories,
  repositoryDependencies, sbomImports, scans, scanFindings, vulnerabilities,
} from "@/db/schema";
import type { DashboardData } from "./types";
import { compareScanSnapshots, evaluateSecurityGate } from "@/domain/security-insights.mjs";

export async function getDashboardData(): Promise<DashboardData> {
  await ensureSeedData();
  const db = getDb();
  const repositoryRows = await db.select().from(repositories).orderBy(desc(repositories.riskScore));
  const policyRows = await db.select().from(policies).orderBy(policies.id);
  const findingRows = await db.select({
    id: scanFindings.id, repositoryId: scanFindings.repositoryId, repositoryName: repositories.name,
    vulnerabilityId: vulnerabilities.id, packageName: vulnerabilities.packageName, severity: vulnerabilities.severity,
    cvss: vulnerabilities.cvss, fixedVersion: vulnerabilities.fixedVersion, summary: vulnerabilities.summary,
    dependencyPath: scanFindings.dependencyPath, direct: scanFindings.direct, status: scanFindings.status,
    detectedAt: scanFindings.detectedAt,
  }).from(scanFindings)
    .innerJoin(repositories, eq(scanFindings.repositoryId, repositories.id))
    .innerJoin(vulnerabilities, eq(scanFindings.vulnerabilityId, vulnerabilities.id))
    .orderBy(desc(scanFindings.detectedAt));
  const scanRows = await db.select({
    id: scans.id, repositoryId: scans.repositoryId, repositoryName: repositories.name, status: scans.status,
    dependencyCount: scans.dependencyCount, findingsCount: scans.findingsCount, riskScore: scans.riskScore,
    durationMs: scans.durationMs, startedAt: scans.startedAt, completedAt: scans.completedAt,
  }).from(scans).innerJoin(repositories, eq(scans.repositoryId, repositories.id)).orderBy(desc(scans.startedAt)).limit(12);
  const componentRows = await db.select({
    id: dependencyComponents.id,
    repositoryId: repositoryDependencies.repositoryId,
    repositoryName: repositories.name,
    name: dependencyComponents.name,
    version: dependencyComponents.version,
    purl: dependencyComponents.purl,
    ecosystem: dependencyComponents.ecosystem,
    license: dependencyComponents.license,
    direct: repositoryDependencies.direct,
    depth: repositoryDependencies.depth,
    componentRef: repositoryDependencies.componentRef,
  }).from(repositoryDependencies)
    .innerJoin(dependencyComponents, eq(repositoryDependencies.dependencyId, dependencyComponents.id))
    .innerJoin(repositories, eq(repositoryDependencies.repositoryId, repositories.id))
    .orderBy(repositoryDependencies.depth, dependencyComponents.name)
    .limit(100);
  const edgeRows = await db.select().from(dependencyEdges).orderBy(dependencyEdges.id).limit(200);
  const sbomRows = await db.select({
    id: sbomImports.id,
    repositoryId: sbomImports.repositoryId,
    repositoryName: repositories.name,
    format: sbomImports.format,
    serialNumber: sbomImports.serialNumber,
    componentCount: sbomImports.componentCount,
    directCount: sbomImports.directCount,
    transitiveCount: sbomImports.transitiveCount,
    isolatedCount: sbomImports.isolatedCount,
    maxDepth: sbomImports.maxDepth,
    cycleCount: sbomImports.cycleCount,
    licenseCoverage: sbomImports.licenseCoverage,
    importedAt: sbomImports.importedAt,
  }).from(sbomImports)
    .innerJoin(repositories, eq(sbomImports.repositoryId, repositories.id))
    .orderBy(desc(sbomImports.importedAt)).limit(10);
  const auditRows = await db.select().from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(12);
  const openFindings = findingRows.filter((finding) => finding.status === "open");
  const enabledPolicies = policyRows.filter((policy) => policy.enabled).length;
  const averageRisk = repositoryRows.length ? Math.round(repositoryRows.reduce((total, repository) => total + repository.riskScore, 0) / repositoryRows.length) : 0;
  const scanComparisons = repositoryRows.flatMap((repository) => {
    const history = scanRows.filter((scan) => scan.repositoryId === repository.id);
    if (history.length < 2) return [];
    return [{ repositoryId: repository.id, repositoryName: repository.name, ...compareScanSnapshots(history[1], history[0]) }];
  });
  const policyGate = evaluateSecurityGate(openFindings, policyRows);

  return {
    repositories: repositoryRows, findings: findingRows, policies: policyRows, scans: scanRows,
    components: componentRows, dependencyEdges: edgeRows, sbomImports: sbomRows, auditEvents: auditRows,
    scanComparisons, policyGate,
    stats: {
      repositories: repositoryRows.length,
      dependencies: repositoryRows.reduce((total, repository) => total + repository.dependencyCount, 0),
      openFindings: openFindings.length,
      critical: openFindings.filter((finding) => finding.severity === "critical").length,
      policyCoverage: policyRows.length ? Math.round((enabledPolicies / policyRows.length) * 100) : 0,
      averageRisk,
    },
    severity: {
      critical: openFindings.filter((finding) => finding.severity === "critical").length,
      high: openFindings.filter((finding) => finding.severity === "high").length,
      medium: openFindings.filter((finding) => finding.severity === "medium").length,
      low: openFindings.filter((finding) => finding.severity === "low").length,
    },
  };
}

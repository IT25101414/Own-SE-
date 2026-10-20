import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureSeedData } from "@/db/seed";
import { policies, repositories, scans, scanFindings, vulnerabilities } from "@/db/schema";
import type { DashboardData } from "./types";

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
  const openFindings = findingRows.filter((finding) => finding.status === "open");
  const enabledPolicies = policyRows.filter((policy) => policy.enabled).length;
  const averageRisk = repositoryRows.length ? Math.round(repositoryRows.reduce((total, repository) => total + repository.riskScore, 0) / repositoryRows.length) : 0;

  return {
    repositories: repositoryRows, findings: findingRows, policies: policyRows, scans: scanRows,
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

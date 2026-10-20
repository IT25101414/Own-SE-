import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  dependencyComponents, dependencyEdges, repositories, repositoryDependencies,
  sbomImports, scanFindings, scans, vulnerabilities,
} from "@/db/schema";
import { analyzeCycloneDx } from "@/domain/sbom-analyzer.mjs";
import { calculateRiskScore, classifyRisk } from "@/domain/risk-engine.mjs";
import { getDashboardData } from "@/lib/dashboard-data";
import { ApiError } from "./http";
import { writeAuditEvent } from "./audit-service";

export async function importCycloneDx(repositoryName: string, document: Record<string, unknown>) {
  let analysis;
  try {
    analysis = analyzeCycloneDx(document);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : "SBOM analysis failed.", 422, "INVALID_SBOM");
  }

  const db = getDb();
  const now = new Date().toISOString();
  const ecosystemCounts = new Map<string, number>();
  for (const component of analysis.components) {
    if (component.ecosystem !== "Unknown") ecosystemCounts.set(component.ecosystem, (ecosystemCounts.get(component.ecosystem) ?? 0) + 1);
  }
  const ecosystem = [...ecosystemCounts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "npm";
  const primary = analysis.components.find((component) => component.direct) ?? analysis.components[0];
  const riskScore = calculateRiskScore(analysis.vulnerabilities);
  const status = classifyRisk(riskScore);

  let [repository] = await db.select().from(repositories).where(eq(repositories.name, repositoryName)).limit(1);
  if (!repository) {
    [repository] = await db.insert(repositories).values({
      name: repositoryName,
      owner: "sbom-import",
      ecosystem,
      primaryDependency: primary.name,
      primaryVersion: primary.version,
      dependencyCount: analysis.metrics.componentCount,
      openFindings: analysis.vulnerabilities.length,
      riskScore,
      status,
      lastScanAt: now,
    }).returning();
  } else {
    [repository] = await db.update(repositories).set({
      ecosystem,
      primaryDependency: primary.name,
      primaryVersion: primary.version,
      dependencyCount: analysis.metrics.componentCount,
      openFindings: analysis.vulnerabilities.length,
      riskScore,
      status,
      lastScanAt: now,
    }).where(eq(repositories.id, repository.id)).returning();
  }

  const [scan] = await db.insert(scans).values({
    repositoryId: repository.id,
    status: "completed",
    dependencyCount: analysis.metrics.componentCount,
    findingsCount: analysis.vulnerabilities.length,
    riskScore,
    durationMs: 500 + analysis.components.length * 8 + analysis.edges.length * 3,
    startedAt: now,
    completedAt: now,
  }).returning();

  await db.delete(repositoryDependencies).where(eq(repositoryDependencies.repositoryId, repository.id));
  await db.delete(dependencyEdges).where(eq(dependencyEdges.repositoryId, repository.id));

  for (const component of analysis.components) {
    const [stored] = await db.insert(dependencyComponents).values({
      purl: component.purl,
      name: component.name,
      version: component.version,
      ecosystem: component.ecosystem,
      license: component.license,
      createdAt: now,
    }).onConflictDoUpdate({
      target: dependencyComponents.purl,
      set: { name: component.name, version: component.version, ecosystem: component.ecosystem, license: component.license },
    }).returning();
    await db.insert(repositoryDependencies).values({
      repositoryId: repository.id,
      dependencyId: stored.id,
      direct: component.direct,
      depth: component.depth,
      componentRef: component.ref,
      importedAt: now,
    });
  }

  if (analysis.edges.length) {
    // Keep each D1 statement comfortably below SQLite's bind-parameter limit for
    // dense graphs while still avoiding one round trip per edge.
    for (let start = 0; start < analysis.edges.length; start += 100) {
      await db.insert(dependencyEdges).values(
        analysis.edges.slice(start, start + 100).map((edge) => ({ ...edge, repositoryId: repository.id, importedAt: now })),
      );
    }
  }

  for (const finding of analysis.vulnerabilities) {
    await db.insert(vulnerabilities).values({
      id: finding.id,
      packageName: finding.packageName,
      severity: finding.severity,
      cvss: finding.cvss,
      fixedVersion: finding.fixedVersion,
      summary: finding.summary,
      publishedAt: now,
    }).onConflictDoUpdate({
      target: vulnerabilities.id,
      set: { packageName: finding.packageName, severity: finding.severity, cvss: finding.cvss, fixedVersion: finding.fixedVersion, summary: finding.summary },
    });
    await db.insert(scanFindings).values({
      scanId: scan.id,
      repositoryId: repository.id,
      vulnerabilityId: finding.id,
      dependencyPath: finding.path.join(" → "),
      direct: finding.direct,
      status: "open",
      detectedAt: now,
    });
  }

  await db.insert(sbomImports).values({
    repositoryId: repository.id,
    scanId: scan.id,
    format: analysis.format,
    serialNumber: analysis.serialNumber,
    ...analysis.metrics,
    importedAt: now,
  });
  await writeAuditEvent({
    eventType: "sbom.imported",
    entityType: "repository",
    entityId: repository.id,
    message: `Imported ${analysis.format} with ${analysis.metrics.componentCount} components, ${analysis.edges.length} edges, and ${analysis.vulnerabilities.length} findings.`,
  });

  return { dashboard: await getDashboardData(), analysis };
}

export async function getLatestSbomImport() {
  return (await getDb().select().from(sbomImports).orderBy(desc(sbomImports.importedAt)).limit(1))[0] ?? null;
}

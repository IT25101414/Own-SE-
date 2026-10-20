import { getDb } from "@/db";
import { repositories, scans } from "@/db/schema";
import { getDashboardData } from "@/lib/dashboard-data";
import { writeAuditEvent } from "./audit-service";

type CreateRepositoryInput = {
  name: string;
  ecosystem: "npm" | "Maven" | "PyPI";
  dependency: string;
  version: string;
};

export async function createRepository(input: CreateRepositoryInput) {
  const db = getDb();
  const now = new Date().toISOString();
  const dependencyCount = 24 + ((input.name.length * 17 + input.dependency.length * 9) % 180);
  const [repository] = await db.insert(repositories).values({
    name: input.name,
    owner: "portfolio-demo",
    ecosystem: input.ecosystem,
    primaryDependency: input.dependency,
    primaryVersion: input.version,
    dependencyCount,
    status: "passing",
    riskScore: 8,
    openFindings: 0,
    lastScanAt: now,
  }).returning();

  await db.insert(scans).values({
    repositoryId: repository.id,
    dependencyCount,
    findingsCount: 0,
    riskScore: 8,
    durationMs: 1800 + dependencyCount * 7,
    startedAt: now,
    completedAt: now,
  });
  await writeAuditEvent({
    eventType: "repository.created",
    entityType: "repository",
    entityId: repository.id,
    message: `Registered ${repository.name} for ${repository.ecosystem} dependency monitoring.`,
  });
  return getDashboardData();
}

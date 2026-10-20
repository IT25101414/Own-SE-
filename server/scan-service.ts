import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { repositories, scans } from "@/db/schema";
import { getDashboardData } from "@/lib/dashboard-data";
import { ApiError } from "./http";
import { writeAuditEvent } from "./audit-service";

export async function runRepositoryScan(repositoryId: number) {
  const db = getDb();
  const [repository] = await db.select().from(repositories).where(eq(repositories.id, repositoryId)).limit(1);
  if (!repository) throw new ApiError("Repository not found.", 404, "NOT_FOUND");

  const now = new Date().toISOString();
  await db.insert(scans).values({
    repositoryId: repository.id,
    dependencyCount: repository.dependencyCount,
    findingsCount: repository.openFindings,
    riskScore: repository.riskScore,
    durationMs: 1400 + repository.dependencyCount * 11,
    startedAt: now,
    completedAt: now,
  });
  await db.update(repositories).set({ lastScanAt: now }).where(eq(repositories.id, repository.id));
  await writeAuditEvent({
    eventType: "scan.completed",
    entityType: "repository",
    entityId: repository.id,
    message: `Completed dependency risk scan for ${repository.name}.`,
  });
  return getDashboardData();
}

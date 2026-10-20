import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { policies } from "@/db/schema";
import { getDashboardData } from "@/lib/dashboard-data";
import { ApiError } from "./http";
import { writeAuditEvent } from "./audit-service";

export async function setPolicyEnabled(id: number, enabled: boolean) {
  const [policy] = await getDb().update(policies)
    .set({ enabled, updatedAt: new Date().toISOString() })
    .where(eq(policies.id, id))
    .returning();
  if (!policy) throw new ApiError("Policy not found.", 404, "NOT_FOUND");

  await writeAuditEvent({
    eventType: "policy.updated",
    entityType: "policy",
    entityId: policy.id,
    message: `${policy.name} was ${enabled ? "enabled" : "disabled"}.`,
  });
  return getDashboardData();
}

import { getDb } from "@/db";
import { auditEvents } from "@/db/schema";

type AuditInput = {
  eventType: string;
  entityType: string;
  entityId: string | number;
  message: string;
};

export async function writeAuditEvent(input: AuditInput) {
  await getDb().insert(auditEvents).values({
    ...input,
    entityId: String(input.entityId),
    createdAt: new Date().toISOString(),
  });
}

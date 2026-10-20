import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { apiErrorResponse } from "@/server/http";

export async function GET() {
  const startedAt = Date.now();
  try {
    await getDb().run(sql`SELECT 1`);
    return Response.json({
      status: "ok",
      service: "supplylens-api",
      database: "reachable",
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return apiErrorResponse(error, "Health check failed.");
  }
}

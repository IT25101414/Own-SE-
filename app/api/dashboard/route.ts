import { getDashboardData } from "@/lib/dashboard-data";
import { apiErrorResponse } from "@/server/http";

export async function GET() {
  try {
    return Response.json(await getDashboardData());
  } catch (error) {
    return apiErrorResponse(error, "Unable to load dashboard.");
  }
}

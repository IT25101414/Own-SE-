import { osvQuerySchema } from "@/server/contracts.mjs";
import { apiErrorResponse, parseJson } from "@/server/http";
import { queryOsv } from "@/server/osv-client";

export async function POST(request: Request) {
  try {
    const query = await parseJson(request, osvQuerySchema);
    return Response.json(await queryOsv(query));
  } catch (error) {
    return apiErrorResponse(error, "Dependency check failed.");
  }
}

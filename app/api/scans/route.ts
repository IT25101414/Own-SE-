import { runScanSchema } from "@/server/contracts.mjs";
import { apiErrorResponse, parseJson } from "@/server/http";
import { runRepositoryScan } from "@/server/scan-service";

export async function POST(request: Request) {
  try {
    const command = await parseJson(request, runScanSchema);
    return Response.json(await runRepositoryScan(command.repositoryId), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Scan failed.");
  }
}

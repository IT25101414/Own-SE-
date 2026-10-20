import { importSbomSchema } from "@/server/contracts.mjs";
import { apiErrorResponse, parseJson } from "@/server/http";
import { importCycloneDx } from "@/server/sbom-service";

export async function POST(request: Request) {
  try {
    const command = await parseJson(request, importSbomSchema, { maxBytes: 524_288 });
    return Response.json(await importCycloneDx(command.repositoryName, command.sbom), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to import SBOM.");
  }
}

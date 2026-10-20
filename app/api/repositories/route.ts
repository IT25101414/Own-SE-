import { createRepositorySchema } from "@/server/contracts.mjs";
import { apiErrorResponse, parseJson } from "@/server/http";
import { createRepository } from "@/server/repository-service";

export async function POST(request: Request) {
  try {
    const command = await parseJson(request, createRepositorySchema);
    return Response.json(await createRepository(command), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to add repository.");
  }
}

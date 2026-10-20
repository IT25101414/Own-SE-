import { updatePolicySchema } from "@/server/contracts.mjs";
import { apiErrorResponse, parseJson } from "@/server/http";
import { setPolicyEnabled } from "@/server/policy-service";

export async function PATCH(request: Request) {
  try {
    const command = await parseJson(request, updatePolicySchema);
    return Response.json(await setPolicyEnabled(command.id, command.enabled));
  } catch (error) {
    return apiErrorResponse(error, "Policy update failed.");
  }
}

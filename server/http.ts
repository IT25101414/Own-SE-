import { ZodError, type ZodType } from "zod";

export class ApiError extends Error {
  constructor(message: string, readonly status = 500, readonly code = "INTERNAL_ERROR") {
    super(message);
    this.name = "ApiError";
  }
}

export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError("Request body must be valid JSON.", 400, "INVALID_JSON");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new ApiError(message || "Request validation failed.", 400, "VALIDATION_ERROR");
  }
  return parsed.data;
}

export function apiErrorResponse(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return Response.json({ error: "Request validation failed.", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  const message = error instanceof Error ? error.message : fallback;
  if (message.includes("UNIQUE")) {
    return Response.json({ error: "That repository already exists.", code: "CONFLICT" }, { status: 409 });
  }
  console.error(error);
  return Response.json({ error: fallback, code: "INTERNAL_ERROR" }, { status: 500 });
}

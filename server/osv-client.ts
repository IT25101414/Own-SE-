import { ApiError } from "./http";

type OsvInput = {
  ecosystem: "npm" | "Maven" | "PyPI";
  packageName: string;
  version: string;
};

type OsvPayload = { vulns?: Array<Record<string, unknown>> };

export async function queryOsv(input: OsvInput) {
  let response: Response;
  try {
    response = await fetch("https://api.osv.dev/v1/query", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ package: { ecosystem: input.ecosystem, name: input.packageName }, version: input.version }),
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new ApiError(
      timedOut ? "The vulnerability service timed out. Try again." : "The vulnerability service is unavailable.",
      503,
      timedOut ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE",
    );
  }

  if (!response.ok) {
    throw new ApiError("The vulnerability service could not complete this check.", 502, "UPSTREAM_ERROR");
  }
  const data = (await response.json()) as OsvPayload;
  const vulnerabilities = (data.vulns ?? []).slice(0, 8).map((vulnerability) => ({
    id: vulnerability.id,
    summary: vulnerability.summary ?? vulnerability.details ?? "No summary provided",
    modified: vulnerability.modified,
    aliases: Array.isArray(vulnerability.aliases) ? vulnerability.aliases.slice(0, 3) : [],
  }));

  return { ...input, vulnerabilities, checkedAt: new Date().toISOString() };
}

import type { z } from "zod";

export declare const ecosystemSchema: z.ZodEnum<["npm", "Maven", "PyPI"]>;
export declare const createRepositorySchema: z.ZodType<{
  name: string;
  ecosystem: "npm" | "Maven" | "PyPI";
  dependency: string;
  version: string;
}>;
export declare const runScanSchema: z.ZodType<{ repositoryId: number }>;
export declare const updatePolicySchema: z.ZodType<{ id: number; enabled: boolean }>;
export declare const osvQuerySchema: z.ZodType<{
  ecosystem: "npm" | "Maven" | "PyPI";
  packageName: string;
  version: string;
}>;
export declare const importSbomSchema: z.ZodType<{ repositoryName: string; sbom: Record<string, unknown> }>;

import { z } from "zod";

export const ecosystemSchema = z.enum(["npm", "Maven", "PyPI"]);

export const createRepositorySchema = z.object({
  name: z.string().trim().min(3).max(64)
    .transform((value) => value.toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""))
    .refine((value) => value.length >= 3, "Repository name must contain at least three valid characters."),
  ecosystem: ecosystemSchema,
  dependency: z.string().trim().min(2).max(160),
  version: z.string().trim().min(1).max(64),
}).strict();

export const runScanSchema = z.object({
  repositoryId: z.number().int().positive(),
}).strict();

export const updatePolicySchema = z.object({
  id: z.number().int().positive(),
  enabled: z.boolean(),
}).strict();

export const osvQuerySchema = z.object({
  ecosystem: ecosystemSchema,
  packageName: z.string().trim().min(2).max(160),
  version: z.string().trim().min(1).max(64),
}).strict();

export const importSbomSchema = z.object({
  repositoryName: z.string().trim().min(3).max(64)
    .transform((value) => value.toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""))
    .refine((value) => value.length >= 3, "Repository name must contain at least three valid characters."),
  sbom: z.record(z.unknown()),
}).strict();

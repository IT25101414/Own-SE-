import test from "node:test";
import assert from "node:assert/strict";
import {
  createRepositorySchema,
  importSbomSchema,
  osvQuerySchema,
  runScanSchema,
  updatePolicySchema,
} from "../server/contracts.mjs";

test("repository command normalizes a display name into a safe slug", () => {
  const result = createRepositorySchema.parse({
    name: "Checkout API!",
    ecosystem: "npm",
    dependency: "express",
    version: "4.18.2",
  });
  assert.equal(result.name, "checkout-api");
});

test("repository command rejects unsupported ecosystems and extra fields", () => {
  assert.equal(createRepositorySchema.safeParse({
    name: "demo-api",
    ecosystem: "Cargo",
    dependency: "serde",
    version: "1.0.0",
  }).success, false);
  assert.equal(createRepositorySchema.safeParse({
    name: "demo-api",
    ecosystem: "npm",
    dependency: "express",
    version: "1.0.0",
    admin: true,
  }).success, false);
});

test("scan and policy commands enforce positive identifiers and booleans", () => {
  assert.equal(runScanSchema.safeParse({ repositoryId: 1 }).success, true);
  assert.equal(runScanSchema.safeParse({ repositoryId: 0 }).success, false);
  assert.equal(updatePolicySchema.safeParse({ id: 2, enabled: false }).success, true);
  assert.equal(updatePolicySchema.safeParse({ id: 2, enabled: "false" }).success, false);
});

test("OSV query trims coordinates and limits accepted ecosystems", () => {
  const result = osvQuerySchema.parse({ ecosystem: "PyPI", packageName: " requests ", version: " 2.31.0 " });
  assert.equal(result.packageName, "requests");
  assert.equal(result.version, "2.31.0");
  assert.equal(osvQuerySchema.safeParse({ ecosystem: "Go", packageName: "x", version: "1" }).success, false);
});

test("SBOM command normalizes its repository and requires an object document", () => {
  const result = importSbomSchema.parse({
    repositoryName: "Payments API!",
    sbom: { bomFormat: "CycloneDX", components: [] },
  });
  assert.equal(result.repositoryName, "payments-api");
  assert.equal(importSbomSchema.safeParse({ repositoryName: "api", sbom: [] }).success, false);
});

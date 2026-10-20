import test from "node:test";
import assert from "node:assert/strict";
import { analyzeCycloneDx } from "../domain/sbom-analyzer.mjs";

const sample = {
  bomFormat: "CycloneDX",
  specVersion: "1.5",
  serialNumber: "urn:uuid:test-sbom",
  metadata: { component: { "bom-ref": "app", name: "payments-api", type: "application" } },
  components: [
    { "bom-ref": "express", name: "express", version: "4.18.2", purl: "pkg:npm/express@4.18.2", licenses: [{ license: { id: "MIT" } }] },
    { "bom-ref": "qs", name: "qs", version: "6.11.0", purl: "pkg:npm/qs@6.11.0" },
    { "bom-ref": "orphan", name: "orphan", version: "1.0.0", purl: "pkg:npm/orphan@1.0.0" },
  ],
  dependencies: [
    { ref: "app", dependsOn: ["express"] },
    { ref: "express", dependsOn: ["qs"] },
  ],
  vulnerabilities: [{
    id: "CVE-TEST-0001",
    ratings: [{ severity: "high", score: 8.1 }],
    affects: [{ ref: "qs" }],
    description: "Test advisory",
    analysis: { detail: "Upgrade to 6.11.2" },
  }],
};

test("analyzes direct, transitive, and isolated CycloneDX components", () => {
  const result = analyzeCycloneDx(sample);
  assert.deepEqual(result.metrics, { componentCount: 3, directCount: 1, transitiveCount: 1, isolatedCount: 1, maxDepth: 2, cycleCount: 0, licenseCoverage: 33 });
  assert.equal(result.components.find((component) => component.ref === "qs").depth, 2);
});

test("builds the shortest human-readable path to an affected component", () => {
  const [finding] = analyzeCycloneDx(sample).vulnerabilities;
  assert.deepEqual(finding.path, ["payments-api", "express", "qs"]);
  assert.equal(finding.fixedVersion, "6.11.2");
  assert.equal(finding.direct, false);
});

test("detects circular dependency chains without recursing forever", () => {
  const cyclic = structuredClone(sample);
  cyclic.dependencies.push({ ref: "qs", dependsOn: ["express"] });
  assert.equal(analyzeCycloneDx(cyclic).metrics.cycleCount, 1);
});

test("rejects unsupported, empty, oversized, and duplicate component documents", () => {
  assert.throws(() => analyzeCycloneDx({ bomFormat: "SPDX", components: [{}] }), /CycloneDX/);
  assert.throws(() => analyzeCycloneDx({ bomFormat: "CycloneDX", components: [] }), /at least one/);
  assert.throws(() => analyzeCycloneDx({ bomFormat: "CycloneDX", components: Array.from({ length: 501 }, (_, index) => ({ name: `p${index}` })) }), /500-component/);
  assert.throws(() => analyzeCycloneDx({ bomFormat: "CycloneDX", components: [{ "bom-ref": "same" }, { "bom-ref": "same" }] }), /unique/);
});

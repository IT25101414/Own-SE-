import test from "node:test";
import assert from "node:assert/strict";
import { calculateRiskScore, classifyRisk, summarizeSeverity, traceShortestDependencyPath } from "../domain/risk-engine.mjs";

test("risk score weights direct and critical findings", () => {
  assert.equal(calculateRiskScore([{ severity: "critical", direct: true }]), 29);
  assert.ok(calculateRiskScore([{ severity: "critical", direct: true }]) > calculateRiskScore([{ severity: "high", direct: false }]));
});

test("risk score is capped and classified", () => {
  assert.equal(calculateRiskScore(Array.from({ length: 20 }, () => ({ severity: "critical", direct: true }))), 100);
  assert.equal(classifyRisk(80), "at_risk");
  assert.equal(classifyRisk(50), "review");
  assert.equal(classifyRisk(20), "passing");
});

test("severity summary includes all supported buckets", () => {
  assert.deepEqual(summarizeSeverity([{ severity: "critical" }, { severity: "high" }, { severity: "high" }]), { critical: 1, high: 2, medium: 0, low: 0 });
});

test("breadth-first search returns the shortest dependency path", () => {
  const graph = { app: ["ui", "api"], ui: ["lodash"], api: ["http", "lodash"], lodash: [], http: [] };
  assert.deepEqual(traceShortestDependencyPath(graph, "app", "lodash"), ["app", "ui", "lodash"]);
  assert.equal(traceShortestDependencyPath(graph, "http", "ui"), null);
});

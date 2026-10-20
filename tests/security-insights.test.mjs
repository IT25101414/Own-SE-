import test from "node:test";
import assert from "node:assert/strict";
import { compareScanSnapshots, evaluateSecurityGate } from "../domain/security-insights.mjs";

test("scan comparison reports aggregate introduced, resolved, and posture changes", () => {
  const comparison = compareScanSnapshots(
    { id: 10, findingsCount: 6, dependencyCount: 120, riskScore: 74, completedAt: "2026-01-01" },
    { id: 11, findingsCount: 4, dependencyCount: 126, riskScore: 52, completedAt: "2026-01-02" },
  );
  assert.equal(comparison.changes.resolvedFindings, 2);
  assert.equal(comparison.changes.introducedFindings, 0);
  assert.equal(comparison.changes.unchangedFindings, 4);
  assert.equal(comparison.changes.dependencyDelta, 6);
  assert.equal(comparison.changes.posture, "improved");
});

test("security gate fails an enabled blocking critical-vulnerability policy", () => {
  const gate = evaluateSecurityGate(
    [{ status: "open", severity: "critical" }, { status: "open", severity: "high" }],
    [{ id: 1, name: "Block critical vulnerabilities", category: "Vulnerability", action: "Block", enabled: true }],
  );
  assert.equal(gate.state, "fail");
  assert.equal(gate.decisions[0].outcome, "fail");
});

test("security gate distinguishes manual review from a clean automated pass", () => {
  const findings = [{ status: "open", severity: "medium" }];
  const review = evaluateSecurityGate(findings, [
    { id: 1, name: "Pinned versions", category: "Integrity", action: "Review", enabled: true },
  ]);
  const pass = evaluateSecurityGate(findings, [
    { id: 2, name: "Block critical vulnerabilities", category: "Vulnerability", action: "Block", enabled: true },
  ]);
  assert.equal(review.state, "review");
  assert.deepEqual(review.notEvaluated, ["Pinned versions"]);
  assert.equal(pass.state, "pass");
});

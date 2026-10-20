const asCount = (value) => Math.max(0, Number(value) || 0);

export function compareScanSnapshots(previous, current) {
  if (!previous || !current) throw new Error("Two scan snapshots are required for comparison.");

  const previousFindings = asCount(previous.findingsCount);
  const currentFindings = asCount(current.findingsCount);
  const findingDelta = currentFindings - previousFindings;
  const dependencyDelta = asCount(current.dependencyCount) - asCount(previous.dependencyCount);
  const riskDelta = asCount(current.riskScore) - asCount(previous.riskScore);

  return {
    previousScanId: Number(previous.id),
    currentScanId: Number(current.id),
    previous: {
      findings: previousFindings,
      dependencies: asCount(previous.dependencyCount),
      riskScore: asCount(previous.riskScore),
      scannedAt: String(previous.completedAt || previous.startedAt || ""),
    },
    current: {
      findings: currentFindings,
      dependencies: asCount(current.dependencyCount),
      riskScore: asCount(current.riskScore),
      scannedAt: String(current.completedAt || current.startedAt || ""),
    },
    changes: {
      introducedFindings: Math.max(0, findingDelta),
      resolvedFindings: Math.max(0, -findingDelta),
      unchangedFindings: Math.min(previousFindings, currentFindings),
      findingDelta,
      dependencyDelta,
      riskDelta,
      posture: riskDelta < 0 ? "improved" : riskDelta > 0 ? "regressed" : "stable",
    },
  };
}

export function evaluateSecurityGate(findings, policies) {
  const openFindings = findings.filter((finding) => finding.status === "open");
  const enabledPolicies = policies.filter((policy) => policy.enabled);
  const decisions = [];
  const notEvaluated = [];

  for (const policy of enabledPolicies) {
    if (policy.category === "Vulnerability" && policy.action === "Block") {
      const critical = openFindings.filter((finding) => finding.severity === "critical").length;
      decisions.push({
        policyId: policy.id,
        policyName: policy.name,
        outcome: critical > 0 ? "fail" : "pass",
        reason: critical > 0
          ? `${critical} open critical ${critical === 1 ? "finding blocks" : "findings block"} release.`
          : "No open critical findings were detected.",
      });
    } else {
      notEvaluated.push(policy.name);
    }
  }

  const state = decisions.some((decision) => decision.outcome === "fail")
    ? "fail"
    : notEvaluated.length > 0
      ? "review"
      : "pass";

  return {
    state,
    evaluatedPolicies: decisions.length,
    enabledPolicies: enabledPolicies.length,
    decisions,
    notEvaluated,
    explanation: state === "fail"
      ? "At least one blocking policy failed. Review the evidence before release."
      : state === "review"
        ? "Automated checks passed, but some policies require data not captured by this demo scanner."
        : "All enabled and evaluable policies passed.",
  };
}

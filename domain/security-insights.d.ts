export type ScanSnapshot = { id: number; findingsCount: number; dependencyCount: number; riskScore: number; startedAt?: string; completedAt?: string };
export type ScanComparison = {
  previousScanId: number;
  currentScanId: number;
  previous: { findings: number; dependencies: number; riskScore: number; scannedAt: string };
  current: { findings: number; dependencies: number; riskScore: number; scannedAt: string };
  changes: { introducedFindings: number; resolvedFindings: number; unchangedFindings: number; findingDelta: number; dependencyDelta: number; riskDelta: number; posture: "improved" | "regressed" | "stable" };
};
export type PolicyGate = {
  state: "pass" | "fail" | "review";
  evaluatedPolicies: number;
  enabledPolicies: number;
  decisions: Array<{ policyId: number; policyName: string; outcome: "pass" | "fail"; reason: string }>;
  notEvaluated: string[];
  explanation: string;
};
export declare function compareScanSnapshots(previous: ScanSnapshot, current: ScanSnapshot): ScanComparison;
export declare function evaluateSecurityGate(findings: Array<{ status: string; severity: string }>, policies: Array<{ id: number; name: string; category: string; action: string; enabled: boolean }>): PolicyGate;

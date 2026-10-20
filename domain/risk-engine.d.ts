export type RiskFinding = { severity: string; direct?: boolean };
export declare function calculateRiskScore(findings: RiskFinding[]): number;
export declare function classifyRisk(score: number): "at_risk" | "review" | "passing";
export declare function summarizeSeverity(findings: RiskFinding[]): Record<"critical" | "high" | "medium" | "low", number>;
export declare function traceShortestDependencyPath(graph: Record<string, string[]>, start: string, target: string): string[] | null;

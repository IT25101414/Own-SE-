export type SbomComponent = { ref: string; name: string; version: string; purl: string; ecosystem: string; license: string; direct: boolean; depth: number };
export type SbomEdge = { parentRef: string; childRef: string };
export type SbomVulnerability = { id: string; affectedRef: string; packageName: string; severity: string; cvss: number; summary: string; fixedVersion: string | null; direct: boolean; path: string[] };
export type SbomAnalysis = {
  format: string;
  serialNumber: string;
  root: { ref: string; name: string };
  components: SbomComponent[];
  edges: SbomEdge[];
  vulnerabilities: SbomVulnerability[];
  cycles: string[][];
  metrics: { componentCount: number; directCount: number; transitiveCount: number; isolatedCount: number; maxDepth: number; cycleCount: number; licenseCoverage: number };
};
export declare function analyzeCycloneDx(input: unknown): SbomAnalysis;

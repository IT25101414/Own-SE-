export type Repository = { id: number; name: string; owner: string; ecosystem: string; branch: string; primaryDependency: string; primaryVersion: string; status: string; riskScore: number; dependencyCount: number; openFindings: number; lastScanAt: string; createdAt: string };
export type Finding = { id: number; repositoryId: number; repositoryName: string; vulnerabilityId: string; packageName: string; severity: string; cvss: number; fixedVersion: string | null; summary: string; dependencyPath: string; direct: boolean; status: string; detectedAt: string };
export type Policy = { id: number; name: string; description: string; category: string; action: string; scope: string; enabled: boolean; updatedAt: string };
export type Scan = { id: number; repositoryId: number; repositoryName: string; status: string; dependencyCount: number; findingsCount: number; riskScore: number; durationMs: number; startedAt: string; completedAt: string };
export type DashboardData = {
  repositories: Repository[]; findings: Finding[]; policies: Policy[]; scans: Scan[];
  stats: { repositories: number; dependencies: number; openFindings: number; critical: number; policyCoverage: number; averageRisk: number };
  severity: { critical: number; high: number; medium: number; low: number };
};

export type Repository = { id: number; name: string; owner: string; ecosystem: string; branch: string; primaryDependency: string; primaryVersion: string; status: string; riskScore: number; dependencyCount: number; openFindings: number; lastScanAt: string; createdAt: string };
export type Finding = { id: number; repositoryId: number; repositoryName: string; vulnerabilityId: string; packageName: string; severity: string; cvss: number; fixedVersion: string | null; summary: string; dependencyPath: string; direct: boolean; status: string; detectedAt: string };
export type Policy = { id: number; name: string; description: string; category: string; action: string; scope: string; enabled: boolean; updatedAt: string };
export type Scan = { id: number; repositoryId: number; repositoryName: string; status: string; dependencyCount: number; findingsCount: number; riskScore: number; durationMs: number; startedAt: string; completedAt: string };
export type DependencyComponent = { id: number; repositoryId: number; repositoryName: string; name: string; version: string; purl: string; ecosystem: string; license: string; direct: boolean; depth: number; componentRef: string };
export type DependencyEdge = { id: number; repositoryId: number; parentRef: string; childRef: string };
export type SbomImport = { id: number; repositoryId: number; repositoryName: string; format: string; serialNumber: string; componentCount: number; directCount: number; transitiveCount: number; isolatedCount: number; maxDepth: number; cycleCount: number; licenseCoverage: number; importedAt: string };
export type AuditEvent = { id: number; eventType: string; entityType: string; entityId: string; message: string; actor: string; createdAt: string };
export type DashboardData = {
  repositories: Repository[]; findings: Finding[]; policies: Policy[]; scans: Scan[];
  components: DependencyComponent[]; dependencyEdges: DependencyEdge[]; sbomImports: SbomImport[]; auditEvents: AuditEvent[];
  stats: { repositories: number; dependencies: number; openFindings: number; critical: number; policyCoverage: number; averageRisk: number };
  severity: { critical: number; high: number; medium: number; low: number };
};

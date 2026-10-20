import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const repositories = sqliteTable("repositories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  owner: text("owner").notNull().default("supplylens-labs"),
  ecosystem: text("ecosystem").notNull(),
  branch: text("branch").notNull().default("main"),
  primaryDependency: text("primary_dependency").notNull().default(""),
  primaryVersion: text("primary_version").notNull().default(""),
  status: text("status").notNull().default("review"),
  riskScore: integer("risk_score").notNull().default(0),
  dependencyCount: integer("dependency_count").notNull().default(0),
  openFindings: integer("open_findings").notNull().default(0),
  lastScanAt: text("last_scan_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const scans = sqliteTable("scans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  repositoryId: integer("repository_id").notNull().references(() => repositories.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("completed"),
  dependencyCount: integer("dependency_count").notNull().default(0),
  findingsCount: integer("findings_count").notNull().default(0),
  riskScore: integer("risk_score").notNull().default(0),
  durationMs: integer("duration_ms").notNull().default(0),
  startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const vulnerabilities = sqliteTable("vulnerabilities", {
  id: text("id").primaryKey(),
  packageName: text("package_name").notNull(),
  severity: text("severity").notNull(),
  cvss: real("cvss").notNull().default(0),
  fixedVersion: text("fixed_version"),
  summary: text("summary").notNull(),
  publishedAt: text("published_at").notNull(),
});

export const scanFindings = sqliteTable("scan_findings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scanId: integer("scan_id").notNull().references(() => scans.id, { onDelete: "cascade" }),
  repositoryId: integer("repository_id").notNull().references(() => repositories.id, { onDelete: "cascade" }),
  vulnerabilityId: text("vulnerability_id").notNull().references(() => vulnerabilities.id),
  dependencyPath: text("dependency_path").notNull(),
  direct: integer("direct", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("open"),
  detectedAt: text("detected_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const policies = sqliteTable("policies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  action: text("action").notNull(),
  scope: text("scope").notNull().default("All repositories"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const auditEvents = sqliteTable("audit_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventType: text("event_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  message: text("message").notNull(),
  actor: text("actor").notNull().default("portfolio-user"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const dependencyComponents = sqliteTable("dependency_components", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  purl: text("purl").notNull().unique(),
  name: text("name").notNull(),
  version: text("version").notNull(),
  ecosystem: text("ecosystem").notNull(),
  license: text("license").notNull().default("Unknown"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const repositoryDependencies = sqliteTable("repository_dependencies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  repositoryId: integer("repository_id").notNull().references(() => repositories.id, { onDelete: "cascade" }),
  dependencyId: integer("dependency_id").notNull().references(() => dependencyComponents.id, { onDelete: "cascade" }),
  direct: integer("direct", { mode: "boolean" }).notNull().default(false),
  depth: integer("depth").notNull().default(-1),
  componentRef: text("component_ref").notNull(),
  importedAt: text("imported_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const dependencyEdges = sqliteTable("dependency_edges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  repositoryId: integer("repository_id").notNull().references(() => repositories.id, { onDelete: "cascade" }),
  parentRef: text("parent_ref").notNull(),
  childRef: text("child_ref").notNull(),
  importedAt: text("imported_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sbomImports = sqliteTable("sbom_imports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  repositoryId: integer("repository_id").notNull().references(() => repositories.id, { onDelete: "cascade" }),
  scanId: integer("scan_id").notNull().references(() => scans.id, { onDelete: "cascade" }),
  format: text("format").notNull(),
  serialNumber: text("serial_number").notNull(),
  componentCount: integer("component_count").notNull(),
  directCount: integer("direct_count").notNull(),
  transitiveCount: integer("transitive_count").notNull(),
  isolatedCount: integer("isolated_count").notNull(),
  maxDepth: integer("max_depth").notNull(),
  cycleCount: integer("cycle_count").notNull(),
  licenseCoverage: integer("license_coverage").notNull(),
  importedAt: text("imported_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

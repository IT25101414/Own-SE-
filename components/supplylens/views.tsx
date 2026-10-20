"use client";

import { useState, type CSSProperties } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BookOpen, Boxes, Braces, ChevronRight,
  CircleAlert, CircleCheck, Clock3, Database, FileCheck2, FileJson, GitBranch, GitCompareArrows, LayoutDashboard,
  Loader2, Network, PackageCheck, Play, Plus, ScanSearch, Search,
  ServerCog, ShieldAlert, ShieldCheck, ShieldX, SlidersHorizontal, TriangleAlert, UploadCloud, Workflow, X,
  type LucideIcon,
} from "lucide-react";
import type { DashboardData, DependencyComponent, Finding, Repository } from "@/lib/types";

export type View = "overview" | "repositories" | "sbom" | "findings" | "riskdiff" | "policies" | "alerts" | "architecture";

export const navigation: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "repositories", label: "Repositories", icon: Boxes },
  { id: "sbom", label: "SBOM Lab", icon: FileJson },
  { id: "findings", label: "Findings", icon: ShieldAlert },
  { id: "riskdiff", label: "Scan comparison", icon: GitCompareArrows },
  { id: "policies", label: "Policies", icon: SlidersHorizontal },
  { id: "alerts", label: "Alert center", icon: Bell },
  { id: "architecture", label: "Architecture", icon: Network },
];

function formatRelative(value: string) {
  const date = new Date(value);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getUTCMonth()];
  const time = `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
  return `${month} ${day} · ${time} UTC`;
}

function weekday(value: string) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(value).getUTCDay()];
}

function statusLabel(status: string) {
  return status === "at_risk" ? "At risk" : status === "passing" ? "Passing" : "Review";
}

export function Overview({ data, onView, onScan, busy }: { data: DashboardData; onView: (view: View) => void; onScan: (repository: Repository) => void; busy: string | null }) {
  const maxActivity = Math.max(...data.scans.slice(0, 7).map((scan) => scan.dependencyCount), 1);
  const highRiskDependencies = data.findings.filter((finding) => finding.direct && ["critical", "high"].includes(finding.severity)).length;
  const failedPolicies = data.policyGate.decisions.filter((decision) => decision.outcome === "fail").length;
  const scannedRepositories = data.repositories.filter((repository) => repository.lastScanAt).length;
  const scanCoverage = data.repositories.length ? Math.round((scannedRepositories / data.repositories.length) * 100) : 0;
  const ecosystemCount = new Set(data.repositories.map((repository) => repository.ecosystem)).size;
  const postureComparison = data.scanComparisons[0];
  const riskMovement = postureComparison?.changes.riskDelta ?? 0;
  const movementLabel = postureComparison
    ? `${riskMovement > 0 ? "↑" : riskMovement < 0 ? "↓" : "→"} ${Math.abs(riskMovement)} pts · ${postureComparison.repositoryName}`
    : "Current workspace";
  const recentRisk = data.scans.slice(0, 8).reverse();
  const riskPoints = recentRisk.map((scan, index) => `${recentRisk.length === 1 ? 50 : (index / (recentRisk.length - 1)) * 100},${100 - scan.riskScore}`).join(" ");
  return <div className="dashboard-grid">
    <section className="metrics-row command-metrics">
      <MetricCard label="Repositories" value={String(data.stats.repositories).padStart(2, "0")} detail={`${scanCoverage}% scanned`} icon={Boxes} tone="blue" />
      <MetricCard label="Dependencies" value={data.stats.dependencies.toLocaleString()} detail={`Across ${ecosystemCount} ecosystem${ecosystemCount === 1 ? "" : "s"}`} icon={PackageCheck} tone="violet" />
      <MetricCard label="Critical findings" value={String(data.stats.critical).padStart(2, "0")} detail="Open and release blocking" icon={TriangleAlert} tone="coral" />
      <MetricCard label="High-risk direct" value={String(highRiskDependencies).padStart(2, "0")} detail="Critical or high severity" icon={ShieldX} tone="amber" />
      <MetricCard label="Policy violations" value={String(failedPolicies).padStart(2, "0")} detail={`${data.policyGate.evaluatedPolicies} automated checks`} icon={FileCheck2} tone={failedPolicies ? "coral" : "green"} />
      <MetricCard label="Overall risk" value={String(data.stats.averageRisk)} detail="Weighted repository average" icon={Activity} tone="blue" />
    </section>

    <section className="card risk-overview-card">
      <div className="card-header"><div><p className="card-kicker">Risk exposure</p><h2>Organization health</h2></div><span className={`trend-pill ${postureComparison?.changes.posture ?? "stable"}`}>{movementLabel}</span></div>
      <div className="risk-content">
        <div className="risk-ring" style={{ "--risk": `${data.stats.averageRisk * 3.6}deg` } as CSSProperties}><div><strong>{data.stats.averageRisk}</strong><span>Moderate</span></div></div>
        <div className="severity-list">
          {Object.entries(data.severity).map(([severity, count]) => <div key={severity}><span className={`severity-dot ${severity}`} /><span>{severity}</span><strong>{count}</strong><div className="severity-track"><i style={{ width: `${Math.max(8, count * 28)}%` }} /></div></div>)}
        </div>
      </div>
      <button className="inline-link" onClick={() => onView("findings")}>Review all findings<ArrowUpRight size={15} /></button>
    </section>

    <section className="card scan-activity-card">
      <div className="card-header"><div><p className="card-kicker">Scan activity</p><h2>Dependencies analyzed</h2></div><span className="period-select">Last 7 scans</span></div>
      <div className="bar-chart" aria-label="Dependencies analyzed over recent scans">
        {data.scans.slice(0, 7).reverse().map((scan, index) => <div className="bar-column" key={scan.id}><div className="bar-tooltip">{scan.dependencyCount}</div><div className={`bar ${index === data.scans.slice(0, 7).length - 1 ? "accent" : ""}`} style={{ height: `${Math.max(16, (scan.dependencyCount / maxActivity) * 100)}%` }} /><span>{weekday(scan.startedAt)}</span></div>)}
      </div>
      <div className="chart-legend"><span><i className="legend-square" />Completed scans</span><strong>{data.scans.length} total</strong></div>
    </section>

    <section className="card security-trend-card">
      <div className="card-header"><div><p className="card-kicker">Posture timeline</p><h2>Risk across recent scans</h2></div><button className="inline-link" onClick={() => onView("riskdiff")}>Compare scans<ArrowUpRight size={14} /></button></div>
      <div className="risk-line-wrap">
        <svg viewBox="0 0 100 100" role="img" aria-label="Risk score across recent scans" preserveAspectRatio="none"><defs><linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4f8cff" stopOpacity=".34" /><stop offset="1" stopColor="#4f8cff" stopOpacity="0" /></linearGradient></defs><polygon points={`0,100 ${riskPoints} 100,100`} fill="url(#riskFill)" /><polyline points={riskPoints} fill="none" stroke="#4f8cff" strokeWidth="2.4" vectorEffect="non-scaling-stroke" /></svg>
        <div className="risk-axis"><span>Older scans</span><strong>Latest scan</strong></div>
      </div>
    </section>

    <section className={`card gate-card ${data.policyGate.state}`}>
      <div className="gate-heading"><span>{data.policyGate.state === "pass" ? <ShieldCheck size={21} /> : data.policyGate.state === "fail" ? <ShieldX size={21} /> : <CircleAlert size={21} />}</span><div><p className="card-kicker">Automated policy gate</p><h2>{data.policyGate.state === "pass" ? "PASS" : data.policyGate.state === "fail" ? "FAIL" : "REVIEW REQUIRED"}</h2></div></div>
      <p>{data.policyGate.explanation}</p>
      <div className="gate-evidence">{data.policyGate.decisions.map((decision) => <div key={decision.policyId}><span className={`decision-dot ${decision.outcome}`} /><div><strong>{decision.policyName}</strong><small>{decision.reason}</small></div></div>)}</div>
      <button className="inline-link" onClick={() => onView("policies")}>Open policy center<ArrowRight size={14} /></button>
    </section>

    <section className="card repositories-card">
      <div className="card-header"><div><p className="card-kicker">Repository health</p><h2>Prioritized by exposure</h2></div><button className="inline-link" onClick={() => onView("repositories")}>View inventory<ChevronRight size={15} /></button></div>
      <div className="repo-table">
        <div className="table-head"><span>Repository</span><span>Ecosystem</span><span>Risk</span><span>Findings</span><span>Last scan</span><span /></div>
        {data.repositories.map((repository) => <RepositoryRow key={repository.id} repository={repository} onScan={onScan} busy={busy} />)}
      </div>
    </section>

    <section className="card recent-card">
      <div className="card-header"><div><p className="card-kicker">Priority queue</p><h2>Recent findings</h2></div><button className="icon-button" onClick={() => onView("findings")}><ArrowUpRight size={17} /></button></div>
      <div className="finding-list">{data.findings.slice(0, 4).map((finding) => <FindingCompact key={finding.id} finding={finding} />)}</div>
    </section>
  </div>;
}

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: LucideIcon; tone: string }) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={19} /></div><p>{label}</p><strong>{value}</strong><span>{detail}</span></article>;
}

function RepositoryRow({ repository, onScan, busy }: { repository: Repository; onScan: (repository: Repository) => void; busy: string | null }) {
  return <div className="table-row">
    <div className="repo-name"><span className={`repo-glyph ${repository.ecosystem.toLowerCase()}`}>{repository.name.slice(0, 2).toUpperCase()}</span><div><strong>{repository.name}</strong><span><GitBranch size={12} />{repository.branch}</span></div></div>
    <span className="ecosystem-tag">{repository.ecosystem}</span>
    <div className="risk-cell"><span className={`status-badge ${repository.status}`}>{statusLabel(repository.status)}</span><strong>{repository.riskScore}</strong></div>
    <strong className={repository.openFindings ? "finding-number" : "muted-number"}>{repository.openFindings}</strong>
    <span className="time-cell"><Clock3 size={13} />{formatRelative(repository.lastScanAt)}</span>
    <button className="scan-button" onClick={() => onScan(repository)} disabled={busy === `scan-${repository.id}`} aria-label={`Scan ${repository.name}`}>{busy === `scan-${repository.id}` ? <Loader2 className="spin" size={15} /> : <Play size={14} />}</button>
  </div>;
}

function FindingCompact({ finding }: { finding: Finding }) {
  return <div className="finding-compact"><span className={`severity-icon ${finding.severity}`}><TriangleAlert size={15} /></span><div><strong>{finding.vulnerabilityId}</strong><span>{finding.packageName} · {finding.repositoryName}</span></div><span className={`severity-label ${finding.severity}`}>{finding.severity}</span></div>;
}

export function Repositories({ data, onScan, busy, onAdd }: { data: DashboardData; onScan: (repository: Repository) => void; busy: string | null; onAdd: () => void }) {
  return <div className="section-stack">
    <div className="inventory-summary"><div><span>Protected repositories</span><strong>{data.repositories.length}</strong></div><div><span>Monitored dependencies</span><strong>{data.stats.dependencies}</strong></div><div><span>Healthy repositories</span><strong>{data.repositories.filter((repo) => repo.status === "passing").length}</strong></div></div>
    <div className="repository-cards">
      {data.repositories.map((repository) => <article className="repository-card" key={repository.id}>
        <div className="repository-card-top"><span className={`repo-glyph large ${repository.ecosystem.toLowerCase()}`}>{repository.name.slice(0, 2).toUpperCase()}</span><span className={`status-badge ${repository.status}`}>{statusLabel(repository.status)}</span></div>
        <h3>{repository.name}</h3><p>{repository.owner} / {repository.branch}</p>
        <div className="repository-score"><div><span>Risk score</span><strong>{repository.riskScore}<small>/100</small></strong></div><div className="score-track"><i style={{ width: `${repository.riskScore}%` }} /></div></div>
        <dl><div><dt>Dependencies</dt><dd>{repository.dependencyCount}</dd></div><div><dt>Open findings</dt><dd>{repository.openFindings}</dd></div><div><dt>Ecosystem</dt><dd>{repository.ecosystem}</dd></div></dl>
        <div className="primary-package"><Braces size={15} /><span>{repository.primaryDependency}</span><code>{repository.primaryVersion}</code></div>
        <button className="secondary-button wide" onClick={() => onScan(repository)} disabled={busy === `scan-${repository.id}`}>{busy === `scan-${repository.id}` ? <Loader2 className="spin" size={16} /> : <Play size={15} />}Run scan</button>
      </article>)}
      <button className="add-card" onClick={onAdd}><span><Plus size={22} /></span><strong>Add repository</strong><small>Connect another project to the inventory</small></button>
    </div>
  </div>;
}

export function Findings({ findings, search, setSearch }: { findings: Finding[]; search: string; setSearch: (value: string) => void }) {
  const [severity, setSeverity] = useState("all");
  const [selected, setSelected] = useState<Finding | null>(null);
  const visible = severity === "all" ? findings : findings.filter((finding) => finding.severity === severity);
  return <><div className="section-stack">
    <div className="toolbar-card"><div className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search CVE, package, or repository" /></div><div className="filter-tabs">{["all", "critical", "high", "medium"].map((item) => <button key={item} className={severity === item ? "active" : ""} onClick={() => setSeverity(item)}>{item}</button>)}</div></div>
    <div className="card findings-table-card"><div className="findings-header"><span>Vulnerability</span><span>Repository</span><span>Dependency path</span><span>CVSS</span><span>Remediation</span></div>{visible.map((finding) => <button type="button" className="finding-row finding-row-button" key={finding.id} onClick={() => setSelected(finding)}><div><span className={`severity-icon ${finding.severity}`}><TriangleAlert size={15} /></span><div><strong>{finding.vulnerabilityId}</strong><span>{finding.summary}</span></div></div><div><strong>{finding.repositoryName}</strong><span>{finding.direct ? "Direct dependency" : "Transitive dependency"}</span></div><code>{finding.dependencyPath}</code><strong className={`cvss ${finding.severity}`}>{finding.cvss.toFixed(1)}</strong><span className={finding.fixedVersion ? "fix-version" : "no-fix"}>{finding.fixedVersion ? `Investigate ${finding.fixedVersion}` : "No verified fix"}</span></button>)}{visible.length === 0 && <div className="empty-state"><CircleCheck size={28} /><strong>No matching findings</strong><span>Try a different query or severity.</span></div>}</div>
  </div>{selected && <aside className="detail-drawer" aria-label={`${selected.vulnerabilityId} details`}><header><div><span className={`severity-label ${selected.severity}`}>{selected.severity}</span><h2>{selected.vulnerabilityId}</h2><p>{selected.packageName} · {selected.repositoryName}</p></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Close details"><X size={17} /></button></header><div className="drawer-body"><section><p className="drawer-label">Finding summary</p><p>{selected.summary}</p></section><section className="drawer-metrics"><div><span>CVSS</span><strong>{selected.cvss.toFixed(1)}</strong></div><div><span>Exposure</span><strong>{selected.direct ? "Direct" : "Transitive"}</strong></div><div><span>Status</span><strong>{selected.status}</strong></div></section><section><p className="drawer-label">Shortest known path</p><code className="path-code">{selected.dependencyPath}</code></section><section className="remediation-card"><p className="drawer-label">Explainable remediation</p><strong>{selected.fixedVersion ? `Investigate version ${selected.fixedVersion}` : "No verified fixed version is available"}</strong><p>{selected.fixedVersion ? "The advisory reports this version as a remediation candidate. Validate compatibility and run the full test suite before release." : "Review the upstream advisory and package references. SupplyLens does not claim an upgrade is safe without verified version data."}</p></section></div></aside>}</>;
}

export function Policies({ data, onToggle, busy }: { data: DashboardData; onToggle: (id: number, enabled: boolean) => void; busy: string | null }) {
  return <div className="policy-layout"><section className="policy-list">{data.policies.map((policy) => <article className="policy-card" key={policy.id}><div className={`policy-symbol ${policy.enabled ? "enabled" : ""}`}><FileCheck2 size={20} /></div><div className="policy-copy"><div><span>{policy.category}</span><h3>{policy.name}</h3></div><p>{policy.description}</p><footer><span>{policy.scope}</span><i>•</i><strong>{policy.action}</strong></footer></div><button className={`switch ${policy.enabled ? "on" : ""}`} onClick={() => onToggle(policy.id, !policy.enabled)} disabled={busy === `policy-${policy.id}`} aria-label={`${policy.enabled ? "Disable" : "Enable"} ${policy.name}`}><span /></button></article>)}</section><aside className="card policy-score"><div className="policy-shield"><ShieldCheck size={28} /></div><p>Policy coverage</p><strong>{data.stats.policyCoverage}%</strong><span>{data.policies.filter((policy) => policy.enabled).length} of {data.policies.length} guardrails actively protect releases.</span><div className="coverage-track"><i style={{ width: `${data.stats.policyCoverage}%` }} /></div><small>Target: 100% before production</small></aside></div>;
}

export function SbomLab({ data, onImport }: { data: DashboardData; onImport: () => void }) {
  const [query, setQuery] = useState("");
  const [relationship, setRelationship] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const latest = data.sbomImports[0];
  const repositoryId = latest?.repositoryId ?? data.repositories[0]?.id;
  const components = data.components.filter((component) => component.repositoryId === repositoryId);
  const edges = data.dependencyEdges.filter((edge) => edge.repositoryId === repositoryId);
  const visibleComponents = components.filter((component) => {
    const matchesQuery = `${component.name} ${component.purl} ${component.version}`.toLowerCase().includes(query.toLowerCase());
    const matchesRelationship = relationship === "all" || (relationship === "direct" ? component.direct : relationship === "transitive" ? !component.direct && component.depth >= 0 : component.depth < 0);
    return matchesQuery && matchesRelationship;
  });
  const selected = components.find((component) => component.id === selectedId) ?? null;
  const selectedFinding = selected ? data.findings.find((finding) => finding.packageName.toLowerCase() === selected.name.toLowerCase()) : null;
  return <div className="sbom-layout">
    <section className="sbom-hero">
      <div><p className="card-kicker">CycloneDX ingestion pipeline</p><h2>Turn an SBOM into an explorable dependency graph.</h2><p>SupplyLens validates, normalizes, analyzes, and persists up to 500 components per import.</p></div>
      <button className="primary-button" onClick={onImport}><UploadCloud size={17} />Import SBOM</button>
    </section>

    <section className="card sbom-pipeline" aria-label="SBOM processing pipeline">
      <div className="card-header"><div><p className="card-kicker">Backend workflow</p><h2>Validated ingestion from JSON to queryable graph</h2></div><Workflow size={18} /></div>
      <div className="pipeline-wrap">
        {[{ step: "01", title: "Validate", detail: "Format, size, unique refs" }, { step: "02", title: "Normalize", detail: "PURLs, licenses, ecosystems" }, { step: "03", title: "Analyze", detail: "BFS depth, cycles, paths" }, { step: "04", title: "Persist", detail: "D1 components, edges, findings" }].map((item) => <article className="pipeline-stage" key={item.step}><span>{item.step}</span><strong>{item.title}</strong><small>{item.detail}</small></article>)}
      </div>
    </section>

    {latest ? <>
      <section className="sbom-metrics">
        <article><span>Components</span><strong>{latest.componentCount}</strong><small>{latest.format}</small></article>
        <article><span>Direct / transitive</span><strong>{latest.directCount}<i>/</i>{latest.transitiveCount}</strong><small>Maximum depth {latest.maxDepth}</small></article>
        <article><span>Graph health</span><strong>{latest.cycleCount === 0 ? "Acyclic" : `${latest.cycleCount} cycles`}</strong><small>{latest.isolatedCount} isolated nodes</small></article>
        <article><span>License coverage</span><strong>{latest.licenseCoverage}%</strong><small>{latest.repositoryName}</small></article>
      </section>

      <section className="sbom-grid">
        <article className="card graph-card">
          <div className="card-header"><div><p className="card-kicker">Dependency graph</p><h2>{latest.repositoryName}</h2></div><span className="architecture-badge">{edges.length} edges</span></div>
          <div className="graph-toolbar"><label><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a package" /></label><div className="filter-tabs compact">{["all", "direct", "transitive", "isolated"].map((item) => <button key={item} className={relationship === item ? "active" : ""} onClick={() => setRelationship(item)}>{item}</button>)}</div></div>
          <div className="graph-workspace"><DependencyGraphCanvas rootName={latest.repositoryName} components={visibleComponents} edges={edges} findings={data.findings} selectedId={selectedId} onSelect={setSelectedId} />{selected && <aside className="node-inspector"><header><div><p className="card-kicker">Selected component</p><h3>{selected.name}</h3></div><button className="icon-button" onClick={() => setSelectedId(null)} aria-label="Close component details"><X size={15} /></button></header><code>{selected.version}</code><dl><div><dt>Relationship</dt><dd>{selected.direct ? "Direct" : selected.depth < 0 ? "Isolated" : `Transitive · depth ${selected.depth}`}</dd></div><div><dt>Ecosystem</dt><dd>{selected.ecosystem}</dd></div><div><dt>License</dt><dd>{selected.license}</dd></div><div><dt>Risk signal</dt><dd>{selectedFinding ? selectedFinding.severity : "No matched advisory"}</dd></div></dl><p className="node-purl">{selected.purl}</p>{selectedFinding && <div className="node-remediation"><strong>{selectedFinding.vulnerabilityId}</strong><span>{selectedFinding.dependencyPath}</span><small>{selectedFinding.fixedVersion ? `Investigate ${selectedFinding.fixedVersion}` : "No verified fix reported"}</small></div>}</aside>}</div>
          {components.length === 0 && <div className="empty-state"><FileJson size={26} /><strong>No normalized components yet</strong></div>}
        </article>

        <article className="card activity-card">
          <div className="card-header"><div><p className="card-kicker">Append-only trail</p><h2>Recent backend events</h2></div><Activity size={18} /></div>
          <div className="audit-list">{data.auditEvents.slice(0, 6).map((event) => <article key={event.id}><span className="audit-dot" /><div><strong>{event.eventType.replaceAll(".", " ")}</strong><p>{event.message}</p><span>{formatRelative(event.createdAt)}</span></div></article>)}</div>
        </article>
      </section>

      <section className="card component-table-card">
        <div className="card-header"><div><p className="card-kicker">Normalized inventory</p><h2>Package components</h2></div><span className="architecture-badge">PURL indexed</span></div>
        <div className="component-head"><span>Package</span><span>Relationship</span><span>Ecosystem</span><span>License</span></div>
        {components.slice(0, 12).map((component) => <div className="component-row" key={component.id}><div><strong>{component.name}</strong><code>{component.version}</code><small>{component.purl}</small></div><span className={`relationship ${component.direct ? "direct" : ""}`}>{component.direct ? "Direct" : component.depth < 0 ? "Isolated" : `Depth ${component.depth}`}</span><span>{component.ecosystem}</span><span>{component.license}</span></div>)}
      </section>
    </> : <section className="card empty-sbom"><FileJson size={34} /><h2>No SBOM imported</h2><p>Import a CycloneDX document to build the first dependency graph.</p><button className="primary-button" onClick={onImport}>Import sample</button></section>}
  </div>;
}

function DependencyGraphCanvas({ rootName, components, edges, findings, selectedId, onSelect }: { rootName: string; components: DependencyComponent[]; edges: DashboardData["dependencyEdges"]; findings: Finding[]; selectedId: number | null; onSelect: (id: number) => void }) {
  const width = 800;
  const height = 390;
  const center = { x: width / 2, y: height / 2 };
  const positions = new Map<string, { x: number; y: number }>();
  components.forEach((component, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(components.length, 1) - Math.PI / 2;
    const radius = component.direct ? 104 : component.depth < 0 ? 174 : 164;
    positions.set(component.componentRef, { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius });
  });
  const componentByRef = new Map(components.map((component) => [component.componentRef, component]));
  const visibleEdges = edges.filter((edge) => componentByRef.has(edge.childRef) && (componentByRef.has(edge.parentRef) || !components.some((component) => component.componentRef === edge.parentRef)));
  const severityColor = (component: DependencyComponent) => {
    const finding = findings.find((item) => item.packageName.toLowerCase() === component.name.toLowerCase());
    return finding?.severity === "critical" ? "#f04452" : finding?.severity === "high" ? "#f79043" : finding?.severity === "medium" ? "#f5be4f" : finding?.severity === "low" ? "#4b9ef8" : component.direct ? "#7c6cf5" : "#4f8cff";
  };

  return <div className="dependency-canvas"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Interactive dependency graph for ${rootName}`}>
    <defs><radialGradient id="rootGlow"><stop offset="0" stopColor="#4f8cff" stopOpacity=".5" /><stop offset="1" stopColor="#4f8cff" stopOpacity="0" /></radialGradient></defs>
    <circle cx={center.x} cy={center.y} r="105" fill="none" stroke="#263449" strokeDasharray="3 7" /><circle cx={center.x} cy={center.y} r="165" fill="none" stroke="#202c40" strokeDasharray="3 9" />
    {visibleEdges.map((edge, index) => { const from = positions.get(edge.parentRef) ?? center; const to = positions.get(edge.childRef); return to ? <line key={`${edge.parentRef}-${edge.childRef}-${index}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="graph-edge-line" /> : null; })}
    <circle cx={center.x} cy={center.y} r="54" fill="url(#rootGlow)" /><circle cx={center.x} cy={center.y} r="27" className="root-node-circle" /><text x={center.x} y={center.y + 4} textAnchor="middle" className="root-node-label">ROOT</text>
    {components.map((component) => { const position = positions.get(component.componentRef)!; const selected = selectedId === component.id; return <g key={component.id} className={`dependency-node ${selected ? "selected" : ""}`} transform={`translate(${position.x} ${position.y})`} role="button" tabIndex={0} onClick={() => onSelect(component.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(component.id); }}><circle r={selected ? 19 : 15} fill={severityColor(component)} /><circle r={selected ? 25 : 20} className="node-halo" /><text y="34" textAnchor="middle" className="dependency-node-label">{component.name.slice(0, 18)}</text><text y="47" textAnchor="middle" className="dependency-node-version">{component.version}</text></g>; })}
  </svg><div className="graph-legend"><span><i className="legend-root" />Project root</span><span><i className="legend-direct" />Direct</span><span><i className="legend-risk" />Known risk</span></div></div>;
}

export function RiskDiff({ data }: { data: DashboardData }) {
  const [repositoryId, setRepositoryId] = useState(data.scanComparisons[0]?.repositoryId ?? 0);
  const comparison = data.scanComparisons.find((item) => item.repositoryId === repositoryId) ?? data.scanComparisons[0];
  if (!comparison) return <section className="card empty-state"><GitCompareArrows size={30} /><strong>Two scans are required</strong><span>Run another scan on a repository to unlock a comparison.</span></section>;
  const signed = (value: number) => `${value > 0 ? "+" : ""}${value}`;
  return <div className="diff-layout">
    <section className="card diff-hero"><div><p className="card-kicker">Dependency risk diff engine</p><h2>What changed between scans?</h2><p>Compare persisted aggregate evidence without inventing package-level changes that were not captured.</p></div><label>Repository<select value={comparison.repositoryId} onChange={(event) => setRepositoryId(Number(event.target.value))}>{data.scanComparisons.map((item) => <option key={item.repositoryId} value={item.repositoryId}>{item.repositoryName}</option>)}</select></label></section>
    <section className="scan-pair">
      <article className="card scan-snapshot previous"><span>Previous scan</span><strong>#{comparison.previousScanId}</strong><time>{formatRelative(comparison.previous.scannedAt)}</time><dl><div><dt>Dependencies</dt><dd>{comparison.previous.dependencies}</dd></div><div><dt>Findings</dt><dd>{comparison.previous.findings}</dd></div><div><dt>Risk score</dt><dd>{comparison.previous.riskScore}</dd></div></dl></article>
      <div className={`diff-direction ${comparison.changes.posture}`}>{comparison.changes.posture === "improved" ? <ArrowDownRight size={22} /> : comparison.changes.posture === "regressed" ? <ArrowUpRight size={22} /> : <ArrowRight size={22} />}<span>{comparison.changes.posture}</span></div>
      <article className="card scan-snapshot current"><span>Current scan</span><strong>#{comparison.currentScanId}</strong><time>{formatRelative(comparison.current.scannedAt)}</time><dl><div><dt>Dependencies</dt><dd>{comparison.current.dependencies}</dd></div><div><dt>Findings</dt><dd>{comparison.current.findings}</dd></div><div><dt>Risk score</dt><dd>{comparison.current.riskScore}</dd></div></dl></article>
    </section>
    <section className="diff-metrics">
      <article className="card"><span>Introduced findings</span><strong className="introduced">{comparison.changes.introducedFindings}</strong><small>Aggregate count increase</small></article>
      <article className="card"><span>Resolved findings</span><strong className="resolved">{comparison.changes.resolvedFindings}</strong><small>Aggregate count decrease</small></article>
      <article className="card"><span>Unchanged exposure</span><strong>{comparison.changes.unchangedFindings}</strong><small>Minimum shared count</small></article>
      <article className="card"><span>Risk movement</span><strong>{signed(comparison.changes.riskDelta)}</strong><small>Score points</small></article>
    </section>
    <section className="card diff-evidence"><div className="card-header"><div><p className="card-kicker">Evidence ledger</p><h2>Persisted scan deltas</h2></div><span className={`posture-pill ${comparison.changes.posture}`}>{comparison.changes.posture}</span></div><div className="evidence-table"><div><span>Dependency inventory</span><strong>{signed(comparison.changes.dependencyDelta)}</strong><small>{comparison.previous.dependencies} → {comparison.current.dependencies}</small></div><div><span>Open findings</span><strong>{signed(comparison.changes.findingDelta)}</strong><small>{comparison.previous.findings} → {comparison.current.findings}</small></div><div><span>Risk score</span><strong>{signed(comparison.changes.riskDelta)}</strong><small>{comparison.previous.riskScore} → {comparison.current.riskScore}</small></div></div><p className="evidence-note"><CircleAlert size={15} />This comparison uses immutable scan aggregates. Package-level added and removed lists require per-scan component snapshots and are intentionally not fabricated.</p></section>
  </div>;
}

export function Alerts({ data, onView }: { data: DashboardData; onView: (view: View) => void }) {
  const urgent = data.findings.filter((finding) => finding.status === "open" && ["critical", "high"].includes(finding.severity));
  return <div className="alerts-layout">
    <section className="alert-summary">
      <article className="card"><span className="alert-icon critical"><TriangleAlert size={20} /></span><div><strong>{data.stats.critical}</strong><span>Critical alerts</span></div></article>
      <article className="card"><span className="alert-icon high"><ShieldAlert size={20} /></span><div><strong>{urgent.filter((item) => item.severity === "high").length}</strong><span>High priority</span></div></article>
      <article className="card"><span className="alert-icon policy"><FileCheck2 size={20} /></span><div><strong>{data.policyGate.decisions.filter((item) => item.outcome === "fail").length}</strong><span>Policy failures</span></div></article>
    </section>
    <section className="card alert-inbox"><div className="card-header"><div><p className="card-kicker">Security alert center</p><h2>Actionable risk inbox</h2></div><span className="architecture-badge">{urgent.length} open</span></div><div className="alert-list">{urgent.map((finding) => <button key={finding.id} onClick={() => onView("findings")}><span className={`severity-icon ${finding.severity}`}><TriangleAlert size={16} /></span><div><strong>{finding.vulnerabilityId} · {finding.packageName}</strong><p>{finding.summary}</p><small>{finding.repositoryName} · {finding.direct ? "direct" : "transitive"} exposure</small></div><ChevronRight size={16} /></button>)}{urgent.length === 0 && <div className="empty-state"><CircleCheck size={28} /><strong>No urgent alerts</strong><span>Critical and high-severity queues are clear.</span></div>}</div></section>
    <aside className="card operations-feed"><div className="card-header"><div><p className="card-kicker">Operations</p><h2>Recent events</h2></div><Activity size={18} /></div><div className="audit-list">{data.auditEvents.slice(0, 8).map((event) => <article key={event.id}><span className="audit-dot" /><div><strong>{event.eventType.replaceAll(".", " ")}</strong><p>{event.message}</p><span>{formatRelative(event.createdAt)}</span></div></article>)}</div></aside>
  </div>;
}

export function Architecture() {
  const contexts = [
    { icon: Boxes, title: "Repository Inventory", text: "Ownership, ecosystems and manifest metadata", tone: "blue" },
    { icon: ScanSearch, title: "Dependency Analysis", text: "Scans, graphs and transitive dependency paths", tone: "violet" },
    { icon: ShieldAlert, title: "Vulnerability Intelligence", text: "OSV advisories, severity and remediation", tone: "coral" },
    { icon: SlidersHorizontal, title: "Policy Management", text: "Guardrails, scope and release decisions", tone: "green" },
  ];
  return <div className="architecture-layout"><section className="card context-map"><div className="card-header"><div><p className="card-kicker">DDD context map</p><h2>Boundaries before services</h2></div><span className="architecture-badge">Modular monolith</span></div><div className="context-flow">{contexts.map(({ icon: Icon, title, text, tone }, index) => <div className="context-wrap" key={title}><article className={`context-card ${tone}`}><span><Icon size={20} /></span><h3>{title}</h3><p>{text}</p></article>{index < contexts.length - 1 && <ChevronRight className="context-arrow" size={18} />}</div>)}</div></section><section className="engineering-grid"><article className="card engineering-card"><span><ServerCog size={21} /></span><h3>Application layer</h3><p>Next.js route handlers orchestrate use cases while domain logic stays framework independent.</p><code>app/api/* → domain services</code></article><article className="card engineering-card"><span><Database size={21} /></span><h3>Persistence layer</h3><p>Drizzle ORM and Cloudflare D1 provide typed queries, foreign keys, and migration history.</p><code>D1 / SQLite + repositories</code></article><article className="card engineering-card"><span><Activity size={21} /></span><h3>Quality strategy</h3><p>Unit tests protect scoring and graph traversal; API and UI checks cover integrations.</p><code>node:test + CI workflow</code></article><article className="card engineering-card"><span><BookOpen size={21} /></span><h3>Decision records</h3><p>Architecture, domain language, tradeoffs, and test strategy are documented in the repository.</p><code>docs/architecture/*</code></article></section><section className="principles-strip"><div><strong>5</strong><span>Bounded contexts</span></div><div><strong>7</strong><span>API endpoints</span></div><div><strong>16</strong><span>Automated tests</span></div><div><strong>1</strong><span>Deployable unit</span></div></section></div>;
}

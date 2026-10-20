"use client";

import { useState, type CSSProperties } from "react";
import {
  Activity, ArrowUpRight, BookOpen, Boxes, Braces, ChevronRight,
  CircleCheck, Clock3, Database, FileCheck2, GitBranch, LayoutDashboard,
  Loader2, Network, PackageCheck, Play, Plus, ScanSearch, Search,
  ServerCog, ShieldAlert, ShieldCheck, SlidersHorizontal, TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { DashboardData, Finding, Repository } from "@/lib/types";

export type View = "overview" | "repositories" | "findings" | "policies" | "architecture";

export const navigation: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "repositories", label: "Repositories", icon: Boxes },
  { id: "findings", label: "Findings", icon: ShieldAlert },
  { id: "policies", label: "Policies", icon: SlidersHorizontal },
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
  return <div className="dashboard-grid">
    <section className="metrics-row">
      <MetricCard label="Repositories" value={String(data.stats.repositories).padStart(2, "0")} detail="100% scanned" icon={Boxes} tone="blue" />
      <MetricCard label="Dependencies" value={data.stats.dependencies.toLocaleString()} detail="Across 3 ecosystems" icon={PackageCheck} tone="violet" />
      <MetricCard label="Open findings" value={String(data.stats.openFindings).padStart(2, "0")} detail={`${data.stats.critical} needs immediate action`} icon={TriangleAlert} tone="coral" />
      <MetricCard label="Policy coverage" value={`${data.stats.policyCoverage}%`} detail="3 of 4 guardrails active" icon={ShieldCheck} tone="green" />
    </section>

    <section className="card risk-overview-card">
      <div className="card-header"><div><p className="card-kicker">Risk exposure</p><h2>Organization health</h2></div><span className="trend-pill">↓ 12% this week</span></div>
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
  const visible = severity === "all" ? findings : findings.filter((finding) => finding.severity === severity);
  return <div className="section-stack">
    <div className="toolbar-card"><div className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search CVE, package, or repository" /></div><div className="filter-tabs">{["all", "critical", "high", "medium"].map((item) => <button key={item} className={severity === item ? "active" : ""} onClick={() => setSeverity(item)}>{item}</button>)}</div></div>
    <div className="card findings-table-card"><div className="findings-header"><span>Vulnerability</span><span>Repository</span><span>Dependency path</span><span>CVSS</span><span>Remediation</span></div>{visible.map((finding) => <div className="finding-row" key={finding.id}><div><span className={`severity-icon ${finding.severity}`}><TriangleAlert size={15} /></span><div><strong>{finding.vulnerabilityId}</strong><span>{finding.summary}</span></div></div><div><strong>{finding.repositoryName}</strong><span>{finding.direct ? "Direct dependency" : "Transitive dependency"}</span></div><code>{finding.dependencyPath}</code><strong className={`cvss ${finding.severity}`}>{finding.cvss.toFixed(1)}</strong><span className="fix-version">Upgrade to {finding.fixedVersion ?? "latest"}</span></div>)}{visible.length === 0 && <div className="empty-state"><CircleCheck size={28} /><strong>No matching findings</strong><span>Try a different query or severity.</span></div>}</div>
  </div>;
}

export function Policies({ data, onToggle, busy }: { data: DashboardData; onToggle: (id: number, enabled: boolean) => void; busy: string | null }) {
  return <div className="policy-layout"><section className="policy-list">{data.policies.map((policy) => <article className="policy-card" key={policy.id}><div className={`policy-symbol ${policy.enabled ? "enabled" : ""}`}><FileCheck2 size={20} /></div><div className="policy-copy"><div><span>{policy.category}</span><h3>{policy.name}</h3></div><p>{policy.description}</p><footer><span>{policy.scope}</span><i>•</i><strong>{policy.action}</strong></footer></div><button className={`switch ${policy.enabled ? "on" : ""}`} onClick={() => onToggle(policy.id, !policy.enabled)} disabled={busy === `policy-${policy.id}`} aria-label={`${policy.enabled ? "Disable" : "Enable"} ${policy.name}`}><span /></button></article>)}</section><aside className="card policy-score"><div className="policy-shield"><ShieldCheck size={28} /></div><p>Policy coverage</p><strong>{data.stats.policyCoverage}%</strong><span>{data.policies.filter((policy) => policy.enabled).length} of {data.policies.length} guardrails actively protect releases.</span><div className="coverage-track"><i style={{ width: `${data.stats.policyCoverage}%` }} /></div><small>Target: 100% before production</small></aside></div>;
}

export function Architecture() {
  const contexts = [
    { icon: Boxes, title: "Repository Inventory", text: "Ownership, ecosystems and manifest metadata", tone: "blue" },
    { icon: ScanSearch, title: "Dependency Analysis", text: "Scans, graphs and transitive dependency paths", tone: "violet" },
    { icon: ShieldAlert, title: "Vulnerability Intelligence", text: "OSV advisories, severity and remediation", tone: "coral" },
    { icon: SlidersHorizontal, title: "Policy Management", text: "Guardrails, scope and release decisions", tone: "green" },
  ];
  return <div className="architecture-layout"><section className="card context-map"><div className="card-header"><div><p className="card-kicker">DDD context map</p><h2>Boundaries before services</h2></div><span className="architecture-badge">Modular monolith</span></div><div className="context-flow">{contexts.map(({ icon: Icon, title, text, tone }, index) => <div className="context-wrap" key={title}><article className={`context-card ${tone}`}><span><Icon size={20} /></span><h3>{title}</h3><p>{text}</p></article>{index < contexts.length - 1 && <ChevronRight className="context-arrow" size={18} />}</div>)}</div></section><section className="engineering-grid"><article className="card engineering-card"><span><ServerCog size={21} /></span><h3>Application layer</h3><p>Next.js route handlers orchestrate use cases while domain logic stays framework independent.</p><code>app/api/* → domain services</code></article><article className="card engineering-card"><span><Database size={21} /></span><h3>Persistence layer</h3><p>Drizzle ORM and Cloudflare D1 provide typed queries, foreign keys, and migration history.</p><code>D1 / SQLite + repositories</code></article><article className="card engineering-card"><span><Activity size={21} /></span><h3>Quality strategy</h3><p>Unit tests protect scoring and graph traversal; API and UI checks cover integrations.</p><code>node:test + CI workflow</code></article><article className="card engineering-card"><span><BookOpen size={21} /></span><h3>Decision records</h3><p>Architecture, domain language, tradeoffs, and test strategy are documented in the repository.</p><code>docs/architecture/*</code></article></section><section className="principles-strip"><div><strong>5</strong><span>Bounded contexts</span></div><div><strong>4</strong><span>API workflows</span></div><div><strong>4</strong><span>Domain unit tests</span></div><div><strong>1</strong><span>Deployable unit</span></div></section></div>;
}

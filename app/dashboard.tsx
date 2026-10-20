"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Check, ChevronRight, Database, Download, ExternalLink, Loader2, Menu,
  Plus, ScanSearch, ShieldCheck, TriangleAlert, X,
} from "lucide-react";
import type { DashboardData, Repository } from "@/lib/types";
import {
  Architecture, Findings, Overview, Policies, Repositories, navigation,
  type View,
} from "@/components/supplylens/views";

type OsvResult = { packageName: string; version: string; ecosystem: string; checkedAt: string; vulnerabilities: Array<{ id: string; summary: string; modified?: string; aliases: string[] }> };

const viewCopy: Record<View, { eyebrow: string; title: string; description: string }> = {
  overview: { eyebrow: "Security posture", title: "Your supply chain, in focus.", description: "Prioritize dependency risk across every repository from one calm workspace." },
  repositories: { eyebrow: "Repository inventory", title: "Know what you ship.", description: "Track ecosystems, dependency volume, scan health, and ownership." },
  findings: { eyebrow: "Vulnerability intelligence", title: "Fix what matters first.", description: "Investigate direct and transitive exposure with clear upgrade paths." },
  policies: { eyebrow: "Policy engine", title: "Turn standards into guardrails.", description: "Apply consistent release checks without slowing down developers." },
  architecture: { eyebrow: "Engineering evidence", title: "Designed as a modular monolith.", description: "A practical DDD architecture with testable domain services and clear boundaries." },
};

async function readJson(response: Response) {
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Request failed");
  return body;
}

export function Dashboard({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<View>("overview");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [repositoryModal, setRepositoryModal] = useState(false);
  const [checkModal, setCheckModal] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [osvResult, setOsvResult] = useState<OsvResult | null>(null);

  const filteredFindings = useMemo(() => {
    const query = search.toLowerCase();
    return data.findings.filter((finding) => [finding.vulnerabilityId, finding.packageName, finding.repositoryName, finding.summary].some((value) => value.toLowerCase().includes(query)));
  }, [data.findings, search]);

  const selectView = (nextView: View) => {
    setView(nextView);
    setMenuOpen(false);
    if (nextView !== "findings") setSearch("");
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  async function handleAddRepository(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy("repository");
    try {
      const next = await readJson(await fetch("/api/repositories", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      })) as DashboardData;
      setData(next);
      setRepositoryModal(false);
      setView("repositories");
      notify("Repository added and baseline scan completed.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to add repository.");
    } finally {
      setBusy(null);
    }
  }

  async function handleScan(repository: Repository) {
    setBusy(`scan-${repository.id}`);
    try {
      const next = await readJson(await fetch("/api/scans", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ repositoryId: repository.id }),
      })) as DashboardData;
      setData(next);
      notify(`${repository.name} scanned successfully.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Scan failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handlePolicy(id: number, enabled: boolean) {
    setBusy(`policy-${id}`);
    try {
      const next = await readJson(await fetch("/api/policies", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, enabled }),
      })) as DashboardData;
      setData(next);
      notify(enabled ? "Policy enabled." : "Policy paused.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Policy update failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDependencyCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOsvResult(null);
    setBusy("osv");
    try {
      const form = new FormData(event.currentTarget);
      const result = await readJson(await fetch("/api/osv", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      })) as OsvResult;
      setOsvResult(result);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Dependency check failed.");
    } finally {
      setBusy(null);
    }
  }

  function exportReport() {
    const report = JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2);
    const url = URL.createObjectURL(new Blob([report], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "supplylens-security-report.json";
    anchor.click();
    URL.revokeObjectURL(url);
    notify("Security report exported.");
  }

  const copy = viewCopy[view];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand"><LogoMark /><span>SupplyLens</span></div>
        <p className="workspace-label">Workspace</p>
        <nav aria-label="Primary navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${view === id ? "active" : ""}`} onClick={() => selectView(id)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {id === "findings" && <span className="nav-count">{data.stats.openFindings}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="standard-card">
          <div className="standard-icon"><ShieldCheck size={17} /></div>
          <div><strong>OWASP A03</strong><span>Supply Chain Failures</span></div>
          <ExternalLink size={14} />
        </div>
        <div className="profile">
          <div className="avatar">SL</div>
          <div><strong>Security Lab</strong><span>Portfolio workspace</span></div>
          <span className="online-dot" />
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Menu size={20} /></button>
          <div className="breadcrumb"><span>SupplyLens</span><ChevronRight size={14} /><strong>{navigation.find((item) => item.id === view)?.label}</strong></div>
          <div className="top-actions">
            <button className="text-button" onClick={exportReport}><Download size={16} />Export report</button>
            <button className="secondary-button" onClick={() => setCheckModal(true)}><ScanSearch size={17} />Check dependency</button>
            <button className="primary-button" onClick={() => setRepositoryModal(true)}><Plus size={17} />Add repository</button>
          </div>
        </header>

        <div className="content">
          <section className="page-intro">
            <div><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.description}</p></div>
            <div className="live-chip"><span />Demo workspace · live OSV checks</div>
          </section>
          {view === "overview" && <Overview data={data} onView={selectView} onScan={handleScan} busy={busy} />}
          {view === "repositories" && <Repositories data={data} onScan={handleScan} busy={busy} onAdd={() => setRepositoryModal(true)} />}
          {view === "findings" && <Findings findings={filteredFindings} search={search} setSearch={setSearch} />}
          {view === "policies" && <Policies data={data} onToggle={handlePolicy} busy={busy} />}
          {view === "architecture" && <Architecture />}
        </div>
      </main>

      <Modal open={repositoryModal} onClose={() => setRepositoryModal(false)} title="Add a repository" subtitle="Create an inventory record and run a baseline dependency scan.">
        <form className="modal-form" onSubmit={handleAddRepository}>
          <label>Repository name<input name="name" placeholder="payments-service" required minLength={3} /></label>
          <div className="form-grid"><label>Ecosystem<select name="ecosystem" defaultValue="npm"><option>npm</option><option>Maven</option><option>PyPI</option></select></label><label>Default branch<input name="branch" defaultValue="main" disabled /></label></div>
          <div className="form-grid"><label>Primary dependency<input name="dependency" placeholder="express" required /></label><label>Current version<input name="version" placeholder="4.18.2" required /></label></div>
          <p className="form-note"><Database size={15} />The record and scan history are persisted in Cloudflare D1.</p>
          <button className="primary-button wide" disabled={busy === "repository"}>{busy === "repository" ? <Loader2 className="spin" size={17} /> : <Plus size={17} />}Add and scan</button>
        </form>
      </Modal>

      <Modal open={checkModal} onClose={() => { setCheckModal(false); setOsvResult(null); }} title="Live dependency check" subtitle="Query the Open Source Vulnerabilities database by package version.">
        <form className="modal-form" onSubmit={handleDependencyCheck}>
          <div className="form-grid three"><label>Ecosystem<select name="ecosystem" defaultValue="npm"><option>npm</option><option>Maven</option><option>PyPI</option></select></label><label className="span-two">Package<input name="packageName" defaultValue="lodash" required /></label></div>
          <label>Version<input name="version" defaultValue="4.17.20" required /></label>
          <button className="primary-button wide" disabled={busy === "osv"}>{busy === "osv" ? <Loader2 className="spin" size={17} /> : <ScanSearch size={17} />}Check OSV database</button>
        </form>
        {osvResult && <OsvResults result={osvResult} />}
      </Modal>

      {toast && <div className="toast"><Check size={16} />{toast}</div>}
      {menuOpen && <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
    </div>
  );
}

function LogoMark() {
  return <span className="logo-mark" aria-hidden="true"><span /><span /><span /></span>;
}

function Modal({ open, onClose, title, subtitle, children }: { open: boolean; onClose: () => void; title: string; subtitle: string; children: ReactNode }) {
  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-label={title}><header><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></header>{children}</section></div>;
}

function OsvResults({ result }: { result: OsvResult }) {
  return <div className="osv-results"><div className="osv-result-header"><span className={result.vulnerabilities.length ? "warning" : "safe"}>{result.vulnerabilities.length ? <TriangleAlert size={18} /> : <ShieldCheck size={18} />}</span><div><strong>{result.vulnerabilities.length ? `${result.vulnerabilities.length} advisories found` : "No known vulnerabilities"}</strong><p>{result.packageName}@{result.version} in {result.ecosystem}</p></div></div>{result.vulnerabilities.map((vulnerability) => <article key={vulnerability.id}><strong>{vulnerability.id}</strong><p>{String(vulnerability.summary).slice(0, 180)}</p>{vulnerability.aliases.length > 0 && <span>{vulnerability.aliases.join(" · ")}</span>}</article>)}</div>;
}

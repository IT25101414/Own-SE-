const SUPPORTED_SEVERITIES = new Set(["critical", "high", "medium", "low"]);

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function componentRef(component, index) {
  return String(component["bom-ref"] || component.purl || `${component.name || "component"}:${component.version || index}`);
}

function ecosystemFromPurl(purl) {
  const kind = String(purl || "").match(/^pkg:([^/]+)/)?.[1]?.toLowerCase();
  return kind === "maven" ? "Maven" : kind === "pypi" ? "PyPI" : kind === "npm" ? "npm" : "Unknown";
}

function firstLicense(component) {
  const entry = Array.isArray(component.licenses) ? asRecord(component.licenses[0]) : {};
  const license = asRecord(entry.license);
  return String(license.id || license.name || entry.expression || "Unknown");
}

function findCycles(graph) {
  const color = new Map();
  const stack = [];
  const cycles = [];
  const seen = new Set();

  function visit(node) {
    color.set(node, 1);
    stack.push(node);
    for (const child of graph.get(node) || []) {
      if (!color.has(child)) visit(child);
      else if (color.get(child) === 1) {
        const start = stack.lastIndexOf(child);
        const cycle = [...stack.slice(start), child];
        const signature = [...new Set(cycle)].sort().join("|");
        if (!seen.has(signature)) {
          seen.add(signature);
          cycles.push(cycle);
        }
      }
    }
    stack.pop();
    color.set(node, 2);
  }

  for (const node of graph.keys()) if (!color.has(node)) visit(node);
  return cycles;
}

function shortestPath(graph, start, target) {
  const queue = [[start]];
  const visited = new Set([start]);
  while (queue.length) {
    const path = queue.shift();
    const node = path[path.length - 1];
    if (node === target) return path;
    for (const child of graph.get(node) || []) {
      if (!visited.has(child)) {
        visited.add(child);
        queue.push([...path, child]);
      }
    }
  }
  return [start, target];
}

export function analyzeCycloneDx(input) {
  const document = asRecord(input);
  if (document.bomFormat !== "CycloneDX") throw new Error("Only CycloneDX SBOM documents are supported.");
  if (!Array.isArray(document.components) || document.components.length === 0) throw new Error("The SBOM must contain at least one component.");
  if (document.components.length > 500) throw new Error("The SBOM exceeds the 500-component import limit.");

  const metadata = asRecord(document.metadata);
  const rootComponent = asRecord(metadata.component);
  const rootRef = String(rootComponent["bom-ref"] || rootComponent.purl || `root:${rootComponent.name || "application"}`);
  const rawComponents = document.components.map((value) => asRecord(value));
  const refs = new Map(rawComponents.map((component, index) => [componentRef(component, index), component]));
  if (refs.size !== rawComponents.length) throw new Error("Every SBOM component must have a unique bom-ref or package URL.");

  const graph = new Map([[rootRef, []]]);
  for (const ref of refs.keys()) graph.set(ref, []);
  const edges = [];
  for (const entry of Array.isArray(document.dependencies) ? document.dependencies : []) {
    const dependency = asRecord(entry);
    const parent = String(dependency.ref || "");
    if (!graph.has(parent)) continue;
    for (const child of Array.isArray(dependency.dependsOn) ? dependency.dependsOn.map(String) : []) {
      if (!graph.has(child)) continue;
      graph.get(parent).push(child);
      edges.push({ parentRef: parent, childRef: child });
    }
  }

  if ((graph.get(rootRef) || []).length === 0) {
    for (const ref of refs.keys()) {
      graph.get(rootRef).push(ref);
      edges.push({ parentRef: rootRef, childRef: ref });
    }
  }

  const depths = new Map([[rootRef, 0]]);
  const queue = [rootRef];
  while (queue.length) {
    const parent = queue.shift();
    for (const child of graph.get(parent) || []) {
      if (!depths.has(child)) {
        depths.set(child, depths.get(parent) + 1);
        queue.push(child);
      }
    }
  }

  const directRefs = new Set(graph.get(rootRef));
  const components = [...refs].map(([ref, component]) => ({
    ref,
    name: String(component.name || ref),
    version: String(component.version || "unknown"),
    purl: String(component.purl || ref),
    ecosystem: ecosystemFromPurl(component.purl),
    license: firstLicense(component),
    direct: directRefs.has(ref),
    depth: depths.get(ref) ?? -1,
  }));
  const names = new Map([[rootRef, String(rootComponent.name || "application")], ...components.map((component) => [component.ref, component.name])]);

  const vulnerabilities = (Array.isArray(document.vulnerabilities) ? document.vulnerabilities : []).flatMap((value, index) => {
    const vulnerability = asRecord(value);
    const rating = asRecord(Array.isArray(vulnerability.ratings) ? vulnerability.ratings[0] : {});
    const severityValue = String(rating.severity || "medium").toLowerCase();
    const severity = SUPPORTED_SEVERITIES.has(severityValue) ? severityValue : "medium";
    const affectedRefs = (Array.isArray(vulnerability.affects) ? vulnerability.affects : []).map((affect) => String(asRecord(affect).ref || "")).filter((ref) => refs.has(ref));
    return affectedRefs.map((ref) => ({
      id: String(vulnerability.id || `SBOM-VULN-${index + 1}`),
      affectedRef: ref,
      packageName: names.get(ref),
      severity,
      cvss: Math.max(0, Math.min(10, Number(rating.score) || 0)),
      summary: String(vulnerability.description || vulnerability.detail || "Vulnerability reported by imported SBOM."),
      fixedVersion: String(asRecord(vulnerability.analysis).detail || "").match(/(?:upgrade|fixed(?: in)?|version)\s+(?:to\s+)?([\w.-]+)/i)?.[1] || null,
      direct: directRefs.has(ref),
      path: shortestPath(graph, rootRef, ref).map((node) => names.get(node) || node),
    }));
  });

  const cycles = findCycles(graph);
  const reachableDepths = components.map((component) => component.depth).filter((depth) => depth >= 0);
  const licensed = components.filter((component) => component.license !== "Unknown").length;
  return {
    format: `CycloneDX ${document.specVersion || "unknown"}`,
    serialNumber: String(document.serialNumber || "not-provided"),
    root: { ref: rootRef, name: String(rootComponent.name || "application") },
    components,
    edges,
    vulnerabilities,
    cycles,
    metrics: {
      componentCount: components.length,
      directCount: components.filter((component) => component.direct).length,
      transitiveCount: components.filter((component) => !component.direct && component.depth >= 0).length,
      isolatedCount: components.filter((component) => component.depth < 0).length,
      maxDepth: reachableDepths.length ? Math.max(...reachableDepths) : 0,
      cycleCount: cycles.length,
      licenseCoverage: Math.round((licensed / components.length) * 100),
    },
  };
}

const SEVERITY_WEIGHTS = Object.freeze({ critical: 10, high: 7, medium: 4, low: 1 });

export function calculateRiskScore(findings) {
  const raw = findings.reduce((total, finding) => {
    const severity = String(finding.severity || "low").toLowerCase();
    const weight = SEVERITY_WEIGHTS[severity] ?? SEVERITY_WEIGHTS.low;
    return total + weight * (finding.direct ? 1.35 : 1);
  }, 0);
  return Math.min(100, Math.round(raw * 2.15));
}

export function classifyRisk(score) {
  if (score >= 70) return "at_risk";
  if (score >= 35) return "review";
  return "passing";
}

export function summarizeSeverity(findings) {
  return findings.reduce((summary, finding) => {
    const key = String(finding.severity || "low").toLowerCase();
    if (Object.hasOwn(summary, key)) summary[key] += 1;
    return summary;
  }, { critical: 0, high: 0, medium: 0, low: 0 });
}

export function traceShortestDependencyPath(graph, start, target) {
  if (start === target) return [start];
  const queue = [[start]];
  const visited = new Set([start]);
  while (queue.length) {
    const path = queue.shift();
    const node = path[path.length - 1];
    for (const neighbor of graph[node] ?? []) {
      if (visited.has(neighbor)) continue;
      const nextPath = [...path, neighbor];
      if (neighbor === target) return nextPath;
      visited.add(neighbor);
      queue.push(nextPath);
    }
  }
  return null;
}

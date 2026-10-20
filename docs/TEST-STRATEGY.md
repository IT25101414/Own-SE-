# Test strategy

## Test pyramid

1. **Domain unit tests:** risk weighting, score caps, classification, severity aggregation, shortest-path traversal, SBOM normalization, depth calculation, and cycle detection.
2. **Contract and API checks:** strict payload validation, status codes, database constraints, state changes, and normalized OSV responses.
3. **User-flow checks:** navigation, repository creation, scanning, policy toggles, report export, and responsive layouts.

## Automated checks included

`npm test` runs 13 Node.js tests covering the risk engine, breadth-first dependency traversal, CycloneDX graph analysis, cycle safety, import limits, and every API command contract. `npm run lint` verifies source quality, and `npm run build` performs TypeScript and production compilation checks.

The release smoke test also starts the compiled Cloudflare Worker and verifies:

- `GET /api/health` returns `200` after querying D1.
- `GET /api/dashboard` returns the aggregate read model.
- Invalid scan input returns a structured `400 VALIDATION_ERROR`.
- A valid repository command returns `201` and persists the baseline scan and audit event.

## High-value manual scenarios

| Scenario | Expected result |
| --- | --- |
| Add a valid repository | Repository and initial scan appear immediately |
| Add the same repository twice | API returns a conflict without duplicate data |
| Import the included CycloneDX sample | Components and edges are normalized, findings include shortest paths, and an audit event is recorded |
| Import duplicate component references | API returns `INVALID_SBOM` without changing the current graph |
| Import a body larger than 512 KB | API returns `PAYLOAD_TOO_LARGE` before JSON analysis |
| Run a scan | New immutable scan is saved and timestamp is updated |
| Pause a policy | Coverage score changes and persists after reload |
| Check `lodash@4.17.20` | Live OSV advisories are displayed |
| Search by CVE or package | Findings reduce to matching rows |
| Export report | Browser downloads valid JSON |
| Simulate a slow OSV response | Request is stopped after eight seconds with a safe upstream error |

## Non-functional checks

- Keyboard-visible controls and native form labels
- Responsive states at desktop, tablet, and phone widths
- Reduced-motion preference support
- No secrets in source or browser requests
- Server-side allowlist for supported package ecosystems

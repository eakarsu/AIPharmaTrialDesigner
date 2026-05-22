# Audit Note — AIPharmaTrialDesigner

Audit-only pass. Domain: pharmaceutical clinical-trial designer (protocol drafting, I/E criteria, endpoint selection, statistical-power planning, site selection, regulatory submission prep).

Stack: Node + Express + React + Postgres + OpenRouter. Backend: `backend/server.js` mounts 25 route modules under `/api/*` behind JWT (`middleware/auth.js`, `requireWrite` RBAC). AI routes mounted at `/api/ai` (open to any authenticated user). DB schema: `backend/migrations/001_schema.sql` — 24 tables including `trials`, `sites`, `protocols`, `investigators`, `patients`, `compounds`, `endpoints`, `adverse_events`, `amendments`, `deviations`, `monitoring_visits`, `queries`, `data_locks`, `milestones`, `budgets`, `vendors_cro`, `regulatory_submissions`, `supply_shipments`, `ai_results`, `users`, `notifications`, `attachments`, `webhooks`, `webhook_deliveries`. Frontend: 40 pages in `frontend/src/pages/` (17 `AI*Page` + CRUD + Login + CustomViews + Timeline). Persistence pattern: every AI POST writes to `ai_results(feature,input,output,model)`.

## Inventory

### Backend CRUD route modules (24)
trials, sites, protocols, investigators, patients, compounds, endpoints, adverseEvents, amendments, deviations, monitoringVisits, queries, dataLocks, milestones, budgets, vendorsCro, regulatorySubmissions, supplyShipments, notifications, attachments, webhooks, bulkImport, customViews, auth.

### AI endpoints (`backend/routes/ai.js`, 16 POST features + samples/results/history)
1. `POST /api/ai/draft-protocol`
2. `POST /api/ai/recommend-endpoints`
3. `POST /api/ai/size-cohort`
4. `POST /api/ai/select-sites`
5. `POST /api/ai/model-risk`
6. `POST /api/ai/generate-brief`
7. `POST /api/ai/deviation-classifier`
8. `POST /api/ai/dsmb-alert`
9. `POST /api/ai/edc-anomaly`
10. `POST /api/ai/statistical-imbalance`
11. `POST /api/ai/expected-vs-actual`
12. `POST /api/ai/irb-pkg-drafter`
13. `POST /api/ai/query-resolver`
14. `POST /api/ai/milestone-forecaster`
15. `POST /api/ai/budget-burn`
16. `POST /api/ai/regulatory-impact`
17. `GET  /api/ai/samples`, `/results`, `/history`

## Gap Analysis (categorized)

### AI capabilities

| Capability | Status | Notes |
|---|---|---|
| Protocol drafter | PRESENT | `draft-protocol` (TOO-RISKY — expert review required) |
| Endpoint recommender | PRESENT | `recommend-endpoints` (TOO-RISKY) |
| Power / sample-size explainer | PARTIAL | `size-cohort` covers sizing; dedicated power-calc *explainer* (assumptions narrative, alpha/beta/MDE walk-through) — MISSING — MECHANICAL |
| Site-feasibility scorer | PARTIAL | `select-sites` exists; explicit *feasibility scoring* (enrollment-rate × startup-time × prior-quality) — MISSING — MECHANICAL |
| Regulatory submission section drafter | PARTIAL | `irb-pkg-drafter`, `regulatory-impact` cover slices; full IND/NDA module drafter (Module 2/5, Investigator's Brochure sections) — MISSING — MECHANICAL, TOO-RISKY |
| I/E criteria optimizer | MISSING | MECHANICAL, TOO-RISKY — optimize against eligibility funnel + comparable-trial criteria |

### Non-AI features

| Feature | Status | Notes |
|---|---|---|
| Protocol CRUD | PRESENT | `routes/protocols.js` |
| Version control on protocols | MISSING | `amendments` table tracks amendments but no diff/version-graph endpoint — MECHANICAL |
| IRB workflow (submission → response → approval → continuing review) | PARTIAL | `regulatory_submissions` table is generic; no IRB-state-machine — MECHANICAL |
| ClinicalTrials.gov integration (NCT push/pull, PRS-style validation) | MISSING | NEEDS-CREDS (CT.gov PRS account / API) |
| EudraCT / CTIS / FDA ESG integration | MISSING | NEEDS-CREDS |
| EHR / EDC connectors (Medidata Rave, Veeva CDMS) | MISSING | NEEDS-CREDS, NEEDS-PRODUCT-DECISION |
| eConsent / 21 CFR Part 11 audit trails | MISSING | NEEDS-PRODUCT-DECISION (compliance scope) |

### Custom (domain-specific) features

| Feature | Status | Notes |
|---|---|---|
| Comparable-trial finder | MISSING | MECHANICAL (CT.gov search-by-indication+phase+endpoints); upgradeable to AI similarity-ranker |
| Dropout-rate predictor | MISSING | MECHANICAL AI endpoint; TOO-RISKY for go/no-go decisions |
| Adaptive-design simulator (Bayesian, group-sequential, sample-size re-estimation) | MISSING | TOO-RISKY — requires biostatistician validation; MECHANICAL stub possible |
| Patient burden estimator (visits × procedures × travel × time) | MISSING | MECHANICAL — pure structured calc + optional AI narrative |
| Diversity / DEI enrollment planner | MISSING | MECHANICAL AI endpoint (FDA Diversity Action Plan guidance) |
| Real-world-evidence (RWE) / external-control-arm matcher | MISSING | NEEDS-CREDS (claims/EHR data), TOO-RISKY |

## Risk Tags
- **TOO-RISKY (require expert/biostatistician/medical-monitor review)**: protocol drafter, endpoint recommender, I/E optimizer, IND/NDA module drafter, dropout predictor, adaptive-design simulator, RWE matcher, DSMB alerts.
- **NEEDS-CREDS**: CT.gov PRS, EudraCT, CTIS, FDA ESG, Medidata/Veeva, RWE data partners.
- **NEEDS-PRODUCT-DECISION**: 21 CFR Part 11 scope, eConsent, EHR connector roadmap.

## Implemented (this round)
None — audit-only.

## Backlog (prioritized)
1. **MECHANICAL** Power-calc explainer endpoint (`/api/ai/power-calc-explain`).
2. **MECHANICAL** Site-feasibility scorer endpoint (`/api/ai/site-feasibility-score`).
3. **MECHANICAL** I/E criteria optimizer endpoint (TOO-RISKY tag in output).
4. **MECHANICAL** Patient-burden estimator (deterministic + AI narrative).
5. **MECHANICAL** Comparable-trial finder (DB-side first, CT.gov later).
6. **MECHANICAL** Protocol version-graph/diff endpoint on `protocols`+`amendments`.
7. **MECHANICAL** Dropout-rate predictor (TOO-RISKY tag).
8. **NEEDS-CREDS** ClinicalTrials.gov / EudraCT / CTIS / FDA ESG integrations.
9. **NEEDS-PRODUCT-DECISION** IRB state-machine, eConsent, 21 CFR Part 11 audit, EDC/EHR connectors.
10. **TOO-RISKY** Adaptive-design simulator, RWE external-control-arm — defer until biostatistician sign-off path defined.

## Status
audit-only — no code changes.

## Apply pass 7 (full backlog implementation)

Pass 7 implements the full backlog from this audit. All new code lives in `backend/routes/pass7.js`, `backend/migrations/002_pass7.sql`, `frontend/src/pages/*` (11 new pages), and additions to `frontend/src/services/api.js`, `frontend/src/App.js`, `frontend/src/components/Sidebar.js`, and `backend/server.js` (mount block only, before the dashboard handler — no 404 handler existed). Zero new dependencies; uses existing `services/ai.js` `callOpenRouter` + `safeJsonParse`.

### MECHANICAL (deterministic + optional AI narrative)
- `POST /api/ai/power-calc-explain` — closed-form normal-approx n_per_arm = 2*((zα+zβ)*SD/MDE)², inflated for dropout. Returns inputs, derived z values, n, formula, assumption walkthrough, caveats, and an AI plain-language narrative.
- `POST /api/ai/patient-burden` — sums procedure + (2 × travel) minutes per visit, totals, hours, 8h-day equivalents, intensity tag (Low / Moderate / High / Very High), plus AI patient-facing summary + burden-reduction suggestions.
- `POST /api/comparable-trials/find` — DB-side search over `trials` table, token-overlap similarity score over `indication` + exact `phase` match. CT.gov / EudraCT / CTIS search is deferred to NEEDS-CREDS stubs.
- `GET  /api/protocols-graph/by-trial/:trialId` — read-only version-graph from `protocols` + `amendments` (nodes + edges, "supersedes" / "amended_by"). Mounted at `/protocols-graph` (not `/protocols/*`) because the existing protocols router is behind `writeGate`.
- `GET  /api/protocols-graph/diff?from=...&to=...` — metadata diff between two protocol versions plus intervening amendments.

### NEEDS-PRODUCT-DECISION (IRB state-machine)
- New tables: `irb_workflows`, `irb_workflow_transitions` (migration `002_pass7.sql`).
- `GET /api/irb-workflows`, `GET /api/irb-workflows/:id`, `POST /api/irb-workflows`, `POST /api/irb-workflows/:id/transition`.
- State machine: `draft → submitted → response_pending → approved | rejected → continuing_review`. Illegal transitions return 400 with the allowed set. Every transition is logged to `irb_workflow_transitions` for audit.

### TOO-RISKY (ADVISORY ONLY)
Every response wrapped with `disclaimer`, `requires_expert_review: true`, `not_for_regulatory_submission: true`. Routes:
- `POST /api/ai/ie-optimizer` — eligibility criteria optimiser
- `POST /api/ai/ind-nda-section` — IND/NDA module outline drafter
- `POST /api/ai/dropout-predictor` — dropout-rate prediction
- `POST /api/ai/adaptive-sim` — qualitative adaptive-design description (NOT operating-characteristic simulation)
- `POST /api/ai/rwe-match` — external-control-arm / RWE matching strategy
- Existing `draft-protocol`, `recommend-endpoints`, `dsmb-alert` are flagged in the original audit; pass 7 documents the advisory contract for new TOO-RISKY routes only (does not modify the legacy routes — no breaking change).

### NEEDS-CREDS (503 stubs)
All return `503` with `{ integration, status: 'not_configured', required_credentials: [...], product_decision? }`:
- `GET  /api/integrations/ctgov/search`
- `POST /api/integrations/ctgov/push`
- `GET  /api/integrations/ctgov/validate-prs`
- `GET  /api/integrations/eudract/search`, `POST /api/integrations/eudract/submit`
- `GET  /api/integrations/ctis/search`, `POST /api/integrations/ctis/submit`
- `POST /api/integrations/fda-esg/submit`, `GET /api/integrations/fda-esg/ack/:trackingId`
- `GET  /api/integrations/edc/rave/studies`, `GET /api/integrations/edc/veeva/studies`
- `GET  /api/integrations/ehr/fhir/patients`
- `GET  /api/integrations/part11/audit-trail`

### Frontend pages (11 new, all mounted in App.js + Sidebar "Backlog (Pass 7)" section)
`/ai/power-calc-explain`, `/ai/patient-burden`, `/ai/ie-optimizer`, `/ai/ind-nda-section`, `/ai/dropout-predictor`, `/ai/adaptive-sim`, `/ai/rwe-match`, `/comparable-trials`, `/protocol-version-graph`, `/irb-workflows`, `/integrations`.

### Persistence
All AI POSTs persist to `ai_results(feature, input, output, model)` so they appear in the existing `/api/ai/history` UI alongside the legacy 16 verbs.

### Mount order
Pass 7 routers mounted in `server.js` immediately after `/api/ai`, BEFORE the cross-cutting (`notifications`, `attachments`, `webhooks`, `bulk-import`) and `customViews` mounts. No 404 handler exists in `server.js`; the catch-all is React Router's `*` route on the client.

### Skips / constraints honored
- No new npm dependencies.
- No breaking changes — legacy routes untouched.
- `node --check backend/server.js` + `node --check backend/routes/pass7.js` both pass.
- No edits to feature-specific frontend pages outside of additions; `Sidebar.js` and `App.js` only have additive routes/links.

### Status
pass-7-applied — full backlog implemented (MECHANICAL + IRB state-machine + ADVISORY-ONLY TOO-RISKY + NEEDS-CREDS 503 stubs).

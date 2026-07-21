# Pharma Trial Designer operations

## Safe local lifecycle

1. Copy `.env.example` to `.env` and set a unique JWT secret of at least 32 characters plus the database URL.
2. Install backend and frontend dependencies explicitly during provisioning.
3. Apply reviewed migrations explicitly with `./scripts/migrate.sh`.
4. Start with `./start.sh`. The launcher refuses occupied ports and missing dependencies; it never installs packages, creates databases, seeds data, applies migrations, or terminates unrelated processes.

Startup performs connection/schema checks only and fails closed when required configuration or durable schema is missing.

## Narrow workflow

`POST /api/trial-design-workflows/designs` persists protocol/SAP versions and bounded statistical assumptions; transitions record evidence, biostatistics, medical, IRB, conduct, data lock, closure, and correction states.

Only authenticated write roles can create or advance designs. Approval requires independent biostatistical and IRB evidence; data lock requires an immutable receipt. Every write is tenant-scoped, idempotency/correlation keyed, version checked, and appended to a database audit table protected against update/delete.

## External boundaries

Generated `/api/cf-*` and `/api/gap-*` routes are quarantined where present. Sponsor systems, EHR/FHIR/lab/imaging/pharmacy feeds, formal statistical and clinical validation, IRB/sponsor authority, regulated validation evidence, and production credentials remain deployment gates. Provider failures must remain explicit and must not be replaced with fabricated success receipts.

## Validation

Run `node --test backend/test/trialPolicy.test.cjs`, syntax-check changed JavaScript with `node --check`, and run `bash -n start.sh scripts/migrate.sh`. CI performs these dependency-free checks and verifies that migrations are transactional and contain no table-drop, truncate, or row-delete statements.


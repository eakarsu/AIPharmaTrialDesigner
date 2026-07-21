BEGIN;

CREATE TABLE IF NOT EXISTS trial_design_cases (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  trial_ref TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'draft' CHECK (stage IN ('draft','evidence_ready','biostat_review','medical_review','irb_submitted','approved','conduct','locked','closed','corrected')),
  protocol_version TEXT NOT NULL,
  analysis_plan_version TEXT NOT NULL,
  indication TEXT NOT NULL,
  phase TEXT NOT NULL,
  endpoint_definition TEXT NOT NULL,
  statistical_assumptions JSONB NOT NULL,
  created_by TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  irb_reference TEXT,
  data_lock_receipt TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, trial_ref, protocol_version),
  UNIQUE (tenant_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS trial_design_evidence (
  id BIGSERIAL PRIMARY KEY,
  design_id BIGINT NOT NULL REFERENCES trial_design_cases(id),
  source_system TEXT NOT NULL,
  record_ref TEXT NOT NULL,
  source_version TEXT NOT NULL,
  consent_reference TEXT NOT NULL,
  checksum TEXT NOT NULL,
  effective_at TIMESTAMPTZ NOT NULL,
  evidence JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (design_id, source_system, record_ref, source_version)
);

CREATE TABLE IF NOT EXISTS trial_integration_deliveries (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  standard TEXT NOT NULL,
  operation TEXT NOT NULL,
  consent_reference TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_digest TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','accepted','failed','reconciled')),
  provider_receipt TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, provider, idempotency_key)
);

CREATE TABLE IF NOT EXISTS trial_validation_runs (
  id BIGSERIAL PRIMARY KEY,
  design_id BIGINT REFERENCES trial_design_cases(id),
  corpus_version TEXT NOT NULL,
  model_version TEXT NOT NULL,
  scenario TEXT NOT NULL,
  calibration NUMERIC(7,6) NOT NULL,
  bias_gap NUMERIC(7,6) NOT NULL,
  escalation_recall NUMERIC(7,6),
  missing_data_case BOOLEAN NOT NULL DEFAULT FALSE,
  contraindications JSONB NOT NULL DEFAULT '[]'::jsonb,
  blocked BOOLEAN NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trial_design_audit (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  design_id BIGINT NOT NULL REFERENCES trial_design_cases(id),
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  from_stage TEXT,
  to_stage TEXT,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, correlation_id)
);

CREATE INDEX IF NOT EXISTS idx_trial_design_stage ON trial_design_cases (tenant_id, stage, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_trial_evidence_design ON trial_design_evidence (design_id, effective_at DESC);
CREATE INDEX IF NOT EXISTS idx_trial_integrations_retry ON trial_integration_deliveries (status, next_attempt_at);

CREATE OR REPLACE FUNCTION reject_trial_design_audit_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'trial_design_audit is append-only';
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trial_design_audit_append_only') THEN
    CREATE TRIGGER trial_design_audit_append_only
      BEFORE UPDATE OR DELETE ON trial_design_audit
      FOR EACH ROW EXECUTE FUNCTION reject_trial_design_audit_mutation();
  END IF;
END;
$$;

COMMIT;

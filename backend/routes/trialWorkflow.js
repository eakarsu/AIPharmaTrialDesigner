const express = require('express');
const pool = require('../config/database');
const { validateDesign, validateTransition } = require('../domain/trialPolicy');

const router = express.Router();
const tenantFor = (user) => String(user.tenant_id || user.tenantId || user.id);
const actorFor = (user) => String(user.id);

router.post('/designs', async (req, res) => {
  const client = await pool.connect();
  try {
    const assumptions = validateDesign(req.body || {});
    const { trial_ref, protocol_version, analysis_plan_version, indication, phase, endpoint_definition, idempotency_key, correlation_id } = req.body || {};
    if (!idempotency_key || !correlation_id) throw new Error('idempotency_key and correlation_id are required');
    const tenantId = tenantFor(req.user);
    const actorId = actorFor(req.user);
    await client.query('BEGIN');
    let result = await client.query(
      `INSERT INTO trial_design_cases
       (tenant_id, trial_ref, protocol_version, analysis_plan_version, indication, phase, endpoint_definition, statistical_assumptions, created_by, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (tenant_id, idempotency_key) DO NOTHING RETURNING *`,
      [tenantId, trial_ref, protocol_version, analysis_plan_version, indication, phase, endpoint_definition, JSON.stringify(assumptions), actorId, idempotency_key]
    );
    const inserted = result.rows.length === 1;
    if (!inserted) result = await client.query('SELECT * FROM trial_design_cases WHERE tenant_id=$1 AND idempotency_key=$2', [tenantId, idempotency_key]);
    const design = result.rows[0];
    await client.query(
      `INSERT INTO trial_design_audit (tenant_id, design_id, actor_id, action, to_stage, evidence, correlation_id)
       VALUES ($1,$2,$3,'created','draft',$4,$5) ON CONFLICT (tenant_id, correlation_id) DO NOTHING`,
      [tenantId, design.id, actorId, JSON.stringify({ protocol_version, analysis_plan_version, statistical_assumptions: assumptions }), correlation_id]
    );
    await client.query('COMMIT');
    res.status(inserted ? 201 : 200).json(design);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(error.code === '23505' ? 409 : 400).json({ error: error.message });
  } finally {
    client.release();
  }
});

router.post('/designs/:trialRef/transition', async (req, res) => {
  const client = await pool.connect();
  try {
    const tenantId = tenantFor(req.user);
    const actorId = actorFor(req.user);
    const { protocol_version, to_stage, expected_version, correlation_id, evidence = {} } = req.body || {};
    if (!protocol_version || !to_stage || !Number.isInteger(expected_version) || !correlation_id) throw new Error('protocol_version, to_stage, integer expected_version, and correlation_id are required');
    await client.query('BEGIN');
    const priorAudit = await client.query('SELECT design_id FROM trial_design_audit WHERE tenant_id=$1 AND correlation_id=$2', [tenantId, correlation_id]);
    if (priorAudit.rows.length) {
      const existing = await client.query('SELECT * FROM trial_design_cases WHERE id=$1', [priorAudit.rows[0].design_id]);
      await client.query('COMMIT');
      return res.json(existing.rows[0]);
    }
    const current = await client.query('SELECT * FROM trial_design_cases WHERE tenant_id=$1 AND trial_ref=$2 AND protocol_version=$3 FOR UPDATE', [tenantId, req.params.trialRef, protocol_version]);
    if (!current.rows.length) throw Object.assign(new Error('trial design not found'), { status: 404 });
    const design = current.rows[0];
    if (design.version !== expected_version) throw Object.assign(new Error('stale workflow version'), { status: 409 });
    validateTransition(design.stage, to_stage, { ...evidence, role: req.user.role, actorId, createdBy: design.created_by });
    const updated = await client.query('UPDATE trial_design_cases SET stage=$1, irb_reference=COALESCE($2,irb_reference), data_lock_receipt=COALESCE($3,data_lock_receipt), version=version+1, updated_at=NOW() WHERE id=$4 RETURNING *', [to_stage, evidence.irbReference || null, evidence.dataLockReceipt || null, design.id]);
    await client.query(
      `INSERT INTO trial_design_audit (tenant_id, design_id, actor_id, action, from_stage, to_stage, evidence, correlation_id)
       VALUES ($1,$2,$3,'transition',$4,$5,$6,$7)`,
      [tenantId, design.id, actorId, design.stage, to_stage, JSON.stringify(evidence), correlation_id]
    );
    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(error.status || 400).json({ error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;

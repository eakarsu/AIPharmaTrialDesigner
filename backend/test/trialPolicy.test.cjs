const test = require('node:test');
const assert = require('node:assert/strict');
const { validateDesign, clinicalGate, validateTransition } = require('../domain/trialPolicy');

const design = { trial_ref: 'trial-1', protocol_version: 'p3', analysis_plan_version: 'sap-2', indication: 'example', phase: 'II', endpoint_definition: 'validated endpoint', alpha: 0.05, power: 0.9, minimum_detectable_effect: 0.2 };

test('accepts bounded versioned statistical assumptions', () => {
  assert.deepEqual(validateDesign(design), { alpha: 0.05, power: 0.9, minimum_detectable_effect: 0.2, requires_expert_review: true });
});

test('rejects invalid power and alpha assumptions', () => {
  assert.throws(() => validateDesign({ ...design, alpha: 1 }), /invalid statistical assumptions/);
  assert.throws(() => validateDesign({ ...design, power: 0.5 }), /invalid statistical assumptions/);
});

test('clinical validation gate remains non-diagnostic and non-regulatory', () => {
  const result = clinicalGate({ contraindications: [], missing_fields: [], bias_gap: 0.03, calibration: 0.95 });
  assert.deepEqual(result, { blocked: false, non_diagnostic: true, not_for_regulatory_submission: true });
});

test('blocks bias, calibration, missing-data, and contraindication failures', () => {
  assert.equal(clinicalGate({ contraindications: ['x'], missing_fields: [], bias_gap: 0, calibration: 1 }).blocked, true);
  assert.equal(clinicalGate({ contraindications: [], missing_fields: ['age'], bias_gap: 0, calibration: 1 }).blocked, true);
  assert.equal(clinicalGate({ contraindications: [], missing_fields: [], bias_gap: 0.11, calibration: 1 }).blocked, true);
});

test('approval requires independent biostatistical review and IRB evidence', () => {
  assert.throws(() => validateTransition('irb_submitted', 'approved', { role: 'principal_investigator', actorId: 'p1', createdBy: 'p1', irbReference: 'irb-1', biostatApproval: true }), /independent/);
  assert.equal(validateTransition('irb_submitted', 'approved', { role: 'principal_investigator', actorId: 'p2', createdBy: 'p1', irbReference: 'irb-1', biostatApproval: true }), true);
});

test('data lock fails closed without immutable receipt', () => {
  assert.throws(() => validateTransition('conduct', 'locked', { role: 'biostatistician' }), /data lock receipt/);
});

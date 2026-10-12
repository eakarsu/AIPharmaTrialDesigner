import React from 'react';
import AIFieldPresets from './AIFieldPresets';

// Planning/query inputs only. No real study IDs, clinical observations, consents,
// credentials, signed forms or reviewer decisions are supplied by these examples.
export const clinicalPlanningExamples = {
  'comparable-trials': [
    { label: 'Demo AI · Oncology search', values: { indication: 'Non-Small Cell Lung Cancer', phase: 'III', limit: 10 } },
    { label: 'Demo AI · Depression search', values: { indication: 'Treatment-Resistant Major Depressive Disorder', phase: 'II', limit: 8 } },
    { label: 'Demo AI · Heart-failure search', values: { indication: 'Heart Failure with Reduced Ejection Fraction', phase: 'III', limit: 12 } },
  ],
  'ctgov-search': [
    { label: 'Demo AI · Recruiting oncology', values: { condition: 'non small cell lung cancer', term: 'pembrolizumab', status: 'RECRUITING' } },
    { label: 'Demo AI · Active depression study', values: { condition: 'treatment resistant depression', term: 'esketamine', status: 'ACTIVE_NOT_RECRUITING' } },
    { label: 'Demo AI · Completed heart-failure study', values: { condition: 'heart failure', term: 'dapagliflozin', status: 'COMPLETED' } },
  ],
  'design-power': [
    { label: 'Demo AI · Continuous planning', values: { endpoint_type: 'continuous', delta: 5, sd: 10, p1: 0.6, p2: 0.4, alpha: 0.05, power: 0.9, dropout_rate: 0.1 } },
    { label: 'Demo AI · Binary planning', values: { endpoint_type: 'binary', delta: 5, sd: 10, p1: 0.6, p2: 0.4, alpha: 0.05, power: 0.8, dropout_rate: 0.15 } },
    { label: 'Demo AI · No-dropout planning', values: { endpoint_type: 'continuous', delta: 2, sd: 10, p1: 0.55, p2: 0.45, alpha: 0.05, power: 0.95, dropout_rate: 0 } },
  ],
  'design-simulate': [
    { label: 'Demo AI · Null-effect check', values: { n_per_arm: 85, delta: 0, looks: 3, alpha: 0.05, sims: 8000, seed: 'illustrative-null' } },
    { label: 'Demo AI · Effect planning', values: { n_per_arm: 85, delta: 0.5, looks: 3, alpha: 0.05, sims: 8000, seed: 'illustrative-effect' } },
    { label: 'Demo AI · Five-look planning', values: { n_per_arm: 120, delta: 0.4, looks: 5, alpha: 0.05, sims: 10000, seed: 'illustrative-five-looks' } },
  ],
};
export default function ClinicalPlanningPresets({ feature, onFill, disabled }) {
  const samples = clinicalPlanningExamples[feature] || [];
  const fields = Object.keys(samples[0]?.values || {}).map((key) => ({ key, type: typeof samples[0].values[key] === 'number' ? 'number' : 'text' }));
  return <AIFieldPresets fields={fields} samples={samples} onFill={(sample) => onFill({ ...sample.values })} disabled={disabled} context={feature} />;
}

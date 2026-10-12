import React, { useEffect, useState } from 'react';
import { getTrials, getInvestigators, getPatients } from '../services/api';

const loaders = { trials: getTrials, investigators: getInvestigators, patients: getPatients };
const keys = { trials: 'trial_id', investigators: 'investigator_id', patients: 'patient_id' };
export function pickClinicalReference(current, records, key, index = 0) {
  const selected = records.find((row) => String(row[key]) === String(current));
  return selected?.[key] ?? records[index % (records.length || 1)]?.[key] ?? '';
}
export function useClinicalReferences(names) {
  const catalogue = names.join(',');
  const [state, setState] = useState({ records: {}, loading: true, error: '' });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: '' }));
    Promise.all(catalogue.split(',').filter(Boolean).map(async (name) => {
      const rows = await loaders[name]();
      if (!Array.isArray(rows) || rows.some((row) => row[keys[name]] === undefined || row[keys[name]] === null || String(row[keys[name]]).trim() === '')) throw new Error(`Invalid ${name} source response. Retry the native list.`);
      return [name, rows];
    })).then((entries) => { if (active) setState({ records: Object.fromEntries(entries), loading: false, error: '' }); })
      .catch((failure) => { if (active) setState({ records: {}, loading: false, error: failure.message || 'Clinical references could not be loaded.' }); });
    return () => { active = false; };
  }, [catalogue, revision]);
  return { ...state, retry: () => setRevision((value) => value + 1) };
}
export function ClinicalReferenceStatus({ source, required = [] }) {
  if (source.loading) return <p role="status">Loading actual accessible clinical records…</p>;
  if (source.error) return <div role="alert">{source.error} <button type="button" className="btn btn-secondary" onClick={source.retry}>Retry source records</button></div>;
  const missing = required.filter((name) => !source.records[name]?.length);
  return missing.length ? <p role="status">Actual {missing.join(' and ')} records are unavailable. Examples cannot invent clinical source references; load or create an authorized record first.</p> : <p>Examples use actual accessible record references and preserve your selected source. No clinical facts, approval, consent, signature or account credentials are created.</p>;
}
export const clinicalSourceChoices = [{ label: 'Demo AI · Source review' }, { label: 'Demo AI · Alternate source review' }, { label: 'Demo AI · Detailed source review' }];
export const randomizationDraftExamples = [
  { label: 'Demo AI · Two-arm planning', values: { scheme_id: 'DRAFT-DEMO-TWO-ARM', block_size: 4, seed: 'planning-101', arms: '[{"name":"Illustrative A","ratio":1},{"name":"Illustrative B","ratio":1}]', strata: '[]', category_schema: '[{"category":"treatment_arm","source":"arms","allowed_values":["Illustrative A","Illustrative B"],"use_in_randomization":true,"use_in_irt":true,"validation_rule":"Use a declared draft arm","notes":"Illustrative planning only; no assignment or dispensing"}]' } },
  { label: 'Demo AI · Stratified planning', values: { scheme_id: 'DRAFT-DEMO-STRATIFIED', block_size: 6, seed: 'planning-202', arms: '[{"name":"Illustrative A","ratio":2},{"name":"Illustrative B","ratio":1}]', strata: '["Illustrative low-risk","Illustrative high-risk"]', category_schema: '[{"category":"planning_stratum","source":"strata","allowed_values":["Illustrative low-risk","Illustrative high-risk"],"use_in_randomization":true,"use_in_irt":false,"validation_rule":"Use a declared illustrative stratum","notes":"Not a measured participant characteristic"}]' } },
  { label: 'Demo AI · Unstratified boundary', values: { scheme_id: 'DRAFT-DEMO-BOUNDARY', block_size: 2, seed: '0', arms: '[{"name":"Illustrative A","ratio":1},{"name":"Illustrative B","ratio":1}]', strata: '[]', category_schema: '[]' } },
];

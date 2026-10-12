import { protectPresetRequest, demonstrationData } from './SampleIntegrity';
import AIFieldPresets, { completeExample } from './AIFieldPresets';
import useCancelableAI from './useCancelableAI';
import React, { useEffect, useState } from 'react';
import AIResult from './AIResultView';
import AIHistory from './AIHistory';
import { aiSamples, featureAiAnalyze } from '../services/api';

/**
 * Reusable AI page scaffold.
 * props:
 *   title, subtitle
 *   feature: ai_results.feature key (for history)
 *   defaults: object — initial form values
 *   fields:   [{ key, label, type ('text'|'number'|'textarea'|'select'|'date'|'json'), options?, full? }]
 *   call:     async (form) => result
 *   submitLabel?: string
 */
export default function AIPage({ title, subtitle, feature, defaults, fields, call, submitLabel = 'Run' }) {
  const [form, setForm] = useState(() => demonstrationData(defaults || {}));
  const aiRequest = useCancelableAI();
  const { result, setResult: setResult, loading, error, setError: setError } = aiRequest;
  const reviewRequest = useCancelableAI();
  const { result: aiReview, loading: aiLoading, setResult: setAiReview } = reviewRequest;



  const [historyOpen, setHistoryOpen] = useState(false);
  const [samples, setSamples] = useState([]);

  useEffect(() => {
    if (!feature) return;
    aiSamples(feature)
      .then(r => setSamples(Array.isArray(r?.samples) ? r.samples : []))
      .catch(() => setSamples([]));
  }, [feature]);

  const onChange = (key, value) => setForm(p => ({ ...p, [key]: value }));

  // Apply a sample-scenario into the form. JSON-typed fields get stringified
  // so the textarea shows them; the submit handler will parse them back.
  const applySample = (sample, index = 0) => { setForm(protectPresetRequest(completeExample(fields.map(field => ({ ...field, defaultValue: demonstrationData(defaults?.[field.key] ?? (/budgets|ae_data|visits|curve|records|subjects|sites|rows|events/i.test(field.key) ? [] : {})) })), sample || {}, index, title, form), form)); setResult(null); setAiReview(null); setError(null); };

  const buildPayload = () => {
    const payload = { ...form };
    for (const f of fields) {
      if (f.type === 'json' && typeof payload[f.key] === 'string') {
        try { payload[f.key] = JSON.parse(payload[f.key]); } catch (_) { /* keep as string */ }
      }
    }
    return payload;
  };

  const onSubmit = async () => { setAiReview(null); return aiRequest.run((options) => call(buildPayload(), options)); };

  const onAiReview = async () => reviewRequest.run(async (options) => { const payload = buildPayload(); const baseResult = result || await call(payload, options); if (options.signal.aborted) return undefined; if (!result) setResult(baseResult); return featureAiAnalyze({ feature, intent: `Review the ${title} feature output and compare it with the deterministic/memory-backed result.`, input: payload, mechanical_result: baseResult }, options); });

  const renderField = (f) => {
    const v = form[f.key] ?? '';
    if (f.type === 'select')   return <select value={v} onChange={(e) => onChange(f.key, e.target.value)}>{f.options.map(o => <option key={o}>{o}</option>)}</select>;
    if (f.type === 'textarea') return <textarea rows={3} value={v} onChange={(e) => onChange(f.key, e.target.value)} />;
    if (f.type === 'json')     return <textarea rows={6} value={typeof v === 'string' ? v : JSON.stringify(v, null, 2)} onChange={(e) => onChange(f.key, e.target.value)} />;
    if (f.type === 'number')   return <input type="number" value={v} onChange={(e) => onChange(f.key, e.target.value)} step="any" />;
    if (f.type === 'date')     return <input type="date" value={v ? String(v).slice(0,10) : ''} onChange={(e) => onChange(f.key, e.target.value)} />;
    return <input value={v} onChange={(e) => onChange(f.key, e.target.value)} />;
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        <button className="btn btn-secondary" onClick={() => setHistoryOpen(true)}>History</button>
      </div>
      <div className="card">
        <AIFieldPresets fields={fields} samples={samples} context={title} disabled={loading || aiLoading} onFill={applySample} />
        <p role="note">Examples are fictional drafting inputs. They do not supply a trial record, consent, approval or verified clinical observations. Select or enter actual authorized references separately; example buttons preserve references and source arrays you have entered. Empty array overrides are illustrative and suppress automatic source loading; leave an override blank to use the native authorized trial source.</p>
        <div className="form-grid">
          {fields.map(f => (
            <div key={f.key} className={`form-group ${f.full ? 'full' : ''}`}>
              <label>{f.label}</label>
              {renderField(f)}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end', gap: 8 }}>
          <button className="btn btn-ai" onClick={onSubmit} disabled={loading || aiLoading}>{submitLabel}</button>
          <button className="btn btn-secondary" onClick={onAiReview} disabled={loading || aiLoading}>
            {aiLoading ? 'Running AI...' : 'Generate with OpenRouter'}
          </button>
          {(loading || aiLoading) && <button type="button" className="btn btn-secondary" onClick={() => { aiRequest.cancel(); reviewRequest.cancel(); }}>Cancel</button>}
        </div>
      </div>
      <AIResult result={result} loading={loading} error={error} />
      <AIResult result={aiReview} loading={aiLoading} error={reviewRequest.error} />
      <AIHistory feature={feature} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}

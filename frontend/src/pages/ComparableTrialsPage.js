import React, { useState } from 'react';
import { findComparableTrials } from '../services/api';

function ComparableTrialsPage() {
  const [form, setForm] = useState({ indication: 'Non-Small Cell Lung Cancer', phase: 'III', limit: 10 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async () => {
    setLoading(true); setError(null); setResult(null);
    try { setResult(await findComparableTrials({ ...form, limit: Number(form.limit) || 10 })); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Comparable-Trial Finder</h2>
          <p>MECHANICAL — searches the internal trials table by indication + phase, ranks by token-overlap similarity. ClinicalTrials.gov / EudraCT / CTIS search requires NEEDS-CREDS integration.</p>
        </div>
      </div>
      <div className="card">
        <div className="form-grid">
          <div className="form-group full"><label>Indication</label><input name="indication" value={form.indication} onChange={onChange} /></div>
          <div className="form-group"><label>Phase</label><input name="phase" value={form.phase} onChange={onChange} /></div>
          <div className="form-group"><label>Limit</label><input type="number" name="limit" value={form.limit} onChange={onChange} /></div>
        </div>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-ai" onClick={onSubmit} disabled={loading}>Find Comparable Trials</button>
        </div>
      </div>
      {error && <div className="card" style={{ color: '#b91c1c' }}>Error: {error}</div>}
      {loading && <div className="card">Searching...</div>}
      {result && (
        <div className="card">
          <p><strong>Source:</strong> {result.source} &nbsp; <strong>Matches:</strong> {result.result_count}</p>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th align="left">Trial ID</th>
                <th align="left">Name</th>
                <th align="left">Indication</th>
                <th align="left">Phase</th>
                <th align="left">Sponsor</th>
                <th align="left">Status</th>
                <th align="right">Similarity</th>
              </tr>
            </thead>
            <tbody>
              {result.results.map((t, i) => (
                <tr key={i}>
                  <td>{t.trial_id}</td>
                  <td>{t.name}</td>
                  <td>{t.indication}</td>
                  <td>{t.phase}</td>
                  <td>{t.sponsor}</td>
                  <td>{t.status}</td>
                  <td align="right">{t.similarity_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.notes?.map((n, i) => <p key={i} style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>{n}</p>)}
        </div>
      )}
    </div>
  );
}
export default ComparableTrialsPage;

import React, { useState } from 'react';
import DetailModal from '../components/DetailModal';
import AIResult from '../components/AIResult';
import AIFieldPresets from '../components/AIFieldPresets';
import { useClinicalReferences, pickClinicalReference, ClinicalReferenceStatus, clinicalSourceChoices } from '../components/ClinicalSourcePresets';
import { getProtocolGraphByTrial, protocolGraphAi } from '../services/api';

function ProtocolVersionGraphPage() {
  const [trialId, setTrialId] = useState('');
  const [graph, setGraph] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const source = useClinicalReferences(['trials']);
  const trials = source.records.trials || [];
  const fillSource = (_, index) => setTrialId(pickClinicalReference(trialId, trials, 'trial_id', index));

  const onLoad = async () => {
    setLoading(true); setError(null); setGraph(null); setAiResult(null);
    try { setGraph(await getProtocolGraphByTrial(trialId)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const onAi = async () => {
    setAiLoading(true); setError(null); setAiResult(null);
    try { setAiResult(await protocolGraphAi({ trial: trialId })); }
    catch (e) { setError(e.message); }
    finally { setAiLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Protocol Version-Graph</h2>
          <p>Read-only view of protocol versions + amendment chain for a trial. Built from <code>protocols</code> + <code>amendments</code> tables.</p>
        </div>
      </div>
      <div className="card">
        <ClinicalReferenceStatus source={source} required={['trials']} />
        <AIFieldPresets fields={[{key:'trial',recordReference:true,options:trials.map(row=>row.trial_id)}]} samples={clinicalSourceChoices} onFill={fillSource} disabled={aiLoading || loading || source.loading} context="Protocol graph review" />
        <div className="form-grid">
          <div className="form-group full"><label>Trial ID</label><select data-ai-field="trial" value={trialId} onChange={(e) => setTrialId(e.target.value)}><option value="">Select actual trial</option>{trials.map(row=><option key={row.trial_id} value={row.trial_id}>{row.trial_id} — {row.name || row.title || "Accessible trial"}</option>)}</select></div>
        </div>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end', gap: 8 }}>
          <button className="btn btn-primary" onClick={onLoad} disabled={loading || !trialId}>Load Version Graph</button>
          <button className="btn btn-ai" onClick={onAi} disabled={aiLoading || !trialId}>{aiLoading ? 'Running AI...' : 'OpenRouter AI'}</button>
        </div>
      </div>
      {error && <div className="card" style={{ color: '#b91c1c' }}>Error: {error}</div>}
      {loading && <div className="card">Loading...</div>}
      {graph && (
        <>
          <div className="card">
            <h3>Summary</h3>
            <p>Trial: <strong>{graph.trial}</strong> &middot; {graph.node_count} nodes &middot; {graph.edge_count} edges</p>
          </div>
          <div className="card">
            <h3>Nodes</h3>
            <table style={{ width: '100%' }}>
              <thead><tr><th align="left">Node</th><th align="left">Type</th><th align="left">Version</th><th align="left">Status</th><th align="left">Created</th></tr></thead>
              <tbody>
                {graph.nodes.map((n, i) => (
                  <tr
                    key={i}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setDetail({ title: `Graph node — ${n.label}`, data: n })}
                  >
                    <td>{n.label}</td>
                    <td>{n.type}</td>
                    <td>{n.version || '—'}</td>
                    <td>{n.status || '—'}</td>
                    <td>{n.created_at ? new Date(n.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h3>Edges</h3>
            <table style={{ width: '100%' }}>
              <thead><tr><th align="left">From</th><th align="left">To</th><th align="left">Type</th></tr></thead>
              <tbody>
                {graph.edges.map((e, i) => (
                  <tr
                    key={i}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setDetail({ title: `Graph edge — ${e.type}`, data: e })}
                  ><td>{e.from}</td><td>{e.to}</td><td>{e.type}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <AIResult result={aiResult} loading={aiLoading} error={null} />
      {detail && <DetailModal title={detail.title} data={detail.data} onClose={() => setDetail(null)} />}
    </div>
  );
}
export default ProtocolVersionGraphPage;

import React, { useState } from 'react';
import { getProtocolGraphByTrial } from '../services/api';

function ProtocolVersionGraphPage() {
  const [trialId, setTrialId] = useState('ONCO-LUNG-301');
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onLoad = async () => {
    setLoading(true); setError(null); setGraph(null);
    try { setGraph(await getProtocolGraphByTrial(trialId)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
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
        <div className="form-grid">
          <div className="form-group full"><label>Trial ID</label><input value={trialId} onChange={(e) => setTrialId(e.target.value)} /></div>
        </div>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-ai" onClick={onLoad} disabled={loading}>Load Version Graph</button>
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
                  <tr key={i}>
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
                  <tr key={i}><td>{e.from}</td><td>{e.to}</td><td>{e.type}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
export default ProtocolVersionGraphPage;

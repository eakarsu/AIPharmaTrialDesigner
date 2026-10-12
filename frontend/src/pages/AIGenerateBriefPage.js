import NativeAIControls from "../components/NativeAIControls.jsx";
import React, { useEffect, useState } from 'react';
import AIResult from '../components/AIResult';
import AIHistory from '../components/AIHistory';

import { aiGenerateBrief, getTrials } from '../services/api';

const FEATURE = 'generate-brief';

function AIGenerateBriefPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [trials, setTrials] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [audience, setAudience] = useState('Steering committee');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTrials().then(rs => {
      setTrials(rs);
      if (rs[0]) setSelectedId(String(rs[0].id));
    }).catch(e => setError(e.message));
  }, []);

  const trial = trials.find(t => String(t.id) === selectedId);

  const onSubmit = async () => {
    if (!trial) return;
    setLoading(true); setError(null); setResult(null);
    try { setResult(await aiGenerateBrief({ trial, audience })); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <NativeAIControls busy={loading} context="PharmaTrialDesigner"><div>
      <div className="page-header">
        <div><h2>AI: Generate Brief</h2><p>Executive / steering committee brief tailored to the selected trial.</p></div>
        <button className="btn btn-secondary" onClick={() => setHistoryOpen(true)}>History</button>
      </div>
      <div className="card">

        <div className="form-grid">
          <div className="form-group full"><label>Trial</label>
            <select data-ai-field={"selectedId"} value={selectedId} onChange={e => setSelectedId(e.target.value)}>
              {trials.map(t => <option key={t.id} value={t.id}>{t.trial_id} — {t.name?.slice(0,70)}</option>)}
            </select>
          </div>
          <div className="form-group full"><label>Audience</label>
            <select data-ai-field={"audience"} value={audience} onChange={e => setAudience(e.target.value)}>
              <option>Steering committee</option>
              <option>Investors</option>
              <option>FDA / regulatory pre-meeting</option>
              <option>Internal R&amp;D leadership</option>
              <option>Site investigators</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-ai" onClick={onSubmit} disabled={loading || !trial}>Generate Brief</button>
        </div>
      </div>
      <AIResult result={result} loading={loading} error={error} />
      <AIHistory feature={FEATURE} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div></NativeAIControls>
  );
}
export default AIGenerateBriefPage;

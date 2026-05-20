import React from 'react';
import CrudTable from '../components/CrudTable';
import { getTrials, createTrial, updateTrial, deleteTrial } from '../services/api';

const PHASES = ['I', 'I/II', 'II', 'II/III', 'III', 'IV'];
const STATUSES = ['planning', 'recruiting', 'active', 'completed', 'halted'];

const columns = [
  { key: 'trial_id', label: 'Trial ID' },
  { key: 'name', label: 'Name', format: v => v && v.length > 60 ? v.slice(0,60) + '...' : v },
  { key: 'indication', label: 'Indication' },
  { key: 'phase', label: 'Phase' },
  { key: 'sponsor', label: 'Sponsor' },
  { key: 'status', label: 'Status', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
];

const fields = [
  { key: 'trial_id', label: 'Trial ID' },
  { key: 'name', label: 'Name', full: true },
  { key: 'indication', label: 'Indication' },
  { key: 'phase', label: 'Phase', type: 'select', options: PHASES },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES },
  { key: 'sponsor', label: 'Sponsor' },
  { key: 'start_date', label: 'Start Date', type: 'date' },
];

const empty = { trial_id:'', name:'', indication:'', phase:'II', status:'planning', sponsor:'', start_date:'' };

function TrialsPage() {
  return (
    <CrudTable
      title="Trials" subtitle="Clinical trial portfolio"
      columns={columns} fields={fields} emptyRow={empty}
      api={{ list:getTrials, create:createTrial, update:updateTrial, remove:deleteTrial }}
    />
  );
}
export default TrialsPage;

import React from 'react';
import CrudTable from '../components/CrudTable';
import { getPatients, createPatient, updatePatient, deletePatient } from '../services/api';

const STATUSES = ['screening', 'enrolled', 'active_followup', 'completed', 'withdrawn'];

const columns = [
  { key: 'patient_id', label: 'Patient ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'site', label: 'Site' },
  { key: 'arm', label: 'Arm' },
  { key: 'enrollment_status', label: 'Status', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
  { key: 'enrolled_at', label: 'Enrolled At', format: v => v ? String(v).slice(0,10) : '—' },
];

const fields = [
  { key: 'patient_id', label: 'Patient ID' },
  { key: 'trial', label: 'Trial (trial_id)' },
  { key: 'site', label: 'Site (site_id)' },
  { key: 'arm', label: 'Arm / Cohort' },
  { key: 'enrollment_status', label: 'Status', type: 'select', options: STATUSES },
  { key: 'enrolled_at', label: 'Enrolled At', type: 'date' },
];

const empty = { patient_id:'', trial:'', site:'', arm:'', enrollment_status:'screening', enrolled_at:'' };

function PatientsPage() {
  return (
    <CrudTable
      title="Patients" subtitle="Trial enrollment tracking"
      columns={columns} fields={fields} emptyRow={empty}
      api={{ list:getPatients, create:createPatient, update:updatePatient, remove:deletePatient }}
    />
  );
}
export default PatientsPage;

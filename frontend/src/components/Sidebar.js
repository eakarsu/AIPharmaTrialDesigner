import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationsBell from './NotificationsBell';

const CRUD_LINKS = [
  { path: '/trials', label: 'Trials' },
  { path: '/sites', label: 'Sites' },
  { path: '/protocols', label: 'Protocols' },
  { path: '/investigators', label: 'Investigators' },
  { path: '/patients', label: 'Patients' },
  { path: '/compounds', label: 'Compounds' },
  { path: '/endpoints', label: 'Endpoints' },
  { path: '/adverse-events', label: 'Adverse Events' },
];

const OPS_LINKS = [
  { path: '/amendments',            label: 'Amendments' },
  { path: '/deviations',            label: 'Deviations' },
  { path: '/monitoring-visits',     label: 'Monitoring Visits' },
  { path: '/queries',               label: 'Queries' },
  { path: '/data-locks',            label: 'Data Locks' },
  { path: '/milestones',            label: 'Milestones' },
  { path: '/budgets',               label: 'Budgets' },
  { path: '/vendors-cro',           label: 'CRO Vendors' },
  { path: '/regulatory-submissions',label: 'Regulatory Submissions' },
  { path: '/supply-shipments',      label: 'Supply Shipments' },
];

const AI_LINKS = [
  { path: '/ai/draft-protocol',         label: 'Draft Protocol' },
  { path: '/ai/recommend-endpoints',    label: 'Recommend Endpoints' },
  { path: '/ai/size-cohort',            label: 'Size Cohort' },
  { path: '/ai/select-sites',           label: 'Select Sites' },
  { path: '/ai/model-risk',             label: 'Model Risk' },
  { path: '/ai/generate-brief',         label: 'Generate Brief' },
  { path: '/ai/deviation-classifier',   label: 'Deviation Classifier' },
  { path: '/ai/dsmb-alert',             label: 'DSMB Alert' },
  { path: '/ai/edc-anomaly',            label: 'EDC Anomaly' },
  { path: '/ai/statistical-imbalance',  label: 'Statistical Imbalance' },
  { path: '/ai/expected-vs-actual',     label: 'Expected vs Actual' },
  { path: '/ai/irb-pkg-drafter',        label: 'IRB Pkg Drafter' },
  { path: '/ai/query-resolver',         label: 'Query Resolver' },
  { path: '/ai/milestone-forecaster',   label: 'Milestone Forecaster' },
  { path: '/ai/budget-burn',            label: 'Budget Burn' },
  { path: '/ai/regulatory-impact',      label: 'Regulatory Impact' },
];

const SYS_LINKS = [
  { path: '/webhooks',    label: 'Webhooks' },
  { path: '/bulk-import', label: 'Bulk Import' },
];

function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle menu"
      >
        {open ? '✕' : '☰'}
      </button>
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <h1>Trial Designer</h1>
          <p>AI Pharma Studio</p>
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={close}>Dashboard</Link>

          <div className="sidebar-section">Master Data</div>
          {CRUD_LINKS.map(l => (
            <Link key={l.path} to={l.path} className={`nav-link ${isActive(l.path) ? 'active' : ''}`} onClick={close}>{l.label}</Link>
          ))}

          <div className="sidebar-section">Trial Operations</div>
          {OPS_LINKS.map(l => (
            <Link key={l.path} to={l.path} className={`nav-link ${isActive(l.path) ? 'active' : ''}`} onClick={close}>{l.label}</Link>
          ))}

          <div className="sidebar-section">AI Studio</div>
          {AI_LINKS.map(l => (
            <Link key={l.path} to={l.path} className={`nav-link ${isActive(l.path) ? 'active' : ''}`} onClick={close}>{l.label}</Link>
          ))}

          <div className="sidebar-section">System</div>
          {SYS_LINKS.map(l => (
            <Link key={l.path} to={l.path} className={`nav-link ${isActive(l.path) ? 'active' : ''}`} onClick={close}>{l.label}</Link>
          ))}

          <div className="sidebar-section">Trial Design Views</div>
          <Link
            to="/custom-views"
            className={`nav-link ${isActive('/custom-views') ? 'active' : ''}`}
            onClick={close}
          >
            Custom Views
          </Link>

          {user && (
            <>
              <div className="sidebar-section">Account</div>
              <div className="sidebar-user">{user.name || user.email}{user.role ? ` (${user.role})` : ''}</div>
              <div className="sidebar-bell"><NotificationsBell /></div>
              <button className="nav-link nav-logout" onClick={() => { close(); onLogout && onLogout(); }}>Sign out</button>
            </>
          )}
        </nav>
      </aside>
      {open && <div className="sidebar-backdrop" onClick={close} />}
    </>
  );
}

export default Sidebar;

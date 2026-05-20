const API_BASE = 'http://localhost:3041/api';

function getHeaders(extra) {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra || {}),
  };
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: getHeaders(options.headers),
  });

  if (res.status === 401 || res.status === 403) {
    // Only auto-redirect on TOKEN problems; 403 from RBAC denial keeps user signed in.
    let msg = 'Unauthorized';
    try { const data = await res.json(); msg = data.error || msg; } catch (_) {}
    const tokenProblem = res.status === 401 || /token|access/i.test(msg);
    if (tokenProblem) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    throw new Error(msg);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Auth
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const me = () => request('/auth/me');

// Dashboard
export const getDashboardStats = () => request('/dashboard/stats');

// ---------- Original 8 CRUD ----------
export const getTrials = () => request('/trials');
export const createTrial = (data) => request('/trials', { method: 'POST', body: JSON.stringify(data) });
export const updateTrial = (id, data) => request(`/trials/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTrial = (id) => request(`/trials/${id}`, { method: 'DELETE' });

export const getSites = () => request('/sites');
export const createSite = (data) => request('/sites', { method: 'POST', body: JSON.stringify(data) });
export const updateSite = (id, data) => request(`/sites/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSite = (id) => request(`/sites/${id}`, { method: 'DELETE' });

export const getProtocols = () => request('/protocols');
export const createProtocol = (data) => request('/protocols', { method: 'POST', body: JSON.stringify(data) });
export const updateProtocol = (id, data) => request(`/protocols/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProtocol = (id) => request(`/protocols/${id}`, { method: 'DELETE' });

export const getInvestigators = () => request('/investigators');
export const createInvestigator = (data) => request('/investigators', { method: 'POST', body: JSON.stringify(data) });
export const updateInvestigator = (id, data) => request(`/investigators/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteInvestigator = (id) => request(`/investigators/${id}`, { method: 'DELETE' });

export const getPatients = () => request('/patients');
export const createPatient = (data) => request('/patients', { method: 'POST', body: JSON.stringify(data) });
export const updatePatient = (id, data) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePatient = (id) => request(`/patients/${id}`, { method: 'DELETE' });

export const getCompounds = () => request('/compounds');
export const createCompound = (data) => request('/compounds', { method: 'POST', body: JSON.stringify(data) });
export const updateCompound = (id, data) => request(`/compounds/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCompound = (id) => request(`/compounds/${id}`, { method: 'DELETE' });

export const getEndpoints = () => request('/endpoints');
export const createEndpoint = (data) => request('/endpoints', { method: 'POST', body: JSON.stringify(data) });
export const updateEndpoint = (id, data) => request(`/endpoints/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEndpoint = (id) => request(`/endpoints/${id}`, { method: 'DELETE' });

export const getAdverseEvents = () => request('/adverse-events');
export const createAdverseEvent = (data) => request('/adverse-events', { method: 'POST', body: JSON.stringify(data) });
export const updateAdverseEvent = (id, data) => request(`/adverse-events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAdverseEvent = (id) => request(`/adverse-events/${id}`, { method: 'DELETE' });

// ---------- 10 NEW CRUD ENTITIES ----------
function crud(base) {
  return {
    list: () => request(base),
    create: (data) => request(base, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`${base}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`${base}/${id}`, { method: 'DELETE' }),
  };
}

export const amendmentsApi          = crud('/amendments');
export const deviationsApi          = crud('/deviations');
export const monitoringVisitsApi    = crud('/monitoring-visits');
export const queriesApi             = crud('/queries');
export const dataLocksApi           = crud('/data-locks');
export const milestonesApi          = crud('/milestones');
export const budgetsApi             = crud('/budgets');
export const vendorsCroApi          = crud('/vendors-cro');
export const regulatorySubmissionsApi = crud('/regulatory-submissions');
export const supplyShipmentsApi     = crud('/supply-shipments');

// ---------- AI (16 verbs) ----------
export const aiDraftProtocol       = (body) => request('/ai/draft-protocol',       { method: 'POST', body: JSON.stringify(body) });
export const aiRecommendEndpoints  = (body) => request('/ai/recommend-endpoints',  { method: 'POST', body: JSON.stringify(body) });
export const aiSizeCohort          = (body) => request('/ai/size-cohort',          { method: 'POST', body: JSON.stringify(body) });
export const aiSelectSites         = (body) => request('/ai/select-sites',         { method: 'POST', body: JSON.stringify(body) });
export const aiModelRisk           = (body) => request('/ai/model-risk',           { method: 'POST', body: JSON.stringify(body) });
export const aiGenerateBrief       = (body) => request('/ai/generate-brief',       { method: 'POST', body: JSON.stringify(body) });

export const aiDeviationClassifier = (body) => request('/ai/deviation-classifier', { method: 'POST', body: JSON.stringify(body) });
export const aiDsmbAlert           = (body) => request('/ai/dsmb-alert',           { method: 'POST', body: JSON.stringify(body) });
export const aiEdcAnomaly          = (body) => request('/ai/edc-anomaly',          { method: 'POST', body: JSON.stringify(body) });
export const aiStatisticalImbalance= (body) => request('/ai/statistical-imbalance',{ method: 'POST', body: JSON.stringify(body) });
export const aiExpectedVsActual    = (body) => request('/ai/expected-vs-actual',   { method: 'POST', body: JSON.stringify(body) });
export const aiIrbPkgDrafter       = (body) => request('/ai/irb-pkg-drafter',      { method: 'POST', body: JSON.stringify(body) });
export const aiQueryResolver       = (body) => request('/ai/query-resolver',       { method: 'POST', body: JSON.stringify(body) });
export const aiMilestoneForecaster = (body) => request('/ai/milestone-forecaster', { method: 'POST', body: JSON.stringify(body) });
export const aiBudgetBurn          = (body) => request('/ai/budget-burn',          { method: 'POST', body: JSON.stringify(body) });
export const aiRegulatoryImpact    = (body) => request('/ai/regulatory-impact',    { method: 'POST', body: JSON.stringify(body) });

// AI history
export const aiHistory = (feature) =>
  request(`/ai/history?feature=${encodeURIComponent(feature)}`);

// AI sample scenarios (powers the "Sample Fill" buttons on every AI page)
export const aiSamples = (feature) =>
  request(`/ai/samples?feature=${encodeURIComponent(feature)}`);

// ---------- Notifications ----------
export const getNotifications = () => request('/notifications');
export const markNotificationRead = (id) => request(`/notifications/${id}/read`, { method: 'POST' });
export const markAllNotificationsRead = () => request('/notifications/read-all', { method: 'POST' });

// ---------- Attachments ----------
export const listAttachments = (refTable, refId) => {
  const qs = refTable && refId ? `?ref_table=${encodeURIComponent(refTable)}&ref_id=${encodeURIComponent(refId)}` : '';
  return request(`/attachments${qs}`);
};
export const uploadAttachment = async (file, refTable, refId) => {
  const token = localStorage.getItem('token');
  const fd = new FormData();
  fd.append('file', file);
  if (refTable) fd.append('ref_table', refTable);
  if (refId)    fd.append('ref_id',    refId);
  const res = await fetch(`${API_BASE}/attachments`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
};
export const attachmentDownloadUrl = (id) => `${API_BASE}/attachments/${id}/download`;
export const deleteAttachment = (id) => request(`/attachments/${id}`, { method: 'DELETE' });

// ---------- Webhooks ----------
export const listWebhooks = () => request('/webhooks');
export const createWebhook = (data) => request('/webhooks', { method: 'POST', body: JSON.stringify(data) });
export const updateWebhook = (id, data) => request(`/webhooks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteWebhook = (id) => request(`/webhooks/${id}`, { method: 'DELETE' });
export const listWebhookDeliveries = () => request('/webhooks/deliveries');
export const fireWebhookTest = (event, payload) =>
  request(`/webhooks/test/${encodeURIComponent(event)}`, { method: 'POST', body: JSON.stringify(payload || {}) });

// ---------- Bulk import ----------
export const bulkImport = (entity, csv) =>
  request(`/bulk-import/${entity}`, { method: 'POST', body: JSON.stringify({ csv }) });

// ---------- Custom Views (4 derived views) ----------
export const customViewsTrialTimeline    = () => request('/custom-views/trial-timeline');
export const customViewsEndpointCoverage = () => request('/custom-views/endpoint-coverage');
export const customViewsProtocolPdf      = (trialId) =>
  request(`/custom-views/protocol-pdf/${encodeURIComponent(trialId)}`);
export const customViewsListRules        = () => request('/custom-views/design-rules');
export const customViewsCreateRule       = (data) =>
  request('/custom-views/design-rules', { method: 'POST', body: JSON.stringify(data) });
export const customViewsUpdateRule       = (id, data) =>
  request(`/custom-views/design-rules/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const customViewsDeleteRule       = (id) =>
  request(`/custom-views/design-rules/${id}`, { method: 'DELETE' });

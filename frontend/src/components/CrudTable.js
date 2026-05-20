import React, { useEffect, useMemo, useState } from 'react';

/*
  Generic CRUD table.
  Props:
    title, subtitle
    columns: [{ key, label, format?(v, row) }]
    fields:  [{ key, label, type ('text'|'number'|'date'|'select'|'textarea'|'checkbox'), options? }]
    api:     { list, create, update, remove }
    idKey:   'id'
    emptyRow: {}
*/

const PAGE_SIZE = 25;

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsv(rows, columns, filename) {
  const headers = columns.map(c => csvEscape(c.label)).join(',');
  const body = rows
    .map(r => columns.map(c => csvEscape(r[c.key])).join(','))
    .join('\n');
  const csv = headers + '\n' + body;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function CrudTable({ title, subtitle, columns, fields, api, idKey = 'id', emptyRow }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [formData, setFormData] = useState(emptyRow);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { load(); }, []);

  async function load() {
    try { setItems(await api.list()); } catch (e) { setError(e.message); }
  }

  // Filter rows by search across all string-ish fields
  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(row =>
      Object.values(row).some(v => {
        if (v === null || v === undefined) return false;
        if (typeof v === 'object') return JSON.stringify(v).toLowerCase().includes(q);
        return String(v).toLowerCase().includes(q);
      })
    );
  }, [items, query]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [query]);

  const onRowClick = (item) => { setSelected(item); setEditing(false); };
  const onEdit = () => { setFormData({ ...selected }); setEditing(true); };
  const onNew = () => { setFormData({ ...emptyRow }); setShowNew(true); setSelected(null); };
  const onDelete = async () => {
    if (!window.confirm('Delete this record?')) return;
    try { await api.remove(selected[idKey]); setSelected(null); load(); } catch (e) { alert(e.message); }
  };
  const onSave = async () => {
    try {
      if (editing && selected) await api.update(selected[idKey], formData);
      else await api.create(formData);
      setSelected(null); setShowNew(false); setEditing(false); load();
    } catch (e) { alert(e.message); }
  };
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };
  const onExport = () => {
    const fname = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0,10)}.csv`;
    downloadCsv(filtered, columns, fname);
  };

  const renderField = (f) => {
    const v = formData[f.key] ?? '';
    if (f.type === 'select') {
      return (
        <select name={f.key} value={v} onChange={onChange}>
          <option value="">--</option>
          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (f.type === 'textarea') return <textarea name={f.key} value={v} onChange={onChange} rows={3} />;
    if (f.type === 'checkbox') return <input type="checkbox" name={f.key} checked={!!formData[f.key]} onChange={onChange} />;
    if (f.type === 'number')   return <input type="number" name={f.key} value={v} onChange={onChange} step="any" />;
    if (f.type === 'date')     return <input type="date" name={f.key} value={v ? String(v).slice(0,10) : ''} onChange={onChange} />;
    return <input name={f.key} value={v} onChange={onChange} />;
  };

  const renderForm = () => (
    <div className="modal-overlay" onClick={() => { setShowNew(false); setEditing(false); }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editing ? `Edit ${title}` : `New ${title}`}</h3>
          <button className="modal-close" onClick={() => { setShowNew(false); setEditing(false); }}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            {fields.map(f => (
              <div key={f.key} className={`form-group ${f.full ? 'full' : ''}`}>
                <label>{f.label}</label>
                {renderField(f)}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => { setShowNew(false); setEditing(false); }}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={onExport} title="Export current view to CSV">Export CSV</button>
          <button className="btn btn-primary" onClick={onNew}>+ New {title.replace(/s$/,'')}</button>
        </div>
      </div>

      {error && <div className="ai-error">{error}</div>}

      <div className="table-toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="result-count">
          {filtered.length} record{filtered.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {pageRows.map(row => (
              <tr key={row[idKey]} onClick={() => onRowClick(row)}>
                {columns.map(c => (
                  <td key={c.key}>{c.format ? c.format(row[c.key], row) : (row[c.key] ?? '')}</td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr><td colSpan={columns.length} style={{ textAlign:'center', color:'#64748b', padding:'30px' }}>No records.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          className="btn btn-secondary"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
        >Prev</button>
        <span className="page-info">Page {currentPage} / {totalPages}</span>
        <button
          className="btn btn-secondary"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
        >Next</button>
      </div>

      {selected && !editing && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{title.replace(/s$/,'')} detail</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                {fields.map(f => (
                  <div key={f.key} className="detail-item">
                    <div className="detail-label">{f.label}</div>
                    <div className="detail-value">{String(selected[f.key] ?? '—')}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={onDelete}>Delete</button>
              <button className="btn btn-secondary" onClick={onEdit}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {(showNew || editing) && renderForm()}
    </div>
  );
}

export default CrudTable;

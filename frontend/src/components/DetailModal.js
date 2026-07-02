import React, { useState } from 'react';

/**
 * Reusable centered detail popup — same look as the CrudTable detail modal
 * (modal-overlay / modal-content / detail-grid). Used by the pass 8/9 pages
 * so every table row / card opens details on click, like the rest of the app.
 *
 * props:
 *   title  — modal header
 *   data   — plain object; each entry becomes a detail-item.
 *            null/undefined -> em dash; objects/arrays -> pretty JSON;
 *            keys are prettified (snake_case -> Title Case).
 *   onClose
 *   onDelete — optional delete handler. If omitted, Delete is shown disabled
 *              so every detail popup has a consistent action surface without
 *              inventing destructive behavior for read-only rows/charts.
 *   deleteDisabled, deleteTitle — optional delete state/tooltip overrides.
 *   children — optional extra content rendered below the grid (e.g. links)
 */
export default function DetailModal({
  title,
  data,
  onClose,
  onDelete,
  deleteDisabled = false,
  deleteTitle = 'Delete is unavailable for this read-only detail.',
  children,
}) {
  const [deleting, setDeleting] = useState(false);

  if (!data) return null;

  const canDelete = typeof onDelete === 'function' && !deleteDisabled && !deleting;
  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    try {
      await onDelete(data);
    } finally {
      setDeleting(false);
    }
  };

  const pretty = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const renderValue = (v) => {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'object') {
      return <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(v, null, 2)}</pre>;
    }
    return String(v);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="detail-grid">
            {Object.entries(data).map(([k, v]) => (
              <div key={k} className="detail-item" style={typeof v === 'object' && v !== null ? { gridColumn: '1 / -1' } : undefined}>
                <div className="detail-label">{pretty(k)}</div>
                <div className="detail-value">{renderValue(v)}</div>
              </div>
            ))}
          </div>
          {children}
        </div>
        <div className="modal-actions">
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={!canDelete}
            title={canDelete ? 'Delete this item' : deleteTitle}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

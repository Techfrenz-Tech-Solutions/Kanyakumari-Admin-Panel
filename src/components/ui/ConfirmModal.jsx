import { AlertTriangle } from './Icons.jsx';

export default function ConfirmModal({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Delete', danger = true }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 400 }}>
        <div className="modal-body" style={{ paddingTop: 26 }}>
          <div className="modal-icon-warn"><AlertTriangle /></div>
          <h3 style={{ fontSize: 17, marginBottom: 8 }}>{title}</h3>
          <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{message}</p>
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className={`btn ${danger ? 'btn-primary' : 'btn-primary'}`} style={danger ? { background: 'var(--red-500)' } : {}} onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

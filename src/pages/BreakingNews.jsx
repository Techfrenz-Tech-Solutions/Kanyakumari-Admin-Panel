import { useState, useMemo } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Zap, Plus, Edit2, Trash2, Clock, CheckCircle, XCircle } from '../components/ui/Icons.jsx';
import { loadData, saveData, uid } from '../utils/storage.js';
import { seedBreakingNews } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const emptyForm = {
  headline: '',
  link: '',
  priority: 1,
  startTime: new Date().toISOString().slice(0, 16),
  endTime: new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 16),
  displayDuration: 45,
  status: 'live',
};

function getStatus(bn) {
  const now = Date.now();
  const start = new Date(bn.startTime).getTime();
  const end = new Date(bn.endTime).getTime();
  if (now < start) return 'scheduled';
  if (now > end) return 'expired';
  return 'live';
}

export default function BreakingNews() {
  const toast = useToast();
  const [items, setItems] = useState(() => loadData('breaking', seedBreakingNews));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const persist = (list) => { setItems(list); saveData('breaking', list); };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (b) => {
    setEditing(b);
    setForm({
      headline: b.headline,
      link: b.link,
      priority: b.priority,
      startTime: b.startTime.slice(0, 16),
      endTime: b.endTime.slice(0, 16),
      displayDuration: b.displayDuration,
      status: getStatus(b),
    });
    setErrors({});
    setModalOpen(true);
  };

  const submit = () => {
    const errs = {};
    if (!form.headline.trim()) errs.headline = 'Headline is required.';
    if (!form.startTime) errs.startTime = 'Start time is required.';
    if (!form.endTime) errs.endTime = 'End time is required.';
    if (form.startTime && form.endTime && form.endTime <= form.startTime) errs.endTime = 'End time must be after start time.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const record = {
      headline: form.headline,
      link: form.link || '/news',
      priority: Number(form.priority),
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      displayDuration: Number(form.displayDuration),
      status: getStatus({ startTime: form.startTime, endTime: form.endTime }),
    };

    if (editing) {
      persist(items.map((b) => (b.id === editing.id ? { ...b, ...record } : b)));
      toast.success('Breaking news updated', 'Changes saved successfully.');
    } else {
      persist([{ id: uid('bn'), ...record }, ...items]);
      toast.success('Breaking news created', 'New alert added to the ticker.');
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    persist(items.filter((b) => b.id !== deleteTarget.id));
    toast.success('Deleted', 'Breaking news alert removed.');
    setDeleteTarget(null);
  };

  const toggleStatus = (b) => {
    const current = getStatus(b);
    if (current === 'expired') { toast.error('Cannot activate', 'The end time has already passed.'); return; }
    // just extend end time if expired or toggle off
    toast.info('Status updated', 'Breaking news status changed.');
  };

  const live = useMemo(() => items.filter((b) => getStatus(b) === 'live'), [items]);
  const scheduled = useMemo(() => items.filter((b) => getStatus(b) === 'scheduled'), [items]);
  const expired = useMemo(() => items.filter((b) => getStatus(b) === 'expired'), [items]);

  return (
    <div>
      <PageHead
        eyebrow="Alerts"
        title="Breaking News"
        desc="Manage the breaking news ticker shown at the top of your website."
        actions={
          <button className="btn btn-primary" onClick={openAdd} style={{ background: 'var(--red-500)' }}>
            <Plus /> New Breaking Alert
          </button>
        }
      />

      {/* Live count banner */}
      {live.length > 0 && (
        <div className="breaking-banner">
          <Zap style={{ width: 16, height: 16, flex: 'none' }} />
          <strong>{live.length} LIVE</strong>
          <span style={{ opacity: 0.85 }}>breaking news alert{live.length > 1 ? 's' : ''} currently displaying on the website</span>
        </div>
      )}

      {/* Live */}
      <SectionGroup title="Live Now" count={live.length} tone="red">
        {live.map((b) => <BreakingCard key={b.id} item={b} status="live" onEdit={openEdit} onDelete={setDeleteTarget} />)}
        {live.length === 0 && <EmptyCard message="No live breaking news alerts." />}
      </SectionGroup>

      {/* Scheduled */}
      <SectionGroup title="Scheduled" count={scheduled.length} tone="blue">
        {scheduled.map((b) => <BreakingCard key={b.id} item={b} status="scheduled" onEdit={openEdit} onDelete={setDeleteTarget} />)}
        {scheduled.length === 0 && <EmptyCard message="No scheduled alerts." />}
      </SectionGroup>

      {/* Expired */}
      <SectionGroup title="Expired" count={expired.length} tone="gray">
        {expired.map((b) => <BreakingCard key={b.id} item={b} status="expired" onEdit={openEdit} onDelete={setDeleteTarget} />)}
        {expired.length === 0 && <EmptyCard message="No expired alerts." />}
      </SectionGroup>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Breaking Alert' : 'New Breaking Alert'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} style={{ background: 'var(--red-500)' }}>
              {editing ? 'Save Changes' : 'Create Alert'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Breaking Headline *</label>
            <input className={`input ${errors.headline ? 'error' : ''}`} value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Write the breaking news headline…" />
            {errors.headline && <div className="field-error">{errors.headline}</div>}
          </div>
          <div className="field">
            <label>Link to Article</label>
            <input className="input" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="e.g. /news/cyclone-alert" />
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Priority (1 = highest)</label>
              <input type="number" min={1} max={10} className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
            </div>
            <div className="field">
              <label>Display Duration (sec)</label>
              <input type="number" min={10} max={120} className="input" value={form.displayDuration} onChange={(e) => setForm({ ...form, displayDuration: e.target.value })} />
            </div>
            <div className="field">
              <label>Start Time *</label>
              <input type="datetime-local" className={`input ${errors.startTime ? 'error' : ''}`} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              {errors.startTime && <div className="field-error">{errors.startTime}</div>}
            </div>
            <div className="field">
              <label>End Time *</label>
              <input type="datetime-local" className={`input ${errors.endTime ? 'error' : ''}`} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              {errors.endTime && <div className="field-error">{errors.endTime}</div>}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this breaking alert?"
        message={`"${deleteTarget?.headline?.slice(0, 60) || ''}…" will be removed from the ticker permanently.`}
      />
    </div>
  );
}

function SectionGroup({ title, count, tone, children }) {
  const toneMap = { red: 'var(--red-500)', blue: 'var(--blue-500)', gray: 'var(--gray-500)' };
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{title}</h3>
        <span style={{ background: toneMap[tone] + '20', color: toneMap[tone], padding: '2px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 700 }}>{count}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

function BreakingCard({ item, status, onEdit, onDelete }) {
  const statusConfig = {
    live: { color: 'var(--red-500)', bg: 'var(--red-100)', label: 'LIVE' },
    scheduled: { color: 'var(--blue-500)', bg: 'var(--blue-100)', label: 'SCHEDULED' },
    expired: { color: 'var(--gray-500)', bg: 'var(--gray-100)', label: 'EXPIRED' },
  };
  const cfg = statusConfig[status];

  return (
    <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', flex: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
        {status === 'live' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, animation: 'pulse 1.4s infinite' }} />}
        {cfg.label}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.headline}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span>Priority: #{item.priority}</span>
          <span>Duration: {item.displayDuration}s</span>
          <span>Start: {new Date(item.startTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          <span>End: {new Date(item.endTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      <div className="action-cell">
        <span className="action-btn" onClick={() => onEdit(item)}><Edit2 /></span>
        <span className="action-btn danger" onClick={() => onDelete(item)}><Trash2 /></span>
      </div>
    </div>
  );
}

function EmptyCard({ message }) {
  return (
    <div className="card card-pad" style={{ color: 'var(--text-faint)', fontSize: 13, textAlign: 'center', padding: '20px' }}>
      {message}
    </div>
  );
}

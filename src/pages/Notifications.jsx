import { useState, useMemo } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Bell, Send, Clock } from '../components/ui/Icons.jsx';
import { loadData, saveData, uid } from '../utils/storage.js';
import { seedNotifications } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const TYPES = ['general', 'breaking', 'live', 'sports', 'weather'];
const TARGETS = ['all', 'subscribers', 'premium'];
const emptyForm = { title: '', message: '', link: '', type: 'general', target: 'all', status: 'draft', scheduled: '' };

export default function Notifications() {
  const toast = useToast();
  const [notifs, setNotifs] = useState(() => loadData('notifications', seedNotifications));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [tab, setTab] = useState('all');

  const persist = (list) => { setNotifs(list); saveData('notifications', list); };

  const filtered = useMemo(() => {
    if (tab === 'all') return notifs;
    return notifs.filter((n) => n.status === tab);
  }, [notifs, tab]);

  const counts = useMemo(() => ({
    all: notifs.length,
    sent: notifs.filter((n) => n.status === 'sent').length,
    scheduled: notifs.filter((n) => n.status === 'scheduled').length,
    draft: notifs.filter((n) => n.status === 'draft').length,
  }), [notifs]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (n) => {
    setEditing(n);
    setForm({ title: n.title, message: n.message, link: n.link || '', type: n.type, target: n.target, status: n.status, scheduled: n.scheduled ? n.scheduled.slice(0, 16) : '' });
    setErrors({});
    setModalOpen(true);
  };

  const submit = (sendNow = false) => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.message.trim()) errs.message = 'Message is required.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const status = sendNow ? 'sent' : form.scheduled ? 'scheduled' : 'draft';
    const record = {
      ...form,
      status,
      sentAt: sendNow ? new Date().toISOString() : null,
      scheduled: form.scheduled ? new Date(form.scheduled).toISOString() : null,
    };

    if (editing) {
      persist(notifs.map((n) => (n.id === editing.id ? { ...n, ...record } : n)));
      toast.success('Notification updated', 'Changes saved.');
    } else {
      persist([{ id: uid('notif'), ...record }, ...notifs]);
      toast.success(sendNow ? 'Notification sent!' : 'Notification saved', sendNow ? 'Push notification dispatched.' : 'Saved as draft.');
    }
    setModalOpen(false);
  };

  const sendNow = (n) => {
    persist(notifs.map((notif) => (notif.id === n.id ? { ...notif, status: 'sent', sentAt: new Date().toISOString() } : notif)));
    toast.success('Notification sent!', `"${n.title}" pushed to ${n.target} users.`);
  };

  const confirmDelete = () => {
    persist(notifs.filter((n) => n.id !== deleteTarget.id));
    toast.success('Deleted', 'Notification removed.');
    setDeleteTarget(null);
  };

  const typeIcon = { general: '📢', breaking: '🔴', live: '📡', sports: '🏆', weather: '⛈️' };
  const statusConfig = { sent: { bg: 'var(--green-100)', color: 'var(--green-500)' }, scheduled: { bg: 'var(--blue-100)', color: 'var(--blue-500)' }, draft: { bg: 'var(--gray-100)', color: 'var(--gray-500)' } };

  return (
    <div>
      <PageHead
        eyebrow="Engagement"
        title="Notifications"
        desc="Send and schedule push notifications to your readers."
        actions={<button className="btn btn-primary" onClick={openAdd}><Plus />New Notification</button>}
      />

      <div className="chip-row" style={{ marginBottom: 16 }}>
        {[['all', 'All'], ['sent', 'Sent'], ['scheduled', 'Scheduled'], ['draft', 'Drafts']].map(([key, label]) => (
          <button key={key} className={`filter-chip ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {label} · {counts[key]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon={Bell} title="No notifications" message="Create push notifications to engage your readers." /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((n) => {
            const cfg = statusConfig[n.status] || statusConfig.draft;
            return (
              <div className="card card-pad" key={n.id}>
                <div className="flex-between" style={{ alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flex: 'none' }}>
                      {typeIcon[n.type] || '📢'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <strong style={{ fontSize: 14 }}>{n.title}</strong>
                        <span style={{ background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 700 }}>{n.status}</span>
                        <span className="faint" style={{ fontSize: 11.5 }}>→ {n.target} users</span>
                      </div>
                      <p className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{n.message}</p>
                      <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>
                        {n.status === 'sent' && n.sentAt && `Sent: ${new Date(n.sentAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                        {n.status === 'scheduled' && n.scheduled && `Scheduled: ${new Date(n.scheduled).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                        {n.status === 'draft' && 'Not sent yet'}
                      </div>
                    </div>
                  </div>
                  <div className="action-cell">
                    {n.status !== 'sent' && (
                      <button className="btn btn-primary btn-sm" onClick={() => sendNow(n)} style={{ background: 'var(--red-500)' }}>
                        <Send style={{ width: 12, height: 12 }} />Send Now
                      </button>
                    )}
                    <span className="action-btn" onClick={() => openEdit(n)}><Edit2 /></span>
                    <span className="action-btn danger" onClick={() => setDeleteTarget(n)}><Trash2 /></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Notification' : 'New Notification'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-secondary" onClick={() => submit(false)}>Save Draft</button>
            <button className="btn btn-primary" onClick={() => submit(true)} style={{ background: 'var(--red-500)' }}><Send />Send Now</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Notification Title *</label>
            <input className={`input ${errors.title ? 'error' : ''}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Breaking news alert title…" />
            {errors.title && <div className="field-error">{errors.title}</div>}
          </div>
          <div className="field">
            <label>Message *</label>
            <textarea className={`input ${errors.message ? 'error' : ''}`} rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Notification body text…" />
            {errors.message && <div className="field-error">{errors.message}</div>}
          </div>
          <div className="field">
            <label>Link</label>
            <input className="input" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/news/article-slug" />
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Type</label>
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Target Audience</label>
              <select className="select" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
                {TARGETS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label><Clock style={{ width: 12, height: 12, marginRight: 4, verticalAlign: -2 }} />Schedule (optional)</label>
            <input type="datetime-local" className="input" value={form.scheduled} onChange={(e) => setForm({ ...form, scheduled: e.target.value })} />
            <div className="hint">Leave blank to save as draft or send immediately.</div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this notification?"
        message={`"${deleteTarget?.title || ''}" will be permanently removed.`}
      />
    </div>
  );
}

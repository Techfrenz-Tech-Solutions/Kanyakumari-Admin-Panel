import { useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Users, Mail, Globe, FileText } from '../components/ui/Icons.jsx';
import { loadData, saveData, uid } from '../utils/storage.js';
import { seedAuthors } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const emptyForm = { name: '', email: '', bio: '', specialization: '', twitterHandle: '', status: 'active' };

export default function Authors() {
  const toast = useToast();
  const [authors, setAuthors] = useState(() => loadData('authors', seedAuthors));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const persist = (list) => { setAuthors(list); saveData('authors', list); };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (a) => {
    setEditing(a);
    setForm({
      name: a.name ?? '',
      email: a.email ?? '',
      bio: a.bio ?? '',
      specialization: a.specialization ?? '',
      twitterHandle: a.social?.twitter ?? '',
      status: a.status ?? 'active',
    });
    setErrors({});
    setModalOpen(true);
  };

  const submit = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const record = { name: form.name, email: form.email, bio: form.bio, specialization: form.specialization, social: { twitter: form.twitterHandle }, status: form.status };

    if (editing) {
      persist(authors.map((a) => (a.id === editing.id ? { ...a, ...record } : a)));
      toast.success('Author updated', `${form.name}'s profile saved.`);
    } else {
      persist([{ id: uid('auth'), ...record, articleCount: 0 }, ...authors]);
      toast.success('Author added', `${form.name} joined the author team.`);
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    persist(authors.filter((a) => a.id !== deleteTarget.id));
    toast.success('Author removed', `${deleteTarget.name} removed.`);
    setDeleteTarget(null);
  };

  const initials = (name) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div>
      <PageHead
        eyebrow="Team"
        title="Authors"
        desc="Manage guest authors and columnists who contribute to The Daily Wire."
        actions={<button className="btn btn-primary" onClick={openAdd}><Plus />Add Author</button>}
      />

      {authors.length === 0 ? (
        <div className="card"><EmptyState icon={Users} title="No authors yet" message="Add your first author to get started." /></div>
      ) : (
        <div className="reporter-grid">
          {authors.map((a) => (
            <div className="card card-pad reporter-card" key={a.id}>
              <div className="reporter-avatar">{initials(a.name)}</div>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{a.name}</div>
              <div className="muted" style={{ fontSize: 12.5, marginBottom: 4 }}>{a.specialization}</div>
              <span className={`pill pill-${a.status === 'active' ? 'active' : 'inactive'}`}>{a.status}</span>
              <div className="divider" />
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Mail style={{ width: 13, height: 13 }} />{a.email}</div>
                {a.social?.twitter && <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Globe style={{ width: 13, height: 13 }} />{a.social.twitter}</div>}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><FileText style={{ width: 13, height: 13 }} />{a.articleCount} articles</div>
              </div>
              {a.bio && <p className="muted" style={{ fontSize: 11.5, marginTop: 8, lineHeight: 1.5, textAlign: 'left' }}>{a.bio.slice(0, 80)}…</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <span className="action-btn" onClick={() => openEdit(a)}><Edit2 /></span>
                <span className="action-btn danger" onClick={() => setDeleteTarget(a)}><Trash2 /></span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Author' : 'Add Author'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>{editing ? 'Save Changes' : 'Add Author'}</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="field span-2">
            <label>Full Name *</label>
            <input className={`input ${errors.name ? 'error' : ''}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>
          <div className="field">
            <label>Email *</label>
            <input className={`input ${errors.email ? 'error' : ''}`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>
          <div className="field">
            <label>Specialization</label>
            <input className="input" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Politics & Governance" />
          </div>
          <div className="field">
            <label>Twitter / X Handle</label>
            <input className="input" value={form.twitterHandle} onChange={(e) => setForm({ ...form, twitterHandle: e.target.value })} placeholder="@handle" />
          </div>
          <div className="field">
            <label>Status</label>
            <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="field span-2">
            <label>Bio</label>
            <textarea className="input" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Brief author biography…" />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Remove this author?"
        message={`${deleteTarget?.name || ''} will be removed. Their articles will remain.`}
      />
    </div>
  );
}

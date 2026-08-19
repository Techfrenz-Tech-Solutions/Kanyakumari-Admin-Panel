import { useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Users, Mail, MapPin, FileText } from '../components/ui/Icons.jsx';
import { loadData, saveData, uid } from '../utils/storage.js';
import { seedReporters } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const emptyForm = { name: '', email: '', phone: '', location: '', role: 'Reporter', bio: '', status: 'active' };

export default function Reporters() {
  const toast = useToast();
  const [reporters, setReporters] = useState(() => loadData('reporters', seedReporters));
  const [modalOpen, setModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const persist = (list) => { setReporters(list); saveData('reporters', list); };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (r) => { setEditing(r); setForm({ ...emptyForm, ...r }); setErrors({}); setModalOpen(true); };

  const submit = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (editing) {
      persist(reporters.map((r) => (r.id === editing.id ? { ...r, ...form } : r)));
      toast.success('Reporter updated', `${form.name}'s profile has been saved.`);
    } else {
      persist([{ id: uid('rep'), ...form, joinDate: new Date().toISOString().slice(0, 10), articleCount: 0 }, ...reporters]);
      toast.success('Reporter added', `${form.name} has been added to the team.`);
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    persist(reporters.filter((r) => r.id !== deleteTarget.id));
    toast.success('Reporter removed', `${deleteTarget.name} was removed.`);
    setDeleteTarget(null);
  };

  const initials = (name) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div>
      <PageHead
        eyebrow="Team"
        title="Reporters"
        desc="Manage the reporters and correspondents writing for your newsroom."
        actions={<button className="btn btn-primary" onClick={openAdd}><Plus />Add Reporter</button>}
      />

      {reporters.length === 0 ? (
        <div className="card"><EmptyState icon={Users} title="No reporters yet" message="Add your first reporter to get started." /></div>
      ) : (
        <div className="reporter-grid">
          {reporters.map((r) => (
            <div className="card card-pad reporter-card" key={r.id}>
              <div className="reporter-avatar">{initials(r.name)}</div>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{r.name}</div>
              <div className="muted" style={{ fontSize: 12.5, marginBottom: 8 }}>{r.role}</div>
              <span className={`pill pill-${r.status === 'active' ? 'active' : 'inactive'}`}>{r.status}</span>
              <div className="divider" />
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Mail style={{ width: 13, height: 13 }} />{r.email}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><MapPin style={{ width: 13, height: 13 }} />{r.location}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><FileText style={{ width: 13, height: 13 }} />{r.articleCount} published articles</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setProfileOpen(r)}>View Profile</button>
                <span className="action-btn" onClick={() => openEdit(r)}><Edit2 /></span>
                <span className="action-btn danger" onClick={() => setDeleteTarget(r)}><Trash2 /></span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Reporter' : 'Add Reporter'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>{editing ? 'Save Changes' : 'Add Reporter'}</button>
        </>}
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
            <label>Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="field">
            <label>Location</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="field">
            <label>Designation</label>
            <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option>Reporter</option>
              <option>Senior Reporter</option>
              <option>Editor</option>
              <option>Business Reporter</option>
              <option>Sports Editor</option>
              <option>Cinema Correspondent</option>
            </select>
          </div>
          <div className="field span-2">
            <label>Bio</label>
            <textarea className="input" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div className="field span-2">
            <label>Status</label>
            <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal open={!!profileOpen} onClose={() => setProfileOpen(null)} title="Reporter Profile">
        {profileOpen && (
          <div style={{ textAlign: 'center' }}>
            <div className="reporter-avatar" style={{ width: 76, height: 76, fontSize: 26 }}>{initials(profileOpen.name)}</div>
            <h3 style={{ fontSize: 18 }}>{profileOpen.name}</h3>
            <div className="muted" style={{ fontSize: 13 }}>{profileOpen.role} · {profileOpen.location}</div>
            <p className="muted" style={{ fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>{profileOpen.bio}</p>
            <div className="divider" />
            <div className="grid-2" style={{ textAlign: 'left' }}>
              <div><div className="faint" style={{ fontSize: 11 }}>EMAIL</div><div style={{ fontSize: 13, fontWeight: 600 }}>{profileOpen.email}</div></div>
              <div><div className="faint" style={{ fontSize: 11 }}>PHONE</div><div style={{ fontSize: 13, fontWeight: 600 }}>{profileOpen.phone}</div></div>
              <div><div className="faint" style={{ fontSize: 11 }}>JOINED</div><div style={{ fontSize: 13, fontWeight: 600 }}>{profileOpen.joinDate}</div></div>
              <div><div className="faint" style={{ fontSize: 11 }}>PUBLISHED</div><div style={{ fontSize: 13, fontWeight: 600 }}>{profileOpen.articleCount} articles</div></div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Remove this reporter?"
        message={`${deleteTarget?.name || ''} will be removed from the team list. Their past articles will remain unaffected.`}
      />
    </div>
  );
}

import { useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Users, Mail, CheckSquare } from '../components/ui/Icons.jsx';
import { loadData, saveData, uid } from '../utils/storage.js';
import { seedEditors } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const PERMISSION_OPTIONS = ['publish', 'approve', 'reject', 'edit', 'delete', 'create'];
const ROLES = ['Chief Editor', 'Deputy Editor', 'Associate Editor', 'Copy Editor', 'Sub Editor', 'Night Editor'];
const DEPARTMENTS = ['News Desk', 'Features', 'Sports', 'Politics', 'Business', 'Cinema', 'Technology', 'Digital'];

const emptyForm = { name: '', email: '', phone: '', role: 'Associate Editor', department: 'News Desk', permissions: ['edit'], status: 'active' };

export default function Editors() {
  const toast = useToast();
  const [editors, setEditors] = useState(() => loadData('editors', seedEditors));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const persist = (list) => { setEditors(list); saveData('editors', list); };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (e) => {
    setEditing(e);
    setForm({
      name: e.name ?? '',
      email: e.email ?? '',
      phone: e.phone ?? '',
      role: e.role ?? 'Associate Editor',
      department: e.department ?? 'News Desk',
      permissions: e.permissions ?? ['edit'],
      status: e.status ?? 'active',
    });
    setErrors({});
    setModalOpen(true);
  };

  const togglePermission = (perm) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  const submit = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Valid email required.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const record = { name: form.name, email: form.email, phone: form.phone, role: form.role, department: form.department, permissions: form.permissions, status: form.status };

    if (editing) {
      persist(editors.map((e) => (e.id === editing.id ? { ...e, ...record } : e)));
      toast.success('Editor updated', `${form.name}'s profile saved.`);
    } else {
      persist([{ id: uid('ed'), ...record, lastLogin: '—' }, ...editors]);
      toast.success('Editor added', `${form.name} added to the editorial team.`);
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    persist(editors.filter((e) => e.id !== deleteTarget.id));
    toast.success('Editor removed', `${deleteTarget.name} removed.`);
    setDeleteTarget(null);
  };

  const initials = (name) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div>
      <PageHead
        eyebrow="Team"
        title="Editors"
        desc="Manage the editorial team responsible for reviewing and publishing content."
        actions={<button className="btn btn-primary" onClick={openAdd}><Plus />Add Editor</button>}
      />

      {editors.length === 0 ? (
        <div className="card"><EmptyState icon={Users} title="No editors yet" message="Add editors to manage the publishing workflow." /></div>
      ) : (
        <div className="card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Editor</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Permissions</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {editors.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(145deg, var(--red-500), var(--ink-700))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flex: 'none' }}>{initials(e.name)}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13.5 }}>{e.name}</div>
                          <div className="faint" style={{ fontSize: 11.5 }}>{e.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="pill pill-scheduled" style={{ textTransform: 'none' }}>{e.role}</span></td>
                    <td>{e.department}</td>
                    <td>
                      <div className="chip-row" style={{ gap: 4 }}>
                        {(e.permissions || []).map((p) => (
                          <span key={p} style={{ fontSize: 10.5, background: 'var(--green-100)', color: 'var(--green-500)', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>{p}</span>
                        ))}
                      </div>
                    </td>
                    <td><span className={`pill pill-${e.status === 'active' ? 'active' : 'inactive'}`}>{e.status}</span></td>
                    <td className="faint">{e.lastLogin || '—'}</td>
                    <td>
                      <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                        <span className="action-btn" onClick={() => openEdit(e)}><Edit2 /></span>
                        <span className="action-btn danger" onClick={() => setDeleteTarget(e)}><Trash2 /></span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Editor' : 'Add Editor'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>{editing ? 'Save Changes' : 'Add Editor'}</button>
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
            <label>Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="field">
            <label>Role</label>
            <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Department</label>
            <select className="select" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="field span-2">
            <label>Permissions</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PERMISSION_OPTIONS.map((p) => (
                <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={form.permissions.includes(p)} onChange={() => togglePermission(p)} style={{ accentColor: 'var(--red-500)' }} />
                  {p}
                </label>
              ))}
            </div>
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

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Remove this editor?"
        message={`${deleteTarget?.name || ''} will lose editorial access to the CMS.`}
      />
    </div>
  );
}

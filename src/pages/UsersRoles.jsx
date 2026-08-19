import { useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, ShieldCheck } from '../components/ui/Icons.jsx';
import { loadData, saveData, uid } from '../utils/storage.js';
import { seedUsers, rolePermissions } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const ROLES = Object.keys(rolePermissions);
const MODULES = ['news', 'categories', 'reporters', 'media', 'ads', 'comments', 'users', 'settings'];
const moduleLabels = { news: 'News', categories: 'Categories', reporters: 'Reporters', media: 'Media', ads: 'Advertisements', comments: 'Comments', users: 'Users', settings: 'Settings' };

const emptyForm = { name: '', email: '', role: 'Editor', status: 'active' };

export default function UsersRoles() {
  const toast = useToast();
  const [users, setUsers] = useState(() => loadData('users', seedUsers));
  const [tab, setTab] = useState('users');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const persist = (list) => { setUsers(list); saveData('users', list); };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (u) => { setEditing(u); setForm({ ...emptyForm, ...u }); setErrors({}); setModalOpen(true); };

  const submit = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (editing) {
      persist(users.map((u) => (u.id === editing.id ? { ...u, ...form } : u)));
      toast.success('User updated', `${form.name}'s account has been saved.`);
    } else {
      persist([{ id: uid('usr'), ...form, lastLogin: '—' }, ...users]);
      toast.success('User invited', `${form.name} has been added as ${form.role}.`);
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    persist(users.filter((u) => u.id !== deleteTarget.id));
    toast.success('User removed', `${deleteTarget.name} no longer has access.`);
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHead
        eyebrow="Access Control"
        title="Users & Roles"
        desc="Manage admin panel access and role-based permissions."
        actions={tab === 'users' ? <button className="btn btn-primary" onClick={openAdd}><Plus />Add User</button> : null}
      />

      <div className="settings-tabs">
        <div className={`settings-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Users</div>
        <div className={`settings-tab ${tab === 'permissions' ? 'active' : ''}`} onClick={() => setTab('permissions')}>Role Permissions</div>
      </div>

      {tab === 'users' ? (
        <div className="card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>User</th><th>Role</th><th>Status</th><th>Last Login</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><div style={{ fontWeight: 700 }}>{u.name}</div><div className="faint" style={{ fontSize: 11.5 }}>{u.email}</div></td>
                    <td><span className="pill pill-scheduled" style={{ textTransform: 'none' }}><ShieldCheck style={{ width: 11, height: 11 }} />{u.role}</span></td>
                    <td><span className={`pill pill-${u.status === 'active' ? 'active' : 'inactive'}`}>{u.status}</span></td>
                    <td className="faint">{u.lastLogin}</td>
                    <td>
                      <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                        <span className="action-btn" onClick={() => openEdit(u)}><Edit2 /></span>
                        <span className="action-btn danger" onClick={() => setDeleteTarget(u)}><Trash2 /></span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="role-grid">
          {ROLES.map((role) => (
            <div className="card card-pad" key={role}>
              <div className="flex-between" style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 14.5 }}>{role}</h3>
                <ShieldCheck style={{ width: 17, height: 17, color: 'var(--red-500)' }} />
              </div>
              {MODULES.map((m) => (
                <div key={m} className="flex-between" style={{ padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12.5 }}>{moduleLabels[m]}</span>
                  <span className="faint" style={{ fontSize: 11 }}>
                    {rolePermissions[role][m].length ? rolePermissions[role][m].join(', ') : 'No access'}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit User' : 'Add User'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>{editing ? 'Save Changes' : 'Send Invite'}</button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
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
            <label>Role</label>
            <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="field">
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
        title="Remove this user?"
        message={`${deleteTarget?.name || ''} will immediately lose access to the admin panel.`}
      />
    </div>
  );
}

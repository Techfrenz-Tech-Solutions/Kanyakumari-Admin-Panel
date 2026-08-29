import { useCallback, useEffect, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, ShieldCheck, Mail, Copy } from '../components/ui/Icons.jsx';
import { usersApi, USER_ROLES, roleLabel } from '../api/users.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const emptyForm = { name: '', email: '', role: 'editor', status: 'active', password: '', extraPermissions: '' };
const messageOf = (error) => error?.message || 'Something went wrong. Please try again.';

export default function UsersRoles() {
  const toast = useToast();
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const canCreate = hasPermission('users.create');
  const canEdit = hasPermission('users.edit');
  const canDelete = hasPermission('users.delete');

  const loadUsers = useCallback(async () => {
    setLoading(true); setLoadError('');
    try { const data = await usersApi.list(); setUsers(Array.isArray(data) ? data : []); }
    catch (error) { setLoadError(messageOf(error)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (target) => {
    setEditing(target);
    setForm({ name: target.name || '', email: target.email || '', role: target.role || 'editor', status: target.status || 'active', password: '', extraPermissions: (target.extraPermissions || []).join(', ') });
    setErrors({}); setModalOpen(true);
  };

  const submit = async () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!editing && form.password && form.password.length < 8) errs.password = 'Initial password must be at least 8 characters.';
    const extraPermissions = form.extraPermissions.split(',').map((item) => item.trim()).filter(Boolean);
    if (extraPermissions.some((item) => !/^[a-z_]+:[a-z_-]+$/.test(item))) errs.extraPermissions = 'Use backend permission format such as news:publish, separated by commas.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      if (editing) {
        const payload = { name: form.name.trim(), role: form.role, status: form.status, extraPermissions };
        await usersApi.update(editing.id, payload);
        toast.success('User updated', `${form.name.trim()}'s account has been saved.`);
        setModalOpen(false);
      } else {
        const payload = { name: form.name.trim(), email: form.email.trim(), role: form.role, status: form.status, extraPermissions };
        if (form.password) payload.password = form.password;
        const data = await usersApi.create(payload);
        const created = data?.user || data;
        if (data?.tempPassword) {
          setInviteResult({ name: created?.name || form.name.trim(), tempPassword: data.tempPassword });
        } else {
          toast.success('User added', `${created?.name || form.name.trim()} now has access as ${roleLabel(form.role)}.`);
        }
        setModalOpen(false);
      }
      await loadUsers();
    } catch (error) {
      setErrors({ submit: messageOf(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || removing) return;
    setRemoving(true);
    try {
      await usersApi.remove(deleteTarget.id);
      toast.success('User removed', `${deleteTarget.name} no longer has access.`);
      setDeleteTarget(null);
      await loadUsers();
    } catch (error) {
      toast.error('Unable to remove user', messageOf(error));
      setRemoving(false);
    }
  };

  const copyTempPassword = async () => {
    try { await navigator.clipboard.writeText(inviteResult?.tempPassword || ''); toast.info('Copied', 'Temporary password copied to clipboard.'); }
    catch { toast.error('Copy failed', 'Select the password text manually.'); }
  };

  const lastLogin = (value) => (value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never');

  return (
    <div>
      <PageHead
        eyebrow="Access Control"
        title="Users & Roles"
        desc="Manage admin panel access and role-based permissions."
        actions={canCreate ? <button className="btn btn-primary" onClick={openAdd}><Plus />Add User</button> : null}
      />

      <div className="card">
          {loading ? (
            <div className="empty-state"><div className="t">Loading users…</div></div>
          ) : loadError ? (
            <div className="empty-state"><div className="t">Unable to load users</div><div>{loadError}</div><button className="btn btn-secondary" onClick={loadUsers}>Retry</button></div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr><th>User</th><th>Role</th><th>Status</th><th>Last Login</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td><div style={{ fontWeight: 700 }}>{u.name}</div><div className="faint" style={{ fontSize: 11.5 }}>{u.email}</div></td>
                      <td><span className="pill pill-scheduled" style={{ textTransform: 'none' }}><ShieldCheck style={{ width: 11, height: 11 }} />{roleLabel(u.role)}</span></td>
                      <td><span className={`pill pill-${u.status}`}>{u.status}</span></td>
                      <td className="faint">{lastLogin(u.lastLoginAt)}</td>
                      <td>
                        <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                          {canEdit && <button className="action-btn" onClick={() => openEdit(u)} aria-label={`Edit ${u.name}`}><Edit2 /></button>}
                          {canDelete && u.id !== currentUser?.id && <button className="action-btn danger" onClick={() => setDeleteTarget(u)} aria-label={`Delete ${u.name}`}><Trash2 /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={editing ? 'Edit User' : 'Add User'}
        footer={<>
          <button className="btn btn-secondary" disabled={submitting} onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" disabled={submitting} onClick={submit}>{submitting ? 'Saving…' : editing ? 'Save Changes' : 'Add User'}</button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Full Name *</label>
            <input className={`input ${errors.name ? 'error' : ''}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>
          {!editing && (
            <div className="field">
              <label>Email *</label>
              <input className={`input ${errors.email ? 'error' : ''}`} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>
          )}
          <div className="field">
            <label>Role</label>
            <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {USER_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="field">
            <label>Extra Permissions</label>
            <textarea className={`input ${errors.extraPermissions ? 'error' : ''}`} rows={2} value={form.extraPermissions} onChange={(e) => setForm({ ...form, extraPermissions: e.target.value })} placeholder="news:publish, categories:edit" />
            {errors.extraPermissions && <div className="field-error">{errors.extraPermissions}</div>}
            <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>Optional backend permission overrides; comma-separated module:action values.</div>
          </div>
          {!editing && (
            <div className="field">
              <label>Initial Password (optional)</label>
              <input className={`input ${errors.password ? 'error' : ''}`} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to auto-generate a temporary password" />
              {errors.password && <div className="field-error">{errors.password}</div>}
              <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>If blank, the server generates a one-time temporary password shown after creation.</div>
            </div>
          )}
          {errors.submit && <div className="field-error">{errors.submit}</div>}
        </div>
      </Modal>

      <Modal
        open={!!inviteResult}
        onClose={() => setInviteResult(null)}
        title="Temporary password generated"
        footer={<button className="btn btn-primary" onClick={() => setInviteResult(null)}>Done</button>}
      >
        {inviteResult && (
          <div>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 14 }}>
              <strong>{inviteResult.name}</strong> was created. Share this one-time temporary password — it will not be shown again.
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <code style={{ flex: 1, padding: '10px 12px', background: 'var(--bg-soft, #f6f7fb)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'monospace', fontSize: 13.5 }}>{inviteResult.tempPassword}</code>
              <button className="btn btn-secondary btn-sm" onClick={copyTempPassword}><Copy />Copy</button>
            </div>
            <div className="faint" style={{ fontSize: 11.5, marginTop: 10, display: 'flex', gap: 6, alignItems: 'center' }}><Mail style={{ width: 12, height: 12 }} />The user must change this password after first login.</div>
          </div>
        )}
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

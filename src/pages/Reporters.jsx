import { useCallback, useEffect, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Users, Mail, MapPin, FileText } from '../components/ui/Icons.jsx';
import { reportersApi } from '../api/reporters.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAutoRefresh } from '../context/RefreshContext.jsx';

const emptyForm = { name: '', email: '', phone: '', location: '', designation: 'Reporter', bio: '', status: 'active' };
const messageOf = (error) => error?.message || 'Something went wrong. Please try again.';
const initials = (name = '') => name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

export default function Reporters() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const [reporters, setReporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const canCreate = hasPermission('reporters.create');
  const canEdit = hasPermission('reporters.edit');
  const canDelete = hasPermission('reporters.delete');

  const loadReporters = useCallback(async () => {
    setLoading(true); setLoadError('');
    try { const data = await reportersApi.list(); setReporters(Array.isArray(data) ? data : []); }
    catch (error) { setLoadError(messageOf(error)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadReporters(); }, [loadReporters]);
  useAutoRefresh(loadReporters);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (reporter) => {
    setEditing(reporter);
    setForm({ ...emptyForm, ...reporter,
      name: reporter.name ?? '',
      email: reporter.email ?? '',
      phone: reporter.phone ?? '',
      location: reporter.location ?? '',
      designation: reporter.designation ?? 'Reporter',
      bio: reporter.bio ?? '',
      status: reporter.status ?? 'active',
    });
    setErrors({});
    setModalOpen(true);
  };
  const submit = async () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.';
    setErrors(nextErrors); if (Object.keys(nextErrors).length) return;
    const payload = { name: form.name.trim(), email: form.email.trim() || undefined, phone: form.phone.trim() || undefined, location: form.location.trim() || undefined, designation: form.designation.trim() || undefined, bio: form.bio.trim() || undefined, status: form.status };
    setSubmitting(true);
    try { if (editing) await reportersApi.update(editing.id, payload); else await reportersApi.create(payload); await loadReporters(); setModalOpen(false); toast.success(editing ? 'Reporter updated' : 'Reporter added', `${payload.name}'s profile has been saved.`); }
    catch (error) { setErrors({ submit: messageOf(error) }); }
    finally { setSubmitting(false); }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await reportersApi.remove(deleteTarget.id); await loadReporters(); toast.success('Reporter removed', `${deleteTarget.name} was removed.`); }
    catch (error) { toast.error('Unable to remove reporter', messageOf(error)); }
    finally { setDeleteTarget(null); }
  };

  return <div>
    <PageHead eyebrow="Team" title="Reporters" desc="Manage the reporters and correspondents writing for your newsroom." actions={canCreate ? <button className="btn btn-primary" onClick={openAdd}><Plus />Add Reporter</button> : null} />
    {loading ? <div className="card"><div className="empty-state"><div className="t">Loading reporters…</div></div></div> : loadError ? <div className="card"><div className="empty-state"><div className="t">Unable to load reporters</div><div>{loadError}</div><button className="btn btn-secondary" onClick={loadReporters}>Retry</button></div></div> : reporters.length === 0 ? <div className="card"><EmptyState icon={Users} title="No reporters yet" message="Add your first reporter to get started." /></div> : <div className="reporter-grid">{reporters.map((reporter) => <div className="card card-pad reporter-card" key={reporter.id}>
      <div className="reporter-avatar">{reporter.avatar || reporter.avatarUrl ? <img src={reporter.avatar || reporter.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initials(reporter.name)}</div><div style={{ fontWeight: 700, fontSize: 14.5 }}>{reporter.name}</div><div className="muted" style={{ fontSize: 12.5, marginBottom: 8 }}>{reporter.designation || 'Reporter'}</div><span className={`pill pill-${reporter.status}`}>{reporter.status}</span><div className="divider" /><div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>{reporter.email && <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Mail style={{ width: 13, height: 13 }} />{reporter.email}</div>}{reporter.location && <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><MapPin style={{ width: 13, height: 13 }} />{reporter.location}</div>}<div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><FileText style={{ width: 13, height: 13 }} />{reporter.articleCount ?? 0} articles</div></div><div style={{ display: 'flex', gap: 8, marginTop: 14 }}><button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setProfileOpen(reporter)}>View Profile</button>{canEdit && <button className="action-btn" onClick={() => openEdit(reporter)} aria-label={`Edit ${reporter.name}`}><Edit2 /></button>}{canDelete && <button className="action-btn danger" onClick={() => setDeleteTarget(reporter)} aria-label={`Delete ${reporter.name}`}><Trash2 /></button>}</div>
    </div>)}</div>}
    <Modal open={modalOpen} onClose={() => !submitting && setModalOpen(false)} title={editing ? 'Edit Reporter' : 'Add Reporter'} footer={<><button className="btn btn-secondary" disabled={submitting} onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={submitting} onClick={submit}>{submitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Reporter'}</button></>} wide><div className="form-grid"><div className="field span-2"><label>Full Name *</label><input className={`input ${errors.name ? 'error' : ''}`} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />{errors.name && <div className="field-error">{errors.name}</div>}</div><div className="field"><label>Email</label><input className={`input ${errors.email ? 'error' : ''}`} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />{errors.email && <div className="field-error">{errors.email}</div>}</div><div className="field"><label>Phone</label><input className="input" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div><div className="field"><label>Location</label><input className="input" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></div><div className="field"><label>Designation</label><input className="input" value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} /></div><div className="field"><label>Status</label><select className="select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></div><div className="field span-2"><label>Bio</label><textarea className="input" rows={3} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></div>{errors.submit && <div className="field-error span-2">{errors.submit}</div>}</div></Modal>
    <Modal open={!!profileOpen} onClose={() => setProfileOpen(null)} title="Reporter Profile">{profileOpen && <div style={{ textAlign: 'center' }}><div className="reporter-avatar" style={{ width: 76, height: 76, fontSize: 26 }}>{initials(profileOpen.name)}</div><h3 style={{ fontSize: 18 }}>{profileOpen.name}</h3><div className="muted" style={{ fontSize: 13 }}>{profileOpen.designation || 'Reporter'}{profileOpen.location ? ` · ${profileOpen.location}` : ''}</div><p className="muted" style={{ fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>{profileOpen.bio || 'No bio provided.'}</p><div className="divider" /><div className="grid-2" style={{ textAlign: 'left' }}><div><div className="faint" style={{ fontSize: 11 }}>EMAIL</div><div style={{ fontSize: 13, fontWeight: 600 }}>{profileOpen.email || '—'}</div></div><div><div className="faint" style={{ fontSize: 11 }}>PHONE</div><div style={{ fontSize: 13, fontWeight: 600 }}>{profileOpen.phone || '—'}</div></div></div></div>}</Modal>
    <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Remove this reporter?" message={`${deleteTarget?.name || ''} will be removed if they have no linked articles.`} />
  </div>;
}

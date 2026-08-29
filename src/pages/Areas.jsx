import { useCallback, useEffect, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, MapPin } from '../components/ui/Icons.jsx';
import { taxonomyApi } from '../api/taxonomy.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const emptyForm = { name: '', slug: '' };
const messageOf = (error) => error?.message || 'Something went wrong. Please try again.';

export default function Areas() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const canCreate = hasPermission('categories.create');
  const canEdit = hasPermission('categories.edit');
  const canDelete = hasPermission('categories.delete');

  const loadAreas = useCallback(async () => {
    setLoading(true); setLoadError('');
    try { const data = await taxonomyApi.areas.list(); setAreas(Array.isArray(data) ? data : []); }
    catch (error) { setLoadError(messageOf(error)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadAreas(); }, [loadAreas]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (area) => { setEditing(area); setForm({ name: area.name || '', slug: area.slug || '' }); setErrors({}); setModalOpen(true); };
  const submit = async () => {
    if (!form.name.trim()) { setErrors({ name: 'Area name is required.' }); return; }
    const payload = { name: form.name.trim(), slug: form.slug.trim() || undefined };
    setSubmitting(true); setErrors({});
    try { if (editing) await taxonomyApi.areas.update(editing.id, payload); else await taxonomyApi.areas.create(payload); await loadAreas(); setModalOpen(false); toast.success(editing ? 'Area updated' : 'Area created', `"${payload.name}" has been saved.`); }
    catch (error) { setErrors({ submit: messageOf(error) }); }
    finally { setSubmitting(false); }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await taxonomyApi.areas.remove(deleteTarget.id); await loadAreas(); toast.success('Area deleted', `"${deleteTarget.name}" was removed.`); }
    catch (error) { toast.error('Unable to delete area', messageOf(error)); }
    finally { setDeleteTarget(null); }
  };

  return <div>
    <PageHead eyebrow="Content" title="Areas" desc="Manage geographic areas used to organize local news." actions={canCreate ? <button className="btn btn-primary" onClick={openAdd}><Plus />Add Area</button> : null} />
    <div className="card">{loading ? <div className="empty-state"><div className="t">Loading areas…</div></div> : loadError ? <div className="empty-state"><div className="t">Unable to load areas</div><div>{loadError}</div><button className="btn btn-secondary" onClick={loadAreas}>Retry</button></div> : areas.length === 0 ? <EmptyState icon={MapPin} title="No areas yet" message="Add an area to organize local coverage." /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Area</th><th>Slug</th>{(canEdit || canDelete) && <th style={{ textAlign: 'right' }}>Actions</th>}</tr></thead><tbody>{areas.map((area) => <tr key={area.id}><td><div style={{ fontWeight: 700 }}>{area.name}</div></td><td className="faint">/{area.slug}</td>{(canEdit || canDelete) && <td><div className="action-cell" style={{ justifyContent: 'flex-end' }}>{canEdit && <button className="action-btn" onClick={() => openEdit(area)} aria-label={`Edit ${area.name}`}><Edit2 /></button>}{canDelete && <button className="action-btn danger" onClick={() => setDeleteTarget(area)} aria-label={`Delete ${area.name}`}><Trash2 /></button>}</div></td>}</tr>)}</tbody></table></div>}</div>
    <Modal open={modalOpen} onClose={() => !submitting && setModalOpen(false)} title={editing ? 'Edit Area' : 'Add Area'} footer={<><button className="btn btn-secondary" disabled={submitting} onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={submitting} onClick={submit}>{submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Area'}</button></>}><div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><div className="field"><label>Area Name *</label><input className={`input ${errors.name ? 'error' : ''}`} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />{errors.name && <div className="field-error">{errors.name}</div>}</div><div className="field"><label>URL Slug</label><input className="input" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="auto-generated if blank" /></div>{errors.submit && <div className="field-error">{errors.submit}</div>}</div></Modal>
    <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete this area?" message={`"${deleteTarget?.name || ''}" will be permanently removed if it is not in use.`} />
  </div>;
}

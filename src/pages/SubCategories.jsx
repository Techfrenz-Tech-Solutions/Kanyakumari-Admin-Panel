import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Tag, Search } from '../components/ui/Icons.jsx';
import { taxonomyApi } from '../api/taxonomy.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const emptyForm = { name: '', slug: '', categoryId: '', description: '', status: 'active' };
const messageOf = (error) => error?.message || 'Something went wrong. Please try again.';
const categoryName = (subcategory, categories) => subcategory.parentCategory || categories.find((item) => String(item.id) === String(subcategory.parentCategoryId))?.name || '—';

export default function SubCategories() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const canCreate = hasPermission('categories.create');
  const canEdit = hasPermission('categories.edit');
  const canDelete = hasPermission('categories.delete');

  const loadData = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const [subcategoryData, categoryData] = await Promise.all([taxonomyApi.subcategories.list(), taxonomyApi.categories.list()]);
      setSubcategories(Array.isArray(subcategoryData) ? subcategoryData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (error) { setLoadError(messageOf(error)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => subcategories.filter((subcategory) => {
    const parent = categoryName(subcategory, categories);
    return (categoryFilter === 'all' || String(subcategory.parentCategoryId) === categoryFilter)
      && (!query.trim() || `${subcategory.name} ${parent}`.toLowerCase().includes(query.trim().toLowerCase()));
  }), [subcategories, categories, query, categoryFilter]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (subcategory) => {
    setEditing(subcategory);
    setForm({ name: subcategory.name || '', slug: subcategory.slug || '', categoryId: String(subcategory.parentCategoryId ?? ''), description: subcategory.description || '', status: subcategory.status || 'active' });
    setErrors({}); setModalOpen(true);
  };
  const submit = async () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (!form.categoryId) nextErrors.categoryId = 'Parent category is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const payload = { name: form.name.trim(), slug: form.slug.trim() || undefined, parentCategory: Number(form.categoryId), description: form.description.trim() || null, status: form.status };
    setSubmitting(true);
    try {
      if (editing) await taxonomyApi.subcategories.update(editing.id, payload); else await taxonomyApi.subcategories.create(payload);
      await loadData(); setModalOpen(false);
      toast.success(editing ? 'Sub-category updated' : 'Sub-category created', `"${payload.name}" has been saved.`);
    } catch (error) { setErrors({ submit: messageOf(error) }); }
    finally { setSubmitting(false); }
  };
  const toggleStatus = async (subcategory) => {
    try { await taxonomyApi.subcategories.update(subcategory.id, { status: subcategory.status === 'active' ? 'inactive' : 'active' }); await loadData(); toast.info('Status updated', `"${subcategory.name}" status changed.`); }
    catch (error) { toast.error('Unable to update status', messageOf(error)); }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await taxonomyApi.subcategories.remove(deleteTarget.id); await loadData(); toast.success('Sub-category deleted', `"${deleteTarget.name}" was removed.`); }
    catch (error) { toast.error('Unable to delete sub-category', messageOf(error)); }
    finally { setDeleteTarget(null); }
  };

  return <div>
    <PageHead eyebrow="Content" title="Sub Categories" desc="Manage sub-sections within each news category." actions={canCreate ? <button className="btn btn-primary" onClick={openAdd}><Plus />Add Sub-Category</button> : null} />
    <div className="card">
      <div className="table-toolbar"><div className="table-search"><Search /><input placeholder="Search sub-categories…" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="toolbar-filters"><select className="select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">All Categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div></div>
      {loading ? <div className="empty-state"><div className="t">Loading sub-categories…</div></div>
        : loadError ? <div className="empty-state"><div className="t">Unable to load sub-categories</div><div>{loadError}</div><button className="btn btn-secondary" onClick={loadData}>Retry</button></div>
          : filtered.length === 0 ? <EmptyState icon={Tag} title="No sub-categories found" message="Add a sub-category or adjust your filters." /> :
            <div className="table-scroll"><table className="data-table"><thead><tr><th>Sub-Category</th><th>Parent Category</th><th>Description</th><th>Articles</th><th>Status</th>{(canEdit || canDelete) && <th style={{ textAlign: 'right' }}>Actions</th>}</tr></thead><tbody>{filtered.map((subcategory) => <tr key={subcategory.id}>
              <td><div style={{ fontWeight: 700 }}>{subcategory.name}</div><div className="faint" style={{ fontSize: 11.5 }}>/{subcategory.slug}</div></td>
              <td><span className="pill pill-scheduled" style={{ textTransform: 'none' }}>{categoryName(subcategory, categories)}</span></td><td className="faint">{subcategory.description || '—'}</td><td className="mono">{subcategory.articleCount ?? 0}</td>
              <td>{canEdit ? <label className="switch"><input type="checkbox" checked={subcategory.status === 'active'} onChange={() => toggleStatus(subcategory)} aria-label={`Toggle ${subcategory.name} status`} /><span className="slider" /></label> : <span className={`pill pill-${subcategory.status}`}>{subcategory.status}</span>}</td>
              {(canEdit || canDelete) && <td><div className="action-cell" style={{ justifyContent: 'flex-end' }}>{canEdit && <button className="action-btn" onClick={() => openEdit(subcategory)} aria-label={`Edit ${subcategory.name}`}><Edit2 /></button>}{canDelete && <button className="action-btn danger" onClick={() => setDeleteTarget(subcategory)} aria-label={`Delete ${subcategory.name}`}><Trash2 /></button>}</div></td>}
            </tr>)}</tbody></table></div>}
    </div>
    <Modal open={modalOpen} onClose={() => !submitting && setModalOpen(false)} title={editing ? 'Edit Sub-Category' : 'Add Sub-Category'} footer={<><button className="btn btn-secondary" disabled={submitting} onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={submitting} onClick={submit}>{submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Sub-Category'}</button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><div className="field"><label>Sub-Category Name *</label><input className={`input ${errors.name ? 'error' : ''}`} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />{errors.name && <div className="field-error">{errors.name}</div>}</div><div className="field"><label>URL Slug</label><input className="input" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="auto-generated if blank" /></div><div className="field"><label>Parent Category *</label><select className={`select ${errors.categoryId ? 'error' : ''}`} value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">Select parent category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{errors.categoryId && <div className="field-error">{errors.categoryId}</div>}</div><div className="field"><label>Description</label><textarea className="input" rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div><div className="field"><label>Status</label><select className="select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>{errors.submit && <div className="field-error">{errors.submit}</div>}</div>
    </Modal>
    <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete this sub-category?" message={`"${deleteTarget?.name || ''}" will be permanently removed if it is not in use.`} />
  </div>;
}

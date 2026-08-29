import { useCallback, useEffect, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Tag } from '../components/ui/Icons.jsx';
import { taxonomyApi } from '../api/taxonomy.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const emptyForm = { name: '', slug: '', status: 'active', sortOrder: 0 };
const messageOf = (error) => error?.message || 'Something went wrong. Please try again.';
const subcategoryNames = (category) => (category.subcategories || []).map((item) => (typeof item === 'string' ? item : item.name));

export default function Categories() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState([]);
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

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await taxonomyApi.categories.list();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      setLoadError(messageOf(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (category) => {
    setEditing(category);
    setForm({
      name: category.name || '', slug: category.slug || '',
      status: category.status || 'active', sortOrder: category.sortOrder ?? 0,
    });
    setErrors({});
    setModalOpen(true);
  };

  const submit = async () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Category name is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const payload = {
      name: form.name.trim(), slug: form.slug.trim() || undefined,
      status: form.status, sortOrder: Number(form.sortOrder) || 0,
    };
    setSubmitting(true);
    try {
      if (editing) await taxonomyApi.categories.update(editing.id, payload);
      else await taxonomyApi.categories.create(payload);
      await loadCategories();
      setModalOpen(false);
      toast.success(editing ? 'Category updated' : 'Category created', `"${payload.name}" has been saved.`);
    } catch (error) {
      setErrors({ submit: messageOf(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (category) => {
    try {
      await taxonomyApi.categories.update(category.id, { status: category.status === 'active' ? 'inactive' : 'active' });
      await loadCategories();
      toast.info('Status updated', `"${category.name}" status changed.`);
    } catch (error) {
      toast.error('Unable to update status', messageOf(error));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await taxonomyApi.categories.remove(deleteTarget.id);
      await loadCategories();
      toast.success('Category deleted', `"${deleteTarget.name}" was removed.`);
    } catch (error) {
      toast.error('Unable to delete category', messageOf(error));
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <PageHead eyebrow="Content" title="Categories" desc="Organize news sections and their sub-categories."
        actions={canCreate ? <button className="btn btn-primary" onClick={openAdd}><Plus />Add Category</button> : null} />
      <div className="card">
        {loading ? <div className="empty-state"><div className="t">Loading categories…</div></div>
          : loadError ? <div className="empty-state"><div className="t">Unable to load categories</div><div>{loadError}</div><button className="btn btn-secondary" onClick={loadCategories}>Retry</button></div>
            : categories.length === 0 ? <EmptyState icon={Tag} title="No categories yet" message="Create your first category to organize news." /> : (
              <div className="table-scroll"><table className="data-table">
                <thead><tr><th>Category</th><th>Sub-categories</th><th>Articles</th><th>Status</th>{(canEdit || canDelete) && <th style={{ textAlign: 'right' }}>Actions</th>}</tr></thead>
                <tbody>{categories.map((category) => (
                  <tr key={category.id}>
                    <td><div style={{ fontWeight: 700 }}>{category.name}</div><div className="faint" style={{ fontSize: 11.5 }}>/{category.slug}</div></td>
                    <td><div className="chip-row">{subcategoryNames(category).length ? subcategoryNames(category).map((name) => <span key={name} className="pill pill-scheduled" style={{ textTransform: 'none' }}>{name}</span>) : <span className="faint">—</span>}</div></td>
                    <td className="mono">{category.articleCount ?? 0}</td>
                    <td>{canEdit ? <label className="switch"><input type="checkbox" checked={category.status === 'active'} onChange={() => toggleStatus(category)} aria-label={`Toggle ${category.name} status`} /><span className="slider" /></label> : <span className={`pill pill-${category.status}`}>{category.status}</span>}</td>
                    {(canEdit || canDelete) && <td><div className="action-cell" style={{ justifyContent: 'flex-end' }}>{canEdit && <button className="action-btn" onClick={() => openEdit(category)} aria-label={`Edit ${category.name}`}><Edit2 /></button>}{canDelete && <button className="action-btn danger" onClick={() => setDeleteTarget(category)} aria-label={`Delete ${category.name}`}><Trash2 /></button>}</div></td>}
                  </tr>
                ))}</tbody>
              </table></div>
            )}
      </div>
      <Modal open={modalOpen} onClose={() => !submitting && setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'} footer={<><button className="btn btn-secondary" disabled={submitting} onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={submitting} onClick={submit}>{submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Category'}</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field"><label>Category Name *</label><input className={`input ${errors.name ? 'error' : ''}`} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />{errors.name && <div className="field-error">{errors.name}</div>}</div>
          <div className="field"><label>URL Slug</label><input className="input" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="auto-generated if blank" /></div>
          <div className="grid-2"><div className="field"><label>Status</label><select className="select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></div><div className="field"><label>Sort Order</label><input className="input" type="number" min="0" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} /></div></div>
          {errors.submit && <div className="field-error">{errors.submit}</div>}
        </div>
      </Modal>
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete this category?" message={`"${deleteTarget?.name || ''}" will be permanently removed if it is not in use.`} />
    </div>
  );
}

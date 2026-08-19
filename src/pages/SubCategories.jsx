import { useMemo, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Tag, Search } from '../components/ui/Icons.jsx';
import { loadData, saveData, uid } from '../utils/storage.js';
import { seedSubCategories, seedCategories } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const emptyForm = { name: '', slug: '', parentCategory: '', description: '', status: 'active' };

export default function SubCategories() {
  const toast = useToast();
  const [subcats, setSubcats] = useState(() => loadData('subcategories', seedSubCategories));
  const categories = loadData('categories', seedCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const persist = (list) => { setSubcats(list); saveData('subcategories', list); };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, slug: s.slug, parentCategory: s.parentCategory, description: s.description || '', status: s.status });
    setErrors({});
    setModalOpen(true);
  };

  const filtered = useMemo(() => {
    let list = [...subcats];
    if (catFilter !== 'all') list = list.filter((s) => s.parentCategory === catFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.parentCategory.toLowerCase().includes(q));
    }
    return list;
  }, [subcats, query, catFilter]);

  const submit = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.parentCategory) errs.parentCategory = 'Parent category is required.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const record = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
      parentCategory: form.parentCategory,
      description: form.description,
      status: form.status,
    };

    if (editing) {
      persist(subcats.map((s) => (s.id === editing.id ? { ...s, ...record } : s)));
      toast.success('Sub-category updated', `"${form.name}" saved.`);
    } else {
      persist([{ id: uid('sub'), ...record, articleCount: 0 }, ...subcats]);
      toast.success('Sub-category created', `"${form.name}" added under ${form.parentCategory}.`);
    }
    setModalOpen(false);
  };

  const toggleStatus = (s) => {
    persist(subcats.map((c) => (c.id === s.id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c)));
    toast.info('Status updated', `"${s.name}" status changed.`);
  };

  const confirmDelete = () => {
    persist(subcats.filter((s) => s.id !== deleteTarget.id));
    toast.success('Deleted', `"${deleteTarget.name}" removed.`);
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHead
        eyebrow="Content"
        title="Sub Categories"
        desc="Manage sub-sections within each news category."
        actions={<button className="btn btn-primary" onClick={openAdd}><Plus />Add Sub-Category</button>}
      />

      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <Search />
            <input placeholder="Search sub-categories…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="toolbar-filters">
            <select className="select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Tag} title="No sub-categories found" message="Add sub-categories to help organize news content." />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sub-Category</th>
                  <th>Parent Category</th>
                  <th>Description</th>
                  <th>Articles</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{s.name}</div>
                      <div className="faint" style={{ fontSize: 11.5 }}>/{s.slug}</div>
                    </td>
                    <td>
                      <span className="pill pill-scheduled" style={{ textTransform: 'none' }}>{s.parentCategory}</span>
                    </td>
                    <td className="faint" style={{ fontSize: 12.5 }}>{s.description || '—'}</td>
                    <td className="mono">{s.articleCount || 0}</td>
                    <td>
                      <label className="switch">
                        <input type="checkbox" checked={s.status === 'active'} onChange={() => toggleStatus(s)} />
                        <span className="slider" />
                      </label>
                    </td>
                    <td>
                      <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                        <span className="action-btn" onClick={() => openEdit(s)}><Edit2 /></span>
                        <span className="action-btn danger" onClick={() => setDeleteTarget(s)}><Trash2 /></span>
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
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Sub-Category' : 'Add Sub-Category'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>{editing ? 'Save Changes' : 'Create Sub-Category'}</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Sub-Category Name *</label>
            <input className={`input ${errors.name ? 'error' : ''}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kollywood" />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>
          <div className="field">
            <label>URL Slug</label>
            <input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated if blank" />
          </div>
          <div className="field">
            <label>Parent Category *</label>
            <select className={`select ${errors.parentCategory ? 'error' : ''}`} value={form.parentCategory} onChange={(e) => setForm({ ...form, parentCategory: e.target.value })}>
              <option value="">Select parent category</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            {errors.parentCategory && <div className="field-error">{errors.parentCategory}</div>}
          </div>
          <div className="field">
            <label>Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of this sub-category" />
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
        title="Delete this sub-category?"
        message={`"${deleteTarget?.name || ''}" will be removed. Articles tagged with this sub-category will keep their tag.`}
      />
    </div>
  );
}

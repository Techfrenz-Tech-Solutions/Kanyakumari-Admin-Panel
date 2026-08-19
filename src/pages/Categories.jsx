import { useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Tag } from '../components/ui/Icons.jsx';
import { loadData, saveData, uid } from '../utils/storage.js';
import { seedCategories } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const emptyForm = { name: '', subcategories: '', status: 'active' };

export default function Categories() {
  const toast = useToast();
  const [categories, setCategories] = useState(() => loadData('categories', seedCategories));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const persist = (list) => { setCategories(list); saveData('categories', list); };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, subcategories: cat.subcategories.join(', '), status: cat.status });
    setErrors({});
    setModalOpen(true);
  };

  const submit = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Category name is required.';
    if (!editing && categories.some((c) => c.name.toLowerCase() === form.name.trim().toLowerCase())) errs.name = 'A category with this name already exists.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const subs = form.subcategories.split(',').map((s) => s.trim()).filter(Boolean);
    if (editing) {
      persist(categories.map((c) => (c.id === editing.id ? { ...c, name: form.name, subcategories: subs, status: form.status } : c)));
      toast.success('Category updated', `"${form.name}" has been saved.`);
    } else {
      persist([{ id: uid('cat'), name: form.name, slug: form.name.toLowerCase().replace(/\s+/g, '-'), subcategories: subs, status: form.status, articleCount: 0 }, ...categories]);
      toast.success('Category created', `"${form.name}" has been added.`);
    }
    setModalOpen(false);
  };

  const toggleStatus = (cat) => {
    persist(categories.map((c) => (c.id === cat.id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c)));
    toast.info('Status updated', `"${cat.name}" is now ${cat.status === 'active' ? 'disabled' : 'enabled'}.`);
  };

  const confirmDelete = () => {
    persist(categories.filter((c) => c.id !== deleteTarget.id));
    toast.success('Category deleted', `"${deleteTarget.name}" was removed.`);
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHead
        eyebrow="Content"
        title="Categories"
        desc="Organize news sections and their sub-categories."
        actions={<button className="btn btn-primary" onClick={openAdd}><Plus />Add Category</button>}
      />

      <div className="card">
        {categories.length === 0 ? (
          <EmptyState icon={Tag} title="No categories yet" message="Create your first category to organize news." />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Sub-categories</th>
                  <th>Articles</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td><div style={{ fontWeight: 700 }}>{c.name}</div><div className="faint" style={{ fontSize: 11.5 }}>/{c.slug}</div></td>
                    <td>
                      <div className="chip-row">
                        {c.subcategories.length ? c.subcategories.map((s) => (
                          <span key={s} className="pill pill-scheduled" style={{ textTransform: 'none' }}>{s}</span>
                        )) : <span className="faint">—</span>}
                      </div>
                    </td>
                    <td className="mono">{c.articleCount}</td>
                    <td>
                      <label className="switch">
                        <input type="checkbox" checked={c.status === 'active'} onChange={() => toggleStatus(c)} />
                        <span className="slider" />
                      </label>
                    </td>
                    <td>
                      <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                        <span className="action-btn" onClick={() => openEdit(c)}><Edit2 /></span>
                        <span className="action-btn danger" onClick={() => setDeleteTarget(c)}><Trash2 /></span>
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
        title={editing ? 'Edit Category' : 'Add Category'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>{editing ? 'Save Changes' : 'Create Category'}</button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Category Name *</label>
            <input className={`input ${errors.name ? 'error' : ''}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Technology" />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>
          <div className="field">
            <label>Sub-categories</label>
            <input className="input" value={form.subcategories} onChange={(e) => setForm({ ...form, subcategories: e.target.value })} placeholder="Comma separated, e.g. AI, Mobiles, Startups" />
            <div className="hint">Separate multiple sub-categories with commas.</div>
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
        title="Delete this category?"
        message={`"${deleteTarget?.name || ''}" will be removed. Articles in this category will keep their tag but the section will no longer appear in the menu.`}
      />
    </div>
  );
}

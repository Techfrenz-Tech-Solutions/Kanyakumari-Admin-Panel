import { useRef, useState, useMemo } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Gallery, Upload, Search, Eye, X } from '../components/ui/Icons.jsx';
import { loadData, saveData, uid } from '../utils/storage.js';
import { seedGalleries, seedCategories } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const emptyForm = { title: '', description: '', category: '', coverImage: '', status: 'published', images: [] };

export default function PhotoGallery() {
  const toast = useToast();
  const coverRef = useRef(null);
  const imagesRef = useRef(null);
  const [galleries, setGalleries] = useState(() => loadData('galleries', seedGalleries));
  const categories = loadData('categories', seedCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewGallery, setViewGallery] = useState(null);
  const [query, setQuery] = useState('');

  const persist = (list) => { setGalleries(list); saveData('galleries', list); };

  const filtered = useMemo(() => {
    if (!query.trim()) return galleries;
    const q = query.toLowerCase();
    return galleries.filter((g) => g.title.toLowerCase().includes(q) || g.category.toLowerCase().includes(q));
  }, [galleries, query]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (g) => {
    setEditing(g);
    setForm({ title: g.title, description: g.description, category: g.category, coverImage: g.coverImage, status: g.status, images: g.images || [] });
    setErrors({});
    setModalOpen(true);
  };

  const handleCover = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, coverImage: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    let done = 0;
    const newImages = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newImages.push({ id: uid('gi'), url: reader.result, caption: file.name.replace(/\.[^.]+$/, '') });
        done++;
        if (done === files.length) {
          setForm((f) => ({ ...f, images: [...f.images, ...newImages] }));
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (id) => setForm((f) => ({ ...f, images: f.images.filter((img) => img.id !== id) }));

  const submit = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Gallery title is required.';
    if (!form.category) errs.category = 'Category is required.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (editing) {
      persist(galleries.map((g) => (g.id === editing.id ? { ...g, ...form } : g)));
      toast.success('Gallery updated', `"${form.title}" saved.`);
    } else {
      persist([{ id: uid('gal'), ...form, createdAt: new Date().toISOString().slice(0, 10) }, ...galleries]);
      toast.success('Gallery created', `"${form.title}" with ${form.images.length} photos.`);
    }
    setModalOpen(false);
  };

  const toggleStatus = (g) => {
    persist(galleries.map((gal) => (gal.id === g.id ? { ...gal, status: gal.status === 'published' ? 'draft' : 'published' } : gal)));
    toast.info('Status updated', `"${g.title}" is now ${g.status === 'published' ? 'draft' : 'published'}.`);
  };

  const confirmDelete = () => {
    persist(galleries.filter((g) => g.id !== deleteTarget.id));
    toast.success('Gallery deleted', `"${deleteTarget.title}" removed.`);
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHead
        eyebrow="Media"
        title="Photo Gallery"
        desc="Create and manage photo galleries for events, news and features."
        actions={<button className="btn btn-primary" onClick={openAdd}><Plus />Create Gallery</button>}
      />

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="table-search" style={{ maxWidth: 340 }}>
          <Search />
          <input placeholder="Search galleries…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon={Gallery} title="No galleries found" message="Create photo galleries for events and news stories." /></div>
      ) : (
        <div className="reporter-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {filtered.map((g) => (
            <div className="card" key={g.id} style={{ overflow: 'hidden' }}>
              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setViewGallery(g)}>
                <img src={g.coverImage} alt={g.title} style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                  {g.images?.length || 0} photos
                </div>
                <div style={{ position: 'absolute', top: 8, left: 8 }}>
                  <span className={`pill pill-${g.status}`} style={{ fontSize: 10 }}>{g.status}</span>
                </div>
              </div>
              <div className="card-pad">
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>{g.title}</div>
                <div className="faint" style={{ fontSize: 11.5, marginBottom: 4 }}>{g.category} · {g.createdAt}</div>
                {g.description && <p className="muted" style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>{g.description.slice(0, 70)}…</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setViewGallery(g)}><Eye />View</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(g)}><Edit2 /></button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(g)}>{g.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                  <span className="action-btn danger" onClick={() => setDeleteTarget(g)}><Trash2 /></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Gallery Modal */}
      <Modal open={!!viewGallery} onClose={() => setViewGallery(null)} title={viewGallery?.title || 'Gallery'} wide>
        {viewGallery && (
          <div>
            <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>{viewGallery.description}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
              {(viewGallery.images || []).map((img) => (
                <div key={img.id} style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                  <img src={img.url} alt={img.caption} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
                  {img.caption && <div style={{ fontSize: 10.5, padding: '4px 6px', background: 'var(--surface-2)', color: 'var(--text-faint)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{img.caption}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Gallery' : 'Create Gallery'}
        wide
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>{editing ? 'Save Changes' : 'Create Gallery'}</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-grid">
            <div className="field span-2">
              <label>Gallery Title *</label>
              <input className={`input ${errors.title ? 'error' : ''}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              {errors.title && <div className="field-error">{errors.title}</div>}
            </div>
            <div className="field">
              <label>Category *</label>
              <select className={`select ${errors.category ? 'error' : ''}`} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              {errors.category && <div className="field-error">{errors.category}</div>}
            </div>
            <div className="field">
              <label>Status</label>
              <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="field span-2">
              <label>Description</label>
              <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          <div className="field">
            <label>Cover Image</label>
            {form.coverImage ? (
              <div className="image-preview"><img src={form.coverImage} alt="" style={{ aspectRatio: '16/9' }} /><button className="remove-btn" onClick={() => setForm({ ...form, coverImage: '' })}>×</button></div>
            ) : (
              <div className="dropzone" onClick={() => coverRef.current?.click()}><Upload /><div style={{ fontSize: 12.5 }}>Upload cover image</div></div>
            )}
            <input ref={coverRef} type="file" accept="image/*" hidden onChange={handleCover} />
          </div>

          <div className="field">
            <label>Gallery Images ({form.images.length} added)</label>
            <div className="dropzone" onClick={() => imagesRef.current?.click()}>
              <Upload /><div style={{ fontSize: 12.5 }}>Click to add photos (multiple selection allowed)</div>
            </div>
            <input ref={imagesRef} type="file" accept="image/*" multiple hidden onChange={handleImages} />
            {form.images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 6, marginTop: 10 }}>
                {form.images.map((img) => (
                  <div key={img.id} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden' }}>
                    <img src={img.url} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
                    <button onClick={() => removeImage(img.id)} style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this gallery?"
        message={`"${deleteTarget?.title || ''}" and all its photos will be permanently removed.`}
      />
    </div>
  );
}

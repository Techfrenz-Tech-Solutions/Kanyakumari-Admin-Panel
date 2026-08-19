import { useRef, useState, useMemo } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Video, Search, Play, Upload, Eye } from '../components/ui/Icons.jsx';
import { loadData, saveData, uid } from '../utils/storage.js';
import { seedVideos, seedCategories } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const VIDEO_TYPES = ['youtube', 'vimeo', 'uploaded'];
const emptyForm = { title: '', thumbnail: '', url: '', type: 'youtube', category: '', duration: '', description: '', status: 'published' };

export default function VideoLibrary() {
  const toast = useToast();
  const thumbRef = useRef(null);
  const [videos, setVideos] = useState(() => loadData('videos', seedVideos));
  const categories = loadData('categories', seedCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [preview, setPreview] = useState(null);
  const [query, setQuery] = useState('');

  const persist = (list) => { setVideos(list); saveData('videos', list); };

  const filtered = useMemo(() => {
    if (!query.trim()) return videos;
    const q = query.toLowerCase();
    return videos.filter((v) => v.title.toLowerCase().includes(q) || v.category.toLowerCase().includes(q));
  }, [videos, query]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (v) => { setEditing(v); setForm({ ...emptyForm, ...v }); setErrors({}); setModalOpen(true); };

  const handleThumb = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, thumbnail: reader.result }));
    reader.readAsDataURL(file);
  };

  const submit = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.category) errs.category = 'Category is required.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (editing) {
      persist(videos.map((v) => (v.id === editing.id ? { ...v, ...form } : v)));
      toast.success('Video updated', `"${form.title}" saved.`);
    } else {
      persist([{ id: uid('vid'), ...form, uploadedAt: new Date().toISOString().slice(0, 10) }, ...videos]);
      toast.success('Video added', `"${form.title}" added to the library.`);
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    persist(videos.filter((v) => v.id !== deleteTarget.id));
    toast.success('Video deleted', `"${deleteTarget.title}" removed.`);
    setDeleteTarget(null);
  };

  const typeColor = { youtube: '#ff0000', vimeo: '#1ab7ea', uploaded: 'var(--green-500)' };

  return (
    <div>
      <PageHead
        eyebrow="Media"
        title="Video Library"
        desc="Manage YouTube, Vimeo and uploaded video content."
        actions={<button className="btn btn-primary" onClick={openAdd}><Plus />Add Video</button>}
      />

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="table-search" style={{ maxWidth: 340 }}>
          <Search />
          <input placeholder="Search videos…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon={Video} title="No videos found" message="Add video content from YouTube, Vimeo or upload directly." /></div>
      ) : (
        <div className="reporter-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {filtered.map((v) => (
            <div className="card" key={v.id} style={{ overflow: 'hidden' }}>
              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setPreview(v)}>
                <img src={v.thumbnail} alt={v.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play style={{ width: 18, height: 18, color: '#111', marginLeft: 2 }} />
                  </span>
                </div>
                {v.duration && (
                  <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{v.duration}</span>
                )}
              </div>
              <div className="card-pad">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: typeColor[v.type], textTransform: 'uppercase' }}>{v.type}</span>
                  <span className={`pill pill-${v.status}`} style={{ fontSize: 10 }}>{v.status}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                <div className="faint" style={{ fontSize: 11.5 }}>{v.category} · {v.uploadedAt}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(v)}><Edit2 />Edit</button>
                  <span className="action-btn danger" onClick={() => setDeleteTarget(v)}><Trash2 /></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.title || 'Video Preview'} wide>
        {preview && (
          <div>
            <div style={{ background: '#000', borderRadius: 8, overflow: 'hidden', marginBottom: 16, aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {preview.type === 'youtube' && preview.url ? (
                <img src={preview.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <img src={preview.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{preview.title}</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>{preview.description}</p>
            <div className="grid-2">
              <div><div className="faint" style={{ fontSize: 10.5 }}>TYPE</div><div style={{ fontSize: 12.5, fontWeight: 600, textTransform: 'capitalize' }}>{preview.type}</div></div>
              <div><div className="faint" style={{ fontSize: 10.5 }}>CATEGORY</div><div style={{ fontSize: 12.5, fontWeight: 600 }}>{preview.category}</div></div>
              <div><div className="faint" style={{ fontSize: 10.5 }}>DURATION</div><div style={{ fontSize: 12.5, fontWeight: 600 }}>{preview.duration || '—'}</div></div>
              <div><div className="faint" style={{ fontSize: 10.5 }}>UPLOADED</div><div style={{ fontSize: 12.5, fontWeight: 600 }}>{preview.uploadedAt}</div></div>
            </div>
            {preview.url && <div style={{ marginTop: 12 }}><a href={preview.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">Open External Link</a></div>}
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Video' : 'Add Video'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>{editing ? 'Save Changes' : 'Add Video'}</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Video Title *</label>
            <input className={`input ${errors.title ? 'error' : ''}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            {errors.title && <div className="field-error">{errors.title}</div>}
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Video Type</label>
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {VIDEO_TYPES.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Category *</label>
              <select className={`select ${errors.category ? 'error' : ''}`} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              {errors.category && <div className="field-error">{errors.category}</div>}
            </div>
          </div>
          {form.type !== 'uploaded' && (
            <div className="field">
              <label>Video URL (YouTube / Vimeo)</label>
              <input className="input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" />
            </div>
          )}
          <div className="form-grid">
            <div className="field">
              <label>Duration</label>
              <input className="input" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 4:22" />
            </div>
            <div className="field">
              <label>Status</label>
              <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Thumbnail</label>
            {form.thumbnail ? (
              <div className="image-preview">
                <img src={form.thumbnail} alt="" style={{ aspectRatio: '16/9' }} />
                <button className="remove-btn" onClick={() => setForm({ ...form, thumbnail: '' })}>×</button>
              </div>
            ) : (
              <div className="dropzone" onClick={() => thumbRef.current?.click()}>
                <Upload /><div style={{ fontSize: 12.5 }}>Upload thumbnail</div>
              </div>
            )}
            <input ref={thumbRef} type="file" accept="image/*" hidden onChange={handleThumb} />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this video?"
        message={`"${deleteTarget?.title || ''}" will be permanently removed from the library.`}
      />
    </div>
  );
}

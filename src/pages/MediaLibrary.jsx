import { useMemo, useRef, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Upload, Search, Trash2, Eye, Image as ImageIcon } from '../components/ui/Icons.jsx';
import { loadData, saveData, uid } from '../utils/storage.js';
import { seedMedia } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

export default function MediaLibrary() {
  const toast = useToast();
  const [media, setMedia] = useState(() => loadData('media', seedMedia));
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const persist = (list) => { setMedia(list); saveData('media', list); };

  const filtered = useMemo(
    () => media.filter((m) => m.name.toLowerCase().includes(query.toLowerCase())),
    [media, query]
  );

  const handleUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    let processed = 0;
    const newItems = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newItems.push({ id: uid('media'), name: file.name, url: reader.result, size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`, uploadedAt: new Date().toISOString().slice(0, 10) });
        processed += 1;
        if (processed === files.length) {
          persist([...newItems, ...media]);
          toast.success('Upload complete', `${files.length} image${files.length > 1 ? 's' : ''} added to the library.`);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const confirmDelete = () => {
    persist(media.filter((m) => m.id !== deleteTarget.id));
    toast.success('Image deleted', `${deleteTarget.name} was removed.`);
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHead
        eyebrow="Assets"
        title="Media Library"
        desc="Upload and manage images used across your articles and ads."
        actions={<button className="btn btn-primary" onClick={() => fileRef.current?.click()}><Upload />Upload Images</button>}
      />
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleUpload} />

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="table-search" style={{ maxWidth: 340 }}>
          <Search />
          <input placeholder="Search images by name…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon={ImageIcon} title="No images found" message="Upload images or adjust your search." /></div>
      ) : (
        <div className="media-grid">
          {filtered.map((m) => (
            <div className="media-item" key={m.id}>
              <img src={m.url} alt={m.name} onClick={() => setPreview(m)} />
              <div className="overlay">
                <span className="action-btn" style={{ background: '#fff' }} onClick={() => setPreview(m)}><Eye /></span>
                <span className="action-btn danger" style={{ background: '#fff' }} onClick={() => setDeleteTarget(m)}><Trash2 /></span>
              </div>
              <div className="meta">
                <div className="n">{m.name}</div>
                <div className="s">{m.size} · {m.uploadedAt}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.name || 'Image preview'}>
        {preview && (
          <div>
            <img src={preview.url} alt={preview.name} style={{ width: '100%', borderRadius: 10, marginBottom: 14 }} />
            <div className="grid-2">
              <div><div className="faint" style={{ fontSize: 11 }}>SIZE</div><div style={{ fontSize: 13, fontWeight: 600 }}>{preview.size}</div></div>
              <div><div className="faint" style={{ fontSize: 11 }}>UPLOADED</div><div style={{ fontSize: 13, fontWeight: 600 }}>{preview.uploadedAt}</div></div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this image?"
        message={`"${deleteTarget?.name || ''}" will be permanently removed from the media library.`}
      />
    </div>
  );
}

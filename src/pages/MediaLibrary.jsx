import { useCallback, useEffect, useRef, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import Modal from '../components/ui/Modal.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { Upload, Search, Trash2, Eye, Image as ImageIcon } from '../components/ui/Icons.jsx';
import { mediaApi } from '../api/media.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const PAGE_SIZE = 24;
const messageOf = (error) => error?.message || 'Something went wrong. Please try again.';
const uploadedDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—';

export default function MediaLibrary() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const [result, setResult] = useState({ items: [], total: 0 });
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);
  const canUpload = hasPermission('media.upload');
  const canDelete = hasPermission('media.delete');

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setResult(await mediaApi.list({ q: query.trim(), kind: 'image', page, limit: PAGE_SIZE }));
    } catch (error) {
      setLoadError(messageOf(error));
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    const timeout = setTimeout(loadMedia, query ? 250 : 0);
    return () => clearTimeout(timeout);
  }, [loadMedia, query]);

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length || uploading) return;
    setUploading(true);
    try {
      for (const file of files) await mediaApi.upload(file, 'image');
      toast.success('Upload complete', `${files.length} image${files.length === 1 ? '' : 's'} added to the server library.`);
      setPage(1);
      await loadMedia();
    } catch (error) {
      toast.error('Upload failed', messageOf(error));
      await loadMedia();
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await mediaApi.remove(deleteTarget.id);
      toast.success('Image deleted', `${deleteTarget.name} was removed from the server library.`);
      setDeleteTarget(null);
      await loadMedia();
    } catch (error) {
      toast.error('Unable to delete image', messageOf(error));
    } finally {
      setDeleting(false);
    }
  };

  const media = result.items || [];
  return (
    <div>
      <PageHead eyebrow="Assets" title="Media Library" desc="Upload and manage server-backed images used by articles."
        actions={canUpload ? <button className="btn btn-primary" disabled={uploading} onClick={() => fileRef.current?.click()}><Upload />{uploading ? 'Uploading…' : 'Upload Images'}</button> : null} />
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={handleUpload} />

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="table-search" style={{ maxWidth: 340 }}><Search /><input placeholder="Search images by name…" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></div>
      </div>

      {loading ? <div className="card card-pad faint">Loading media…</div>
        : loadError ? <div className="card"><div className="empty-state"><div className="t">Unable to load media</div><div>{loadError}</div><button className="btn btn-secondary" onClick={loadMedia}>Retry</button></div></div>
          : media.length === 0 ? <div className="card"><EmptyState icon={ImageIcon} title="No images found" message="Upload an image or adjust your search." /></div>
            : <div className="media-grid">{media.map((item) => <div className="media-item" key={item.id}>
              <img src={item.thumbnailUrl || item.url} alt={item.name} onClick={() => setPreview(item)} />
              <div className="overlay"><button className="action-btn" style={{ background: '#fff' }} onClick={() => setPreview(item)} aria-label={`Preview ${item.name}`}><Eye /></button>{canDelete && <button className="action-btn danger" style={{ background: '#fff' }} onClick={() => setDeleteTarget(item)} aria-label={`Delete ${item.name}`}><Trash2 /></button>}</div>
              <div className="meta"><div className="n">{item.name}</div><div className="s">{item.size} · {uploadedDate(item.uploadedAt)}</div></div>
            </div>)}</div>}
      <Pagination page={page} pageSize={PAGE_SIZE} total={result.total || 0} onPageChange={setPage} />

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.name || 'Image preview'}>
        {preview && <div><img src={preview.url} alt={preview.name} style={{ width: '100%', borderRadius: 10, marginBottom: 14 }} /><div className="grid-2"><div><div className="faint" style={{ fontSize: 11 }}>TYPE / SIZE</div><div style={{ fontSize: 13, fontWeight: 600 }}>{preview.mimeType} · {preview.size}</div></div><div><div className="faint" style={{ fontSize: 11 }}>DIMENSIONS</div><div style={{ fontSize: 13, fontWeight: 600 }}>{preview.width && preview.height ? `${preview.width} × ${preview.height}` : '—'}</div></div></div></div>}
      </Modal>
      <ConfirmModal open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete this image?" message={`"${deleteTarget?.name || ''}" will be removed through the backend media service.`} />
    </div>
  );
}

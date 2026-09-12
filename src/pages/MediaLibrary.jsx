import { useCallback, useEffect, useRef, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import Modal from '../components/ui/Modal.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { Upload, Search, Trash2, Eye, Image as ImageIcon, Video, FileText } from '../components/ui/Icons.jsx';
import { mediaApi } from '../api/media.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAutoRefresh } from '../context/RefreshContext.jsx';

const PAGE_SIZE = 24;
const messageOf = (error) => error?.message || 'Something went wrong. Please try again.';
const uploadedDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—';

// Detect media type from mime type
const getMediaType = (file) => {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  return 'document';
};

// Icon for media items in the grid
function MediaThumb({ item, onClick }) {
  if (item.mimeType?.startsWith('video/') || item.kind === 'video') {
    return (
      <div onClick={onClick} style={{ width: '100%', aspectRatio: '16/10', background: 'var(--ink-800)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}>
        <Video style={{ width: 28, height: 28, color: '#2461c9' }} />
        <span style={{ fontSize: 10, color: 'var(--text-faint)', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
      </div>
    );
  }
  if (item.mimeType?.startsWith('image/') || item.kind === 'image') {
    return <img src={item.thumbnailUrl || item.url} alt={item.name} onClick={onClick} style={{ cursor: 'pointer' }} />;
  }
  // document / other
  return (
    <div onClick={onClick} style={{ width: '100%', aspectRatio: '16/10', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}>
      <FileText style={{ width: 28, height: 28, color: 'var(--accent)' }} />
      <span style={{ fontSize: 10, color: 'var(--text-faint)', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
    </div>
  );
}

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
      setResult(await mediaApi.list({ q: query.trim(), page, limit: PAGE_SIZE }));
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
  useAutoRefresh(loadMedia);

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length || uploading) return;
    setUploading(true);
    try {
      for (const file of files) await mediaApi.upload(file, getMediaType(file));
      toast.success('Upload complete', `${files.length} file${files.length === 1 ? '' : 's'} added to the media library.`);
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
        actions={canUpload ? <button className="btn btn-primary" disabled={uploading} onClick={() => fileRef.current?.click()}><Upload />{uploading ? 'Uploading…' : 'Upload Media'}</button> : null} />
      <input ref={fileRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" multiple hidden onChange={handleUpload} />

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="table-search" style={{ maxWidth: 340 }}><Search /><input placeholder="Search media by name…" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></div>
      </div>

      {loading ? <div className="card card-pad faint">Loading media…</div>
        : loadError ? <div className="card"><div className="empty-state"><div className="t">Unable to load media</div><div>{loadError}</div><button className="btn btn-secondary" onClick={loadMedia}>Retry</button></div></div>
          : media.length === 0 ? <div className="card"><EmptyState icon={ImageIcon} title="No media found" message="Upload an image, video or document to get started." /></div>
            : <div className="media-grid">{media.map((item) => <div className="media-item" key={item.id}>
              <MediaThumb item={item} onClick={() => setPreview(item)} />
              <div className="overlay"><button className="action-btn" style={{ background: '#fff' }} onClick={() => setPreview(item)} aria-label={`Preview ${item.name}`}><Eye /></button>{canDelete && <button className="action-btn danger" style={{ background: '#fff' }} onClick={() => setDeleteTarget(item)} aria-label={`Delete ${item.name}`}><Trash2 /></button>}</div>
              <div className="meta"><div className="n">{item.name}</div><div className="s">{item.size} · {uploadedDate(item.uploadedAt)}</div></div>
            </div>)}</div>}
      <Pagination page={page} pageSize={PAGE_SIZE} total={result.total || 0} onPageChange={setPage} />

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.name || 'Media preview'}>
        {preview && (
          <div>
            {preview.mimeType?.startsWith('video/') || preview.kind === 'video' ? (
              <video src={preview.url} controls style={{ width: '100%', borderRadius: 10, marginBottom: 14 }} />
            ) : preview.mimeType?.startsWith('image/') || preview.kind === 'image' ? (
              <img src={preview.url} alt={preview.name} style={{ width: '100%', borderRadius: 10, marginBottom: 14 }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 0 18px', marginBottom: 14 }}>
                <FileText style={{ width: 48, height: 48, color: 'var(--accent)' }} />
                <a href={preview.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">Open / Download</a>
              </div>
            )}
            <div className="grid-2">
              <div><div className="faint" style={{ fontSize: 11 }}>TYPE / SIZE</div><div style={{ fontSize: 13, fontWeight: 600 }}>{preview.mimeType} · {preview.size}</div></div>
              <div><div className="faint" style={{ fontSize: 11 }}>UPLOADED</div><div style={{ fontSize: 13, fontWeight: 600 }}>{uploadedDate(preview.uploadedAt)}</div></div>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmModal open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete this file?" message={`"${deleteTarget?.name || ''}" will be permanently removed from the media library.`} />
    </div>
  );
}

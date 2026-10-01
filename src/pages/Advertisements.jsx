import { useCallback, useEffect, useRef, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Megaphone, Upload, Video, X } from '../components/ui/Icons.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { adsApi } from '../api/ads.js';
import { mediaApi } from '../api/media.js';
import { useAutoRefresh } from '../context/RefreshContext.jsx';

const POSITIONS = ['Header Banner', 'Sidebar', 'In-Article', 'Footer Banner', 'Popup'];
const emptyForm = { title: '', image: '', imageId: null, images: [], videoUrl: '', videoId: null, position: POSITIONS[0], linkUrl: '', startDate: '', endDate: '', status: 'active' };
const messageOf = (error) => error?.message || 'Something went wrong. Please try again.';

export default function Advertisements() {
  const toast = useToast();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileRef = useRef(null);
  const videoRef = useRef(null);

  const loadAds = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await adsApi.list({ limit: 100 });
      setAds(data.items || []);
    } catch (error) {
      setLoadError(messageOf(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAds(); }, [loadAds]);
  useAutoRefresh(loadAds);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (ad) => {
    setEditing(ad);
    setForm({
      title: ad.title ?? '',
      image: ad.image ?? '',
      imageId: ad.imageId ?? null,
      images: ad.image ? [{ id: ad.imageId, url: ad.image, name: ad.title }] : [],
      videoUrl: ad.videoUrl ?? '',
      videoId: ad.videoId ?? null,
      position: ad.position ?? POSITIONS[0],
      linkUrl: ad.linkUrl ?? '',
      startDate: ad.startDate ?? '',
      endDate: ad.endDate ?? '',
      status: ad.status ?? 'active',
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleImage = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const media = await mediaApi.upload(file, 'image');
        uploaded.push({ id: media.id, url: media.url, name: media.name || media.originalName || file.name });
      }
      setForm((current) => ({
        ...current,
        images: editing ? uploaded.slice(0, 1) : [...current.images, ...uploaded],
        imageId: uploaded[0]?.id || current.imageId,
        image: uploaded[0]?.url || current.image,
      }));
      toast.success('Image uploaded', `${uploaded.length} creative${uploaded.length > 1 ? 's' : ''} ready.`);
    } catch (error) {
      toast.error('Image upload failed', messageOf(error));
    } finally {
      setUploading(false);
    }
  };

  const handleVideo = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadingVideo(true);
    try {
      const media = await mediaApi.upload(file, 'video');
      setForm((current) => ({ ...current, videoUrl: media.url, videoId: media.id }));
      toast.success('Video uploaded', file.name);
    } catch (error) {
      toast.error('Video upload failed', messageOf(error));
    } finally {
      setUploadingVideo(false);
    }
  };

  const submit = async () => {    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!editing && form.images.length === 0) errs.image = 'Upload at least one advertisement image.';
    if (editing && !form.imageId) errs.image = 'Upload an advertisement image.';
    if (!form.startDate) errs.startDate = 'Start date is required.';
    if (!form.endDate) errs.endDate = 'End date is required.';
    if (form.startDate && form.endDate && form.endDate < form.startDate) errs.endDate = 'End date must be after start date.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      if (editing) {
        await adsApi.update(editing.id, { ...form, imageId: form.images[0]?.id || form.imageId });
        toast.success('Advertisement updated', `"${form.title}" has been saved.`);
      } else {
        await Promise.all(form.images.map((image, index) => adsApi.create({
          ...form,
          title: form.images.length > 1 ? `${form.title.trim()} ${index + 1}` : form.title.trim(),
          imageId: image.id,
        })));
        toast.success('Advertisements created', `${form.images.length} creative${form.images.length > 1 ? 's' : ''} added.`);
      }
      await loadAds();
      setModalOpen(false);
    } catch (error) {
      setErrors({ submit: messageOf(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (ad) => {
    try {
      await adsApi.update(ad.id, { ...ad, status: ad.status === 'active' ? 'inactive' : 'active' });
      await loadAds();
      toast.info('Status updated', `"${ad.title}" is now ${ad.status === 'active' ? 'disabled' : 'enabled'}.`);
    } catch (error) {
      toast.error('Unable to update status', messageOf(error));
    }
  };

  const confirmDelete = async () => {
    try {
      await adsApi.remove(deleteTarget.id);
      await loadAds();
      toast.success('Advertisement deleted', `"${deleteTarget.title}" was removed.`);
    } catch (error) {
      toast.error('Unable to delete advertisement', messageOf(error));
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <PageHead
        eyebrow="Monetization"
        title="Advertisements"
        desc="Manage ad placements, schedules and creatives across the site."
        actions={<button className="btn btn-primary" onClick={openAdd}><Plus />Add Advertisement</button>}
      />

      {loading ? (
        <div className="card"><div className="empty-state"><div className="t">Loading advertisements…</div></div></div>
      ) : loadError ? (
        <div className="card"><div className="empty-state"><div className="t">Unable to load advertisements</div><div>{loadError}</div><button className="btn btn-secondary" onClick={loadAds}>Retry</button></div></div>
      ) : ads.length === 0 ? (
        <div className="card"><EmptyState icon={Megaphone} title="No advertisements yet" message="Add your first ad placement." /></div>
      ) : (
        <div className="reporter-grid">
          {ads.map((ad) => (
            <div className="card" key={ad.id} style={{ overflow: 'hidden' }}>
              <img src={ad.image} alt={ad.title} style={{ width: '100%', aspectRatio: '16/8', objectFit: 'cover' }} />
              <div className="card-pad">
                <div className="flex-between" style={{ marginBottom: 6 }}>
                  <span className={`pill pill-${ad.status === 'active' ? 'active' : 'inactive'}`}>{ad.status}</span>
                  <label className="switch">
                    <input type="checkbox" checked={ad.status === 'active'} onChange={() => toggleStatus(ad)} />
                    <span className="slider" />
                  </label>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{ad.title}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{ad.position}</div>
                <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>{ad.startDate} → {ad.endDate}</div>
                <div className="grid-2" style={{ marginTop: 12 }}>
                  <div><div className="faint" style={{ fontSize: 10.5 }}>IMPRESSIONS</div><div className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{Number(ad.impressions || 0).toLocaleString('en-IN')}</div></div>
                  <div><div className="faint" style={{ fontSize: 10.5 }}>CLICKS</div><div className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{Number(ad.clicks || 0).toLocaleString('en-IN')}</div></div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(ad)}><Edit2 />Edit</button>
                  <span className="action-btn danger" onClick={() => setDeleteTarget(ad)}><Trash2 /></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={editing ? 'Edit Advertisement' : 'Add Advertisement'}
        footer={<>
          <button className="btn btn-secondary" disabled={submitting} onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" disabled={submitting || uploading || uploadingVideo} onClick={submit}>{submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Advertisement'}</button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Advertisement Title *</label>
            <input className={`input ${errors.title ? 'error' : ''}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            {errors.title && <div className="field-error">{errors.title}</div>}
          </div>

          <div className="field">
            <label>Advertisement Images *</label>
            {form.images.length > 0 && (
              <div className="media-grid">
                {form.images.map((image) => (
                  <div className="image-preview" key={image.id || image.url}>
                    <img src={image.url} alt={image.name || 'Advertisement creative'} />
                    <button type="button" className="remove-btn" onClick={() => setForm((current) => {
                      const next = current.images.filter((item) => item !== image);
                      return { ...current, images: next, imageId: next[0]?.id || null, image: next[0]?.url || '' };
                    })}></button>
                  </div>
                ))}
              </div>
            )}
            <div className="dropzone" onClick={() => fileRef.current?.click()}>
              <Upload />
              <div style={{ fontWeight: 600, fontSize: 13 }}>{uploading ? 'Uploading…' : editing ? 'Click to replace creative' : 'Click to upload one or more creatives'}</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple={!editing} hidden onChange={handleImage} />
            {errors.image && <div className="field-error">{errors.image}</div>}
          </div>

          {/* Video Upload */}
          <div className="field">
            <label>Advertisement Video <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional)</span></label>
            {form.videoUrl ? (
              <div style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <video
                  src={form.videoUrl}
                  controls
                  style={{ width: '100%', maxHeight: 180, display: 'block', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, videoUrl: '', videoId: null }))}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 6,
                    color: '#fff', width: 26, height: 26, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  aria-label="Remove video"
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            ) : (
              <div className="dropzone" onClick={() => videoRef.current?.click()} style={{ borderColor: 'var(--blue-500)', opacity: uploadingVideo ? 0.6 : 1 }}>
                <Video style={{ width: 22, height: 22, color: 'var(--blue-500)' }} />
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {uploadingVideo ? 'Uploading video…' : 'Click to upload a video creative'}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>MP4, WebM or MOV</div>
              </div>
            )}
            <input ref={videoRef} type="file" accept="video/*" hidden onChange={handleVideo} />
          </div>

          <div className="field">
            <label>Destination URL</label>
            <input className="input" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://example.com" />
          </div>

          <div className="form-grid">
            <div className="field">
              <label>Position</label>
              <select className="select" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                {POSITIONS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="field">
              <label>Start Date *</label>
              <input type="date" className={`input ${errors.startDate ? 'error' : ''}`} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              {errors.startDate && <div className="field-error">{errors.startDate}</div>}
            </div>
            <div className="field">
              <label>End Date *</label>
              <input type="date" className={`input ${errors.endDate ? 'error' : ''}`} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              {errors.endDate && <div className="field-error">{errors.endDate}</div>}
            </div>
          </div>
          {errors.submit && <div className="field-error">{errors.submit}</div>}
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this advertisement?"
        message={`"${deleteTarget?.title || ''}" will be permanently removed and stop displaying immediately.`}
      />
    </div>
  );
}

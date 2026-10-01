import { useRef, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, MapPin, Upload, X, ExternalLink } from '../components/ui/Icons.jsx';
import { loadData, saveData } from '../utils/storage.js';
import { mediaApi } from '../api/media.js';
import { useToast } from '../context/ToastContext.jsx';

const EMPTY_FORM = { name: '', description: '', photo: '', mapLink: '', status: 'active' };

export default function TouristInfo() {
  const toast = useToast();
  const fileRef = useRef(null);
  const [places, setPlaces] = useState(() => loadData('tourist_info', []));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const persist = (list) => { setPlaces(list); saveData('tourist_info', list); };

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setErrors({}); setModalOpen(true); };
  const openEdit = (place) => {
    setEditing(place);
    setForm({
      name: place.name ?? '',
      description: place.description ?? '',
      photo: place.photo ?? '',
      mapLink: place.mapLink ?? '',
      status: place.status ?? 'active',
    });
    setErrors({});
    setModalOpen(true);
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || uploading) return;
    setUploading(true);
    try {
      const media = await mediaApi.upload(file, 'image');
      setForm((p) => ({ ...p, photo: media.url }));
      toast.success('Photo uploaded', file.name);
    } catch (err) {
      toast.error('Upload failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Place name is required.';
    if (!form.description.trim()) errs.description = 'Description is required.';
    if (form.mapLink.trim() && !/^https?:\/\/.+/.test(form.mapLink.trim())) {
      errs.mapLink = 'Enter a valid URL starting with http:// or https://';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      photo: form.photo,
      mapLink: form.mapLink.trim(),
      status: form.status,
    };
    if (editing) {
      persist(places.map((p) => (p.id === editing.id ? { ...p, ...data } : p)));
      toast.success('Place updated', `"${data.name}" has been saved.`);
    } else {
      persist([{ id: Date.now(), ...data, createdAt: new Date().toISOString().slice(0, 10) }, ...places]);
      toast.success('Tourist place added', `"${data.name}" was added successfully.`);
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    persist(places.filter((p) => p.id !== deleteTarget.id));
    toast.success('Place deleted', `"${deleteTarget.name}" was removed.`);
    setDeleteTarget(null);
  };

  const toggleStatus = (place) => {
    persist(places.map((p) => (p.id === place.id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p)));
    toast.info('Status updated', `"${place.name}" is now ${place.status === 'active' ? 'inactive' : 'active'}.`);
  };

  return (
    <div>
      <PageHead
        eyebrow="Manage"
        title="Tourist Info"
        desc="Manage tourist places and points of interest for Kanyakumari."
        actions={
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus /> Add Tourist Place
          </button>
        }
      />

      {places.length === 0 ? (
        <div className="card">
          <EmptyState icon={MapPin} title="No tourist places yet" message="Click 'Add Tourist Place' to get started." />
        </div>
      ) : (
        <div className="reporter-grid">
          {places.map((place) => (
            <div className="card" key={place.id} style={{ overflow: 'hidden' }}>
              {/* Photo */}
              {place.photo ? (
                <img
                  src={place.photo}
                  alt={place.name}
                  style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin style={{ width: 32, height: 32, opacity: 0.25 }} />
                </div>
              )}

              <div className="card-pad">
                {/* Status toggle */}
                <div className="flex-between" style={{ marginBottom: 8 }}>
                  <span className={`pill pill-${place.status === 'active' ? 'active' : 'inactive'}`}>{place.status}</span>
                  <label className="switch">
                    <input type="checkbox" checked={place.status === 'active'} onChange={() => toggleStatus(place)} />
                    <span className="slider" />
                  </label>
                </div>

                {/* Name */}
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{place.name}</div>

                {/* Description */}
                <div className="faint" style={{ fontSize: 12.5, lineHeight: 1.6, marginBottom: 8 }}>
                  {place.description.length > 100 ? place.description.slice(0, 100) + '…' : place.description}
                </div>

                {/* Map link */}
                {place.mapLink && (
                  <a
                    href={place.mapLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)', marginBottom: 12 }}
                  >
                    <MapPin style={{ width: 12, height: 12 }} /> View on Map
                  </a>
                )}

                {/* Added date */}
                <div className="faint" style={{ fontSize: 11, marginBottom: 12 }}>Added {place.createdAt}</div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(place)}>
                    <Edit2 /> Edit
                  </button>
                  <button className="action-btn danger" title="Delete" onClick={() => setDeleteTarget(place)}>
                    <Trash2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => !uploading && setModalOpen(false)}
        title={editing ? 'Edit Tourist Place' : 'Add Tourist Place'}
        wide
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={uploading} onClick={submit}>
              {editing ? 'Save Changes' : 'Add Place'}
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Place Name */}
          <div className="field">
            <label>Tourist Place Name <span style={{ color: 'var(--red-500)' }}>*</span></label>
            <input
              className={`input ${errors.name ? 'error' : ''}`}
              placeholder="e.g. Vivekananda Rock Memorial"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>

          {/* Description */}
          <div className="field">
            <label>Description <span style={{ color: 'var(--red-500)' }}>*</span></label>
            <textarea
              className={`input ${errors.description ? 'error' : ''}`}
              placeholder="Describe the place, its history, timings, entry fee…"
              rows={5}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              style={{ resize: 'vertical' }}
            />
            {errors.description && <div className="field-error">{errors.description}</div>}
          </div>

          {/* Photo Upload */}
          <div className="field">
            <label>Photo</label>
            {form.photo ? (
              <div className="image-preview" style={{ maxWidth: '100%', marginBottom: 8 }}>
                <img src={form.photo} alt="Tourist place" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 6 }} />
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => setForm((p) => ({ ...p, photo: '' }))}
                >
                  <X />
                </button>
              </div>
            ) : (
              <div className="dropzone" onClick={() => fileRef.current?.click()} style={{ cursor: 'pointer' }}>
                <Upload />
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {uploading ? 'Uploading…' : 'Click to upload a photo'}
                </div>
                <div className="faint" style={{ fontSize: 11.5 }}>JPG, PNG, WebP supported</div>
              </div>
            )}
            {!form.photo && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                style={{ marginTop: 6 }}
              >
                <Upload /> {uploading ? 'Uploading…' : 'Upload Photo'}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
          </div>

          {/* Map Link */}
          <div className="field">
            <label>
              <MapPin style={{ width: 13, height: 13, marginRight: 4, verticalAlign: -2 }} />
              Google Maps / Map Link
            </label>
            <input
              className={`input ${errors.mapLink ? 'error' : ''}`}
              placeholder="https://maps.google.com/..."
              type="url"
              value={form.mapLink}
              onChange={(e) => setForm((p) => ({ ...p, mapLink: e.target.value }))}
            />
            {errors.mapLink && <div className="field-error">{errors.mapLink}</div>}
            {form.mapLink && !errors.mapLink && (
              <a href={form.mapLink} target="_blank" rel="noreferrer" style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, color: 'var(--accent)' }}>
                <ExternalLink style={{ width: 11, height: 11 }} /> Preview link
              </a>
            )}
          </div>

          {/* Status */}
          <div className="field">
            <label>Status</label>
            <select className="select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
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
        title="Delete this tourist place?"
        message={`"${deleteTarget?.name || ''}" will be permanently removed.`}
      />
    </div>
  );
}

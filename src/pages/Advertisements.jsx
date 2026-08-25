import { useRef, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Megaphone, Upload } from '../components/ui/Icons.jsx';
import { loadData, saveData, uid } from '../utils/storage.js';
import { seedAds } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const POSITIONS = ['Header Banner', 'Sidebar', 'In-Article', 'Footer Banner', 'Popup'];
const emptyForm = { title: '', image: '', position: POSITIONS[0], startDate: '', endDate: '', status: 'active' };

export default function Advertisements() {
  const toast = useToast();
  const [ads, setAds] = useState(() => loadData('ads', seedAds));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileRef = useRef(null);

  const persist = (list) => { setAds(list); saveData('ads', list); };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (ad) => { setEditing(ad); setForm({ ...emptyForm, ...ad }); setErrors({}); setModalOpen(true); };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const submit = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.startDate) errs.startDate = 'Start date is required.';
    if (!form.endDate) errs.endDate = 'End date is required.';
    if (form.startDate && form.endDate && form.endDate < form.startDate) errs.endDate = 'End date must be after start date.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (editing) {
      persist(ads.map((a) => (a.id === editing.id ? { ...a, ...form } : a)));
      toast.success('Advertisement updated', `"${form.title}" has been saved.`);
    } else {
      persist([{ id: uid('ad'), ...form, image: form.image || `https://picsum.photos/seed/${uid('ad')}/640/300`, clicks: 0, impressions: 0 }, ...ads]);
      toast.success('Advertisement created', `"${form.title}" has been added.`);
    }
    setModalOpen(false);
  };

  const toggleStatus = (ad) => {
    persist(ads.map((a) => (a.id === ad.id ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' } : a)));
    toast.info('Status updated', `"${ad.title}" is now ${ad.status === 'active' ? 'disabled' : 'enabled'}.`);
  };

  const confirmDelete = () => {
    persist(ads.filter((a) => a.id !== deleteTarget.id));
    toast.success('Advertisement deleted', `"${deleteTarget.title}" was removed.`);
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHead
        eyebrow="Monetization"
        title="Advertisements"
        desc="Manage ad placements, schedules and creatives across the site."
        actions={<button className="btn btn-primary" onClick={openAdd}><Plus />Add Advertisement</button>}
      />

      {ads.length === 0 ? (
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
                  <div><div className="faint" style={{ fontSize: 10.5 }}>IMPRESSIONS</div><div className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{ad.impressions.toLocaleString('en-IN')}</div></div>
                  <div><div className="faint" style={{ fontSize: 10.5 }}>CLICKS</div><div className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{ad.clicks.toLocaleString('en-IN')}</div></div>
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
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Advertisement' : 'Add Advertisement'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>{editing ? 'Save Changes' : 'Create Advertisement'}</button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Advertisement Title *</label>
            <input className={`input ${errors.title ? 'error' : ''}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            {errors.title && <div className="field-error">{errors.title}</div>}
          </div>

          <div className="field">
            <label>Advertisement Image</label>
            {form.image ? (
              <div className="image-preview">
                <img src={form.image} alt="" />
                <button className="remove-btn" onClick={() => setForm({ ...form, image: '' })}></button>
              </div>
            ) : (
              <div className="dropzone" onClick={() => fileRef.current?.click()}>
                <Upload />
                <div style={{ fontWeight: 600, fontSize: 13 }}>Click to upload creative</div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />
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

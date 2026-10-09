import { useCallback, useEffect, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Briefcase, ExternalLink } from '../components/ui/Icons.jsx';
import { supportingApi } from '../api/supporting.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAutoRefresh } from '../context/RefreshContext.jsx';

const EMPTY_FORM = { title: '', org: '', location: '', type: 'private', lastDate: '', applyUrl: '', status: 'active' };
const messageOf = (error) => error?.message || 'Something went wrong. Please try again.';
const jobTypes = [
  { value: 'private', label: 'Private' },
  { value: 'govt', label: 'Government' },
  { value: 'teaching', label: 'Teaching' },
  { value: 'bank', label: 'Bank' },
];

export default function Jobs() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await supportingApi.jobs.list({ limit: 100 });
      setJobs(data.items || []);
    } catch (error) {
      setLoadError(messageOf(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);
  useAutoRefresh(loadJobs);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setErrors({}); setModalOpen(true); };
  const openEdit = (job) => {
    setEditing(job);
    setForm({
      title: job.title ?? '',
      description: job.description ?? '',
      url: job.url ?? '',
      status: job.status ?? 'active',
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Job title is required.';
    if (!form.lastDate) errs.lastDate = 'Last date is required.';
    if (form.applyUrl.trim() && !/^https?:\/\/.+/.test(form.applyUrl.trim())) errs.applyUrl = 'Enter a valid URL starting with http:// or https://';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (editing) await supportingApi.jobs.update(editing.id, form);
      else await supportingApi.jobs.create(form);
      await loadJobs();
      setModalOpen(false);
      toast.success(editing ? 'Job updated' : 'Job added', `"${form.title.trim()}" has been saved.`);
    } catch (error) {
      setErrors({ submit: messageOf(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await supportingApi.jobs.remove(deleteTarget.id);
      await loadJobs();
      toast.success('Job deleted', `"${deleteTarget.title}" was removed.`);
    } catch (error) {
      toast.error('Unable to delete job', messageOf(error));
    } finally {
      setDeleteTarget(null);
    }
  };

  const toggleStatus = async (job) => {
    const nextStatus = job.status === 'active' ? 'inactive' : 'active';
    try {
      await supportingApi.jobs.update(job.id, { status: nextStatus });
      await loadJobs();
      toast.info('Status updated', `"${job.title}" is now ${nextStatus}.`);
    } catch (error) {
      toast.error('Unable to update status', messageOf(error));
    }
  };

  return (
    <div>
      <PageHead
        eyebrow="Manage"
        title="Jobs"
        desc="Post and manage job openings for your organisation."
        actions={
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus /> Add Job
          </button>
        }
      />

      {loading ? (
        <div className="card"><div className="empty-state"><div className="t">Loading jobs...</div></div></div>
      ) : loadError ? (
        <div className="card"><div className="empty-state"><div className="t">Unable to load jobs</div><div>{loadError}</div><button className="btn btn-secondary" onClick={loadJobs}>Retry</button></div></div>
      ) : jobs.length === 0 ? (
        <div className="card">
          <EmptyState icon={Briefcase} title="No jobs posted yet" message="Click 'Add Job' to post your first opening." />
        </div>
      ) : (
        <div className="card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Organisation</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Link</th>
                  <th>Status</th>
                  <th>Last Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{job.title}</div>
                    </td>
                    <td className="faint" style={{ fontSize: 12 }}>{job.org || '—'}</td>
                    <td><span className="pill pill-scheduled">{jobTypes.find((type) => type.value === job.type)?.label || job.type}</span></td>
                    <td className="faint" style={{ fontSize: 12 }}>{job.location || '—'}</td>
                    <td>
                      {job.applyUrl ? (
                        <a href={job.applyUrl} target="_blank" rel="noreferrer" className="action-btn" title={job.applyUrl} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                          <ExternalLink style={{ width: 13, height: 13 }} /> View
                        </a>
                      ) : (
                        <span className="faint" style={{ fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td>
                      <label className="switch" title={`Toggle status (currently ${job.status})`}>
                        <input type="checkbox" checked={job.status === 'active'} onChange={() => toggleStatus(job)} />
                        <span className="slider" />
                      </label>
                    </td>
                    <td className="faint" style={{ fontSize: 12 }}>{job.lastDate}</td>
                    <td>
                      <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                        <button className="action-btn" title="Edit" onClick={() => openEdit(job)}><Edit2 /></button>
                        <button className="action-btn danger" title="Delete" onClick={() => setDeleteTarget(job)}><Trash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={editing ? 'Edit Job' : 'Add Job'}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" disabled={submitting} onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={submitting} onClick={submit}>{submitting ? 'Saving...' : editing ? 'Save Changes' : 'Add Job'}</button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Job Title */}
          <div className="field">
            <label>Job Title <span style={{ color: 'var(--red-500)' }}>*</span></label>
            <input
              className={`input ${errors.title ? 'error' : ''}`}
              placeholder="e.g. Senior Reporter"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
            {errors.title && <div className="field-error">{errors.title}</div>}
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Organisation</label>
              <input className="input" placeholder="e.g. District Collectorate" value={form.org} onChange={(e) => setForm((p) => ({ ...p, org: e.target.value }))} />
            </div>
            <div className="field">
              <label>Location</label>
              <input className="input" placeholder="e.g. Nagercoil" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Type</label>
              <select className="select" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                {jobTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Last Date <span style={{ color: 'var(--red-500)' }}>*</span></label>
              <input className={`input ${errors.lastDate ? 'error' : ''}`} type="date" value={form.lastDate} onChange={(e) => setForm((p) => ({ ...p, lastDate: e.target.value }))} />
              {errors.lastDate && <div className="field-error">{errors.lastDate}</div>}
            </div>
          </div>

          {/* URL */}
          <div className="field">
            <label>Application URL</label>
            <input
              className={`input ${errors.applyUrl ? 'error' : ''}`}
              placeholder="https://example.com/apply"
              type="url"
              value={form.applyUrl}
              onChange={(e) => setForm((p) => ({ ...p, applyUrl: e.target.value }))}
            />
            {errors.applyUrl && <div className="field-error">{errors.applyUrl}</div>}
          </div>

          {/* Status */}
          <div className="field">
            <label>Status</label>
            <select className="select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {errors.submit && <div className="field-error">{errors.submit}</div>}
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this job?"
        message={`"${deleteTarget?.title || ''}" will be permanently removed.`}
      />
    </div>
  );
}

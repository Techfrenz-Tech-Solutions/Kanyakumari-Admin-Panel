import { useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { EmptyState } from '../components/ui/Badges.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Briefcase, ExternalLink } from '../components/ui/Icons.jsx';
import { loadData, saveData } from '../utils/storage.js';
import { useToast } from '../context/ToastContext.jsx';

const EMPTY_FORM = { title: '', description: '', url: '', status: 'active' };

export default function Jobs() {
  const toast = useToast();
  const [jobs, setJobs] = useState(() => loadData('jobs', []));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const persist = (list) => { setJobs(list); saveData('jobs', list); };

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setErrors({}); setModalOpen(true); };
  const openEdit = (job) => { setEditing(job); setForm({ ...EMPTY_FORM, ...job }); setErrors({}); setModalOpen(true); };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Job title is required.';
    if (!form.description.trim()) errs.description = 'Description is required.';
    if (form.url.trim() && !/^https?:\/\/.+/.test(form.url.trim())) errs.url = 'Enter a valid URL starting with http:// or https://';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    if (editing) {
      const updated = jobs.map((j) => (j.id === editing.id ? { ...j, ...form, title: form.title.trim(), description: form.description.trim(), url: form.url.trim() } : j));
      persist(updated);
      toast.success('Job updated', `"${form.title.trim()}" has been saved.`);
    } else {
      const newJob = { id: Date.now(), title: form.title.trim(), description: form.description.trim(), url: form.url.trim(), status: form.status, createdAt: new Date().toISOString().slice(0, 10) };
      persist([newJob, ...jobs]);
      toast.success('Job added', `"${form.title.trim()}" was posted successfully.`);
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    persist(jobs.filter((j) => j.id !== deleteTarget.id));
    toast.success('Job deleted', `"${deleteTarget.title}" was removed.`);
    setDeleteTarget(null);
  };

  const toggleStatus = (job) => {
    persist(jobs.map((j) => (j.id === job.id ? { ...j, status: j.status === 'active' ? 'inactive' : 'active' } : j)));
    toast.info('Status updated', `"${job.title}" is now ${job.status === 'active' ? 'inactive' : 'active'}.`);
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

      {jobs.length === 0 ? (
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
                  <th>Description</th>
                  <th>Link</th>
                  <th>Status</th>
                  <th>Posted</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{job.title}</div>
                    </td>
                    <td style={{ maxWidth: 320 }}>
                      <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {job.description.length > 120 ? job.description.slice(0, 120) + '…' : job.description}
                      </div>
                    </td>
                    <td>
                      {job.url ? (
                        <a href={job.url} target="_blank" rel="noreferrer" className="action-btn" title={job.url} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
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
                    <td className="faint" style={{ fontSize: 12 }}>{job.createdAt}</td>
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
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Job' : 'Add Job'}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>{editing ? 'Save Changes' : 'Add Job'}</button>
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

          {/* Description */}
          <div className="field">
            <label>Description <span style={{ color: 'var(--red-500)' }}>*</span></label>
            <textarea
              className={`input ${errors.description ? 'error' : ''}`}
              placeholder="Describe the role, responsibilities, requirements…"
              rows={5}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              style={{ resize: 'vertical' }}
            />
            {errors.description && <div className="field-error">{errors.description}</div>}
          </div>

          {/* URL */}
          <div className="field">
            <label>Application URL</label>
            <input
              className={`input ${errors.url ? 'error' : ''}`}
              placeholder="https://example.com/apply"
              type="url"
              value={form.url}
              onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
            />
            {errors.url && <div className="field-error">{errors.url}</div>}
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
        title="Delete this job?"
        message={`"${deleteTarget?.title || ''}" will be permanently removed.`}
      />
    </div>
  );
}

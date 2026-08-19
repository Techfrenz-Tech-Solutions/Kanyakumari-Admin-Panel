import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../components/ui/PageHead.jsx';
import { StatusPill, EmptyState } from '../components/ui/Badges.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Search, CheckCircle, XCircle, Edit2, Eye, ClipboardList, Send } from '../components/ui/Icons.jsx';
import { loadData, saveData } from '../utils/storage.js';
import { seedNews } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const PAGE_SIZE = 10;

export default function PendingApproval() {
  const navigate = useNavigate();
  const toast = useToast();
  const [news, setNews] = useState(() => loadData('news', seedNews));
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewOpen, setReviewOpen] = useState(null);

  const pending = useMemo(() => {
    let list = news.filter((n) => n.status === 'pending');
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((n) => n.title.toLowerCase().includes(q) || n.author.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [news, query]);

  const pageItems = pending.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const approve = (article) => {
    const updated = news.map((n) => n.id === article.id ? { ...n, status: 'published', publishDate: new Date().toISOString().slice(0, 10) } : n);
    setNews(updated);
    saveData('news', updated);
    toast.success('Article approved & published', `"${article.title.slice(0, 40)}…" is now live.`);
    setReviewOpen(null);
  };

  const reject = (article) => {
    const updated = news.map((n) => n.id === article.id ? { ...n, status: 'draft', rejectionReason: rejectReason } : n);
    setNews(updated);
    saveData('news', updated);
    toast.error('Article rejected', `Returned to reporter with feedback.`);
    setRejectTarget(null);
    setRejectReason('');
  };

  const requestChanges = (article) => {
    toast.info('Changes requested', `"${article.title.slice(0, 40)}…" sent back with notes.`);
  };

  return (
    <div>
      <PageHead
        eyebrow="Editorial Workflow"
        title="Pending Approval"
        desc={`${pending.length} article${pending.length !== 1 ? 's' : ''} submitted by reporters and awaiting editorial review.`}
      />

      {/* Workflow banner */}
      <div className="card card-pad" style={{ marginBottom: 16, background: 'var(--amber-100)', border: '1px solid var(--amber-500)20', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 12.5, color: 'var(--amber-500)', fontWeight: 600 }}>
          <span style={{ background: 'var(--amber-500)', color: '#fff', padding: '3px 9px', borderRadius: 6 }}>Reporter</span>
          <span>→</span>
          <span style={{ background: 'var(--blue-500)', color: '#fff', padding: '3px 9px', borderRadius: 6 }}>Submit for Review</span>
          <span>→</span>
          <span style={{ background: 'var(--amber-500)', color: '#fff', padding: '3px 9px', borderRadius: 6 }}>Editor Reviews</span>
          <span>→</span>
          <span style={{ background: 'var(--green-500)', color: '#fff', padding: '3px 9px', borderRadius: 6 }}>Approve & Publish</span>
          <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>or</span>
          <span style={{ background: 'var(--red-500)', color: '#fff', padding: '3px 9px', borderRadius: 6 }}>Reject</span>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <Search />
            <input placeholder="Search pending articles…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          </div>
          <span className="pill pill-pending">{pending.length} pending</span>
        </div>

        {pageItems.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No pending articles" message="All submissions have been reviewed. Great work!" />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Category</th>
                  <th>Reporter</th>
                  <th>Submitted</th>
                  <th>Words</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <div className="row-title">
                        <img src={n.image} className="row-thumb" alt="" />
                        <div className="txt">
                          <div className="main">{n.title}</div>
                          <div className="sub">{n.location}</div>
                        </div>
                      </div>
                    </td>
                    <td>{n.category}</td>
                    <td>{n.author}</td>
                    <td className="faint">{n.createdAt}</td>
                    <td className="mono">{n.wordCount || '—'}</td>
                    <td>
                      <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setReviewOpen(n)}><Eye />Review</button>
                        <button className="btn btn-secondary btn-sm" style={{ color: 'var(--green-500)', borderColor: 'var(--green-500)' }} onClick={() => approve(n)}>
                          <CheckCircle style={{ width: 13, height: 13 }} />Approve
                        </button>
                        <button className="btn btn-secondary btn-sm" style={{ color: 'var(--red-600)', borderColor: 'var(--red-100)' }} onClick={() => { setRejectTarget(n); setRejectReason(''); }}>
                          <XCircle style={{ width: 13, height: 13 }} />Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={pending.length} onPageChange={setPage} />
      </div>

      {/* Review modal */}
      <Modal open={!!reviewOpen} onClose={() => setReviewOpen(null)} title="Review Article" wide>
        {reviewOpen && (
          <div>
            <img src={reviewOpen.image} alt="" style={{ width: '100%', aspectRatio: '16/8', objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{reviewOpen.title}</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <span className="pill pill-pending">Pending</span>
              <span className="faint" style={{ fontSize: 12 }}>By {reviewOpen.author} · {reviewOpen.category} · {reviewOpen.createdAt}</span>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--text-muted)', marginBottom: 18 }}>{reviewOpen.shortDescription}</p>
            <div style={{ fontSize: 13, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: reviewOpen.content }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => navigate(`/news/edit/${reviewOpen.id}`)}>
                <Edit2 />Edit
              </button>
              <button className="btn btn-secondary" style={{ color: 'var(--red-600)' }} onClick={() => { setRejectTarget(reviewOpen); setReviewOpen(null); }}>
                <XCircle />Reject
              </button>
              <button className="btn btn-primary" onClick={() => approve(reviewOpen)}>
                <CheckCircle />Approve & Publish
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject modal */}
      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject Article"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRejectTarget(null)}>Cancel</button>
            <button className="btn btn-primary" style={{ background: 'var(--red-500)' }} onClick={() => reject(rejectTarget)}>Reject & Return</button>
          </>
        }
      >
        {rejectTarget && (
          <div>
            <p style={{ fontSize: 13.5, marginBottom: 16, color: 'var(--text-muted)' }}>
              You are rejecting <strong>"{rejectTarget.title?.slice(0, 50)}…"</strong> by {rejectTarget.author}. This will return it to the reporter as a draft.
            </p>
            <div className="field">
              <label>Rejection Reason / Editorial Feedback *</label>
              <textarea className="input" rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain what needs to be corrected or improved before resubmission…" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

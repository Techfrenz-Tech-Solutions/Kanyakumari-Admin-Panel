import { useMemo, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { StatusPill, EmptyState } from '../components/ui/Badges.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { MessageSquare, CheckCircle, XCircle, Trash2, Search } from '../components/ui/Icons.jsx';
import { loadData, saveData } from '../utils/storage.js';
import { seedComments } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const TABS = ['all', 'pending', 'approved', 'rejected', 'spam'];

export default function Comments() {
  const toast = useToast();
  const [comments, setComments] = useState(() => loadData('comments', seedComments));
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const persist = (list) => { setComments(list); saveData('comments', list); };

  const updateStatus = (id, status) => {
    persist(comments.map((c) => (c.id === id ? { ...c, status } : c)));
    toast.success('Comment updated', `Marked as ${status}.`);
  };

  const confirmDelete = () => {
    persist(comments.filter((c) => c.id !== deleteTarget.id));
    toast.success('Comment deleted', 'The comment was removed.');
    setDeleteTarget(null);
  };

  const filtered = useMemo(() => {
    let list = [...comments];
    if (tab !== 'all') list = list.filter((c) => c.status === tab);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((c) => c.comment.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.article.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [comments, tab, query]);

  const counts = useMemo(() => ({
    all: comments.length,
    pending: comments.filter((c) => c.status === 'pending').length,
    approved: comments.filter((c) => c.status === 'approved').length,
    rejected: comments.filter((c) => c.status === 'rejected').length,
    spam: comments.filter((c) => c.status === 'spam').length,
  }), [comments]);

  return (
    <div>
      <PageHead eyebrow="Engagement" title="Comments" desc="Moderate reader comments across all articles." />

      <div className="chip-row" style={{ marginBottom: 16 }}>
        {TABS.map((t) => (
          <button key={t} className={`filter-chip ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)} · {counts[t]}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <Search />
            <input placeholder="Search comments, names, articles…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No comments found" message="Nothing to moderate here right now." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((c) => (
              <div key={c.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 13.5 }}>{c.name}</strong>
                      <span className="faint" style={{ fontSize: 12 }}>{c.email}</span>
                      <StatusPill status={c.status} />
                    </div>
                    <p style={{ fontSize: 13.5, margin: '8px 0', lineHeight: 1.5 }}>{c.comment}</p>
                    <div className="faint" style={{ fontSize: 11.5 }}>on "{c.article}" · {c.date}</div>
                  </div>
                  <div className="action-cell" style={{ flex: 'none' }}>
                    {c.status !== 'approved' && <span className="action-btn" title="Approve" onClick={() => updateStatus(c.id, 'approved')}><CheckCircle /></span>}
                    {c.status !== 'rejected' && <span className="action-btn" title="Reject" onClick={() => updateStatus(c.id, 'rejected')}><XCircle /></span>}
                    {c.status !== 'spam' && <span className="action-btn" title="Mark as spam" onClick={() => updateStatus(c.id, 'spam')}>🚫</span>}
                    <span className="action-btn danger" title="Delete" onClick={() => setDeleteTarget(c)}><Trash2 /></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this comment?"
        message="This comment will be permanently removed from the article."
      />
    </div>
  );
}

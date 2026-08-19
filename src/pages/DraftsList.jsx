import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../components/ui/PageHead.jsx';
import { StatusPill, EmptyState } from '../components/ui/Badges.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Search, Edit2, Trash2, FileText, Send, Eye } from '../components/ui/Icons.jsx';
import { loadData, saveData } from '../utils/storage.js';
import { seedNews } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const PAGE_SIZE = 10;

export default function DraftsList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [news, setNews] = useState(() => loadData('news', seedNews));
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const drafts = useMemo(() => {
    let list = news.filter((n) => n.status === 'draft');
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((n) => n.title.toLowerCase().includes(q) || n.author.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  }, [news, query]);

  const pageItems = drafts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const submitForReview = (article) => {
    const updated = news.map((n) => n.id === article.id ? { ...n, status: 'pending' } : n);
    setNews(updated);
    saveData('news', updated);
    toast.success('Submitted for review', `"${article.title.slice(0, 40)}…" sent to editors.`);
  };

  const confirmDelete = () => {
    const updated = news.filter((n) => n.id !== deleteTarget.id);
    setNews(updated);
    saveData('news', updated);
    toast.success('Draft deleted', `"${deleteTarget.title.slice(0, 40)}…" removed.`);
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHead
        eyebrow="Content"
        title="Draft Articles"
        desc={`${drafts.length} article${drafts.length !== 1 ? 's' : ''} saved as draft and awaiting submission.`}
        actions={<button className="btn btn-primary" onClick={() => navigate('/news/add')}><Edit2 />New Article</button>}
      />

      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <Search />
            <input placeholder="Search drafts by title or author…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          </div>
          <span className="pill pill-draft">{drafts.length} drafts</span>
        </div>

        {pageItems.length === 0 ? (
          <EmptyState icon={FileText} title="No drafts found" message="All your articles have been published or submitted." />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Last Modified</th>
                  <th>Status</th>
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
                          <div className="sub">{n.location} · {n.wordCount || '—'} words</div>
                        </div>
                      </div>
                    </td>
                    <td>{n.category}</td>
                    <td>{n.author}</td>
                    <td className="faint">{n.updatedAt || n.createdAt}</td>
                    <td><StatusPill status={n.status} /></td>
                    <td>
                      <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/news/edit/${n.id}`)}><Edit2 />Edit</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => submitForReview(n)}><Send />Submit</button>
                        <span className="action-btn danger" onClick={() => setDeleteTarget(n)}><Trash2 /></span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={drafts.length} onPageChange={setPage} />
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this draft?"
        message={`"${deleteTarget?.title || ''}" will be permanently deleted.`}
      />
    </div>
  );
}

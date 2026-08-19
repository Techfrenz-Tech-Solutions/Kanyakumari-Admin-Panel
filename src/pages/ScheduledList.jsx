import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../components/ui/PageHead.jsx';
import { StatusPill, EmptyState } from '../components/ui/Badges.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Search, Edit2, Trash2, Clock, Send } from '../components/ui/Icons.jsx';
import { loadData, saveData } from '../utils/storage.js';
import { seedNews } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const PAGE_SIZE = 10;

export default function ScheduledList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [news, setNews] = useState(() => loadData('news', seedNews));
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const scheduled = useMemo(() => {
    let list = news.filter((n) => n.status === 'scheduled');
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((n) => n.title.toLowerCase().includes(q) || n.author.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(a.publishDate + 'T' + (a.publishTime || '09:00')) - new Date(b.publishDate + 'T' + (b.publishTime || '09:00')));
  }, [news, query]);

  const pageItems = scheduled.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const publishNow = (article) => {
    const updated = news.map((n) => n.id === article.id ? { ...n, status: 'published', publishDate: new Date().toISOString().slice(0, 10) } : n);
    setNews(updated);
    saveData('news', updated);
    toast.success('Published now', `"${article.title.slice(0, 40)}…" is now live.`);
  };

  const cancelSchedule = (article) => {
    const updated = news.map((n) => n.id === article.id ? { ...n, status: 'draft' } : n);
    setNews(updated);
    saveData('news', updated);
    toast.info('Schedule cancelled', `"${article.title.slice(0, 40)}…" moved back to drafts.`);
  };

  const confirmDelete = () => {
    const updated = news.filter((n) => n.id !== deleteTarget.id);
    setNews(updated);
    saveData('news', updated);
    toast.success('Deleted', 'Article removed.');
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHead
        eyebrow="Content"
        title="Scheduled Articles"
        desc={`${scheduled.length} article${scheduled.length !== 1 ? 's' : ''} scheduled for automatic publishing.`}
      />

      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <Search />
            <input placeholder="Search scheduled articles…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          </div>
          <span className="pill pill-scheduled">{scheduled.length} scheduled</span>
        </div>

        {pageItems.length === 0 ? (
          <EmptyState icon={Clock} title="No scheduled articles" message="Articles set to publish automatically will appear here." />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Scheduled Date</th>
                  <th>Scheduled Time</th>
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
                          <div className="sub">{n.category}</div>
                        </div>
                      </div>
                    </td>
                    <td>{n.category}</td>
                    <td>{n.author}</td>
                    <td>
                      <span style={{ background: 'var(--blue-100)', color: 'var(--blue-500)', padding: '3px 9px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                        {n.publishDate}
                      </span>
                    </td>
                    <td className="mono">{n.publishTime || '09:00'}</td>
                    <td>
                      <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                        <span className="action-btn" onClick={() => navigate(`/news/edit/${n.id}`)} title="Reschedule"><Edit2 /></span>
                        <button className="btn btn-primary btn-sm" onClick={() => publishNow(n)}><Send />Publish Now</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => cancelSchedule(n)}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={scheduled.length} onPageChange={setPage} />
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete scheduled article?"
        message={`"${deleteTarget?.title || ''}" will be permanently deleted.`}
      />
    </div>
  );
}

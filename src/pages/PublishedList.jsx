import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../components/ui/PageHead.jsx';
import { StatusPill, BreakingTag, EmptyState } from '../components/ui/Badges.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Search, Edit2, Trash2, CheckCircle, Eye } from '../components/ui/Icons.jsx';
import { loadData, saveData } from '../utils/storage.js';
import { seedNews, seedCategories } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const PAGE_SIZE = 10;

export default function PublishedList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [news, setNews] = useState(() => loadData('news', seedNews));
  const categories = loadData('categories', seedCategories);
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const published = useMemo(() => {
    let list = news.filter((n) => n.status === 'published');
    if (catFilter !== 'all') list = list.filter((n) => n.category === catFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((n) => n.title.toLowerCase().includes(q) || n.author.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
  }, [news, query, catFilter]);

  const pageItems = published.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const unpublish = (article) => {
    const updated = news.map((n) => n.id === article.id ? { ...n, status: 'draft' } : n);
    setNews(updated);
    saveData('news', updated);
    toast.info('Unpublished', `"${article.title.slice(0, 40)}…" moved to drafts.`);
  };

  const confirmDelete = () => {
    const updated = news.filter((n) => n.id !== deleteTarget.id);
    setNews(updated);
    saveData('news', updated);
    toast.success('Deleted', `Article removed.`);
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHead
        eyebrow="Content"
        title="Published Articles"
        desc={`${published.length} published article${published.length !== 1 ? 's' : ''} currently live on the website.`}
      />

      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <Search />
            <input placeholder="Search published articles…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          </div>
          <div className="toolbar-filters">
            <select className="select" value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}>
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <span className="pill pill-published">{published.length} published</span>
          </div>
        </div>

        {pageItems.length === 0 ? (
          <EmptyState icon={CheckCircle} title="No published articles" message="Articles you publish will appear here." />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Views</th>
                  <th>Published</th>
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
                          <div className="sub" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {n.isBreaking && <BreakingTag />}
                            <span>{n.language}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{n.category}</td>
                    <td>{n.author}</td>
                    <td className="mono" style={{ fontWeight: 700 }}>{(n.views || 0).toLocaleString('en-IN')}</td>
                    <td className="faint">{n.publishDate}</td>
                    <td>
                      <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                        <span className="action-btn" onClick={() => navigate(`/news/edit/${n.id}`)} title="Edit"><Edit2 /></span>
                        <button className="btn btn-ghost btn-sm" onClick={() => unpublish(n)}>Unpublish</button>
                        <span className="action-btn danger" onClick={() => setDeleteTarget(n)} title="Delete"><Trash2 /></span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={published.length} onPageChange={setPage} />
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete published article?"
        message={`"${deleteTarget?.title || ''}" will be removed from the website permanently.`}
      />
    </div>
  );
}

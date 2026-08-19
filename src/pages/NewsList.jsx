import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../components/ui/PageHead.jsx';
import { StatusPill, BreakingTag, EmptyState } from '../components/ui/Badges.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Search, Edit2, Trash2, Eye, Newspaper, Filter } from '../components/ui/Icons.jsx';
import { loadData, saveData } from '../utils/storage.js';
import { seedNews, seedCategories } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const TABS = [
  { key: 'all', label: 'All News' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Draft' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'pending', label: 'Pending' },
  { key: 'breaking', label: 'Breaking' },
];

const PAGE_SIZE = 8;

export default function NewsList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [news, setNews] = useState(() => loadData('news', seedNews));
  const categories = loadData('categories', seedCategories);

  const activeTab = params.get('tab') || 'all';
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const setTab = (tab) => { setParams({ tab }); setPage(1); };

  const filtered = useMemo(() => {
    let list = [...news];
    if (activeTab === 'breaking') list = list.filter((n) => n.isBreaking);
    else if (activeTab !== 'all') list = list.filter((n) => n.status === activeTab);

    if (categoryFilter !== 'all') list = list.filter((n) => n.category === categoryFilter);

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((n) => n.title.toLowerCase().includes(q) || n.author.toLowerCase().includes(q) || n.category.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.publishDate) - new Date(a.publishDate);
      if (sortBy === 'date-asc') return new Date(a.publishDate) - new Date(b.publishDate);
      if (sortBy === 'views-desc') return b.views - a.views;
      if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
      return 0;
    });
    return list;
  }, [news, activeTab, categoryFilter, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => ({
    all: news.length,
    published: news.filter((n) => n.status === 'published').length,
    draft: news.filter((n) => n.status === 'draft').length,
    scheduled: news.filter((n) => n.status === 'scheduled').length,
    pending: news.filter((n) => n.status === 'pending').length,
    breaking: news.filter((n) => n.isBreaking).length,
  }), [news]);

  const confirmDelete = () => {
    const updated = news.filter((n) => n.id !== deleteTarget.id);
    setNews(updated);
    saveData('news', updated);
    toast.success('Article deleted', `"${deleteTarget.title.slice(0, 40)}…" was removed.`);
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHead
        eyebrow="Content"
        title="News Management"
        desc="Manage every article across the newsroom in one place."
        actions={<button className="btn btn-primary" onClick={() => navigate('/news/add')}><Plus />Add News</button>}
      />

      <div className="chip-row" style={{ marginBottom: 16 }}>
        {TABS.map((t) => (
          <button key={t.key} className={`filter-chip ${activeTab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label} · {counts[t.key]}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <Search />
            <input placeholder="Search by title, author, category…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          </div>
          <div className="toolbar-filters">
            <select className="select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="views-desc">Most Viewed</option>
              <option value="title-asc">Title A–Z</option>
            </select>
          </div>
        </div>

        {pageItems.length === 0 ? (
          <EmptyState icon={Newspaper} title="No articles found" message="Try adjusting your search or filters." />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Publish Date</th>
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
                            <span>{n.location}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{n.category}</td>
                    <td>{n.author}</td>
                    <td><StatusPill status={n.status} /></td>
                    <td className="mono">{n.views.toLocaleString('en-IN')}</td>
                    <td>{n.publishDate}</td>
                    <td>
                      <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                        <span className="action-btn" title="Preview"><Eye /></span>
                        <span className="action-btn" title="Edit" onClick={() => navigate(`/news/edit/${n.id}`)}><Edit2 /></span>
                        <span className="action-btn danger" title="Delete" onClick={() => setDeleteTarget(n)}><Trash2 /></span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this article?"
        message={`"${deleteTarget?.title || ''}" will be permanently removed. This action cannot be undone.`}
      />
    </div>
  );
}

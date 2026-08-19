import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHead } from '../components/ui/PageHead.jsx';
import { StatusPill, BreakingTag, EmptyState } from '../components/ui/Badges.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Search, Edit2, Trash2, Eye, Newspaper } from '../components/ui/Icons.jsx';
import { loadData, saveData } from '../utils/storage.js';
import { seedNews } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const SECTION_META = {
  politics:   { label: 'Politics',   eyebrow: 'Sections', desc: 'Political developments, elections and governance coverage.', icon: '🗳️' },
  sports:     { label: 'Sports',     eyebrow: 'Sections', desc: 'Cricket, football, athletics and all sporting events.', icon: '🏏' },
  cinema:     { label: 'Cinema',     eyebrow: 'Sections', desc: 'Kollywood, Bollywood and OTT entertainment news.', icon: '🎬' },
  business:   { label: 'Business',   eyebrow: 'Sections', desc: 'Markets, economy, startups and corporate news.', icon: '📈' },
  technology: { label: 'Technology', eyebrow: 'Sections', desc: 'Tech news, AI, gadgets and digital transformation.', icon: '💻' },
};

const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft',     label: 'Draft' },
  { key: 'pending',   label: 'Pending' },
  { key: 'scheduled', label: 'Scheduled' },
];

const PAGE_SIZE = 8;

export default function SectionPage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const meta = SECTION_META[section?.toLowerCase()] ?? {
    label: section ?? 'Section',
    eyebrow: 'Sections',
    desc: `Browse all articles in ${section}.`,
    icon: '📰',
  };

  const [news, setNews] = useState(() => loadData('news', seedNews));
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Filter to this category only
  const sectionNews = useMemo(
    () => news.filter((n) => n.category?.toLowerCase() === meta.label.toLowerCase()),
    [news, meta.label],
  );

  const filtered = useMemo(() => {
    let list = [...sectionNews];

    if (activeTab !== 'all') list = list.filter((n) => n.status === activeTab);

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.author.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.publishDate) - new Date(a.publishDate);
      if (sortBy === 'date-asc')  return new Date(a.publishDate) - new Date(b.publishDate);
      if (sortBy === 'views-desc') return b.views - a.views;
      if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
      return 0;
    });

    return list;
  }, [sectionNews, activeTab, query, sortBy]);

  const counts = useMemo(() => ({
    all:       sectionNews.length,
    published: sectionNews.filter((n) => n.status === 'published').length,
    draft:     sectionNews.filter((n) => n.status === 'draft').length,
    pending:   sectionNews.filter((n) => n.status === 'pending').length,
    scheduled: sectionNews.filter((n) => n.status === 'scheduled').length,
  }), [sectionNews]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const confirmDelete = () => {
    const updated = news.filter((n) => n.id !== deleteTarget.id);
    setNews(updated);
    saveData('news', updated);
    toast.success('Article deleted', `"${deleteTarget.title.slice(0, 40)}…" was removed.`);
    setDeleteTarget(null);
  };

  const handleTab = (key) => { setActiveTab(key); setPage(1); };

  return (
    <div>
      <PageHead
        eyebrow={meta.eyebrow}
        title={`${meta.icon} ${meta.label}`}
        desc={meta.desc}
        actions={
          <button
            className="btn btn-primary"
            onClick={() => navigate('/news/add')}
          >
            <Plus /> Add Article
          </button>
        }
      />

      {/* Tab chips */}
      <div className="chip-row" style={{ marginBottom: 16 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`filter-chip ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => handleTab(t.key)}
          >
            {t.label} · {counts[t.key]}
          </button>
        ))}
      </div>

      <div className="card">
        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="table-search">
            <Search />
            <input
              placeholder={`Search ${meta.label} articles…`}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
          </div>
          <div className="toolbar-filters">
            <select
              className="select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="views-desc">Most Viewed</option>
              <option value="title-asc">Title A–Z</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {pageItems.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title={`No ${meta.label} articles found`}
            message="Try adjusting your search or tab filter."
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Article</th>
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
                          <div
                            className="sub"
                            style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                          >
                            {n.isBreaking && <BreakingTag />}
                            <span>{n.location}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{n.author}</td>
                    <td><StatusPill status={n.status} /></td>
                    <td className="mono">{n.views.toLocaleString('en-IN')}</td>
                    <td>{n.publishDate}</td>
                    <td>
                      <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                        <span className="action-btn" title="Preview"><Eye /></span>
                        <span
                          className="action-btn"
                          title="Edit"
                          onClick={() => navigate(`/news/edit/${n.id}`)}
                        >
                          <Edit2 />
                        </span>
                        <span
                          className="action-btn danger"
                          title="Delete"
                          onClick={() => setDeleteTarget(n)}
                        >
                          <Trash2 />
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPageChange={setPage}
        />
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

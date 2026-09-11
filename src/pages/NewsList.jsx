import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../components/ui/PageHead.jsx';
import { StatusPill, BreakingTag, EmptyState } from '../components/ui/Badges.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Plus, Search, Edit2, Trash2, Newspaper } from '../components/ui/Icons.jsx';
import { articlesApi } from '../api/articles.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const TABS = [
  { key: 'all', label: 'All News' }, { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Draft' }, { key: 'scheduled', label: 'Scheduled' },
  { key: 'pending', label: 'Pending' }, { key: 'breaking', label: 'Breaking' },
];
const PAGE_SIZE = 8;
const itemsOf = (value) => Array.isArray(value) ? value : value?.items || value?.categories || [];

export default function NewsList({ fixedStatus = null }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const [params, setParams] = useSearchParams();
  const activeTab = fixedStatus || params.get('tab') || 'all';
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [transitioningId, setTransitioningId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadArticles = () => {
    const controller = new AbortController();
    setLoading(true); setError('');
    const status = !['all', 'breaking'].includes(activeTab) ? activeTab : undefined;
    articlesApi.list({ page, limit: PAGE_SIZE, status, category: categoryFilter, search: query, isBreaking: activeTab === 'breaking', sort: sortBy }, { signal: controller.signal })
      .then(setResult)
      .catch((err) => { if (err.code !== 'REQUEST_ABORTED') setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return controller;
  };

  useEffect(() => {
    const controller = loadArticles();
    return () => controller.abort();
  }, [activeTab, categoryFilter, page, query, sortBy]);

  useEffect(() => {
    const controller = new AbortController();
    articlesApi.listCategories({ signal: controller.signal }).then((data) => setCategories(itemsOf(data))).catch(() => {});
    return () => controller.abort();
  }, []);

  const setTab = (tab) => { if (!fixedStatus) setParams(tab === 'all' ? {} : { tab }); setPage(1); };
  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await articlesApi.remove(deleteTarget.id);
      toast.success('Article deleted', `"${deleteTarget.title.slice(0, 40)}" was removed.`);
      setDeleteTarget(null); loadArticles();
    } catch (err) { toast.error('Unable to delete article', err.message); }
    finally { setDeleting(false); }
  };

  const transition = async (article, action, reason = '') => {
    if (transitioningId) return;
    setTransitioningId(article.id);
    try {
      await articlesApi.changeStatus(article.id, action, reason);
      toast.success('Article status updated', `"${article.title.slice(0, 40)}" was ${action.replaceAll('-', ' ')}.`);
      setRejectTarget(null);
      setRejectReason('');
      loadArticles();
    } catch (err) {
      toast.error('Unable to change article status', err.message);
    } finally {
      setTransitioningId(null);
    }
  };

  const lifecycleActions = (article) => <>
    {article.status === 'draft' && hasPermission('news.edit') && <button className="btn btn-secondary btn-sm" disabled={transitioningId === article.id} onClick={() => transition(article, 'submit')}>Submit</button>}
    {article.status === 'pending' && hasPermission('news.approve') && <button className="btn btn-secondary btn-sm" disabled={transitioningId === article.id} onClick={() => transition(article, 'approve')}>Approve</button>}
    {article.status === 'pending' && hasPermission('news.approve') && <button className="btn btn-ghost btn-sm" disabled={transitioningId === article.id} onClick={() => { setRejectTarget(article); setRejectReason(''); }}>Reject</button>}
    {['draft', 'pending', 'scheduled'].includes(article.status) && hasPermission('news.publish') && <button className="btn btn-primary btn-sm" disabled={transitioningId === article.id} onClick={() => transition(article, 'publish-now')}>Publish Now</button>}
    {article.status === 'published' && hasPermission('news.publish') && <button className="btn btn-ghost btn-sm" disabled={transitioningId === article.id} onClick={() => transition(article, 'unpublish')}>Unpublish</button>}
    {article.status === 'scheduled' && hasPermission('news.publish') && <button className="btn btn-ghost btn-sm" disabled={transitioningId === article.id} onClick={() => transition(article, 'cancel-schedule')}>Cancel Schedule</button>}
  </>;

  return <div>
    {/* <PageHead eyebrow="Content" title={fixedStatus ? `${fixedStatus[0].toUpperCase()}${fixedStatus.slice(1)} Articles` : 'News Management'} desc="Manage server-backed articles and their editorial lifecycle."
      actions={hasPermission('news.create') ? <button className="btn btn-primary" onClick={() => navigate('/news/add')}><Plus />Add News</button> : null} /> */}
    {!fixedStatus && <div className="chip-row" style={{ marginBottom: 16 }}>
      {TABS.map((tab) => <button key={tab.key} className={`filter-chip ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setTab(tab.key)}>{tab.label}</button>)}
    </div>}
    <div className="card">
      <div className="table-toolbar">
        <div className="table-search"><Search /><input placeholder="Search articles…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} /></div>
        <div className="toolbar-filters">
          <select className="select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
            <option value="all">All Categories</option>
            {categories.map((category) => <option key={category.id || category.slug} value={category.slug || category.name}>{category.name || category.label}</option>)}
          </select>
          <select className="select" value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
            <option value="-createdAt">Newest First</option><option value="createdAt">Oldest First</option>
            <option value="views-desc">Most Viewed</option><option value="title-asc">Title A–Z</option>
          </select>
        </div>
      </div>
      {error && <div className="card-pad" role="alert"><div className="field-error">{error}</div><button className="btn btn-secondary btn-sm" onClick={loadArticles}>Retry</button></div>}
      {loading ? <div className="card-pad faint">Loading articles…</div> : !result.items.length ?
        <EmptyState icon={Newspaper} title="No articles found" message="Try adjusting your search or filters." /> :
        <div className="table-scroll"><table className="data-table"><thead><tr><th>Article</th><th>Category</th><th>Author</th><th>Status</th><th>Views</th><th>Publish Date</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
          <tbody>{result.items.map((article) => <tr key={article.id}>
            <td><div className="row-title">{article.image && <img src={article.image} className="row-thumb" alt="" />}<div className="txt"><div className="main">{article.title}</div><div className="sub" style={{ display: 'flex', gap: 6 }}>{article.isBreaking && <BreakingTag />}<span>{article.location || ''}</span></div></div></div></td>
            <td>{article.category || '—'}</td><td>{article.author || '—'}</td><td><StatusPill status={article.status} /></td>
            <td className="mono">{(article.views || 0).toLocaleString('en-IN')}</td><td>{article.publishDate || '—'}</td>
            <td><div className="action-cell" style={{ justifyContent: 'flex-end' }}>
              {hasPermission('news.edit') && <button className="action-btn" title="Edit" onClick={() => navigate(`/news/edit/${article.id}`)}><Edit2 /></button>}
              {lifecycleActions(article)}
              {hasPermission('news.delete') && <button className="action-btn danger" title="Delete" onClick={() => setDeleteTarget(article)}><Trash2 /></button>}
            </div></td></tr>)}</tbody></table></div>}
      <Pagination page={page} pageSize={PAGE_SIZE} total={result.total || 0} onPageChange={setPage} />
    </div>
    <ConfirmModal open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete this article?" message={`"${deleteTarget?.title || ''}" will be permanently removed.`} />
    <Modal open={!!rejectTarget} onClose={() => !transitioningId && setRejectTarget(null)} title="Reject Article" footer={<><button className="btn btn-secondary" disabled={!!transitioningId} onClick={() => setRejectTarget(null)}>Cancel</button><button className="btn btn-primary" disabled={!!transitioningId || rejectReason.trim().length < 3} onClick={() => transition(rejectTarget, 'reject', rejectReason)}>{transitioningId ? 'Rejecting…' : 'Reject & Return to Draft'}</button></>}>
      <div className="field"><label>Rejection reason *</label><textarea className="input" rows={4} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Explain the required changes (minimum 3 characters)" /></div>
    </Modal>
  </div>;
}

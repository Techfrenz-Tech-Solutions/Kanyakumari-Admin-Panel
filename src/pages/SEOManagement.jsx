import { useState, useMemo } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Search, Edit2, Globe, Eye } from '../components/ui/Icons.jsx';
import { loadData, saveData } from '../utils/storage.js';
import { seedNews, seedSEO } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

function SeoScore({ score }) {
  const color = score >= 80 ? 'var(--green-500)' : score >= 60 ? 'var(--amber-500)' : 'var(--red-600)';
  const label = score >= 80 ? 'Good' : score >= 60 ? 'Needs Work' : 'Poor';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 80, height: 6, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontSize: 11.5, fontWeight: 700, color }}>{score} — {label}</span>
    </div>
  );
}

const emptySeo = { seoTitle: '', seoDescription: '', seoKeywords: '', canonicalUrl: '', focusKeyword: '', ogTitle: '', ogDescription: '', ogImage: '', twitterTitle: '', twitterDescription: '', twitterImage: '' };

function calcScore(seo) {
  let score = 0;
  if (seo.seoTitle?.length >= 30 && seo.seoTitle?.length <= 70) score += 20;
  else if (seo.seoTitle?.length > 0) score += 10;
  if (seo.seoDescription?.length >= 120 && seo.seoDescription?.length <= 160) score += 20;
  else if (seo.seoDescription?.length > 0) score += 10;
  if (seo.focusKeyword?.length > 0) score += 15;
  if (seo.ogTitle?.length > 0) score += 15;
  if (seo.ogDescription?.length > 0) score += 10;
  if (seo.twitterTitle?.length > 0) score += 10;
  if (seo.canonicalUrl?.length > 0 || true) score += 10;
  return Math.min(score, 100);
}

export default function SEOManagement() {
  const toast = useToast();
  const [seoList, setSeoList] = useState(() => loadData('seo', seedSEO));
  const news = loadData('news', seedNews);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [form, setForm] = useState(emptySeo);
  const [previewTab, setPreviewTab] = useState('google');

  const persist = (list) => { setSeoList(list); saveData('seo', list); };

  const getSeo = (articleId) => seoList.find((s) => s.articleId === articleId) || null;

  const filtered = useMemo(() => {
    let list = news;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((n) => n.title.toLowerCase().includes(q));
    }
    return list;
  }, [news, query]);

  const openEditor = (article) => {
    setSelectedArticle(article);
    const existing = getSeo(article.id);
    setForm(existing ? { ...emptySeo, seoTitle: existing.title || article.title, seoDescription: existing.description || '', seoKeywords: existing.keywords || '', canonicalUrl: existing.canonicalUrl || '', focusKeyword: existing.focusKeyword || '', ogTitle: existing.ogTitle || '', ogDescription: existing.ogDescription || '', ogImage: existing.ogImage || '', twitterTitle: existing.twitterTitle || '', twitterDescription: existing.twitterDescription || '', twitterImage: existing.twitterImage || '' } : { ...emptySeo, seoTitle: article.seoTitle || article.title, seoDescription: article.seoDescription || '' });
    setModalOpen(true);
  };

  const save = () => {
    const existing = getSeo(selectedArticle.id);
    const record = {
      id: existing?.id || `seo_${selectedArticle.id}`,
      articleId: selectedArticle.id,
      title: form.seoTitle,
      description: form.seoDescription,
      keywords: form.seoKeywords,
      canonicalUrl: form.canonicalUrl,
      focusKeyword: form.focusKeyword,
      ogTitle: form.ogTitle,
      ogDescription: form.ogDescription,
      ogImage: form.ogImage,
      twitterTitle: form.twitterTitle,
      twitterDescription: form.twitterDescription,
      twitterImage: form.twitterImage,
      score: calcScore(form),
    };
    if (existing) {
      persist(seoList.map((s) => (s.articleId === selectedArticle.id ? record : s)));
    } else {
      persist([record, ...seoList]);
    }
    toast.success('SEO saved', `SEO data updated for "${selectedArticle.title.slice(0, 40)}…"`);
    setModalOpen(false);
  };

  const score = calcScore(form);

  return (
    <div>
      <PageHead eyebrow="SEO" title="SEO Management" desc="Optimize articles for search engines and social sharing." />

      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <Search />
            <input placeholder="Search articles for SEO optimization…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <span className="faint" style={{ fontSize: 12.5 }}>{filtered.length} articles</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Category</th>
                <th>Status</th>
                <th>SEO Score</th>
                <th>Focus Keyword</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => {
                const seo = getSeo(n.id);
                const s = seo ? calcScore({ seoTitle: seo.title, seoDescription: seo.description, focusKeyword: seo.focusKeyword, ogTitle: seo.ogTitle, ogDescription: seo.ogDescription, twitterTitle: seo.twitterTitle, canonicalUrl: seo.canonicalUrl }) : 0;
                return (
                  <tr key={n.id}>
                    <td>
                      <div className="row-title">
                        <img src={n.image} className="row-thumb" alt="" />
                        <div className="txt"><div className="main">{n.title}</div><div className="sub">{n.author}</div></div>
                      </div>
                    </td>
                    <td>{n.category}</td>
                    <td><span className={`pill pill-${n.status}`}>{n.status}</span></td>
                    <td style={{ minWidth: 160 }}>
                      {seo ? <SeoScore score={s} /> : <span className="faint" style={{ fontSize: 12 }}>Not optimized</span>}
                    </td>
                    <td className="faint">{seo?.focusKeyword || '—'}</td>
                    <td>
                      <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditor(n)}><Edit2 />{seo ? 'Edit SEO' : 'Add SEO'}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`SEO — ${selectedArticle?.title?.slice(0, 40) || ''}…`} wide
        footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save SEO</button></>}
      >
        {selectedArticle && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Score */}
            <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>SEO Score</span>
                <SeoScore score={score} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                Complete all fields below to improve your score. Target 80+ for best search performance.
              </div>
            </div>

            {/* Google Preview */}
            <div>
              <div className="settings-tabs" style={{ marginBottom: 12 }}>
                {['google', 'social'].map((t) => (
                  <div key={t} className={`settings-tab ${previewTab === t ? 'active' : ''}`} onClick={() => setPreviewTab(t)}>
                    {t === 'google' ? 'Google Preview' : 'Social Preview'}
                  </div>
                ))}
              </div>
              {previewTab === 'google' ? (
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 4 }}>thedailywire.in › {selectedArticle.category?.toLowerCase().replace(/\s+/g, '-')} › {selectedArticle.id}</div>
                  <div style={{ fontSize: 18, color: '#1a0dab', fontWeight: 400, cursor: 'pointer' }}>{form.seoTitle || selectedArticle.title}</div>
                  <div style={{ fontSize: 13, color: '#545454', marginTop: 4, lineHeight: 1.5 }}>{form.seoDescription || selectedArticle.shortDescription}</div>
                </div>
              ) : (
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  {selectedArticle.image && <img src={selectedArticle.image} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />}
                  <div style={{ padding: 12, background: 'var(--surface-2)' }}>
                    <div style={{ fontSize: 10.5, textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 4 }}>thedailywire.in</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{form.ogTitle || form.seoTitle || selectedArticle.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>{form.ogDescription || form.seoDescription}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Fields */}
            <div className="form-grid">
              <div className="field span-2">
                <label>SEO Title <span className="faint">({(form.seoTitle || '').length}/70)</span></label>
                <input className="input" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} maxLength={70} />
              </div>
              <div className="field span-2">
                <label>Meta Description <span className="faint">({(form.seoDescription || '').length}/160)</span></label>
                <textarea className="input" rows={2} value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} maxLength={160} />
              </div>
              <div className="field">
                <label>Focus Keyword</label>
                <input className="input" value={form.focusKeyword} onChange={(e) => setForm({ ...form, focusKeyword: e.target.value })} />
              </div>
              <div className="field">
                <label>Meta Keywords</label>
                <input className="input" value={form.seoKeywords} onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })} placeholder="comma, separated, keywords" />
              </div>
              <div className="field span-2">
                <label>Canonical URL</label>
                <input className="input" value={form.canonicalUrl} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })} placeholder="Leave blank to use default" />
              </div>
              <div className="field">
                <label>OG Title</label>
                <input className="input" value={form.ogTitle} onChange={(e) => setForm({ ...form, ogTitle: e.target.value })} />
              </div>
              <div className="field">
                <label>OG Description</label>
                <input className="input" value={form.ogDescription} onChange={(e) => setForm({ ...form, ogDescription: e.target.value })} />
              </div>
              <div className="field">
                <label>Twitter Title</label>
                <input className="input" value={form.twitterTitle} onChange={(e) => setForm({ ...form, twitterTitle: e.target.value })} />
              </div>
              <div className="field">
                <label>Twitter Description</label>
                <input className="input" value={form.twitterDescription} onChange={(e) => setForm({ ...form, twitterDescription: e.target.value })} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

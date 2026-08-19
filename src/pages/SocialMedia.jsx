import { useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { Globe, Send, Calendar } from '../components/ui/Icons.jsx';
import { loadData } from '../utils/storage.js';
import { seedNews } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const PLATFORMS = [
  { key: 'facebook', label: 'Facebook', color: '#1877f2', icon: '📘', charLimit: 500 },
  { key: 'instagram', label: 'Instagram', color: '#e1306c', icon: '📸', charLimit: 2200 },
  { key: 'twitter', label: 'X / Twitter', color: '#000', icon: '𝕏', charLimit: 280 },
  { key: 'youtube', label: 'YouTube', color: '#ff0000', icon: '▶️', charLimit: 5000 },
  { key: 'telegram', label: 'Telegram', color: '#2ca5e0', icon: '✈️', charLimit: 4096 },
];

const emptyPost = { platform: 'facebook', articleId: '', caption: '', hashtags: '', scheduledAt: '' };

export default function SocialMedia() {
  const toast = useToast();
  const news = loadData('news', seedNews).filter((n) => n.status === 'published');
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(emptyPost);
  const [tab, setTab] = useState('compose');

  const selectedPlatform = PLATFORMS.find((p) => p.key === form.platform);
  const selectedArticle = news.find((n) => n.id === form.articleId);

  const compose = (sendNow = false) => {
    if (!form.platform || !form.articleId) {
      toast.error('Missing fields', 'Please select a platform and article.');
      return;
    }
    const post = {
      id: Date.now(),
      ...form,
      status: sendNow ? 'sent' : form.scheduledAt ? 'scheduled' : 'draft',
      sentAt: sendNow ? new Date().toISOString() : null,
      articleTitle: selectedArticle?.title || '',
    };
    setPosts([post, ...posts]);
    setForm(emptyPost);
    toast.success(sendNow ? 'Post published!' : 'Post saved', sendNow ? `Posted to ${selectedPlatform?.label}` : 'Saved for later.');
  };

  const deletePost = (id) => {
    setPosts(posts.filter((p) => p.id !== id));
    toast.info('Post removed', 'Social post deleted.');
  };

  const platformMap = Object.fromEntries(PLATFORMS.map((p) => [p.key, p]));

  return (
    <div>
      <PageHead eyebrow="Distribution" title="Social Media" desc="Prepare and schedule posts to your social media channels." />

      <div className="settings-tabs">
        <div className={`settings-tab ${tab === 'compose' ? 'active' : ''}`} onClick={() => setTab('compose')}>Compose Post</div>
        <div className={`settings-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Post History ({posts.length})</div>
      </div>

      {tab === 'compose' ? (
        <div className="two-col">
          {/* Form */}
          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="field">
              <label>Platform</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PLATFORMS.map((p) => (
                  <button
                    key={p.key}
                    className={`btn btn-sm ${form.platform === p.key ? 'btn-primary' : 'btn-secondary'}`}
                    style={form.platform === p.key ? { background: p.color } : {}}
                    onClick={() => setForm({ ...form, platform: p.key })}
                  >
                    {p.icon} {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Select Article</label>
              <select className="select" value={form.articleId} onChange={(e) => {
                const art = news.find((n) => n.id === e.target.value);
                setForm({ ...form, articleId: e.target.value, caption: art ? `📰 ${art.title}\n\nRead the full story at The Daily Wire.` : '' });
              }}>
                <option value="">Choose a published article…</option>
                {news.slice(0, 20).map((n) => <option key={n.id} value={n.id}>{n.title.slice(0, 60)}</option>)}
              </select>
            </div>

            {selectedArticle && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--surface-2)', padding: '10px 12px', borderRadius: 8 }}>
                <img src={selectedArticle.image} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, flex: 'none' }} />
                <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4 }}>{selectedArticle.title}</div>
              </div>
            )}

            <div className="field">
              <label>Caption <span className="faint">({(form.caption || '').length} / {selectedPlatform?.charLimit || 500})</span></label>
              <textarea className="input" rows={6} value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} placeholder="Write your social media caption…" maxLength={selectedPlatform?.charLimit || 5000} />
            </div>

            <div className="field">
              <label>Hashtags</label>
              <input className="input" value={form.hashtags} onChange={(e) => setForm({ ...form, hashtags: e.target.value })} placeholder="#TamilNadu #DailyWire #News" />
            </div>

            <div className="field">
              <label><Calendar style={{ width: 12, height: 12, marginRight: 4, verticalAlign: -2 }} />Schedule (optional)</label>
              <input type="datetime-local" className="input" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary btn-block" onClick={() => compose(false)}>Save Draft</button>
              <button className="btn btn-primary btn-block" onClick={() => compose(true)} style={{ background: selectedPlatform?.color || 'var(--red-500)' }}>
                <Send />{form.scheduledAt ? 'Schedule' : 'Post Now'}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className="card card-pad">
              <h3 style={{ fontSize: 13, marginBottom: 14, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Post Preview</h3>
              {selectedArticle ? (
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <img src={selectedArticle.image} alt="" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: 12 }}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 4 }}>The Daily Wire</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{selectedArticle.title}</div>
                    <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{form.caption || selectedArticle.shortDescription}</p>
                    {form.hashtags && <div style={{ fontSize: 12, color: selectedPlatform?.color || 'var(--blue-500)', marginTop: 8 }}>{form.hashtags}</div>}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 40 }}>
                  <Globe style={{ width: 36, height: 36, marginBottom: 10 }} />
                  <div>Select an article to preview</div>
                </div>
              )}
            </div>

            {/* Platform guidelines */}
            <div className="card card-pad" style={{ marginTop: 14 }}>
              <h3 style={{ fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>Platform Guide</h3>
              {PLATFORMS.map((p) => (
                <div key={p.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12.5 }}>
                  <span>{p.icon} {p.label}</span>
                  <span className="faint">{p.charLimit.toLocaleString()} chars</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          {posts.length === 0 ? (
            <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 60 }}>
              No posts yet. Compose and publish social media posts to see history here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {posts.map((p) => {
                const plat = platformMap[p.platform];
                return (
                  <div className="card card-pad" key={p.id}>
                    <div className="flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 22 }}>{plat?.icon}</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <strong style={{ color: plat?.color }}>{plat?.label}</strong>
                            <span className={`pill pill-${p.status === 'sent' ? 'published' : p.status === 'scheduled' ? 'scheduled' : 'draft'}`} style={{ fontSize: 10 }}>{p.status}</span>
                          </div>
                          <div className="faint" style={{ fontSize: 12, marginBottom: 4 }}>Article: {p.articleTitle.slice(0, 50)}</div>
                          <p style={{ fontSize: 13, lineHeight: 1.5 }}>{p.caption?.slice(0, 120)}…</p>
                        </div>
                      </div>
                      <button className="action-btn danger" onClick={() => deletePost(p.id)}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

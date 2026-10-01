import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useBlocker } from 'react-router-dom';
import { PageHead } from '../components/ui/PageHead.jsx';
import { Upload, X, Save, Send, Calendar, FlameIcon, Star, Video } from '../components/ui/Icons.jsx';
import { articlesApi, mapArticlePayload } from '../api/articles.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = {
  title: '', titleTA: '', shortDescription: '', excerptTA: '', content: '', contentTA: '',
  categoryId: '', subCategoryId: '', authorId: '', location: '',
  featuredImageId: null, image: '', videoUrl: '', tags: [], publishDate: today(), publishTime: '09:00',
  isBreaking: false, isFeatured: false, status: 'draft',
};
const itemsOf = (value) => Array.isArray(value) ? value : value?.items || value?.categories || value?.subcategories || value?.reporters || value?.areas || [];

// sessionStorage key — separate key for "new" vs each edit id
const draftKey = (id) => id ? `news_draft_edit_${id}` : 'news_draft_new';

function loadDraft(id) {
  try {
    const raw = sessionStorage.getItem(draftKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDraft(id, form) {
  try { sessionStorage.setItem(draftKey(id), JSON.stringify(form)); } catch { /* quota exceeded — ignore */ }
}

function clearDraft(id) {
  try { sessionStorage.removeItem(draftKey(id)); } catch { /* ignore */ }
}

export default function AddEditNews() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const toast = useToast();
  const { hasPermission } = useAuth();
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const [form, setForm] = useState(() => loadDraft(id) || emptyForm);
  const [references, setReferences] = useState({ categories: [], subcategories: [], reporters: [], media: [] });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [draftRestored, setDraftRestored] = useState(() => Boolean(loadDraft(id)));
  const [isDirty, setIsDirty] = useState(false);

  // Block navigation when form has unsaved changes
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Auto-save form to sessionStorage whenever it changes
  useEffect(() => {
    saveDraft(id, form);
  }, [form, id]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError('');
    const requests = [
      articlesApi.listCategories({ signal: controller.signal }), articlesApi.listSubcategories({ signal: controller.signal }),
      articlesApi.listReporters({ signal: controller.signal }),
      hasPermission('media.view') ? articlesApi.listMedia({ signal: controller.signal }) : Promise.resolve({ items: [] }),
      isEdit ? articlesApi.get(id, { signal: controller.signal }) : Promise.resolve(null),
    ];
    Promise.all(requests).then(([categories, subcategories, reporters, media, article]) => {
      setReferences({ categories: itemsOf(categories), subcategories: itemsOf(subcategories), reporters: itemsOf(reporters), media: itemsOf(media) });
      // For edit mode: only apply server data if no draft was restored
      if (article && !loadDraft(id)) {
        setForm({
          ...emptyForm,
          ...article,
          title: article.title ?? '',
          titleTA: article.titleTA ?? '',
          shortDescription: article.shortDescription ?? '',
          excerptTA: article.excerptTA ?? '',
          content: article.content ?? '',
          contentTA: article.contentTA ?? '',
          categoryId: article.categoryId ?? '',
          subCategoryId: article.subCategoryId ?? '',
          authorId: article.authorId ?? '',
          location: article.location ?? '',
          image: article.image ?? '',
          videoUrl: article.videoUrl ?? '',
          tags: Array.isArray(article.tags) ? article.tags : [],
          publishDate: article.publishDate ?? today(),
          publishTime: article.publishTime ?? '09:00',
          isBreaking: article.isBreaking ?? false,
          isFeatured: article.isFeatured ?? false,
          status: article.status ?? 'draft',
        });
      }
    }).catch((err) => { if (err.code !== 'REQUEST_ABORTED') setLoadError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [hasPermission, id, isEdit]);

  const setField = (key, value) => {
    setIsDirty(true);
    setForm((current) => ({ ...current, [key]: value }));
  };
  const visibleSubcategories = references.subcategories.filter((item) => !form.categoryId || String(item.parentCategoryId ?? item.categoryId ?? item.category?.id) === String(form.categoryId));
  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required.';
    if (!form.shortDescription.trim()) next.shortDescription = 'Short description is required.';
    if (!form.content.trim()) next.content = 'Full content is required.';
    if (!form.categoryId) next.categoryId = 'Select a category.';
    if (!form.authorId) next.authorId = 'Select an author.';
    setErrors(next); return !Object.keys(next).length;
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file || uploading) return;
    setUploading(true);
    try {
      const media = await articlesApi.uploadMedia(file);
      setIsDirty(true);
      setForm((current) => ({ ...current, featuredImageId: media.id, image: media.url }));
      setReferences((current) => ({ ...current, media: [media, ...current.media.filter((item) => item.id !== media.id)] }));
      toast.success('Image uploaded', file.name);
    } catch (err) { toast.error('Image upload failed', err.message); }
    finally { setUploading(false); }
  };

  const uploadVideo = async (event) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file || uploadingVideo) return;
    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', 'video');
      const media = await articlesApi.uploadMedia(formData);
      setIsDirty(true);
      setForm((current) => ({ ...current, videoUrl: media.url }));
      toast.success('Video uploaded', file.name);
    } catch (err) { toast.error('Video upload failed', err.message); }
    finally { setUploadingVideo(false); }
  };

  const addTag = (event) => {
    if (!['Enter', ','].includes(event.key) || !tagInput.trim()) return;
    event.preventDefault();
    if (!form.tags.includes(tagInput.trim()) && form.tags.length < 10) setField('tags', [...form.tags, tagInput.trim()]);
    setTagInput('');
  };

  const persist = async (targetStatus) => {
    if (submitting || !validate()) {
      if (!submitting) toast.error('Fix the highlighted fields', 'Some required fields are missing.');
      return;
    }
    setSubmitting(true);
    try {
      if (targetStatus === 'scheduled') {
        const scheduled = new Date(`${form.publishDate}T${form.publishTime}:00+05:30`);
        if (!form.publishDate || !form.publishTime || Number.isNaN(scheduled.getTime()) || scheduled <= new Date()) {
          throw new Error('Choose a future publish date and time for scheduling.');
        }
      }
      if (!isEdit) {
        await articlesApi.create(mapArticlePayload({ ...form, status: targetStatus }));
      } else {
        const updateForm = { ...form };
        delete updateForm.status;
        if (targetStatus === 'scheduled') updateForm.status = 'scheduled';
        await articlesApi.update(id, mapArticlePayload(updateForm));
        if (targetStatus === 'pending' && form.status === 'draft') await articlesApi.changeStatus(id, 'submit');
        if (targetStatus === 'published' && form.status !== 'published') await articlesApi.changeStatus(id, 'publish-now');
      }
      const finalStatus = isEdit && targetStatus === 'draft' ? form.status : targetStatus;
      clearDraft(id); // clear saved draft after successful save
      setIsDirty(false);
      toast.success(isEdit ? 'Article updated' : 'Article created', `Server confirmed ${finalStatus} status.`);
      navigate('/news');
    } catch (err) { toast.error('Unable to save article', err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="card card-pad faint">Loading article editor…</div>;
  if (loadError) return <div className="card card-pad"><div className="field-error" role="alert">{loadError}</div><button className="btn btn-secondary" onClick={() => navigate('/news')}>Back to news</button></div>;

  const input = (field, label, tamil = false) => <div className="field"><label>{label}</label><input className={`input ${errors[field] ? 'error' : ''}`} lang={tamil ? 'ta' : undefined} value={form[field] || ''} onChange={(e) => setField(field, e.target.value)} />{errors[field] && <div className="field-error">{errors[field]}</div>}</div>;
  const textarea = (field, label, rows, tamil = false) => <div className="field"><label>{label}</label><textarea className={`input ${errors[field] ? 'error' : ''}`} lang={tamil ? 'ta' : undefined} rows={rows} value={form[field] || ''} onChange={(e) => setField(field, e.target.value)} />{errors[field] && <div className="field-error">{errors[field]}</div>}</div>;

  return <div>
    {/* ── Unsaved changes confirmation popup ───────────────────── */}
    {blocker.state === 'blocked' && (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(13,14,19,0.6)',
        backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 200, padding: 20,
        animation: 'fade-in 0.15s ease',
      }}>
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 420,
          padding: '32px 28px', display: 'flex', flexDirection: 'column',
          gap: 16, animation: 'modal-in 0.16s ease',
        }}>
          {/* Icon */}
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--accent-100)', color: 'var(--accent-600)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            ✋
          </div>
          {/* Text */}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              Unsaved Changes
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              You have unsaved changes on this page. If you leave now, your work will be lost.
            </div>
          </div>
          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => blocker.reset()}
            >
              Stay on Page
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => {
                clearDraft(id);
                setIsDirty(false);
                blocker.proceed();
              }}
            >
              Discard & Leave
            </button>
          </div>
        </div>
      </div>
    )}
    <PageHead eyebrow={isEdit ? 'Edit Article' : 'New Article'} title={isEdit ? 'Edit News' : 'Add News'} desc="Create bilingual stories and use the server-backed editorial workflow." />
    {draftRestored && (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '10px 14px',
        marginBottom: 16, fontSize: 13, gap: 12,
      }}>
        <span>📝 Your unsaved changes have been restored.</span>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: 12, padding: '4px 10px' }}
          onClick={() => {
            clearDraft(id);
            setForm(emptyForm);
            setDraftRestored(false);
          }}
        >
          Discard & Start Fresh
        </button>
      </div>
    )}
    <div className="two-col">
      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {input('title', 'News Title *')}{input('titleTA', 'Tamil Title', true)}
        {textarea('shortDescription', 'Short Description *', 2)}{textarea('excerptTA', 'Tamil Short Description', 2, true)}
        {textarea('content', 'Full News Content *', 10)}{textarea('contentTA', 'Tamil Content', 10, true)}
        <div className="field"><label>Featured Image</label>
          {form.image && <div className="image-preview" style={{ maxWidth: 340 }}><img src={form.image} alt="Featured" /><button type="button" className="remove-btn" onClick={() => setForm((current) => ({ ...current, image: '', featuredImageId: null }))}><X /></button></div>}
          {hasPermission('media.upload') && <><button type="button" className="btn btn-secondary" disabled={uploading} onClick={() => fileRef.current?.click()}><Upload />{uploading ? 'Uploading…' : 'Upload image'}</button><input ref={fileRef} type="file" accept="image/*" hidden onChange={uploadImage} /></>}
          {hasPermission('media.view') && references.media.length > 0 && <select className="select" value={form.featuredImageId || ''} onChange={(e) => { const media = references.media.find((item) => String(item.id) === e.target.value); setForm((current) => ({ ...current, featuredImageId: media?.id || null, image: media?.url || '' })); }}><option value="">Choose from media library</option>{references.media.map((item) => <option key={item.id} value={item.id}>{item.name || item.originalName || `Image ${item.id}`}</option>)}</select>}
        </div>
        <div className="field"><label><Video style={{ width: 14, height: 14, marginRight: 4, verticalAlign: -2 }} />Featured Video</label>
          {form.videoUrl && (
            <div className="image-preview" style={{ maxWidth: 340, position: 'relative' }}>
              <video src={form.videoUrl} controls style={{ width: '100%', borderRadius: 6, display: 'block' }} />
              <button type="button" className="remove-btn" onClick={() => setForm((current) => ({ ...current, videoUrl: '' }))}><X /></button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {hasPermission('media.upload') && (
              <>
                <button type="button" className="btn btn-secondary" disabled={uploadingVideo} onClick={() => videoRef.current?.click()}>
                  <Upload />{uploadingVideo ? 'Uploading…' : 'Upload video'}
                </button>
                <input ref={videoRef} type="file" accept="video/*" hidden onChange={uploadVideo} />
              </>
            )}
            <span className="faint" style={{ fontSize: 12 }}>or</span>
            <input
              className="input"
              style={{ flex: 1, minWidth: 200 }}
              placeholder="Paste YouTube or video URL…"
              value={form.videoUrl}
              onChange={(e) => setForm((current) => ({ ...current, videoUrl: e.target.value }))}
            />
          </div>
        </div>
        <div className="field"><label>Tags</label><div className="tag-input-wrap">{form.tags.map((tag) => <span className="tag-chip" key={tag}>{tag}<button type="button" onClick={() => setField('tags', form.tags.filter((item) => item !== tag))}><X /></button></span>)}<input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} placeholder="Type a tag and press Enter" /></div></div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><h3>Publishing</h3>
          <div className="field"><label>Category *</label><select className={`select ${errors.categoryId ? 'error' : ''}`} value={form.categoryId} onChange={(e) => setForm((current) => ({ ...current, categoryId: e.target.value, subCategoryId: '' }))}><option value="">Select category</option>{references.categories.map((item) => <option key={item.id} value={item.id}>{item.name || item.label}</option>)}</select>{errors.categoryId && <div className="field-error">{errors.categoryId}</div>}</div>
          <div className="field"><label>Sub Category</label><select className="select" value={form.subCategoryId} onChange={(e) => setField('subCategoryId', e.target.value)}><option value="">None</option>{visibleSubcategories.map((item) => <option key={item.id} value={item.id}>{item.name || item.label}</option>)}</select></div>
          <div className="field"><label>Author / Reporter *</label><select className={`select ${errors.authorId ? 'error' : ''}`} value={form.authorId} onChange={(e) => setField('authorId', e.target.value)}><option value="">Select reporter</option>{references.reporters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{errors.authorId && <div className="field-error">{errors.authorId}</div>}</div>
          {input('location', 'Location')}
          <div className="field"><label><Calendar /> Publish Date</label><input type="date" className="input" value={form.publishDate || ''} onChange={(e) => setField('publishDate', e.target.value)} /></div>
          <div className="field"><label>Publish Time</label><input type="time" className="input" value={form.publishTime || ''} onChange={(e) => setField('publishTime', e.target.value)} /></div>
          {[['isBreaking', 'Mark as Breaking News', FlameIcon], ['isFeatured', 'Mark as Featured', Star]].map(([key, label, Icon]) => <div className="flex-between" key={key}><span><Icon /> {label}</span><label className="switch"><input type="checkbox" checked={form[key]} onChange={(e) => setField(key, e.target.checked)} /><span className="slider" /></label></div>)}
        </div>
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-secondary btn-block" disabled={submitting} onClick={() => persist('draft')}><Save />Save Changes</button>
          {hasPermission('news.edit') && form.status === 'draft' && <button className="btn btn-secondary btn-block" disabled={submitting} onClick={() => persist('pending')}><Send />Submit for Review</button>}
          {hasPermission('news.publish') && (!isEdit || form.status === 'scheduled') && <button className="btn btn-secondary btn-block" disabled={submitting} onClick={() => persist('scheduled')}><Calendar />{form.status === 'scheduled' ? 'Update Schedule' : 'Schedule'}</button>}
          {hasPermission('news.publish') && form.status !== 'published' && <button className="btn btn-primary btn-block" disabled={submitting} onClick={() => persist('published')}><Send />Publish Now</button>}
        </div>
      </div>
    </div>
  </div>;
}

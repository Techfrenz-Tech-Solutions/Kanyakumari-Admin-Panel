import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHead } from '../components/ui/PageHead.jsx';
import { Upload, X, Save, Send, Calendar, Zap } from '../components/ui/Icons.jsx';
import { articlesApi, mapArticlePayload } from '../api/articles.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = {
  title: '', titleTA: '', shortDescription: '', excerptTA: '', content: '', contentTA: '',
  categoryId: '', subCategoryId: '', authorId: '', areaId: '', location: '',
  featuredImageId: null, image: '', tags: [], publishDate: today(), publishTime: '09:00',
  isBreaking: false, isFeatured: false, status: 'draft',
};
const itemsOf = (value) => Array.isArray(value) ? value : value?.items || value?.categories || value?.subcategories || value?.reporters || value?.areas || [];

export default function AddEditNews() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const toast = useToast();
  const { hasPermission } = useAuth();
  const fileRef = useRef(null);
  const [form, setForm] = useState(emptyForm);
  const [references, setReferences] = useState({ categories: [], subcategories: [], reporters: [], areas: [], media: [] });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError('');
    const requests = [
      articlesApi.listCategories({ signal: controller.signal }), articlesApi.listSubcategories({ signal: controller.signal }),
      articlesApi.listReporters({ signal: controller.signal }), articlesApi.listAreas({ signal: controller.signal }),
      hasPermission('media.view') ? articlesApi.listMedia({ signal: controller.signal }) : Promise.resolve({ items: [] }),
      isEdit ? articlesApi.get(id, { signal: controller.signal }) : Promise.resolve(null),
    ];
    Promise.all(requests).then(([categories, subcategories, reporters, areas, media, article]) => {
      setReferences({ categories: itemsOf(categories), subcategories: itemsOf(subcategories), reporters: itemsOf(reporters), areas: itemsOf(areas), media: itemsOf(media) });
      if (article) setForm({ ...emptyForm, ...article, categoryId: article.categoryId || '', subCategoryId: article.subCategoryId || '', authorId: article.authorId || '', areaId: article.areaId || '' });
    }).catch((err) => { if (err.code !== 'REQUEST_ABORTED') setLoadError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [hasPermission, id, isEdit]);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
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
      setForm((current) => ({ ...current, featuredImageId: media.id, image: media.url }));
      setReferences((current) => ({ ...current, media: [media, ...current.media.filter((item) => item.id !== media.id)] }));
      toast.success('Image uploaded', file.name);
    } catch (err) { toast.error('Image upload failed', err.message); }
    finally { setUploading(false); }
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
    <PageHead eyebrow={isEdit ? 'Edit Article' : 'New Article'} title={isEdit ? 'Edit News' : 'Add News'} desc="Create bilingual stories and use the server-backed editorial workflow." />
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
        <div className="field"><label>Tags</label><div className="tag-input-wrap">{form.tags.map((tag) => <span className="tag-chip" key={tag}>{tag}<button type="button" onClick={() => setField('tags', form.tags.filter((item) => item !== tag))}><X /></button></span>)}<input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} placeholder="Type a tag and press Enter" /></div></div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><h3>Publishing</h3>
          <div className="field"><label>Category *</label><select className={`select ${errors.categoryId ? 'error' : ''}`} value={form.categoryId} onChange={(e) => setForm((current) => ({ ...current, categoryId: e.target.value, subCategoryId: '' }))}><option value="">Select category</option>{references.categories.map((item) => <option key={item.id} value={item.id}>{item.name || item.label}</option>)}</select>{errors.categoryId && <div className="field-error">{errors.categoryId}</div>}</div>
          <div className="field"><label>Sub Category</label><select className="select" value={form.subCategoryId} onChange={(e) => setField('subCategoryId', e.target.value)}><option value="">None</option>{visibleSubcategories.map((item) => <option key={item.id} value={item.id}>{item.name || item.label}</option>)}</select></div>
          <div className="field"><label>Author / Reporter *</label><select className={`select ${errors.authorId ? 'error' : ''}`} value={form.authorId} onChange={(e) => setField('authorId', e.target.value)}><option value="">Select reporter</option>{references.reporters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{errors.authorId && <div className="field-error">{errors.authorId}</div>}</div>
          <div className="field"><label>Area</label><select className="select" value={form.areaId} onChange={(e) => setField('areaId', e.target.value)}><option value="">None</option>{references.areas.map((item) => <option key={item.id} value={item.id}>{item.name || item.label}</option>)}</select></div>
          {input('location', 'Location')}
          <div className="field"><label><Calendar /> Publish Date</label><input type="date" className="input" value={form.publishDate || ''} onChange={(e) => setField('publishDate', e.target.value)} /></div>
          <div className="field"><label>Publish Time</label><input type="time" className="input" value={form.publishTime || ''} onChange={(e) => setField('publishTime', e.target.value)} /></div>
          {[['isBreaking', 'Mark as Breaking News'], ['isFeatured', 'Mark as Featured']].map(([key, label]) => <div className="flex-between" key={key}><span><Zap /> {label}</span><label className="switch"><input type="checkbox" checked={form[key]} onChange={(e) => setField(key, e.target.checked)} /><span className="slider" /></label></div>)}
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

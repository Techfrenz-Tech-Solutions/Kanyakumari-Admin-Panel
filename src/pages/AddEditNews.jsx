import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHead } from '../components/ui/PageHead.jsx';
import { Upload, X, Save, Send, Calendar, Zap } from '../components/ui/Icons.jsx';
import { loadData, saveData, uid } from '../utils/storage.js';
import { seedNews, seedCategories, seedReporters } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const emptyForm = {
  title: '',
  shortDescription: '',
  content: '',
  image: '',
  category: '',
  subCategory: '',
  author: '',
  location: '',
  tags: [],
  publishDate: new Date().toISOString().slice(0, 10),
  publishTime: '09:00',
  isBreaking: false,
};

export default function AddEditNews() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const isEdit = Boolean(id);
  const fileRef = useRef(null);

  const categories = loadData('categories', seedCategories);
  const reporters = loadData('reporters', seedReporters);

  const [form, setForm] = useState(emptyForm);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      const news = loadData('news', seedNews);
      const existing = news.find((n) => n.id === id);
      if (existing) setForm({ ...emptyForm, ...existing });
    }
  }, [id, isEdit]);

  const selectedCategory = categories.find((c) => c.name === form.category);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.shortDescription.trim()) errs.shortDescription = 'Short description is required.';
    if (!form.content.trim()) errs.content = 'Full content is required.';
    if (!form.category) errs.category = 'Select a category.';
    if (!form.author) errs.author = 'Select an author.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setField('image', reader.result);
    reader.readAsDataURL(file);
  };

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      if (!form.tags.includes(tagInput.trim())) setField('tags', [...form.tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  const removeTag = (tag) => setField('tags', form.tags.filter((t) => t !== tag));

  const persist = (status) => {
    if (!validate()) {
      toast.error('Fix the highlighted fields', 'Some required fields are missing.');
      return;
    }
    const news = loadData('news', seedNews);
    const now = new Date().toISOString().slice(0, 10);
    const record = {
      ...form,
      image: form.image || `https://picsum.photos/seed/${uid('n')}/640/400`,
      status,
      views: form.views || 0,
      createdAt: form.createdAt || now,
    };

    let updated;
    if (isEdit) {
      record.id = id;
      updated = news.map((n) => (n.id === id ? record : n));
      toast.success('Article updated', `Saved as ${status}.`);
    } else {
      record.id = uid('news');
      updated = [record, ...news];
      toast.success('Article created', `Saved as ${status}.`);
    }
    saveData('news', updated);
    navigate('/news');
  };

  return (
    <div>
      <PageHead
        eyebrow={isEdit ? 'Edit Article' : 'New Article'}
        title={isEdit ? 'Edit News' : 'Add News'}
        desc="Fill in the article details, then save as draft, publish immediately, or schedule."
      />

      <div className="two-col">
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="field">
            <label>News Title *</label>
            <input className={`input ${errors.title ? 'error' : ''}`} value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Enter a clear, concise headline" />
            {errors.title && <div className="field-error">{errors.title}</div>}
          </div>

          <div className="field">
            <label>Short Description *</label>
            <textarea className={`input ${errors.shortDescription ? 'error' : ''}`} rows={2} value={form.shortDescription} onChange={(e) => setField('shortDescription', e.target.value)} placeholder="One or two sentences for listings and social previews" />
            {errors.shortDescription && <div className="field-error">{errors.shortDescription}</div>}
          </div>

          <div className="field">
            <label>Full News Content *</label>
            <textarea className={`input ${errors.content ? 'error' : ''}`} rows={10} value={form.content} onChange={(e) => setField('content', e.target.value)} placeholder="Write the full article body (HTML formatting supported)" />
            {errors.content && <div className="field-error">{errors.content}</div>}
          </div>

          <div className="field">
            <label>Featured Image</label>
            {form.image ? (
              <div className="image-preview" style={{ maxWidth: 340 }}>
                <img src={form.image} alt="Featured" />
                <button className="remove-btn" onClick={() => setField('image', '')}><X /></button>
              </div>
            ) : (
              <div className="dropzone" style={{ maxWidth: 340 }} onClick={() => fileRef.current?.click()}>
                <Upload />
                <div style={{ fontWeight: 600, fontSize: 13 }}>Click to upload an image</div>
                <div className="faint" style={{ fontSize: 11.5, marginTop: 3 }}>PNG, JPG up to 5MB</div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />
          </div>

          <div className="field">
            <label>Tags</label>
            <div className="tag-input-wrap">
              {form.tags.map((t) => (
                <span className="tag-chip" key={t}>{t}<button onClick={() => removeTag(t)}><X style={{ width: 11, height: 11 }} /></button></span>
              ))}
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} placeholder="Type a tag and press Enter" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 14 }}>Publishing</h3>

            <div className="field">
              <label>Category *</label>
              <select className={`select ${errors.category ? 'error' : ''}`} value={form.category} onChange={(e) => setField('category', e.target.value)}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              {errors.category && <div className="field-error">{errors.category}</div>}
            </div>

            <div className="field">
              <label>Sub Category</label>
              <select className="select" value={form.subCategory} onChange={(e) => setField('subCategory', e.target.value)}>
                <option value="">Select sub-category</option>
                {(selectedCategory?.subcategories || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="field">
              <label>Author / Reporter *</label>
              <select className={`select ${errors.author ? 'error' : ''}`} value={form.author} onChange={(e) => setField('author', e.target.value)}>
                <option value="">Select reporter</option>
                {reporters.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
              {errors.author && <div className="field-error">{errors.author}</div>}
            </div>

            <div className="field">
              <label>Location</label>
              <input className="input" value={form.location} onChange={(e) => setField('location', e.target.value)} placeholder="e.g. Chennai" />
            </div>

            <div className="form-grid cols-1" style={{ gap: 14 }}>
              <div className="field">
                <label><Calendar style={{ width: 13, height: 13, marginRight: 4, verticalAlign: -2 }} />Publish Date</label>
                <input type="date" className="input" value={form.publishDate} onChange={(e) => setField('publishDate', e.target.value)} />
              </div>
              <div className="field">
                <label>Publish Time</label>
                <input type="time" className="input" value={form.publishTime} onChange={(e) => setField('publishTime', e.target.value)} />
              </div>
            </div>

            <div className="flex-between" style={{ background: 'var(--surface-2)', padding: '10px 12px', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                <Zap style={{ width: 15, height: 15, color: 'var(--red-500)' }} /> Mark as Breaking News
              </div>
              <label className="switch">
                <input type="checkbox" checked={form.isBreaking} onChange={(e) => setField('isBreaking', e.target.checked)} />
                <span className="slider" />
              </label>
            </div>
          </div>

          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-secondary btn-block" onClick={() => persist('draft')}><Save />Save as Draft</button>
            <button className="btn btn-secondary btn-block" onClick={() => persist('scheduled')}><Calendar />Schedule</button>
            <button className="btn btn-primary btn-block" onClick={() => persist('published')}><Send />Publish Now</button>
          </div>
        </div>
      </div>
    </div>
  );
}

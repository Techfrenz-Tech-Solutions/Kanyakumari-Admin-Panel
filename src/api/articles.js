import { apiClient } from './client.js';

const LIST_KEYS = ['page', 'limit', 'status', 'category', 'search', 'isBreaking', 'isFeatured', 'sort'];
const LIFECYCLE_ACTIONS = new Set(['submit', 'approve', 'reject', 'publish-now', 'unpublish', 'cancel-schedule']);

export function buildArticleQuery(filters = {}) {
  const params = new URLSearchParams();
  for (const key of LIST_KEYS) {
    let value = filters[key];
    if (typeof value === 'string') value = value.trim();
    if (value === undefined || value === null || value === '' || value === 'all' || value === false) continue;
    params.set(key, String(value));
  }
  return params.toString();
}

function integerOrValue(value) {
  if (value === '' || value === null || value === undefined) return undefined;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : value;
}

function optionalText(value, { nullable = false } = {}) {
  if (value === undefined) return undefined;
  const text = value === null ? '' : String(value).trim();
  return text || (nullable ? null : undefined);
}

export function mapArticle(article = {}) {
  const featuredImage = article.featuredImage || null;
  return {
    ...article,
    shortDescription: article.shortDescription ?? article.excerpt ?? '',
    image: featuredImage?.url || article.image || article.featuredImageUrl || '',
    featuredImageId: article.featuredImageId ?? featuredImage?.id ?? null,
    subCategoryId: article.subCategoryId ?? article.subcategoryId ?? null,
    tags: Array.isArray(article.tags)
      ? article.tags.map((tag) => (typeof tag === 'string' ? tag : tag?.name)).filter(Boolean)
      : [],
  };
}

export function mapArticlePayload(form = {}) {
  const payload = {
    title: optionalText(form.title),
    titleTA: optionalText(form.titleTA, { nullable: true }),
    excerpt: optionalText(form.shortDescription ?? form.excerpt),
    excerptTA: optionalText(form.excerptTA, { nullable: true }),
    content: form.content,
    contentTA: form.contentTA === undefined ? undefined : (form.contentTA || null),
    location: optionalText(form.location, { nullable: true }),
    videoUrl: optionalText(form.videoUrl, { nullable: true }),
    tags: Array.isArray(form.tags) ? form.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
    isBreaking: Boolean(form.isBreaking),
    isFeatured: Boolean(form.isFeatured),
    status: form.status,
    publishDate: optionalText(form.publishDate),
    publishTime: optionalText(form.publishTime),
    scheduledAt: optionalText(form.scheduledAt),
  };

  const category = integerOrValue(form.categoryId ?? form.category);
  if (typeof category === 'number') payload.categoryId = category;
  else if (category !== undefined) payload.category = category;

  const subcategory = integerOrValue(form.subCategoryId ?? form.subcategoryId ?? form.subCategory);
  if (typeof subcategory === 'number') payload.subcategoryId = subcategory;
  else if (subcategory !== undefined) payload.subCategory = subcategory;
  else if (form.subCategoryId === null || form.subCategoryId === '' || form.subcategoryId === null || form.subcategoryId === '') payload.subcategoryId = null;

  const author = integerOrValue(form.authorId ?? form.author);
  if (typeof author === 'number') payload.authorId = author;
  else if (author !== undefined) payload.author = author;

  const area = integerOrValue(form.areaId ?? form.area);
  if (typeof area === 'number') payload.areaId = area;
  else if (area !== undefined) payload.area = area;
  else if (form.areaId === null || form.areaId === '') payload.areaId = null;

  const featuredImageId = integerOrValue(form.featuredImageId);
  if (typeof featuredImageId === 'number') payload.featuredImageId = featuredImageId;
  else if (form.featuredImageId === null || form.featuredImageId === '') payload.featuredImageId = null;

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function mapList(result = {}) {
  return { ...result, items: (result.items || []).map(mapArticle) };
}

export function createArticlesApi(client = apiClient) {
  return {
    async list(filters = {}, options = {}) {
      const query = buildArticleQuery(filters);
      return mapList(await client.request(`/api/admin/news${query ? `?${query}` : ''}`, options));
    },
    async get(id, options = {}) {
      return mapArticle(await client.request(`/api/admin/news/${encodeURIComponent(id)}`, options));
    },
    async create(payload, options = {}) {
      return mapArticle(await client.request('/api/admin/news', { ...options, method: 'POST', body: payload }));
    },
    async update(id, payload, options = {}) {
      return mapArticle(await client.request(`/api/admin/news/${encodeURIComponent(id)}`, { ...options, method: 'PUT', body: payload }));
    },
    remove(id, options = {}) {
      return client.request(`/api/admin/news/${encodeURIComponent(id)}`, { ...options, method: 'DELETE' });
    },
    async changeStatus(id, action, reason, options = {}) {
      if (!LIFECYCLE_ACTIONS.has(action)) throw new TypeError(`Unsupported article lifecycle action: ${action}`);
      const body = { action };
      if (reason?.trim()) body.reason = reason.trim();
      return mapArticle(await client.request(`/api/admin/news/${encodeURIComponent(id)}/status`, { ...options, method: 'POST', body }));
    },
    listCategories: (options = {}) => client.request('/api/admin/categories?limit=100', options),
    listSubcategories: (options = {}) => client.request('/api/admin/subcategories?limit=100', options),
    listReporters: (options = {}) => client.request('/api/admin/reporters?limit=100', options),
    listAreas: (options = {}) => client.request('/api/admin/areas?limit=100', options),
    listMedia: (options = {}) => client.request('/api/admin/media?kind=image&page=1&limit=100', options),
    uploadMedia(fileOrForm, options = {}) {
      const body = fileOrForm instanceof FormData ? fileOrForm : new FormData();
      if (!(fileOrForm instanceof FormData)) {
        body.append('file', fileOrForm);
        body.append('kind', 'image');
      }
      return client.request('/api/admin/upload', { ...options, method: 'POST', body });
    },
  };
}

export const articlesApi = createArticlesApi();

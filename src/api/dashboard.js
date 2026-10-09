import { apiClient } from './client.js';
import { mapArticle } from './articles.js';

const RANGE_BY_LABEL = {
  Today: 'today',
  Yesterday: 'yesterday',
  'Last 7 Days': '7d',
  'Last 30 Days': '30d',
};

export function dashboardRange(label) {
  return RANGE_BY_LABEL[label] || '7d';
}

function withRange(path, range) {
  const params = new URLSearchParams();
  if (range) params.set('range', range);
  const query = params.toString();
  return `${path}${query ? `?${query}` : ''}`;
}

function normalizeStats(stats = {}) {
  return {
    range: stats.range || '7d',
    total: stats.total || 0,
    published: stats.published || 0,
    publishedToday: stats.publishedToday || 0,
    draft: stats.draft || 0,
    pending: stats.pending || 0,
    scheduled: stats.scheduled || 0,
    breaking: stats.breaking || 0,
    totalViews: stats.totalViews || 0,
    totalComments: stats.totalComments || 0,
    totalReporters: stats.totalReporters || 0,
    viewsInPeriod: stats.viewsInPeriod || 0,
    commentsInPeriod: stats.commentsInPeriod || 0,
    viewsTrend: stats.viewsTrend || [],
    categoryDistribution: stats.categoryDistribution || [],
    weeklyPublished: stats.weeklyPublished || [],
    trafficSources: stats.trafficSources || [],
    deviceDistribution: stats.deviceDistribution || [],
  };
}

export function createDashboardApi(client = apiClient) {
  return {
    async stats(range, options = {}) {
      return normalizeStats(await client.request(withRange('/api/admin/dashboard/stats', range), options));
    },
    async recent(options = {}) {
      const result = await client.request('/api/admin/news?page=1&limit=7&sort=-createdAt', options);
      return (result.items || []).map(mapArticle);
    },
    async topArticles(range, options = {}) {
      const result = await client.request(`${withRange('/api/admin/analytics/top-articles', range)}&limit=5`, options);
      return (result.items || []).map((item) => ({
        ...item,
        views: item.viewCount || item.views || 0,
        category: item.category || '—',
        author: item.author?.name || item.author || '—',
      }));
    },
  };
}

export const dashboardApi = createDashboardApi();

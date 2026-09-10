// Data file — seed arrays are empty (no dummy data).
// Pages will show empty states until real data is added through the UI.

// ── Seed arrays (all empty) ──────────────────────────────────────────────────

export const seedCategories = [];

export const seedSubCategories = [];

export const seedReporters = [];

export const seedAuthors = [];

export const seedEditors = [];

export const seedNews = [];

export const seedBreakingNews = [];

export const seedLiveUpdates = [];

export const seedDistrictNews = [];

export const seedMedia = [];

export const seedVideos = [];

export const seedGalleries = [];

export const seedAds = [];

export const seedComments = [];

export const seedUsers = [];

export const seedNotifications = [];

export const seedActivityLogs = [];

export const seedSEO = [];

// ── Role permissions (structural — not dummy data) ───────────────────────────

export const rolePermissions = {
  'Super Admin': {
    news:       ['view', 'create', 'edit', 'delete', 'publish', 'approve'],
    categories: ['view', 'create', 'edit', 'delete'],
    reporters:  ['view', 'create', 'edit', 'delete'],
    media:      ['view', 'upload', 'delete'],
    ads:        ['view', 'create', 'edit', 'delete'],
    comments:   ['view', 'moderate', 'delete'],
    users:      ['view', 'create', 'edit', 'delete'],
    settings:   ['view', 'edit'],
  },
  Admin: {
    news:       ['view', 'create', 'edit', 'delete', 'publish'],
    categories: ['view', 'create', 'edit'],
    reporters:  ['view', 'create', 'edit'],
    media:      ['view', 'upload', 'delete'],
    ads:        ['view', 'create', 'edit'],
    comments:   ['view', 'moderate', 'delete'],
    users:      ['view', 'edit'],
    settings:   ['view'],
  },
  Editor: {
    news:       ['view', 'create', 'edit', 'publish', 'approve'],
    categories: ['view'],
    reporters:  ['view'],
    media:      ['view', 'upload'],
    ads:        ['view'],
    comments:   ['view', 'moderate'],
    users:      [],
    settings:   [],
  },
  Reporter: {
    news:       ['view', 'create', 'edit'],
    categories: ['view'],
    reporters:  ['view'],
    media:      ['view', 'upload'],
    ads:        [],
    comments:   ['view'],
    users:      [],
    settings:   [],
  },
  Moderator: {
    news:       ['view'],
    categories: ['view'],
    reporters:  ['view'],
    media:      ['view'],
    ads:        ['view'],
    comments:   ['view', 'moderate', 'delete'],
    users:      [],
    settings:   [],
  },
  'Content Manager': {
    news:       ['view', 'create', 'edit'],
    categories: ['view', 'create', 'edit'],
    reporters:  ['view'],
    media:      ['view', 'upload', 'delete'],
    ads:        ['view'],
    comments:   ['view'],
    users:      [],
    settings:   [],
  },
  'Advertisement Manager': {
    news:       ['view'],
    categories: ['view'],
    reporters:  [],
    media:      ['view', 'upload'],
    ads:        ['view', 'create', 'edit', 'delete'],
    comments:   [],
    users:      [],
    settings:   [],
  },
};

// ── Analytics chart data ─────────────────────────────────────────────────────

export const viewsTrend = [
  { date: 'Aug 28', views: 3200, visitors: 1850 },
  { date: 'Aug 29', views: 4100, visitors: 2300 },
  { date: 'Aug 30', views: 3750, visitors: 2100 },
  { date: 'Aug 31', views: 5200, visitors: 2900 },
  { date: 'Sep 01', views: 6400, visitors: 3500 },
  { date: 'Sep 02', views: 5800, visitors: 3200 },
  { date: 'Sep 03', views: 4900, visitors: 2750 },
  { date: 'Sep 04', views: 7100, visitors: 4100 },
  { date: 'Sep 05', views: 8300, visitors: 4700 },
  { date: 'Sep 06', views: 7600, visitors: 4300 },
  { date: 'Sep 07', views: 6200, visitors: 3600 },
  { date: 'Sep 08', views: 9100, visitors: 5200 },
  { date: 'Sep 09', views: 10400, visitors: 5900 },
  { date: 'Sep 10', views: 9700, visitors: 5500 },
];

export const categoryDistribution = [
  { name: 'Politics',    value: 34 },
  { name: 'Sports',      value: 22 },
  { name: 'Cinema',      value: 18 },
  { name: 'Business',    value: 12 },
  { name: 'Technology',  value: 8  },
  { name: 'Education',   value: 6  },
];

export const weeklyPublished = [
  { day: 'Mon', published: 8,  draft: 3, pending: 2 },
  { day: 'Tue', published: 12, draft: 5, pending: 4 },
  { day: 'Wed', published: 7,  draft: 2, pending: 1 },
  { day: 'Thu', published: 15, draft: 6, pending: 3 },
  { day: 'Fri', published: 11, draft: 4, pending: 5 },
  { day: 'Sat', published: 6,  draft: 1, pending: 2 },
  { day: 'Sun', published: 4,  draft: 2, pending: 1 },
];

export const trafficSources = [
  { name: 'Google',    value: 42 },
  { name: 'Direct',    value: 24 },
  { name: 'Facebook',  value: 16 },
  { name: 'Twitter',   value: 9  },
  { name: 'WhatsApp',  value: 6  },
  { name: 'Others',    value: 3  },
];

export const deviceDistribution = [
  { name: 'Mobile',  value: 68 },
  { name: 'Desktop', value: 24 },
  { name: 'Tablet',  value: 8  },
];

// ── Default site settings ────────────────────────────────────────────────────

export const defaultSettings = {
  siteName:     '',
  tagline:      '',
  logoUrl:      '',
  faviconUrl:   '',
  contactEmail: '',
  contactPhone: '',
  address:      '',
  headerNote:   '',
  footerText:   '',
  social: {
    facebook:  '',
    twitter:   '',
    instagram: '',
    youtube:   '',
  },
};

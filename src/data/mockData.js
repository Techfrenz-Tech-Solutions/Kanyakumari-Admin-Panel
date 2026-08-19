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

// ── Analytics chart data (empty — will render blank charts) ─────────────────

export const viewsTrend = [];

export const categoryDistribution = [];

export const weeklyPublished = [];

export const trafficSources = [];

export const deviceDistribution = [];

// ── Current admin (used by AuthContext / Profile) ────────────────────────────

export const currentAdmin = {
  name:     'Admin User',
  email:    'admin@dailywire.in',
  role:     'Super Admin',
  initials: 'AU',
  phone:    '',
  bio:      '',
  joinDate: '',
};

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

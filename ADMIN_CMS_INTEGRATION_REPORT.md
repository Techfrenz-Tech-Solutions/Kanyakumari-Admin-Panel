# Admin CMS Integration Report

## Executive Summary

Step 3 replaces the core Admin CMS mock/localStorage workflows with the hardened backend. Categories, subcategories, areas, reporters, users, media, article CRUD, filtering, and editorial lifecycle operations now use the shared authenticated API client. The browser-verified workflow persists to the isolated MySQL integration database and includes restricted-role enforcement.

## Starting Baseline

```text
Admin Step 2 SHA:
a506c0812cc4b5280df0bf8b88c057eb93c8d44b

Backend SHA:
3760d9fcab14f2c4d6a06176db3449dc47681a9c
```

The Admin Step 3 branch was created from the exact frozen Step 2 SHA. The public frontend was not modified.

## Modules Integrated

### Categories

- Old source: `dw_admin_categories` localStorage data and mock seeds.
- New backend API: `GET/POST /api/admin/categories`, `PUT/DELETE /api/admin/categories/:id`.
- Files changed: `src/api/taxonomy.js`, `src/pages/Categories.jsx`.
- Status: Complete. Uses backend integer IDs, canonical nested subcategory display, loading/empty/error states, permissions, duplicate-submit prevention, and server-confirmed mutations.
- Tests: API adapter automation and browser create/reload/cleanup.

### Subcategories

- Old source: duplicated category/localStorage representations.
- New backend API: `GET/POST /api/admin/subcategories`, `PUT/DELETE /api/admin/subcategories/:id`.
- Files changed: `src/api/taxonomy.js`, `src/pages/SubCategories.jsx`.
- Status: Complete. Sends the canonical `parentCategory` integer ID and reads `parentCategoryId`.
- Tests: API payload automation and browser category relationship reload.

### Areas

- Old source: hardcoded/mock locality values.
- New backend API: `GET/POST /api/admin/areas`, `PUT/DELETE /api/admin/areas/:id`.
- Files changed: `src/api/taxonomy.js`, `src/pages/Areas.jsx`, `src/App.jsx`, `src/components/layout/Sidebar.jsx`.
- Status: Complete. Added the smallest dedicated Area management page and uses Area IDs in article forms.
- Tests: API CRUD automation and browser create/select/cleanup.

### Reporters

- Old source: reporter localStorage/mock seed data.
- New backend API: `GET/POST /api/admin/reporters`, `GET/PUT/DELETE /api/admin/reporters/:id`.
- Files changed: `src/api/reporters.js`, `src/pages/Reporters.jsx`.
- Status: Complete. Reporter is the article attribution relation; disconnected Author and Editor models are not used for article creation.
- Tests: API adapter automation and browser create/select/cleanup.

### Users/Roles

- Old source: mock users and a frontend role matrix.
- New backend API: `GET/POST /api/admin/users`, `PUT/DELETE /api/admin/users/:id`.
- Files changed: `src/api/users.js`, `src/pages/UsersRoles.jsx`.
- Status: Complete. Uses the backend role enum and optional `module:action` extra permissions. The fake role matrix was removed. Generated temporary passwords are held only in the one-time modal state and are never logged or persisted.
- Tests: API adapter automation and restricted/full-access browser sessions.

### Media

- Old source: `FileReader` base64 data stored in localStorage.
- New backend API: `POST /api/admin/upload`, `GET /api/admin/media`, `DELETE /api/admin/media/:id`.
- Files changed: `src/api/media.js`, `src/pages/MediaLibrary.jsx`, `src/pages/AddEditNews.jsx`.
- Status: Complete. Uses multipart field `file`, backend validation, real metadata/URLs/thumbnails, server pagination/search, upload/delete permissions, and a media picker based on `featuredImageId`.
- Tests: FormData adapter automation plus browser upload/select/article relation/cleanup.

### Articles

- Old source: `dw_admin_news`, mock articles, and component-only filtering/lifecycle state.
- New backend API: `GET/POST /api/admin/news`, `GET/PUT/DELETE /api/admin/news/:id`.
- Files changed: `src/api/articles.js`, `src/pages/NewsList.jsx`, `src/pages/AddEditNews.jsx`, `src/App.jsx`.
- Status: Complete. All `/news`, `/news/drafts`, `/news/pending`, `/news/published`, and `/news/scheduled` routes use backend pagination/filtering. Create/edit/delete, Tamil values, relations, featured media, tags, featured/breaking flags, and server errors are supported.
- Tests: Query/payload/CRUD automation and full browser round-trip.

### Lifecycle

- Old source: local status mutation in separate mock pages.
- New backend API: `POST /api/admin/news/:id/status`.
- Files changed: `src/api/articles.js`, `src/pages/NewsList.jsx`, `src/pages/AddEditNews.jsx`, `src/App.jsx`.
- Status: Complete. Implements submit, approve, reject with reason, publish-now, unpublish, cancel-schedule, plus scheduled create/reschedule. Every action waits for backend confirmation and re-fetches canonical state.
- Tests: Lifecycle adapter tests, full browser transition flow, restricted 403/session-survival test, and isolated scheduler tick.

## District Decision

Decision C: District article assignment remains deferred. The backend still has separately managed District records and an `Article.districtId`, but the hardened article validator/service does not expose District assignment in the write contract. Article locality therefore uses the functional Area relation only. No duplicate Area/District semantics or schema redesign was introduced. The legacy District News Admin page remains deferred.

## Article Field Mapping

| Admin field | Backend field |
| --- | --- |
| `title` | `title` |
| `titleTA` | `titleTA` → persisted `titleTa` |
| `shortDescription` | `excerpt` |
| `excerptTA` | `excerptTA` → persisted `excerptTa` |
| `content` | `content` (server sanitized) |
| `contentTA` | `contentTA` → persisted `contentTa` (server sanitized) |
| `categoryId` | `categoryId` |
| `subCategoryId` | `subcategoryId` |
| `authorId` | `authorId` (Reporter relation) |
| `areaId` | `areaId` |
| `location` | `location` |
| media picker | `featuredImageId` |
| tag chips | `tags[]` |
| breaking toggle | `isBreaking` |
| featured toggle | `isFeatured` |
| date/time | `publishDate`, `publishTime` |
| create status | `status` |

Edit payloads preserve Tamil and other loaded values. Explicitly clearing subcategory, area, or featured media sends `null`. Article breaking badge and the separate BreakingNews ticker remain distinct.

## Media Contract

Uploads are `multipart/form-data` with field `file` and optional kind `image`. No `Content-Type` boundary is manually set. The returned Media DTO supplies `id`, `name`, `url`, `thumbnailUrl`, `mimeType`, `kind`, `size`, dimensions, and upload date. Article forms persist only `featuredImageId`. Media deletion is performed only through the backend endpoint.

## Permission Mapping

The UI consumes server-derived effective permission strings through `hasPermission`. Integrated actions use:

- `categories.view/create/edit/delete`
- `reporters.view/create/edit/delete`
- `users.view/create/edit/delete`
- `media.view/upload/delete`
- `news.view/create/edit/delete/approve/publish`

There is no frontend Super Admin bypass or role-name conditional for authorization. Backend 403 remains authoritative.

## Lifecycle Mapping

| UI action | Backend action/result |
| --- | --- |
| Save Draft | create `status=draft`, or update fields without local status mutation |
| Submit | `submit`: draft → pending |
| Approve | `approve`: pending → published |
| Reject | `reject` with reason: pending → draft |
| Publish Now | `publish-now`: permitted source → published |
| Unpublish | `unpublish`: published → draft |
| Schedule | create `status=scheduled` with future date/time |
| Update Schedule | update future date/time on an existing scheduled article |
| Cancel Schedule | `cancel-schedule`: scheduled → draft |

Invalid transitions remain controlled backend conflicts.

## Browser Verification

Passed against the isolated integration database using real Chromium from `/mnt/EXT1` and the actual Admin UI:

```text
login → category → subcategory → area → reporter → multipart media upload
→ article draft → reload/reopen → edit bilingual fields/tags/relations
→ submit → approve → published → unpublish → submit → reject with reason
→ publish-now

scheduled create → scheduled list → reschedule → cancel schedule → UI delete
```

The final API re-query confirmed English/Tamil text, tags, category, subcategory, reporter, area, featured media, featured flag, breaking flag, and lifecycle status. A restricted reporter account could not see Users & Roles, received a direct backend 403 for category creation, and remained authenticated afterward. An isolated due scheduler fixture was published by the real scheduler and then removed.

## Automated Validation

- Admin tests: 28 passed, 0 failed (includes all 21 Step 2 tests).
- Admin lint: passed.
- Admin production build: passed; existing large-chunk warning only.
- Backend unit tests: 93 passed, 0 failed.
- Backend integration tests: 3 passed, 0 failed.
- Backend lint: passed.
- Prisma validation: passed.
- Migration status: 4 migrations found; database schema up to date; no migrations run.

## Backend Changes

Backend commit `3ed3443` fixes two canonical edit round-trip defects:

1. explicit `null` now clears optional subcategory and Area relations;
2. changing date/time on a scheduled article now recalculates and validates its future `publishedAt` value.

It also validates non-null Area IDs and adds regression coverage in `tests/articles/edit-roundtrip.test.js`. No schema or migration changes were made.

## Still Mocked / LocalStorage

Deferred Admin modules remain on their previous local/mock implementations:

- Dashboard charts/counts
- Videos
- Galleries
- Live updates
- Breaking News ticker management
- District News management/assignment
- Advertisements
- Comments
- Notifications
- Social publishing
- Analytics
- E-paper and other supporting resources
- SEO management
- Settings
- Authors and Editors (disconnected from article attribution)
- Inactive legacy `DraftsList`, `PendingApproval`, `PublishedList`, and `ScheduledList` component files; their live routes now render the backend `NewsList`
- Legacy section pages

Theme/sidebar preferences may continue to use localStorage. None of the integrated core CMS routes uses localStorage as business-data authority.

## Temporary Test Cleanup

Step 2 cleanup gate: operational database contains zero `@smoke.kkn.test` users, associated sessions, or password-reset records.

Step 3 used only the isolated integration database. All marker articles, taxonomy, reporters, media records/files, users, 129 accumulated refresh sessions from repeated browser iterations, reset records, and scheduler fixtures were removed. Final marker residue counts are zero. No browser screenshots, traces, videos, or test databases were created in the repositories.

## Remaining Risks

- The Admin production bundle retains the pre-existing Vite chunk-size warning.
- Roles are a backend enum rather than a discoverable `/roles` resource; the Admin mirrors only those validated enum values for the select control.
- Deferred modules can still show mock/local data until their later integration phases; they are not used by the core publishing workflow.
- Browser verification used the isolated integration database, intentionally not the operational database.

## Step 4 Readiness

```text
READY FOR PUBLIC FRONTEND INTEGRATION
```

The backend is now the canonical source for the core Admin publishing workflow and can be consumed by the public frontend in Step 4.

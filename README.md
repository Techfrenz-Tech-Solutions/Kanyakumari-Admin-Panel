# The Daily Wire — Newspaper Admin Panel

A complete, responsive admin dashboard for managing a newspaper website, built with React + Vite.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`). Sign in with **any email/password** — this is a demo auth flow.

To build for production:

```bash
npm run build
npm run preview
```

## What's included

- **Dashboard** — total/published/draft/pending/breaking news, total views, recent news feed, and 3 chart types (views trend, category distribution, weekly publishing activity) via Recharts.
- **News Management** — All News table with tab filters (All / Published / Draft / Scheduled / Pending / Breaking), search, category filter, sort, and pagination.
- **Add / Edit News** — title, short description, full content, featured image upload (drag/click), category + dependent sub-category, author, location, tags, publish date/time, breaking-news toggle, and Save Draft / Schedule / Publish actions with validation.
- **Categories** — add/edit/delete, enable/disable toggle, sub-categories, seeded with the 11 sections requested (Tamil Nadu, India, World, Politics, Business, Sports, Cinema, Technology, Education, Lifestyle, District News).
- **Reporters** — profile cards, add/edit/delete, published-article counts, profile detail modal.
- **Media Library** — multi-image upload (stored as data URLs for the demo), search, preview modal, delete.
- **Advertisements** — add/edit/delete, enable/disable, position, start/end date, impressions/clicks display.
- **Comments** — approve / reject / delete / mark as spam, status tabs, search.
- **Users & Roles** — user list + a role-permission matrix for Super Admin / Admin / Editor / Reporter.
- **Analytics** — traffic trend, views by category, articles by reporter, top-performing articles table.
- **Settings** — newspaper name, logo/favicon upload, contact details, social links, header/footer text.

## Tech notes

- **Routing:** React Router v6, with a simple auth guard redirecting to `/login`.
- **State/persistence:** all demo data lives in `localStorage` via `src/utils/storage.js` (`loadData` / `saveData`). Swap these calls for real API requests when you connect a backend — every page already reads/writes through this one layer.
- **Seed data:** `src/data/mockData.js` — edit this to change what a fresh install looks like.
- **Charts:** Recharts (`AreaChart`, `PieChart`, `BarChart`, `LineChart`).
- **Design system:** CSS custom properties in `src/styles/index.css` (no CSS framework) — dark navy sidebar, red (`--red-500`) accent, light/dark mode via `data-theme` attribute.
- **Reusable UI:** `src/components/ui/` — `Modal`, `ConfirmModal`, `Pagination`, `StatusPill`, `PageHead`/`StatCard`, `Badges`, and a shared inline icon set (`Icons.jsx`, no external icon package).
- **Toasts:** `src/context/ToastContext.jsx` — call `useToast().success/error/info(title, message)` anywhere.

## Connecting a real backend later

Replace the `loadData`/`saveData` calls in each page with your API client (e.g. `fetch`/`axios`) — the data shapes in `mockData.js` double as the expected API response shapes. The image upload inputs currently store base64 data URLs; swap those handlers for a real upload endpoint that returns a URL.

# Admin Authentication & API Integration Report

## Summary

The Admin Panel now authenticates against the hardened backend instead of creating a local fake session. It uses an environment-configured API client, keeps the access token in memory, relies on the backend's httpOnly refresh cookie, restores sessions on startup, coalesces simultaneous refresh attempts, and derives UI authorization from server-supplied effective permissions.

The work is isolated on the Admin branch `feat/admin-auth-api-infrastructure`. Existing CMS data screens remain local/mock-backed for Step 3.

## Architecture

```text
Browser
  -> AuthProvider
  -> central Admin API client
  -> access token held only in JavaScript memory
  -> Authorization: Bearer <access token>
  -> hardened backend
  -> rotating refresh token in an httpOnly cookie
  -> startup/401 refresh restores the in-memory session
```

The browser manages the refresh cookie. Admin code neither reads it nor copies it into JavaScript storage.

## Files Changed

- `src/api/client.js`: base URL, timeouts, JSON envelopes, normalized errors, bearer headers, credentialed requests, cancellation, single-flight refresh, and one-time retries.
- `src/api/auth.js`: canonical backend auth/profile/password endpoint calls.
- `src/context/AuthContext.jsx`: server-backed session lifecycle and reusable authorization API.
- `src/auth/permissions.js`: permission, any-permission, role, and navigation-filter helpers.
- `src/auth/session.js`: testable bootstrap, route-decision, and password-session workflows.
- `src/App.jsx`: initialization-aware authentication guard, public-only auth routes, per-route permission guard, and preserved return navigation.
- `src/pages/Login.jsx`: real backend login and safe request-state/error handling.
- `src/pages/ForgotPassword.jsx` and `src/pages/ResetPassword.jsx`: real recovery flows.
- `src/pages/Profile.jsx`: current backend identity, profile update, and password change with session termination.
- `src/pages/AccessDenied.jsx`: authenticated 403 experience.
- `src/components/layout/Header.jsx` and `Sidebar.jsx`: real identity, real logout, permission-filtered navigation/actions.
- `src/data/mockData.js`: removed the fabricated current Admin identity.
- `.env.example`: safe API configuration example.
- `.gitignore`: prevents new dependency, build, coverage, and secret environment artifacts.
- `eslint.config.js`, `package.json`, and `package-lock.json`: minimal maintained lint/test commands.
- `test/`: API boundary, auth workflow, route decision, and permission regression tests.

## Environment

- `VITE_API_BASE_URL`: backend origin, without a required trailing slash.
- `VITE_API_TIMEOUT_MS`: optional central timeout; defaults to 15000 ms.

No credentials, tokens, or production hostnames are committed. Each development, staging, or production build can provide its own values without source changes.

## Login Flow

1. The login form validates the email and required password and prevents repeat submission while active.
2. `POST /api/admin/auth/login` sends the canonical `{ email, password }` body with browser credentials enabled.
3. The success envelope provides the access token and real Admin DTO.
4. The API client keeps the access token in memory only; the backend sets the rotating refresh cookie.
5. `AuthContext` becomes authenticated and the user returns to the originally requested route where possible.
6. Backend messages for invalid credentials, inactive users, rate limits, validation, and server failures are safely normalized. Network and timeout errors remain distinguishable.

There is no demo-login or fabricated Super Admin fallback.

## Session Bootstrap and Refresh Flow

On mount, the provider remains in `initializing` state while it attempts `POST /api/admin/auth/refresh`, followed by `GET /api/admin/auth/me`. A valid cookie restores the in-memory token and verified user. Failure produces an anonymous state without a login-page flash.

For a normal authenticated request that receives 401:

1. The first request creates a shared refresh promise.
2. Concurrent 401 requests wait on the same promise.
3. The refresh request sends `credentials: include`, does not depend on an access token, and cannot trigger recursive refresh.
4. A successful refresh replaces the memory token and each original request retries once.
5. A failed refresh clears the session and notifies `AuthContext` once.

A retried request is sent directly and cannot enter another refresh cycle. A 403 is returned to the caller without refreshing or logging the user out. A session epoch also prevents an in-flight refresh from resurrecting a session after logout.

## Logout Flow

Logout calls `POST /api/admin/auth/logout`, allowing the backend to revoke the cookie-bound refresh session. The browser's in-memory token and user are then cleared and protected routes return to login. Local state is cleared even when the logout request fails; development builds log only safe error code/message context.

## Forgot/Reset Flow

`/forgot-password` submits the canonical email body and always displays generic anti-enumeration success copy after backend success. `/reset-password?token=...` requires a URL token, validates an eight-character password and confirmation, submits the token directly without logging or storing it, reports invalid/expired/used-token backend messages, and returns to login after success.

## Profile and Password Flow

Profile fields originate from the login/refresh/me DTO. Name, phone, and bio are sent to `PUT /api/admin/auth/profile`; the returned user replaces the context user so the Header and Profile update immediately. Email and role are correctly read-only because the endpoint does not accept them.

Password changes send `currentPassword` and `newPassword` to `PUT /api/admin/auth/password`. The backend revokes all refresh sessions, so success explicitly runs logout/local cleanup and returns the Admin to login.

## Permission Architecture

The server user DTO supplies flattened effective permissions such as `news.view`, already merging base-role and per-user extras. Super Admin receives `['*']`. `AuthContext` exposes `hasPermission`, `hasAnyPermission`, and `hasRole`, but navigation and action checks use permissions rather than role labels.

Sidebar modules and straightforward Header actions are filtered by these permissions. This improves usability only; backend RBAC remains the security authority.

## Route Protection

- During initialization: show a session-restoration state.
- Anonymous protected navigation: redirect to login and retain the requested location.
- Authenticated public-auth navigation: redirect to the dashboard.
- Authenticated and permitted: render the page.
- Authenticated but not permitted: render Access Denied (403 semantics) without clearing the session.

## Cookie, CORS, and CSRF Review

Every Admin request uses `credentials: include`. The backend allows credentials only for its exact configured origin allowlist, accepts the Authorization header, and uses an httpOnly, `SameSite=Strict` refresh cookie. The cookie is `Secure` in production and intentionally non-Secure in backend development mode; its path is `/api`.

Local HTTP development therefore uses the backend's non-production cookie behavior. Production must use HTTPS. Admin and API deployments should remain same-site (for example, sibling subdomains under one registrable domain), because a Strict cookie is intentionally unavailable in a genuinely cross-site deployment. Cross-origin ports/subdomains still require the Admin origin in the backend CORS allowlist.

For this architecture, the Strict cookie, exact credentialed-CORS allowlist, non-GET refresh/logout methods, and JSON request contract provide the intended CSRF boundary. No unsupported frontend CSRF token was invented, and SameSite/CORS were not weakened.

## Tests

Executed on 2026-08-26:

```text
npm test
-> 21 passed, 0 failed

npm run lint
-> passed, 0 errors

npm run build
-> passed (Vite production build)
```

Automated coverage includes login success/failure, bootstrap success/failure, logout contract, forgot/reset/profile/password endpoints, password-change session termination, predictable errors, credentialed bearer/JSON requests, timeout/cancellation, simultaneous 401 one-flight behavior, refresh failure, one-time retry, 403 preservation, route decisions, wildcard/effective permission helpers, and navigation filtering. Network boundaries are mocked; no production database is required.

The backend hardening suite was also run after the backend DTO change: 91 unit tests and 3 integration tests passed, and backend lint passed.

An actual browser login/me/refresh/logout smoke test was not performed because no safe running environment or Admin credentials were supplied. This must be completed with non-production accounts before deployment, including one full-access and one restricted role.

`npm audit` reports four dependency findings (three moderate, one high). React Router was upgraded to the latest compatible 6.x release, which removes one older 6.x advisory, but the remaining Router findings require a 7.x migration. The Vite/esbuild findings likewise require a major Vite migration. Those major upgrades were not force-applied because they would broaden this authentication task and may involve runtime/build-tool breaking changes.

## Backend Changes

One small, objectively required backend change was made and committed on `fix/backend-production-hardening` as `3760d9f feat(auth): expose effective admin permissions`.

The existing login, refresh, and me DTO did not expose permissions. Reconstructing role permissions in the Admin would have duplicated backend authority and could not reliably represent per-user extra permissions. The backend now derives and returns a sorted `permissions[]` field from its existing RBAC implementation, with `['*']` for Super Admin. Tests and `docs/API_CONTRACT_BASELINE.md` were updated. No endpoint, cookie, or authorization enforcement was weakened.

## Remaining LocalStorage/MOCK Features

Step 2 intentionally leaves the following CMS domains using existing local/mock data: Dashboard metrics, News and article lifecycle screens, Categories/Subcategories, Reporters/Authors/Editors, Media/Video/Galleries, Live/District news, Advertisements, Comments, Notifications, Users/Roles display management, SEO, Analytics, Social Media, Activity Logs, and Settings.

The old `dw_session` value is removed once as migration cleanup but is never read as authentication authority. Theme and CMS-prefixed localStorage remain. The static role matrix is still displayed by the mock Users/Roles page only; it is not used for current-session authorization.

The repository continues to track thousands of `node_modules` files and existing `dist` output. This pre-existing hygiene problem was not destructively rewritten. New `.gitignore` rules prevent additional generated artifacts, and the production build output was restored after verification so it is absent from this change set.

## Step 3 Readiness

**READY WITH CONDITIONS**

The authentication/API/RBAC foundation and automated acceptance cases are ready for CMS endpoint integration. Before production release, complete real browser smoke tests against a safe HTTPS-like deployment, verify both a full and restricted role, resolve or formally accept the dependency audit findings, and plan a separate review for the already tracked dependency/build artifacts.

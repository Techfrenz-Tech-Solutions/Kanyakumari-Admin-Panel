import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/layout/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewsList from './pages/NewsList.jsx';
import AddEditNews from './pages/AddEditNews.jsx';
import BreakingNews from './pages/BreakingNews.jsx';
import Categories from './pages/Categories.jsx';
import SubCategories from './pages/SubCategories.jsx';
import Reporters from './pages/Reporters.jsx';
import Authors from './pages/Authors.jsx';
import Editors from './pages/Editors.jsx';
import MediaLibrary from './pages/MediaLibrary.jsx';
import Advertisements from './pages/Advertisements.jsx';
import Jobs from './pages/Jobs.jsx';
import TouristInfo from './pages/TouristInfo.jsx';
import ContactUs from './pages/ContactUs.jsx';
import UsersRoles from './pages/UsersRoles.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';
import SectionPage from './pages/SectionPage.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import AccessDenied from './pages/AccessDenied.jsx';
import { authenticationDecision, permissionDecision } from './auth/session.js';

function RequireAuth({ children }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  const decision = authenticationDecision({ isInitializing, isAuthenticated });
  if (decision === 'initializing') return <AuthLoading />;
  if (decision === 'login') return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function PublicOnly({ children }) {
  const { isAuthenticated, isInitializing } = useAuth();
  if (isInitializing) return <AuthLoading />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export function RequirePermission({ permission, children }) {
  const { hasPermission } = useAuth();
  if (permissionDecision({ hasPermission, permission }) === 'denied') return <AccessDenied permission={permission} />;
  return children;
}

function AuthLoading() {
  return (
    <div className="login-page" role="status" aria-live="polite">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div className="login-mark"><div className="mark">KN</div><h1>Kanyakumari News</h1></div>
        <p className="muted">Restoring your secure session…</p>
      </div>
    </div>
  );
}

const protectedPage = (permission, page) => (
  <RequirePermission permission={permission}>{page}</RequirePermission>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
      <Route path="/reset-password" element={<PublicOnly><ResetPassword /></PublicOnly>} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={protectedPage('news.view', <Dashboard />)} />
        {/* News Management */}
        <Route path="news" element={protectedPage('news.view', <NewsList />)} />
        <Route path="news/add" element={protectedPage('news.create', <AddEditNews />)} />
        <Route path="news/edit/:id" element={protectedPage('news.edit', <AddEditNews />)} />
        <Route path="news/published" element={protectedPage('news.view', <NewsList fixedStatus="published" />)} />
        <Route path="news/scheduled" element={protectedPage('news.view', <NewsList fixedStatus="scheduled" />)} />
        <Route path="news/pending" element={protectedPage('news.view', <NewsList fixedStatus="pending" />)} />
        <Route path="news/breaking" element={protectedPage('news.view', <BreakingNews />)} />
        {/* Categories */}
        <Route path="categories" element={protectedPage('categories.view', <Categories />)} />
        <Route path="subcategories" element={protectedPage('categories.view', <SubCategories />)} />
        {/* Team */}
        <Route path="reporters" element={protectedPage('reporters.view', <Reporters />)} />
        <Route path="authors" element={protectedPage('reporters.view', <Authors />)} />
        <Route path="editors" element={protectedPage('reporters.view', <Editors />)} />
        {/* Media */}
        <Route path="media" element={protectedPage('media.view', <MediaLibrary />)} />
        {/* Manage */}
        <Route path="advertisements" element={protectedPage('ads.view', <Advertisements />)} />
        <Route path="jobs" element={protectedPage('ads.view', <Jobs />)} />
        <Route path="tourist-info" element={protectedPage('ads.view', <TouristInfo />)} />
        <Route path="contact-us" element={protectedPage('settings.view', <ContactUs />)} />
        <Route path="users-roles" element={protectedPage('users.view', <UsersRoles />)} />
        {/* Insights & Config */}
        <Route path="settings" element={protectedPage('settings.view', <Settings />)} />
        <Route path="profile" element={<Profile />} />
        {/* Sections */}
        <Route path="sections/:section" element={protectedPage('news.view', <SectionPage />)} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

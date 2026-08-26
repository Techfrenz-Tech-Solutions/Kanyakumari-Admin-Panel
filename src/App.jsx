import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/layout/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewsList from './pages/NewsList.jsx';
import AddEditNews from './pages/AddEditNews.jsx';
import DraftsList from './pages/DraftsList.jsx';
import PublishedList from './pages/PublishedList.jsx';
import ScheduledList from './pages/ScheduledList.jsx';
import PendingApproval from './pages/PendingApproval.jsx';
import BreakingNews from './pages/BreakingNews.jsx';
import Categories from './pages/Categories.jsx';
import SubCategories from './pages/SubCategories.jsx';
import Reporters from './pages/Reporters.jsx';
import Authors from './pages/Authors.jsx';
import Editors from './pages/Editors.jsx';
import MediaLibrary from './pages/MediaLibrary.jsx';
import VideoLibrary from './pages/VideoLibrary.jsx';
import PhotoGallery from './pages/PhotoGallery.jsx';
import LiveUpdates from './pages/LiveUpdates.jsx';
import DistrictNews from './pages/DistrictNews.jsx';
import Advertisements from './pages/Advertisements.jsx';
import Comments from './pages/Comments.jsx';
import Notifications from './pages/Notifications.jsx';
import UsersRoles from './pages/UsersRoles.jsx';
import SEOManagement from './pages/SEOManagement.jsx';
import Analytics from './pages/Analytics.jsx';
import SocialMedia from './pages/SocialMedia.jsx';
import ActivityLogs from './pages/ActivityLogs.jsx';
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
        <Route path="news/drafts" element={protectedPage('news.view', <DraftsList />)} />
        <Route path="news/published" element={protectedPage('news.view', <PublishedList />)} />
        <Route path="news/scheduled" element={protectedPage('news.view', <ScheduledList />)} />
        <Route path="news/pending" element={protectedPage('news.view', <PendingApproval />)} />
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
        <Route path="videos" element={protectedPage('media.view', <VideoLibrary />)} />
        <Route path="gallery" element={protectedPage('media.view', <PhotoGallery />)} />
        {/* Live & Local */}
        <Route path="live-updates" element={protectedPage('news.view', <LiveUpdates />)} />
        <Route path="district-news" element={protectedPage('news.view', <DistrictNews />)} />
        {/* Manage */}
        <Route path="advertisements" element={protectedPage('ads.view', <Advertisements />)} />
        <Route path="comments" element={protectedPage('comments.view', <Comments />)} />
        <Route path="notifications" element={protectedPage('settings.view', <Notifications />)} />
        <Route path="users-roles" element={protectedPage('users.view', <UsersRoles />)} />
        {/* Insights & Config */}
        <Route path="seo" element={protectedPage('news.view', <SEOManagement />)} />
        <Route path="analytics" element={protectedPage('news.view', <Analytics />)} />
        <Route path="social-media" element={protectedPage('settings.view', <SocialMedia />)} />
        <Route path="activity-logs" element={protectedPage('settings.view', <ActivityLogs />)} />
        <Route path="settings" element={protectedPage('settings.view', <Settings />)} />
        <Route path="profile" element={<Profile />} />
        {/* Sections */}
        <Route path="sections/:section" element={protectedPage('news.view', <SectionPage />)} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

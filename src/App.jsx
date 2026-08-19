import { Routes, Route, Navigate } from 'react-router-dom';
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

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        {/* News Management */}
        <Route path="news" element={<NewsList />} />
        <Route path="news/add" element={<AddEditNews />} />
        <Route path="news/edit/:id" element={<AddEditNews />} />
        <Route path="news/drafts" element={<DraftsList />} />
        <Route path="news/published" element={<PublishedList />} />
        <Route path="news/scheduled" element={<ScheduledList />} />
        <Route path="news/pending" element={<PendingApproval />} />
        <Route path="news/breaking" element={<BreakingNews />} />
        {/* Categories */}
        <Route path="categories" element={<Categories />} />
        <Route path="subcategories" element={<SubCategories />} />
        {/* Team */}
        <Route path="reporters" element={<Reporters />} />
        <Route path="authors" element={<Authors />} />
        <Route path="editors" element={<Editors />} />
        {/* Media */}
        <Route path="media" element={<MediaLibrary />} />
        <Route path="videos" element={<VideoLibrary />} />
        <Route path="gallery" element={<PhotoGallery />} />
        {/* Live & Local */}
        <Route path="live-updates" element={<LiveUpdates />} />
        <Route path="district-news" element={<DistrictNews />} />
        {/* Manage */}
        <Route path="advertisements" element={<Advertisements />} />
        <Route path="comments" element={<Comments />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="users-roles" element={<UsersRoles />} />
        {/* Insights & Config */}
        <Route path="seo" element={<SEOManagement />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="social-media" element={<SocialMedia />} />
        <Route path="activity-logs" element={<ActivityLogs />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
        {/* Sections */}
        <Route path="sections/:section" element={<SectionPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

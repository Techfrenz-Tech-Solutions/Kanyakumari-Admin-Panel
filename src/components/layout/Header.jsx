import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Menu, ChevronDown, User, Settings, LogOut, Plus, ExternalLink, Zap, MessageSquare, FlameIcon } from '../ui/Icons.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const notifications = [
  { t: 'Breaking news published', m: 'Cyclone Makalu alert is now live', time: '5 min ago', type: 'breaking', icon: FlameIcon },
  { t: 'New comment awaiting approval', m: 'On "Farmers protest delayed procurement prices"', time: '1 hr ago', type: 'comment', icon: MessageSquare },
  { t: 'Article published', m: '"New metro line" is now live on the website', time: '2 hr ago', type: 'info', icon: Bell },
  { t: 'Advertisement expiring', m: '"Real Estate Expo 2026" ends in 2 days', time: 'Yesterday', type: 'warning', icon: Bell },
];

const BREADCRUMB_MAP = {
  '/': 'Dashboard',
  '/news': 'All News',
  '/news/add': 'Add News',
  '/news/drafts': 'Drafts',
  '/news/published': 'Published',
  '/news/scheduled': 'Scheduled',
  '/news/breaking': 'Breaking News',
  '/news/pending': 'Pending Approval',
  '/categories': 'Categories',
  '/subcategories': 'Sub Categories',
  '/reporters': 'Reporters',
  '/authors': 'Authors',
  '/editors': 'Editors',
  '/media': 'Media Library',
  '/videos': 'Video Library',
  '/gallery': 'Photo Gallery',
  '/live-updates': 'Live Updates',
  '/district-news': 'District News',
  '/advertisements': 'Advertisements',
  '/comments': 'Comments',
  '/notifications': 'Notifications',
  '/users-roles': 'Users & Roles',
  '/seo': 'SEO Management',
  '/analytics': 'Analytics',
  '/social-media': 'Social Media',
  '/activity-logs': 'Activity Logs',
  '/settings': 'Settings',
  '/profile': 'My Profile',
};

export default function Header({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const initials = (user?.name || 'Admin User').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const currentPage = BREADCRUMB_MAP[location.pathname] || 'Admin';
  const isEditPage = location.pathname.startsWith('/news/edit/');

  // Build breadcrumb
  const breadcrumbs = [{ label: 'Dashboard', to: '/' }];
  if (location.pathname !== '/') {
    if (location.pathname.startsWith('/news')) {
      breadcrumbs.push({ label: 'News', to: '/news' });
      if (location.pathname !== '/news') {
        breadcrumbs.push({ label: isEditPage ? 'Edit Article' : BREADCRUMB_MAP[location.pathname] || 'Article', to: null });
      }
    } else {
      breadcrumbs.push({ label: currentPage, to: null });
    }
  }

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      navigate(`/news?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="icon-btn mobile-only" onClick={onMenuClick} aria-label="Open menu">
          <Menu style={{ width: 18, height: 18 }} />
        </span>

        {/* Breadcrumb */}
        <div className="breadcrumb desktop-only">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="bc-item">
              {i > 0 && <span className="bc-sep">/</span>}
              {b.to && i < breadcrumbs.length - 1 ? (
                <span className="bc-link" onClick={() => navigate(b.to)}>{b.label}</span>
              ) : (
                <span className={i === breadcrumbs.length - 1 ? 'bc-current' : 'bc-link'} onClick={b.to ? () => navigate(b.to) : undefined}>{b.label}</span>
              )}
            </span>
          ))}
        </div>

        {/* Search */}
        <div className="search-wrap">
          <Search />
          <input
            placeholder="Search news, reporters, categories…"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={handleSearch}
          />
          {searchVal && (
            <kbd style={{ fontSize: 10, color: 'var(--text-faint)', padding: '2px 5px', border: '1px solid var(--border)', borderRadius: 4 }}>↵</kbd>
          )}
        </div>
      </div>

      <div className="topbar-right">
        {/* Quick Add */}
        <button className="btn btn-primary btn-sm desktop-only" onClick={() => navigate('/news/add')} style={{ gap: 5 }}>
          <Plus style={{ width: 14, height: 14 }} /> Quick Add
        </button>

        {/* Preview site */}
        <span className="icon-btn desktop-only" title="Preview website" onClick={() => window.open('/', '_blank')}>
          <ExternalLink style={{ width: 16, height: 16 }} />
        </span>

        {/* Theme toggle */}
        <span className="icon-btn" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? <Moon style={{ width: 16, height: 16 }} /> : <Sun style={{ width: 16, height: 16 }} />}
        </span>

        {/* Notifications */}
        <div className="icon-btn-wrap" ref={notifRef}>
          <span className="icon-btn" style={{ position: 'relative' }} onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }} aria-label="Notifications">
            <Bell style={{ width: 16, height: 16 }} />
            <span className="badge-dot" />
          </span>
          {notifOpen && (
            <div className="dropdown-panel" style={{ width: 320 }}>
              <div className="dd-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 13.5 }}>Notifications</strong>
                <span className="pill pill-breaking" style={{ fontSize: 10 }}>4 new</span>
              </div>
              {notifications.map((n, i) => {
                const Icon = n.icon;
                const colors = { breaking: 'var(--red-500)', comment: 'var(--amber-500)', info: 'var(--blue-500)', warning: 'var(--amber-500)' };
                return (
                  <div className="notif-item" key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', color: colors[n.type] }}>
                      <Icon style={{ width: 14, height: 14 }} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div className="t">{n.t}</div>
                      <div className="m">{n.m}</div>
                      <div className="time">{n.time}</div>
                    </div>
                  </div>
                );
              })}
              <div className="dd-item" style={{ justifyContent: 'center', fontSize: 12.5, color: 'var(--red-500)', fontWeight: 600 }} onClick={() => { navigate('/notifications'); setNotifOpen(false); }}>
                View all notifications
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="icon-btn-wrap" ref={profileRef}>
          <div className="profile-btn" onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }} aria-label="Profile menu">
            <div className="avatar">{initials}</div>
            <div className="desktop-only">
              <div className="name">{user?.name || 'Admin User'}</div>
              <div className="role">{user?.role || 'Super Admin'}</div>
            </div>
            <ChevronDown style={{ width: 14, height: 14 }} className="desktop-only" />
          </div>
          {profileOpen && (
            <div className="dropdown-panel">
              <div className="dd-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div className="avatar" style={{ width: 36, height: 36, fontSize: 14 }}>{initials}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{user?.name || 'Admin User'}</div>
                    <div className="faint" style={{ fontSize: 11.5 }}>{user?.email}</div>
                  </div>
                </div>
                <span className="pill pill-active" style={{ fontSize: 10.5 }}>{user?.role || 'Super Admin'}</span>
              </div>
              <div className="dd-item" onClick={() => { setProfileOpen(false); navigate('/profile'); }}><User style={{ width: 15, height: 15 }} /> My Profile</div>
              <div className="dd-item" onClick={() => { setProfileOpen(false); navigate('/settings'); }}><Settings style={{ width: 15, height: 15 }} /> Account Settings</div>
              <div className="dd-sep" />
              <div className="dd-item danger" onClick={() => { setProfileOpen(false); logout(); navigate('/login'); }}><LogOut style={{ width: 15, height: 15 }} /> Logout</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

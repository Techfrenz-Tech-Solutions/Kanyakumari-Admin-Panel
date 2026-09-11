import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Sun, Moon, Menu, ChevronDown, User, Settings, LogOut, Plus, ExternalLink } from '../ui/Icons.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const ACCENT_OPTIONS = [
  { key: 'red',  label: 'Red',       color: '#c81e1e' },
  { key: 'gold', label: 'Gold',      color: '#c9960c' },
  { key: 'ink',  label: 'Ink Blue',  color: '#2461c9' },
];

const BREADCRUMB_MAP = {
  '/': 'Dashboard',
  '/news': 'All News',
  '/news/add': 'Add News',
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
  '/advertisements': 'Advertisements',
  '/users-roles': 'Users & Roles',
  '/settings': 'Settings',
  '/profile': 'My Profile',
};

export default function Header({ onMenuClick }) {
  const { theme, toggleTheme, accent, switchAccent } = useTheme();
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const profileRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const initials = (user?.name || 'Admin').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const roleLabel = user?.roleLabel || user?.role || '';
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
        {hasPermission('news.create') && (
          <button className="btn btn-primary btn-sm desktop-only" onClick={() => navigate('/news/add')} style={{ gap: 5 }}>
            <Plus style={{ width: 14, height: 14 }} /> Quick Add
          </button>
        )}

        {/* Preview site */}
        <span className="icon-btn desktop-only" title="Preview website" onClick={() => window.open('/', '_blank')}>
          <ExternalLink style={{ width: 16, height: 16 }} />
        </span>

        {/* Theme toggle */}
        <span className="icon-btn" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? <Moon style={{ width: 16, height: 16 }} /> : <Sun style={{ width: 16, height: 16 }} />}
        </span>

        {/* Profile */}
        <div className="icon-btn-wrap" ref={profileRef}>
          <div className="profile-btn" onClick={() => setProfileOpen((v) => !v)} aria-label="Profile menu">
            <div className="avatar">{initials}</div>
            <div className="desktop-only">
              <div className="name">{user?.name}</div>
              <div className="role">{roleLabel}</div>
            </div>
            <ChevronDown style={{ width: 14, height: 14 }} className="desktop-only" />
          </div>
          {profileOpen && (
            <div className="dropdown-panel">
              <div className="dd-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div className="avatar" style={{ width: 36, height: 36, fontSize: 14 }}>{initials}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{user?.name}</div>
                    <div className="faint" style={{ fontSize: 11.5 }}>{user?.email}</div>
                  </div>
                </div>
                <span className="pill pill-active" style={{ fontSize: 10.5 }}>{roleLabel}</span>
              </div>
              <div className="dd-item" onClick={() => { setProfileOpen(false); navigate('/profile'); }}><User style={{ width: 15, height: 15 }} /> My Profile</div>
              {hasPermission('settings.view') && (
                <div className="dd-item" onClick={() => { setProfileOpen(false); navigate('/settings'); }}><Settings style={{ width: 15, height: 15 }} /> Website Settings</div>
              )}
              <div className="dd-sep" />
              <div className="dd-item danger" onClick={async () => { setProfileOpen(false); await logout(); navigate('/login', { replace: true }); }}><LogOut style={{ width: 15, height: 15 }} /> Logout</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

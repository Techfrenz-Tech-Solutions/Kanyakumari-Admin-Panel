import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Grid, Newspaper, Tag, Users, Image, Megaphone, MessageSquare,
  ShieldCheck, BarChart2, Settings, LogOut, PanelLeftClose, PanelLeftOpen,
  ChevronDown, ChevronRight, Zap, Video, Gallery, Radio, MapPinned,
  Bell, Activity, Globe, FileText, List, PenSquare, Clock, CheckCircle,
  FlameIcon, Building, ClipboardList,
} from '../ui/Icons.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const SECTIONS = [
  {
    label: 'Main',
    items: [
      { to: '/', label: 'Dashboard', icon: Grid, end: true },
    ],
  },
  {
    label: 'News Management',
    key: 'news',
    defaultOpen: true,
    items: [
      { to: '/news', label: 'All News', icon: List },
      { to: '/news/add', label: 'Add News', icon: PenSquare },
      { to: '/news/drafts', label: 'Drafts', icon: FileText },
      { to: '/news/published', label: 'Published', icon: CheckCircle },
      { to: '/news/scheduled', label: 'Scheduled', icon: Clock },
      { to: '/news/breaking', label: 'Breaking News', icon: Zap, badge: 'live', badgeColor: 'red' },
      { to: '/news/pending', label: 'Pending Approval', icon: ClipboardList, badgeKey: 'pending' },
    ],
  },
  {
    label: 'Categories',
    key: 'categories',
    defaultOpen: false,
    items: [
      { to: '/categories', label: 'Categories', icon: Tag },
      { to: '/subcategories', label: 'Sub Categories', icon: Tag },
    ],
  },
  {
    label: 'Team',
    key: 'team',
    defaultOpen: false,
    items: [
      { to: '/reporters', label: 'Reporters', icon: Users },
      { to: '/authors', label: 'Authors', icon: PenSquare },
      { to: '/editors', label: 'Editors', icon: CheckCircle },
    ],
  },
  {
    label: 'Media',
    key: 'media',
    defaultOpen: false,
    items: [
      { to: '/media', label: 'Media Library', icon: Image },
      { to: '/videos', label: 'Video Library', icon: Video },
      { to: '/gallery', label: 'Photo Gallery', icon: Gallery },
    ],
  },
  {
    label: 'Live & Local',
    key: 'live',
    defaultOpen: false,
    items: [
      { to: '/live-updates', label: 'Live Updates', icon: Radio },
      { to: '/district-news', label: 'District News', icon: MapPinned },
    ],
  },
  /*
  {
    label: 'Sections',
    key: 'sections',
    defaultOpen: false,
    items: [
      { to: '/sections/politics',   label: 'Politics',    icon: Building },
      { to: '/sections/sports',     label: 'Sports',      icon: Grid },
      { to: '/sections/cinema',     label: 'Cinema',      icon: Video },
      { to: '/sections/business',   label: 'Business',    icon: BarChart2 },
      { to: '/sections/technology', label: 'Technology',  icon: Globe },
    ],
  },
  */
  {
    label: 'Manage',
    key: 'manage',
    defaultOpen: false,
    items: [
      { to: '/advertisements', label: 'Advertisements', icon: Megaphone },
      { to: '/comments', label: 'Comments', icon: MessageSquare },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/users-roles', label: 'Users & Roles', icon: ShieldCheck },
    ],
  },
  {
    label: 'Insights & Config',
    key: 'config',
    defaultOpen: false,
    items: [
      { to: '/seo', label: 'SEO Management', icon: Globe },
      { to: '/analytics', label: 'Analytics', icon: BarChart2 },
      { to: '/social-media', label: 'Social Media', icon: Globe },
      { to: '/activity-logs', label: 'Activity Logs', icon: Activity },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { logout } = useAuth();
  const location = useLocation();
  const [openSections, setOpenSections] = useState(() => {
    const init = {};
    SECTIONS.forEach((s) => { if (s.key) init[s.key] = s.defaultOpen ?? false; });
    // auto-open section containing active route
    SECTIONS.forEach((s) => {
      if (s.items?.some((item) => location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to.split('?')[0])))) {
        if (s.key) init[s.key] = true;
      }
    });
    return init;
  });

  const toggleSection = (key) => {
    if (collapsed) return;
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onCloseMobile} />}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="mark">KN</div>
          <div>
            <div className="word">Kanyakumari News</div>
            <div className="sub">Admin Panel</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {SECTIONS.map((section) => (
            <div key={section.label}>
              {section.key ? (
                <>
                  <div
                    className={`sidebar-section-label clickable ${openSections[section.key] ? 'open' : ''}`}
                    onClick={() => toggleSection(section.key)}
                  >
                    <span>{section.label}</span>
                    {!collapsed && (
                      openSections[section.key]
                        ? <ChevronDown style={{ width: 12, height: 12, flex: 'none', opacity: 0.6 }} />
                        : <ChevronRight style={{ width: 12, height: 12, flex: 'none', opacity: 0.6 }} />
                    )}
                  </div>
                  {(openSections[section.key] || collapsed) && section.items.map((item) => (
                    <NavItem key={item.to + item.label} item={item} onCloseMobile={onCloseMobile} collapsed={collapsed} />
                  ))}
                </>
              ) : (
                <>
                  <div className="sidebar-section-label"><span>{section.label}</span></div>
                  {section.items.map((item) => (
                    <NavItem key={item.to + item.label} item={item} onCloseMobile={onCloseMobile} collapsed={collapsed} />
                  ))}
                </>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-foot">
          <div className="nav-item" onClick={logout}>
            <LogOut />
            <span className="label">Logout</span>
          </div>

        </div>
      </aside>
    </>
  );
}

function NavItem({ item, onCloseMobile, collapsed }) {
  const Icon = item.icon;
  const isExternal = item.to.includes('?cat=');

  if (isExternal) {
    return (
      <div className="nav-item" onClick={onCloseMobile} style={{ cursor: 'default', opacity: 0.7 }}>
        <Icon />
        <span className="label">{item.label}</span>
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      onClick={onCloseMobile}
    >
      <Icon />
      <span className="label">{item.label}</span>
      {item.badge && !collapsed && (
        <span className="nav-badge" style={{ background: item.badgeColor === 'red' ? 'var(--red-500)' : 'var(--blue-500)' }}>
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { PageHead, StatCard } from '../components/ui/PageHead.jsx';
import { StatusPill, BreakingTag } from '../components/ui/Badges.jsx';
import {
  Newspaper, CheckCircle, FileText, Clock, Zap, Eye, Plus, TrendingUp,
  Users, MessageSquare, ArrowUpRight, ArrowDownRight,
} from '../components/ui/Icons.jsx';
import { loadData } from '../utils/storage.js';
import { seedNews, seedReporters, seedComments, viewsTrend, categoryDistribution, weeklyPublished, trafficSources, deviceDistribution } from '../data/mockData.js';

const PIE_COLORS = ['#c81e1e', '#2461c9', '#1a8a4a', '#b3760a', '#454b64', '#8f1414', '#6b7182'];
const DEVICE_COLORS = ['#c81e1e', '#2461c9', '#1a8a4a'];
const SOURCE_COLORS = ['#c81e1e', '#2461c9', '#e1306c', '#1da1f2', '#25d366', '#6b7182'];

const DATE_FILTERS = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days'];

export default function Dashboard() {
  const navigate = useNavigate();
  const news = loadData('news', seedNews);
  const reporters = loadData('reporters', seedReporters);
  const comments = loadData('comments', seedComments);
  const [dateFilter, setDateFilter] = useState('Last 7 Days');

  const stats = useMemo(() => {
    const total = news.length;
    const published = news.filter((n) => n.status === 'published').length;
    const publishedToday = news.filter((n) => {
      const d = new Date(n.publishDate);
      const today = new Date();
      return n.status === 'published' && d.toDateString() === today.toDateString();
    }).length;
    const draft = news.filter((n) => n.status === 'draft').length;
    const pending = news.filter((n) => n.status === 'pending').length;
    const breaking = news.filter((n) => n.isBreaking).length;
    const totalViews = news.reduce((sum, n) => sum + (n.views || 0), 0);
    const totalComments = comments.length;
    const totalReporters = reporters.length;
    return { total, published, publishedToday, draft, pending, breaking, totalViews, totalComments, totalReporters };
  }, [news, reporters, comments]);

  const recent = useMemo(
    () => [...news].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 7),
    [news]
  );

  const topArticles = useMemo(
    () => [...news].filter((n) => n.status === 'published').sort((a, b) => b.views - a.views).slice(0, 5),
    [news]
  );

  const maxViews = topArticles[0]?.views || 1;

  return (
    <div>
      <PageHead
        eyebrow="Overview"
        title="Newsroom Dashboard"
        desc="Here's what's happening across The Daily Wire today."
        actions={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/news/pending')}>
              {stats.pending > 0 && <span style={{ background: 'var(--red-500)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{stats.pending}</span>}
              Pending Review
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/news/add')}>
              <Plus />Add News
            </button>
          </div>
        }
      />

      {/* Breaking news ticker if any */}
      {stats.breaking > 0 && (
        <div
          onClick={() => navigate('/news/breaking')}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'linear-gradient(135deg, var(--red-700), var(--red-500))',
            color: '#fff', padding: '11px 18px', borderRadius: 10,
            marginBottom: 18, cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', flex: 'none' }}>
            <span style={{ width: 7, height: 7, background: '#fff', borderRadius: '50%', animation: 'pulse 1.2s infinite' }} />
            LIVE
          </span>
          {stats.breaking} breaking news alert{stats.breaking > 1 ? 's' : ''} currently active on the website
          <ArrowUpRight style={{ width: 16, height: 16, marginLeft: 'auto', flex: 'none' }} />
        </div>
      )}

      {/* 8 Stat Cards */}
      <div className="stat-grid">
        <StatCard icon={Newspaper} tone="ink" value={stats.total.toLocaleString('en-IN')} label="Total Articles" delta="+8.2% this month" deltaUp />
        <StatCard icon={CheckCircle} tone="green" value={stats.publishedToday} label="Published Today" delta={`${stats.published} total live`} deltaUp />
        <StatCard icon={FileText} tone="gray" value={stats.draft} label="Draft Articles" delta="Waiting for review" deltaUp={false} />
        <StatCard icon={Clock} tone="amber" value={stats.pending} label="Pending Approval" delta="Needs editorial action" deltaUp={false} />
        <StatCard icon={Zap} tone="red" value={stats.breaking} label="Breaking News" delta="Live on ticker" deltaUp />
        <StatCard icon={Users} tone="blue" value={stats.totalReporters} label="Total Reporters" delta="Active correspondents" deltaUp />
        <StatCard icon={Eye} tone="green" value={stats.totalViews.toLocaleString('en-IN')} label="Total Views" delta="+12.4% vs last week" deltaUp />
        <StatCard icon={MessageSquare} tone="amber" value={stats.totalComments} label="Total Comments" delta={`${comments.filter(c => c.status === 'pending').length} pending review`} deltaUp={false} />
      </div>

      {/* Date filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 12.5, color: 'var(--text-faint)', fontWeight: 600 }}>Analytics period:</span>
        {DATE_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setDateFilter(f)}
            className={`filter-chip ${dateFilter === f ? 'active' : ''}`}
            style={{ fontSize: 12 }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Website Traffic</h3>
              <div className="sub">Page views, unique visitors and sessions</div>
            </div>
            <TrendingUp style={{ color: 'var(--red-500)', width: 18, height: 18 }} />
          </div>
          <div className="card-pad" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={viewsTrend} margin={{ left: -20, top: 6 }}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c81e1e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#c81e1e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2461c9" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2461c9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="views" name="Page Views" stroke="#c81e1e" strokeWidth={2} fill="url(#viewsGrad)" />
                <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#2461c9" strokeWidth={2} fill="url(#visitorsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3>Publishing Activity</h3>
              <div className="sub">Published vs draft vs pending by day</div>
            </div>
          </div>
          <div className="card-pad" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyPublished} margin={{ left: -20, top: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="published" name="Published" fill="#c81e1e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="draft" name="Draft" fill="#d3d6e2" radius={[3, 3, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#fdf1dc" stroke="#b3760a" strokeWidth={1} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2 — Category + Device + Traffic Sources */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }} className="chart-trio">
        <div className="card">
          <div className="card-head"><div><h3>By Category</h3><div className="sub">Article distribution</div></div></div>
          <div className="card-pad" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryDistribution} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {categoryDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h3>Device Analytics</h3><div className="sub">Mobile vs desktop</div></div></div>
          <div className="card-pad" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={deviceDistribution} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {deviceDistribution.map((_, i) => <Cell key={i} fill={DEVICE_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(v) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h3>Traffic Sources</h3><div className="sub">Where readers come from</div></div></div>
          <div className="card-pad" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={trafficSources} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {trafficSources.map((_, i) => <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(v) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom row — Recent News + Top Articles */}
      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div><h3>Recent News</h3><div className="sub">Latest articles added to the CMS</div></div>
            <span className="btn btn-ghost btn-sm" onClick={() => navigate('/news')} style={{ cursor: 'pointer' }}>View all →</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {recent.map((n) => (
              <div
                key={n.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => navigate(`/news/edit/${n.id}`)}
              >
                <img src={n.image} alt="" style={{ width: 46, height: 46, borderRadius: 8, objectFit: 'cover', flex: 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4, flexWrap: 'wrap' }}>
                    <StatusPill status={n.status} />
                    {n.isBreaking && <BreakingTag />}
                    <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{n.category} · {n.author}</span>
                  </div>
                </div>
                <span style={{ fontSize: 11.5, color: 'var(--text-faint)', flex: 'none' }}>{(n.views || 0).toLocaleString('en-IN')} views</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div><h3>Top Articles</h3><div className="sub">Most-read articles this period</div></div>
            <span className="btn btn-ghost btn-sm" onClick={() => navigate('/analytics')} style={{ cursor: 'pointer' }}>Analytics →</span>
          </div>
          <div className="card-pad" style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topArticles.map((n, i) => (
              <div key={n.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 6, flex: 'none',
                    background: i === 0 ? 'var(--red-500)' : i === 1 ? 'var(--ink-700)' : 'var(--surface-2)',
                    color: i < 2 ? '#fff' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800,
                  }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{n.category} · {n.author}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', flex: 'none' }}>{(n.views || 0).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round((n.views / maxViews) * 100)}%`, background: i === 0 ? 'var(--red-500)' : 'var(--ink-500)', borderRadius: 999 }} />
                </div>
              </div>
            ))}

            {/* Quick stats */}
            <div style={{ marginTop: 8, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Quick Stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Avg. Views/Article', value: Math.round(news.reduce((s, n) => s + n.views, 0) / (news.length || 1)).toLocaleString('en-IN') },
                  { label: 'Pending Comments', value: comments.filter(c => c.status === 'pending').length },
                  { label: 'Published Rate', value: `${Math.round((stats.published / (stats.total || 1)) * 100)}%` },
                  { label: 'Active Reporters', value: loadData('reporters', seedReporters).filter(r => r.status === 'active').length },
                ].map((s) => (
                  <div key={s.label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

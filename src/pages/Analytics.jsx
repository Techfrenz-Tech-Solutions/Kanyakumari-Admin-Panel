import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { PageHead, StatCard } from '../components/ui/PageHead.jsx';
import { Eye, TrendingUp, Users, Clock } from '../components/ui/Icons.jsx';
import { loadData } from '../utils/storage.js';
import { seedNews, viewsTrend } from '../data/mockData.js';

const COLORS = ['#c9960c', '#2461c9', '#1a8a4a', '#b3760a', '#454b64', '#865f06', '#6b7182'];

export default function Analytics() {
  const news = loadData('news', seedNews);

  const topArticles = useMemo(() => [...news].sort((a, b) => b.views - a.views).slice(0, 6), [news]);

  const byCategory = useMemo(() => {
    const map = {};
    news.forEach((n) => { map[n.category] = (map[n.category] || 0) + n.views; });
    return Object.entries(map).map(([name, views]) => ({ name, views })).sort((a, b) => b.views - a.views).slice(0, 7);
  }, [news]);

  const byAuthor = useMemo(() => {
    const map = {};
    news.forEach((n) => { map[n.author] = (map[n.author] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [news]);

  const totalViews = news.reduce((s, n) => s + n.views, 0);
  const avgViews = Math.round(totalViews / (news.length || 1));

  return (
    <div>
      <PageHead eyebrow="Insights" title="Analytics" desc="Performance across articles, categories and reporters." />

      <div className="stat-grid">
        <StatCard icon={Eye} tone="blue" value={totalViews.toLocaleString('en-IN')} label="Total Views" delta="12.4% vs last week" />
        <StatCard icon={TrendingUp} tone="green" value={avgViews.toLocaleString('en-IN')} label="Avg. Views / Article" delta="3.8% vs last week" />
        <StatCard icon={Users} tone="ink" value={byAuthor.length} label="Active Contributors" delta="Stable" />
        <StatCard icon={Clock} tone="amber" value="4m 12s" label="Avg. Read Time" delta="0.4% vs last week" deltaUp={false} />
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head"><div><h3>Traffic Over Time</h3><div className="sub">Total site views across the last 14 days</div></div></div>
        <div className="card-pad" style={{ paddingTop: 8 }}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={viewsTrend} margin={{ left: -20, top: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="views" stroke="#c9960c" strokeWidth={2.6} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><div><h3>Views by Category</h3><div className="sub">Which sections drive the most traffic</div></div></div>
          <div className="card-pad" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byCategory} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="views" fill="#c9960c" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h3>Articles by Reporter</h3><div className="sub">Contribution share across the newsroom</div></div></div>
          <div className="card-pad" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byAuthor} dataKey="value" nameKey="name" innerRadius={50} outerRadius={82} paddingAngle={2}>
                  {byAuthor.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10.5 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head"><div><h3>Top Performing Articles</h3><div className="sub">Ranked by total views</div></div></div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>#</th><th>Article</th><th>Category</th><th>Author</th><th>Views</th></tr></thead>
            <tbody>
              {topArticles.map((n, i) => (
                <tr key={n.id}>
                  <td className="mono faint">{i + 1}</td>
                  <td><div className="row-title"><img src={n.image} className="row-thumb" alt="" /><div className="txt"><div className="main">{n.title}</div></div></div></td>
                  <td>{n.category}</td>
                  <td>{n.author}</td>
                  <td className="mono" style={{ fontWeight: 700 }}>{n.views.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

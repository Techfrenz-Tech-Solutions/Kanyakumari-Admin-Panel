import { useMemo, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { Search, Activity, Printer } from '../components/ui/Icons.jsx';
import { loadData } from '../utils/storage.js';
import { seedActivityLogs } from '../data/mockData.js';

const PAGE_SIZE = 15;

const MODULES = ['All', 'News', 'Categories', 'Reporters', 'Advertisements', 'Comments', 'Users', 'Settings', 'Auth', 'Media'];

const actionColor = (action) => {
  if (/publish|approve/i.test(action)) return { bg: 'var(--green-100)', color: 'var(--green-500)' };
  if (/delete|reject|remove/i.test(action)) return { bg: 'var(--red-100)', color: 'var(--red-600)' };
  if (/create|add|upload/i.test(action)) return { bg: 'var(--blue-100)', color: 'var(--blue-500)' };
  if (/update|edit|save|change/i.test(action)) return { bg: 'var(--amber-100)', color: 'var(--amber-500)' };
  return { bg: 'var(--gray-100)', color: 'var(--gray-500)' };
};

export default function ActivityLogs() {
  const [logs] = useState(() => loadData('activityLogs', seedActivityLogs));
  const [query, setQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = [...logs];
    if (moduleFilter !== 'All') list = list.filter((l) => l.module === moduleFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((l) =>
        l.user.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.record.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [logs, query, moduleFilter]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatDate = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <PageHead
        eyebrow="Audit"
        title="Activity Logs"
        desc="Complete audit trail of all admin actions across the CMS."
        actions={
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer />Export Log
          </button>
        }
      />

      <div className="card">
        <div className="table-toolbar" style={{ flexWrap: 'wrap' }}>
          <div className="table-search">
            <Search />
            <input placeholder="Search by user, action, module…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          </div>
          <div className="toolbar-filters">
            <select className="select" value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}>
              {MODULES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {pageItems.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-faint)' }}>
            <Activity style={{ width: 40, height: 40, marginBottom: 12 }} />
            <div>No activity logs found.</div>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Record</th>
                  <th>Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((log) => {
                  const ac = actionColor(log.action);
                  return (
                    <tr key={log.id}>
                      <td>
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{formatDate(log.date)}</div>
                        <div className="faint" style={{ fontSize: 10.5 }}>{new Date(log.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(145deg, var(--red-500), var(--ink-700))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flex: 'none' }}>
                            {log.user.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{log.user}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ background: ac.bg, color: ac.color, padding: '3px 9px', borderRadius: 6, fontSize: 11.5, fontWeight: 700 }}>{log.action}</span>
                      </td>
                      <td>
                        <span className="pill pill-scheduled" style={{ textTransform: 'none' }}>{log.module}</span>
                      </td>
                      <td style={{ fontSize: 12.5, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.record}</td>
                      <td className="faint" style={{ fontSize: 12 }}>{log.details}</td>
                      <td className="mono" style={{ fontSize: 12, color: 'var(--text-faint)' }}>{log.ip}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      </div>
    </div>
  );
}

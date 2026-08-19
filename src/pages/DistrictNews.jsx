import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../components/ui/PageHead.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Plus, Edit2, MapPin, FileText, Users, Search } from '../components/ui/Icons.jsx';
import { loadData, saveData, uid } from '../utils/storage.js';
import { seedDistrictNews, seedNews } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

export default function DistrictNews() {
  const navigate = useNavigate();
  const toast = useToast();
  const [districts, setDistricts] = useState(() => loadData('districtNews', seedDistrictNews));
  const news = loadData('news', seedNews);
  const [query, setQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newDistrict, setNewDistrict] = useState('');

  const persist = (list) => { setDistricts(list); saveData('districtNews', list); };

  const filtered = useMemo(() => {
    if (!query.trim()) return districts;
    const q = query.toLowerCase();
    return districts.filter((d) => d.district.toLowerCase().includes(q));
  }, [districts, query]);

  const addDistrict = () => {
    if (!newDistrict.trim()) return;
    if (districts.some((d) => d.district.toLowerCase() === newDistrict.trim().toLowerCase())) {
      toast.error('Already exists', `${newDistrict} district is already in the list.`);
      return;
    }
    const d = { id: uid('dist'), district: newDistrict.trim(), activeReporters: 0, totalArticles: 0, thisMonth: 0, lastUpdated: new Date().toISOString().slice(0, 10), latestHeadline: '', status: 'active' };
    persist([...districts, d]);
    toast.success('District added', `${newDistrict} added to the district news board.`);
    setNewDistrict('');
    setAddModalOpen(false);
  };

  const statusMap = { active: { color: 'var(--green-500)', bg: 'var(--green-100)', label: 'Active' }, medium: { color: 'var(--amber-500)', bg: 'var(--amber-100)', label: 'Moderate' }, low: { color: 'var(--gray-500)', bg: 'var(--gray-100)', label: 'Low Activity' } };

  return (
    <div>
      <PageHead
        eyebrow="Local Coverage"
        title="District News"
        desc="Track news coverage activity across all Tamil Nadu districts."
        actions={
          <button className="btn btn-primary" onClick={() => setAddModalOpen(true)}>
            <Plus />Add District
          </button>
        }
      />

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Districts', value: districts.length, color: 'var(--blue-500)' },
          { label: 'Active Districts', value: districts.filter((d) => d.status === 'active').length, color: 'var(--green-500)' },
          { label: 'Total Articles', value: districts.reduce((s, d) => s + (d.totalArticles || 0), 0), color: 'var(--red-500)' },
          { label: 'This Month', value: districts.reduce((s, d) => s + (d.thisMonth || 0), 0), color: 'var(--amber-500)' },
        ].map((s) => (
          <div key={s.label} className="card card-pad" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <Search />
            <input placeholder="Search districts…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <span className="faint" style={{ fontSize: 12.5 }}>{filtered.length} districts</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>District</th>
                <th>Activity</th>
                <th>Reporters</th>
                <th>Total Articles</th>
                <th>This Month</th>
                <th>Last Updated</th>
                <th>Latest Headline</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const cfg = statusMap[d.status] || statusMap.active;
                return (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MapPin style={{ width: 14, height: 14, color: 'var(--red-500)', flex: 'none' }} />
                        <span style={{ fontWeight: 700, fontSize: 13.5 }}>{d.district}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 9px', borderRadius: 6, fontSize: 11.5, fontWeight: 700 }}>{cfg.label}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Users style={{ width: 13, height: 13, color: 'var(--text-faint)' }} />
                        <span className="mono">{d.activeReporters}</span>
                      </div>
                    </td>
                    <td className="mono" style={{ fontWeight: 700 }}>{d.totalArticles}</td>
                    <td className="mono">{d.thisMonth}</td>
                    <td className="faint">{d.lastUpdated}</td>
                    <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-muted)' }}>
                      {d.latestHeadline || '—'}
                    </td>
                    <td>
                      <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/news?district=${encodeURIComponent(d.district)}`)}>
                          <FileText />View News
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New District"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAddModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addDistrict}>Add District</button>
          </>
        }
      >
        <div className="field">
          <label>District Name *</label>
          <input className="input" value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)} placeholder="e.g. Sivagangai" onKeyDown={(e) => e.key === 'Enter' && addDistrict()} />
        </div>
      </Modal>
    </div>
  );
}

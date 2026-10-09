import { useCallback, useEffect, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { Mail, Phone, Inbox, Trash2, CheckCheck, Search, X, Clock } from '../components/ui/Icons.jsx';
import { contactApi } from '../api/contact.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAutoRefresh } from '../context/RefreshContext.jsx';

/* ── Dummy enquiries ─────────────────────────────────────────────── */
const DUMMY_ENQUIRIES = [
  {
    id: 1, name: 'Rajesh Kumar', email: 'rajesh.kumar@gmail.com', phone: '+91 94432 11223',
    subject: 'Advertisement Inquiry',
    message: 'Hello, I am interested in placing a full-page advertisement on your website for our new product launch next month. Please share your rate card and available slots.',
    status: 'unread', createdAt: '2026-09-22T09:15:00',
  },
  {
    id: 2, name: 'Priya Shankar', email: 'priya.shankar@yahoo.com', phone: '+91 98760 44512',
    subject: 'News Tip / Press Release',
    message: 'We are organising a district-level yoga camp on October 5th at the Kanyakumari beach. Kindly cover this event in your news portal. Attached is the press release for your reference.',
    status: 'read', createdAt: '2026-09-21T14:30:00',
  },
  {
    id: 3, name: 'Murugesan A.', email: 'murugesan.a@outlook.com', phone: '+91 77081 99234',
    subject: 'Correction Request',
    message: 'The article published on 20th September about the Nagercoil flyover has incorrect information. The inauguration date mentioned is wrong — it is October 12, not October 8. Please correct it at the earliest.',
    status: 'replied', createdAt: '2026-09-20T11:05:00',
  },
  {
    id: 4, name: 'Lakshmi Devi', email: 'lakshmi.devi88@gmail.com', phone: '',
    subject: 'Job Application',
    message: 'I am a journalist with 5 years of experience in Tamil print media. I would like to apply for any reporter or content writer position available at Kanyakumari Today. Please let me know how I can submit my resume.',
    status: 'unread', createdAt: '2026-09-19T16:45:00',
  },
  {
    id: 5, name: 'Suresh Babu', email: 'suresh.babu2026@gmail.com', phone: '+91 90920 33445',
    subject: 'Technical Issue on Website',
    message: 'The video section on your homepage is not loading properly on mobile. I tried on two phones (Android) and the videos show a blank black screen. Please fix this issue.',
    status: 'read', createdAt: '2026-09-18T08:20:00',
  },
  {
    id: 6, name: 'Kavitha R.', email: 'kavitha.r@hotmail.com', phone: '+91 86080 12345',
    subject: 'Sponsorship Proposal',
    message: 'Our NGO — Green Kanyakumari Foundation — is running a beach cleanup drive this weekend. We would love media coverage and also explore if you offer sponsorship or social media shoutout packages.',
    status: 'replied', createdAt: '2026-09-17T13:10:00',
  },
  {
    id: 7, name: 'Anand Krishnan', email: 'anand.krishnan@kmail.in', phone: '+91 99400 67890',
    subject: 'General Feedback',
    message: 'I have been reading Kanyakumari Today for over two years. The Tamil content quality has improved a lot recently. Keep up the great work! One suggestion — please add a dark mode option to the website.',
    status: 'read', createdAt: '2026-09-16T10:55:00',
  },
];

/* ── Helpers ─────────────────────────────────────────────────────── */
function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_STYLES = {
  unread:  { bg: 'var(--accent-100)', color: 'var(--accent-700)', label: 'Unread' },
  read:    { bg: 'var(--gray-100)',   color: 'var(--gray-500)',   label: 'Read' },
  replied: { bg: 'var(--green-100)',  color: 'var(--green-500)',  label: 'Replied' },
};

/* ════════════════════════════════════════════════════════════════════ */
export default function ContactUs() {
  const toast = useToast();

  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [mockMode, setMockMode] = useState(false);
  const [enqFilter, setEnqFilter] = useState('all');
  const [enqSearch, setEnqSearch] = useState('');
  const [selectedEnq, setSelectedEnq] = useState(null);

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await contactApi.list({ page: 1, limit: 100 });
      setEnquiries(data.items || []);
      setMockMode(false);
    } catch (error) {
      setLoadError(error?.message || 'Unable to load enquiries from the server.');
      setEnquiries(contactApi.mockEnquiries());
      setMockMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEnquiries(); }, [loadEnquiries]);
  useAutoRefresh(loadEnquiries);

  /* ── Actions ───────────────────────────────────────────────────── */
  const markStatus = async (id, status, { silent = false } = {}) => {
    const previous = enquiries;
    setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
    if (selectedEnq?.id === id) setSelectedEnq((e) => ({ ...e, status }));
    try {
      await contactApi.updateStatus(id, status);
      if (!silent && status === 'replied') toast.success('Marked as replied', 'Enquiry status updated.');
    } catch (error) {
      setEnquiries(previous);
      if (selectedEnq?.id === id) setSelectedEnq(previous.find((e) => e.id === id) || null);
      toast.error('Unable to update enquiry', error?.message || 'Please try again.');
    }
  };
  const markRead = (id) => {
    markStatus(id, 'read', { silent: true });
  };
  const markReplied = (id) => {
    markStatus(id, 'replied');
  };
  const deleteEnq = async (id) => {
    const previous = enquiries;
    setEnquiries((prev) => prev.filter((e) => e.id !== id));
    if (selectedEnq?.id === id) setSelectedEnq(null);
    try {
      await contactApi.remove(id);
      toast.success('Deleted', 'Enquiry removed.');
    } catch (error) {
      setEnquiries(previous);
      setSelectedEnq(previous.find((e) => e.id === id) || null);
      toast.error('Unable to delete enquiry', error?.message || 'Please try again.');
    }
  };
  const openEnq = (enq) => {
    const next = enq.status === 'unread' ? { ...enq, status: 'read' } : enq;
    setSelectedEnq(next);
    if (enq.status === 'unread') markRead(enq.id);
  };

  const filteredEnq = enquiries.filter((e) => {
    if (enqFilter !== 'all' && e.status !== enqFilter) return false;
    if (enqSearch) {
      const q = enqSearch.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unreadCount = enquiries.filter((e) => e.status === 'unread').length;

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div>
      <PageHead
        eyebrow="Manage"
        title="Contact Us"
        desc="View and manage messages submitted by website visitors."
      />

      {mockMode && (
        <div className="card card-pad" style={{ marginBottom: 14 }}>
          <div className="field-error" role="alert">{loadError}</div>
          <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>Showing sample enquiries so the page controls can still be tested.</div>
          <button className="btn btn-secondary btn-sm" onClick={loadEnquiries} style={{ marginTop: 10 }}>Retry Server</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedEnq ? '1fr 420px' : '1fr', gap: 16, alignItems: 'start' }}>

        {/* List panel */}
        <div className="card" style={{ overflow: 'hidden' }}>

          {/* Toolbar */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 12px', flex: 1, minWidth: 180 }}>
              <Search style={{ width: 14, height: 14, color: 'var(--text-faint)', flex: 'none' }} />
              <input
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--text)', width: '100%' }}
                placeholder="Search by name, email, subject…"
                value={enqSearch}
                onChange={(e) => setEnqSearch(e.target.value)}
              />
              {enqSearch && (
                <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex', padding: 0 }} onClick={() => setEnqSearch('')}>
                  <X style={{ width: 13, height: 13 }} />
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'unread', 'read', 'replied'].map((f) => (
                <button
                  key={f}
                  className={`filter-chip ${enqFilter === f ? 'active' : ''}`}
                  onClick={() => setEnqFilter(f)}
                  style={{ fontSize: 12 }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Rows */}
          {loading ? (
            <div className="empty-state">
              <Inbox style={{ width: 40, height: 40 }} />
              <div className="t">Loading enquiries...</div>
              <div>Fetching website messages from the server.</div>
            </div>
          ) : filteredEnq.length === 0 ? (
            <div className="empty-state">
              <Inbox style={{ width: 40, height: 40 }} />
              <div className="t">No enquiries found</div>
              <div>{enqSearch || enqFilter !== 'all' ? 'Try clearing filters.' : 'No messages submitted yet.'}</div>
            </div>
          ) : (
            <div>
              {filteredEnq.map((enq) => {
                const st = STATUS_STYLES[enq.status];
                const isSelected = selectedEnq?.id === enq.id;
                return (
                  <div
                    key={enq.id}
                    onClick={() => openEnq(enq)}
                    style={{
                      padding: '14px 16px', borderBottom: '1px solid var(--border)',
                      cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start',
                      background: isSelected ? 'var(--surface-2)' : enq.status === 'unread' ? 'var(--accent-50)' : 'transparent',
                      transition: 'background 0.12s',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flex: 'none',
                      background: 'linear-gradient(135deg, var(--accent-400), var(--accent-700))',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
                    }}>
                      {enq.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontWeight: enq.status === 'unread' ? 700 : 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {enq.name}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-faint)', flex: 'none' }}>{timeAgo(enq.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {enq.subject}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {enq.message}
                      </div>
                    </div>
                    <span style={{ background: st.bg, color: st.color, borderRadius: 999, fontSize: 10.5, fontWeight: 700, padding: '2px 8px', flex: 'none', whiteSpace: 'nowrap' }}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedEnq && (() => {
          const st = STATUS_STYLES[selectedEnq.status];
          return (
            <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-400), var(--accent-700))',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17,
                  }}>
                    {selectedEnq.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedEnq.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{fmtDate(selectedEnq.createdAt)}</div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setSelectedEnq(null)}>
                  <X style={{ width: 15, height: 15 }} />
                </button>
              </div>

              <span style={{ background: st.bg, color: st.color, borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '3px 10px', alignSelf: 'flex-start' }}>
                {st.label}
              </span>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>Subject</div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{selectedEnq.subject}</div>
              </div>

              <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <Mail style={{ width: 14, height: 14, color: 'var(--accent)', flex: 'none' }} />
                  <a href={`mailto:${selectedEnq.email}`} style={{ color: 'var(--accent-500)', textDecoration: 'underline' }}>{selectedEnq.email}</a>
                </div>
                {selectedEnq.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <Phone style={{ width: 14, height: 14, color: 'var(--accent)', flex: 'none' }} />
                    <a href={`tel:${selectedEnq.phone}`} style={{ color: 'var(--text)' }}>{selectedEnq.phone}</a>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-faint)' }}>
                  <Clock style={{ width: 13, height: 13, flex: 'none' }} />
                  {fmtDate(selectedEnq.createdAt)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 8 }}>Message</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                  {selectedEnq.message}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                <a
                  href={`mailto:${selectedEnq.email}?subject=Re: ${encodeURIComponent(selectedEnq.subject)}`}
                  className="btn btn-primary btn-block"
                  onClick={() => markReplied(selectedEnq.id)}
                >
                  <Mail style={{ width: 14, height: 14 }} /> Reply via Email
                </a>
                {selectedEnq.status !== 'replied' && (
                  <button className="btn btn-secondary btn-block" onClick={() => markReplied(selectedEnq.id)}>
                    <CheckCheck style={{ width: 14, height: 14 }} /> Mark as Replied
                  </button>
                )}
                <button
                  className="btn btn-ghost btn-block"
                  style={{ color: 'var(--accent-600)' }}
                  onClick={() => deleteEnq(selectedEnq.id)}
                >
                  <Trash2 style={{ width: 14, height: 14 }} /> Delete Enquiry
                </button>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}

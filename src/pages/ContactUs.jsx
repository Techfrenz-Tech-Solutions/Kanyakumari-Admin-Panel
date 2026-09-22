import { useCallback, useEffect, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { Save, Mail, Phone, MapPin, Globe, Link2, Inbox, Eye, Trash2, CheckCheck, Search, X, Clock } from '../components/ui/Icons.jsx';
import { settingsApi, normalizeContactInfo, buildContactInfoPayload } from '../api/settings.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/* ── Dummy enquiries (shown until real API is wired) ─────────────── */
const DUMMY_ENQUIRIES = [
  {
    id: 1, name: 'Rajesh Kumar', email: 'rajesh.kumar@gmail.com', phone: '+91 94432 11223',
    subject: 'Advertisement Inquiry', message: 'Hello, I am interested in placing a full-page advertisement on your website for our new product launch next month. Please share your rate card and available slots.',
    status: 'unread', createdAt: '2026-09-22T09:15:00',
  },
  {
    id: 2, name: 'Priya Shankar', email: 'priya.shankar@yahoo.com', phone: '+91 98760 44512',
    subject: 'News Tip / Press Release', message: 'We are organising a district-level yoga camp on October 5th at the Kanyakumari beach. Kindly cover this event in your news portal. Attached is the press release for your reference.',
    status: 'read', createdAt: '2026-09-21T14:30:00',
  },
  {
    id: 3, name: 'Murugesan A.', email: 'murugesan.a@outlook.com', phone: '+91 77081 99234',
    subject: 'Correction Request', message: 'The article published on 20th September about the Nagercoil flyover has incorrect information. The inauguration date mentioned is wrong — it is October 12, not October 8. Please correct it at the earliest.',
    status: 'replied', createdAt: '2026-09-20T11:05:00',
  },
  {
    id: 4, name: 'Lakshmi Devi', email: 'lakshmi.devi88@gmail.com', phone: '',
    subject: 'Job Application', message: 'I am a journalist with 5 years of experience in Tamil print media. I would like to apply for any reporter or content writer position available at Kanyakumari Today. Please let me know how I can submit my resume.',
    status: 'unread', createdAt: '2026-09-19T16:45:00',
  },
  {
    id: 5, name: 'Suresh Babu', email: 'suresh.babu2026@gmail.com', phone: '+91 90920 33445',
    subject: 'Technical Issue on Website', message: 'The video section on your homepage is not loading properly on mobile. I tried on two phones (Android) and the videos show a blank black screen. Please fix this issue.',
    status: 'read', createdAt: '2026-09-18T08:20:00',
  },
  {
    id: 6, name: 'Kavitha R.', email: 'kavitha.r@hotmail.com', phone: '+91 86080 12345',
    subject: 'Sponsorship Proposal', message: 'Our NGO — Green Kanyakumari Foundation — is running a beach cleanup drive this weekend. We would love media coverage and also explore if you offer sponsorship or social media shoutout packages.',
    status: 'replied', createdAt: '2026-09-17T13:10:00',
  },
  {
    id: 7, name: 'Anand Krishnan', email: 'anand.krishnan@kmail.in', phone: '+91 99400 67890',
    subject: 'General Feedback', message: 'I have been reading Kanyakumari Today for over two years. The Tamil content quality has improved a lot recently. Keep up the great work! One suggestion — please add a dark mode option to the website.',
    status: 'read', createdAt: '2026-09-16T10:55:00',
  },
];

/* ── Helpers ─────────────────────────────────────────────────────── */
const DEFAULT_CONTACT_INFO = {
  officeName: '', address: '', city: '', state: '', pincode: '',
  phone: '', altPhone: '', email: '', supportEmail: '',
  website: '', mapEmbedUrl: '', whatsapp: '',
  workingHours: 'Mon – Sat: 9:00 AM – 6:00 PM',
};

function isGoogleMapsEmbed(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    if (host !== 'google.com' && !host.endsWith('.google.com')) return false;
    return u.pathname.startsWith('/maps/');
  } catch { return false; }
}
function isUrl(value) {
  try { const u = new URL(value); return u.protocol === 'http:' || u.protocol === 'https:'; }
  catch { return false; }
}
function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_STYLES = {
  unread:  { bg: 'var(--accent-100)', color: 'var(--accent-700)', label: 'Unread' },
  read:    { bg: 'var(--gray-100)',   color: 'var(--gray-500)',   label: 'Read' },
  replied: { bg: 'var(--green-100)',  color: 'var(--green-500)',  label: 'Replied' },
};

/* ══════════════════════════════════════════════════════════════════ */
export default function ContactUs() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('settings.edit');

  /* tab: 'settings' | 'enquiries' */
  const [tab, setTab] = useState('enquiries');

  /* ── Office settings state ─────────────────────────────────────── */
  const [form, setForm] = useState(DEFAULT_CONTACT_INFO);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  /* ── Enquiries state ───────────────────────────────────────────── */
  const [enquiries, setEnquiries] = useState(DUMMY_ENQUIRIES);
  const [enqFilter, setEnqFilter] = useState('all');  // all | unread | read | replied
  const [enqSearch, setEnqSearch] = useState('');
  const [selectedEnq, setSelectedEnq] = useState(null);

  /* ── Load office settings ──────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const data = await settingsApi.get();
      setForm(normalizeContactInfo(data?.contactInfo));
    } catch (error) {
      setLoadError(error?.message || 'Unable to load contact settings.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e = {};
    if (!form.officeName.trim()) e.officeName = 'Office name is required.';
    if (!form.address.trim()) e.address = 'Address is required.';
    if (!form.phone.trim()) e.phone = 'Phone number is required.';
    if (!form.email.trim()) e.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (form.supportEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.supportEmail)) e.supportEmail = 'Enter a valid email address.';
    if (form.website.trim() && !isUrl(form.website)) e.website = 'Enter a valid URL (https://…).';
    if (form.mapEmbedUrl.trim() && !isGoogleMapsEmbed(form.mapEmbedUrl)) e.mapEmbedUrl = 'Must be a Google Maps embed URL.';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate(); setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await settingsApi.update({ contactInfo: buildContactInfoPayload(form) });
      setSaving(false);
      toast.success('Contact info saved', 'The details are now live on the website.');
    } catch (error) {
      setSaving(false);
      if (error?.status === 400 && Array.isArray(error.details)) {
        const fieldOf = (path) => String(path).replace(/^contactInfo\./, '').split('.').pop();
        let shown = false;
        setErrors((prev) => {
          const next = { ...prev };
          for (const detail of error.details) {
            const field = fieldOf(detail.path);
            if (detail.path.startsWith('contactInfo.')) { next[field] = detail.message; shown = true; }
          }
          return shown ? next : prev;
        });
        if (shown) return;
      }
      const message = error?.status === 403
        ? 'Your account cannot edit site settings.'
        : (error?.message || 'Something went wrong. Please try again.');
      toast.error('Could not save contact info', message);
    }
  };

  /* ── Enquiry actions ───────────────────────────────────────────── */
  const markRead = (id) => {
    setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, status: 'read' } : e));
    if (selectedEnq?.id === id) setSelectedEnq((e) => ({ ...e, status: 'read' }));
  };
  const markReplied = (id) => {
    setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, status: 'replied' } : e));
    if (selectedEnq?.id === id) setSelectedEnq((e) => ({ ...e, status: 'replied' }));
    toast.success('Marked as replied', 'Enquiry status updated.');
  };
  const deleteEnq = (id) => {
    setEnquiries((prev) => prev.filter((e) => e.id !== id));
    if (selectedEnq?.id === id) setSelectedEnq(null);
    toast.success('Deleted', 'Enquiry removed.');
  };
  const openEnq = (enq) => {
    setSelectedEnq(enq);
    if (enq.status === 'unread') markRead(enq.id);
  };

  const filteredEnq = enquiries.filter((e) => {
    if (enqFilter !== 'all' && e.status !== enqFilter) return false;
    if (enqSearch) {
      const q = enqSearch.toLowerCase();
      return e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q);
    }
    return true;
  });

  const unreadCount = enquiries.filter((e) => e.status === 'unread').length;
  const disabled = !canEdit || saving;

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div>
      <PageHead
        eyebrow="Manage"
        title="Contact Us"
        desc="Manage office contact details and view visitor enquiries."
        actions={tab === 'settings' && canEdit ? (
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            <Save style={{ width: 15, height: 15 }} />
            {saving ? 'Saving…' : 'Save & Publish'}
          </button>
        ) : null}
      />

      {/* Tabs */}
      <div className="settings-tabs" style={{ marginBottom: 20 }}>
        <div
          className={`settings-tab ${tab === 'enquiries' ? 'active' : ''}`}
          onClick={() => setTab('enquiries')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Inbox style={{ width: 14, height: 14 }} />
            Enquiries
            {unreadCount > 0 && (
              <span style={{
                background: 'var(--accent-500)', color: 'var(--btn-primary-color)',
                borderRadius: 999, fontSize: 11, fontWeight: 700,
                padding: '1px 7px', lineHeight: 1.6,
              }}>{unreadCount}</span>
            )}
          </span>
        </div>
        <div
          className={`settings-tab ${tab === 'settings' ? 'active' : ''}`}
          onClick={() => setTab('settings')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <MapPin style={{ width: 14, height: 14 }} />
            Office Settings
          </span>
        </div>
      </div>

      {/* ── ENQUIRIES TAB ─────────────────────────────────────────── */}
      {tab === 'enquiries' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedEnq ? '1fr 420px' : '1fr', gap: 16, alignItems: 'start' }}>

          {/* List panel */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
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
              {/* Filter chips */}
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

            {/* Enquiry rows */}
            {filteredEnq.length === 0 ? (
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
                      {/* Avatar */}
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
                {/* Header */}
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

                {/* Status pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: st.bg, color: st.color, borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '3px 10px' }}>
                    {st.label}
                  </span>
                </div>

                {/* Subject */}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>Subject</div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{selectedEnq.subject}</div>
                </div>

                {/* Contact info */}
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

                {/* Message */}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 8 }}>Message</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                    {selectedEnq.message}
                  </div>
                </div>

                {/* Actions */}
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
      )}

      {/* ── OFFICE SETTINGS TAB ────────────────────────────────────── */}
      {tab === 'settings' && (
        loading ? (
          <div className="card"><div className="empty-state"><div className="t">Loading contact settings…</div></div></div>
        ) : loadError ? (
          <div className="card"><div className="empty-state"><div className="t">Unable to load</div><div>{loadError}</div><button className="btn btn-secondary" onClick={load}>Retry</button></div></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Office Details */}
            <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin style={{ width: 15, height: 15, color: 'var(--accent)' }} /> Office Details
              </div>
              <div className="field">
                <label>Office / Organisation Name *</label>
                <input className={`input ${errors.officeName ? 'error' : ''}`} placeholder="e.g. Kanyakumari Today" value={form.officeName} onChange={(e) => set('officeName', e.target.value)} disabled={disabled} />
                {errors.officeName && <div className="field-error">{errors.officeName}</div>}
              </div>
              <div className="field">
                <label>Street Address *</label>
                <textarea className={`input ${errors.address ? 'error' : ''}`} rows={2} placeholder="Door No, Street, Area…" value={form.address} onChange={(e) => set('address', e.target.value)} style={{ resize: 'vertical' }} disabled={disabled} />
                {errors.address && <div className="field-error">{errors.address}</div>}
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>City</label>
                  <input className="input" placeholder="Kanyakumari" value={form.city} onChange={(e) => set('city', e.target.value)} disabled={disabled} />
                </div>
                <div className="field">
                  <label>State</label>
                  <input className="input" placeholder="Tamil Nadu" value={form.state} onChange={(e) => set('state', e.target.value)} disabled={disabled} />
                </div>
              </div>
              <div className="field">
                <label>Pin Code</label>
                <input className="input" placeholder="629001" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} style={{ maxWidth: 180 }} disabled={disabled} />
              </div>
              <div className="field">
                <label>Working Hours</label>
                <input className="input" value={form.workingHours} onChange={(e) => set('workingHours', e.target.value)} disabled={disabled} />
              </div>
            </div>

            {/* Contact Details */}
            <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone style={{ width: 15, height: 15, color: 'var(--accent)' }} /> Contact Details
              </div>
              <div className="field">
                <label>Primary Phone *</label>
                <input className={`input ${errors.phone ? 'error' : ''}`} placeholder="+91 94XXX XXXXX" value={form.phone} onChange={(e) => set('phone', e.target.value)} disabled={disabled} />
                {errors.phone && <div className="field-error">{errors.phone}</div>}
              </div>
              <div className="field">
                <label>Alternate Phone</label>
                <input className="input" placeholder="+91 98XXX XXXXX" value={form.altPhone} onChange={(e) => set('altPhone', e.target.value)} disabled={disabled} />
              </div>
              <div className="field">
                <label>WhatsApp Number</label>
                <input className="input" placeholder="+91 94XXX XXXXX" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} disabled={disabled} />
              </div>
              <div className="field">
                <label>Primary Email *</label>
                <input className={`input ${errors.email ? 'error' : ''}`} type="email" placeholder="info@kanyakumartoday.com" value={form.email} onChange={(e) => set('email', e.target.value)} disabled={disabled} />
                {errors.email && <div className="field-error">{errors.email}</div>}
              </div>
              <div className="field">
                <label>Support / Feedback Email</label>
                <input className={`input ${errors.supportEmail ? 'error' : ''}`} type="email" placeholder="support@kanyakumartoday.com" value={form.supportEmail} onChange={(e) => set('supportEmail', e.target.value)} disabled={disabled} />
                {errors.supportEmail && <div className="field-error">{errors.supportEmail}</div>}
              </div>
              <div className="field">
                <label>Website URL</label>
                <input className={`input ${errors.website ? 'error' : ''}`} placeholder="https://kanyakumartoday.com" value={form.website} onChange={(e) => set('website', e.target.value)} disabled={disabled} />
                {errors.website && <div className="field-error">{errors.website}</div>}
              </div>
            </div>

            {/* Google Map Embed */}
            <div className="card card-pad" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe style={{ width: 15, height: 15, color: 'var(--accent)' }} /> Google Map Embed
              </div>
              <div className="field">
                <label>Google Maps Embed URL</label>
                <input className={`input ${errors.mapEmbedUrl ? 'error' : ''}`} placeholder="https://www.google.com/maps/embed?pb=..." value={form.mapEmbedUrl} onChange={(e) => set('mapEmbedUrl', e.target.value)} disabled={disabled} />
                {errors.mapEmbedUrl && <div className="field-error">{errors.mapEmbedUrl}</div>}
                <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 4 }}>
                  Go to Google Maps → Share → Embed a map → copy the <code>src</code> URL from the iframe code.
                </div>
              </div>
              {form.mapEmbedUrl && (
                <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', height: 300 }}>
                  <iframe src={form.mapEmbedUrl} width="100%" height="300" style={{ border: 0, display: 'block' }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Office location map" />
                </div>
              )}
            </div>

            {/* Live Preview */}
            <div className="card card-pad" style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link2 style={{ width: 15, height: 15, color: 'var(--accent)' }} /> Live Preview
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {[
                  { icon: MapPin, label: 'Address', value: [form.officeName, form.address, [form.city, form.state, form.pincode].filter(Boolean).join(', ')].filter(Boolean).join('\n') },
                  { icon: Phone, label: 'Phone', value: [form.phone, form.altPhone].filter(Boolean).join('\n') },
                  { icon: Mail, label: 'Email', value: [form.email, form.supportEmail].filter(Boolean).join('\n') },
                  { icon: Globe, label: 'Working Hours', value: form.workingHours },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ marginTop: 2, color: 'var(--accent)', flex: 'none' }}><Icon style={{ width: 16, height: 16 }} /></span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 13.5, whiteSpace: 'pre-line', color: 'var(--text)' }}>{value || <span style={{ color: 'var(--text-faint)' }}>—</span>}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )
      )}
    </div>
  );
}

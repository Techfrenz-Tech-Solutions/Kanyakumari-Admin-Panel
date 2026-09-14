import { useCallback, useEffect, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { Save, Mail, Phone, MapPin, Globe, Link2 } from '../components/ui/Icons.jsx';
import { settingsApi, normalizeContactInfo, buildContactInfoPayload } from '../api/settings.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

// UI-only defaults for the 13-field office/contact form. The Backend is the
// authoritative store (PUT /api/admin/settings -> contactInfo); browser-local
// `contact_info` persistence is no longer used (see api/settings.js D19 note).
const DEFAULT_CONTACT_INFO = {
  officeName: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  altPhone: '',
  email: '',
  supportEmail: '',
  website: '',
  mapEmbedUrl: '',
  whatsapp: '',
  workingHours: 'Mon – Sat: 9:00 AM – 6:00 PM',
};

// Mirrors the backend googleMapsEmbedUrl rule (supporting.js):
// https + google.com host + /maps/ path.
function isGoogleMapsEmbed(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    if (host !== 'google.com' && !host.endsWith('.google.com')) return false;
    return u.pathname.startsWith('/maps/');
  } catch {
    return false;
  }
}

function isUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function ContactUs() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('settings.edit');
  const [form, setForm] = useState(DEFAULT_CONTACT_INFO);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await settingsApi.get();
      setForm(normalizeContactInfo(data?.contactInfo));
      if (import.meta.env?.DEV && window.localStorage.getItem('dw_admin_contact_info')) {
        console.info('[ContactUs] ignoring stale browser-local "contact_info" — Backend is authoritative.');
      }
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
    if (form.mapEmbedUrl.trim() && !isGoogleMapsEmbed(form.mapEmbedUrl)) e.mapEmbedUrl = 'Must be a Google Maps embed URL (https://…google.com/maps/…).';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      // Partial update: only the contactInfo block is sent (spec §14).
      await settingsApi.update({ contactInfo: buildContactInfoPayload(form) });
      setSaving(false);
      toast.success('Contact info saved', 'The details are now live on the website.');
    } catch (error) {
      setSaving(false);
      // Keep the unsaved form values; map backend 400 details onto fields.
      if (error?.status === 400 && Array.isArray(error.details)) {
        const fieldOf = (path) => String(path).replace(/^contactInfo\./, '').split('.').pop();
        let shown = false;
        setErrors((prev) => {
          const next = { ...prev };
          for (const detail of error.details) {
            const field = fieldOf(detail.path);
            if (detail.path.startsWith('contactInfo.')) {
              next[field] = detail.message;
              shown = true;
            }
          }
          return shown ? next : prev;
        });
        if (shown) return;
      }
      const message = error?.status === 403
        ? 'Your account cannot edit site settings (settings.edit required).'
        : (error?.message || 'Something went wrong. Please try again.');
      toast.error('Could not save contact info', message);
    }
  };

  const disabled = !canEdit || saving;

  return (
    <div>
      <PageHead
        eyebrow="Manage"
        title="Contact Us"
        desc={canEdit
          ? 'Update the contact information displayed on the website.'
          : 'View the contact information displayed on the website (read-only).'}
        actions={canEdit ? (
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            <Save style={{ width: 15, height: 15 }} />
            {saving ? 'Saving…' : 'Save & Publish'}
          </button>
        ) : null}
      />

      {loading ? (
        <div className="card"><div className="empty-state"><div className="t">Loading contact settings…</div></div></div>
      ) : loadError ? (
        <div className="card"><div className="empty-state"><div className="t">Unable to load contact settings</div><div>{loadError}</div><button className="btn btn-secondary" onClick={load}>Retry</button></div></div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Office Details */}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin style={{ width: 15, height: 15, color: 'var(--accent)' }} /> Office Details
          </div>

          <div className="field">
            <label>Office / Organisation Name *</label>
            <input
              className={`input ${errors.officeName ? 'error' : ''}`}
              placeholder="e.g. Kanyakumari Today"
              value={form.officeName}
              onChange={(e) => set('officeName', e.target.value)}
              disabled={disabled}
            />
            {errors.officeName && <div className="field-error">{errors.officeName}</div>}
          </div>

          <div className="field">
            <label>Street Address *</label>
            <textarea
              className={`input ${errors.address ? 'error' : ''}`}
              rows={2}
              placeholder="Door No, Street, Area…"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              style={{ resize: 'vertical' }}
              disabled={disabled}
            />
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
            <input
              className={`input ${errors.phone ? 'error' : ''}`}
              placeholder="+91 94XXX XXXXX"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              disabled={disabled}
            />
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
            <input
              className={`input ${errors.email ? 'error' : ''}`}
              type="email"
              placeholder="info@kanyakumartoday.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              disabled={disabled}
            />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          <div className="field">
            <label>Support / Feedback Email</label>
            <input
              className={`input ${errors.supportEmail ? 'error' : ''}`}
              type="email"
              placeholder="support@kanyakumartoday.com"
              value={form.supportEmail}
              onChange={(e) => set('supportEmail', e.target.value)}
              disabled={disabled}
            />
            {errors.supportEmail && <div className="field-error">{errors.supportEmail}</div>}
          </div>

          <div className="field">
            <label>Website URL</label>
            <input
              className={`input ${errors.website ? 'error' : ''}`}
              placeholder="https://kanyakumartoday.com"
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
              disabled={disabled}
            />
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
            <input
              className={`input ${errors.mapEmbedUrl ? 'error' : ''}`}
              placeholder="https://www.google.com/maps/embed?pb=..."
              value={form.mapEmbedUrl}
              onChange={(e) => set('mapEmbedUrl', e.target.value)}
              disabled={disabled}
            />
            {errors.mapEmbedUrl && <div className="field-error">{errors.mapEmbedUrl}</div>}
            <div className="field-hint" style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 4 }}>
              Go to Google Maps → Share → Embed a map → copy the <code>src</code> URL from the iframe code.
            </div>
          </div>
          {form.mapEmbedUrl && (
            <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', height: 300 }}>
              <iframe
                src={form.mapEmbedUrl}
                width="100%"
                height="300"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Office location map"
              />
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
      )}
    </div>
  );
}

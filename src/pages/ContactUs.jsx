import { useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { Save, Mail, Phone, MapPin, Globe, Link2 } from '../components/ui/Icons.jsx';
import { loadData, saveData } from '../utils/storage.js';
import { useToast } from '../context/ToastContext.jsx';

const DEFAULT_CONTACT = {
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

export default function ContactUs() {
  const toast = useToast();
  const [form, setForm] = useState(() => loadData('contact_info', DEFAULT_CONTACT));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e = {};
    if (!form.officeName.trim()) e.officeName = 'Office name is required.';
    if (!form.address.trim()) e.address = 'Address is required.';
    if (!form.phone.trim()) e.phone = 'Phone number is required.';
    if (!form.email.trim()) e.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    // Simulate async save (swap for a real API call when backend is ready)
    await new Promise((r) => setTimeout(r, 400));
    saveData('contact_info', form);
    setSaving(false);
    toast.success('Contact info saved', 'The details are now live on the website.');
  };

  return (
    <div>
      <PageHead
        eyebrow="Manage"
        title="Contact Us"
        desc="Update the contact information displayed on the website."
        actions={
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            <Save style={{ width: 15, height: 15 }} />
            {saving ? 'Saving…' : 'Save & Publish'}
          </button>
        }
      />

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
            />
            {errors.address && <div className="field-error">{errors.address}</div>}
          </div>

          <div className="grid-2">
            <div className="field">
              <label>City</label>
              <input className="input" placeholder="Kanyakumari" value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div className="field">
              <label>State</label>
              <input className="input" placeholder="Tamil Nadu" value={form.state} onChange={(e) => set('state', e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Pin Code</label>
            <input className="input" placeholder="629001" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} style={{ maxWidth: 180 }} />
          </div>

          <div className="field">
            <label>Working Hours</label>
            <input className="input" value={form.workingHours} onChange={(e) => set('workingHours', e.target.value)} />
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
            />
            {errors.phone && <div className="field-error">{errors.phone}</div>}
          </div>

          <div className="field">
            <label>Alternate Phone</label>
            <input className="input" placeholder="+91 98XXX XXXXX" value={form.altPhone} onChange={(e) => set('altPhone', e.target.value)} />
          </div>

          <div className="field">
            <label>WhatsApp Number</label>
            <input className="input" placeholder="+91 94XXX XXXXX" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
          </div>

          <div className="field">
            <label>Primary Email *</label>
            <input
              className={`input ${errors.email ? 'error' : ''}`}
              type="email"
              placeholder="info@kanyakumartoday.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          <div className="field">
            <label>Support / Feedback Email</label>
            <input className="input" type="email" placeholder="support@kanyakumartoday.com" value={form.supportEmail} onChange={(e) => set('supportEmail', e.target.value)} />
          </div>

          <div className="field">
            <label>Website URL</label>
            <input className="input" placeholder="https://kanyakumartoday.com" value={form.website} onChange={(e) => set('website', e.target.value)} />
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
              className="input"
              placeholder="https://www.google.com/maps/embed?pb=..."
              value={form.mapEmbedUrl}
              onChange={(e) => set('mapEmbedUrl', e.target.value)}
            />
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
    </div>
  );
}

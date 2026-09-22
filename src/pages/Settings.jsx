import { useCallback, useEffect, useRef, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { Upload, Save, Globe, Mail, Link2 } from '../components/ui/Icons.jsx';
import { settingsApi, normalizeSettings, buildSettingsPayload, SOCIAL_KEYS } from '../api/settings.js';
import { mediaApi } from '../api/media.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const TABS = ['General'/*, 'Contact', 'Social Media', 'Header & Footer'*/];

// Display labels for the social inputs (kept minimal — same card layout as
// before, three inputs added for the newly backend-supported networks).
const SOCIAL_LABELS = {
  facebook: 'Facebook',
  twitter: 'X / Twitter',
  instagram: 'Instagram',
  youtube: 'YouTube',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  googlenews: 'Google News',
};

export default function Settings() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('settings.edit');
  const [tab, setTab] = useState('General');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const logoRef = useRef(null);
  const faviconRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await settingsApi.get();
      setSettings(normalizeSettings(data));
      // Legacy browser-local `settings` (base64 logos etc.) is no longer
      // authoritative — the Backend SiteSettings row wins (spec §19/§28).
      if (import.meta.env?.DEV && window.localStorage.getItem('dw_admin_settings')) {
        console.info('[Settings] ignoring stale browser-local "settings" — Backend is authoritative.');
      }
    } catch (error) {
      setLoadError(error?.message || 'Unable to load site settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (key, value) => setSettings((s) => ({ ...s, [key]: value }));
  const setSocial = (key, value) => setSettings((s) => ({ ...s, social: { ...s.social, [key]: value } }));

  const handleFile = (key) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const media = await mediaApi.upload(file, 'image');
      setSettings((s) => ({ ...s, [key]: media.url, [`${key}Id`]: media.id }));
      toast.success('Image uploaded', `${file.name} is ready to be saved with the settings.`);
    } catch (error) {
      toast.error('Upload failed', error?.message || 'Could not upload the image.');
    }
  };

  const removeImage = (key) => setSettings((s) => ({ ...s, [key]: '', [`${key}Id`]: null }));

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      // Flat, backend-supported fields only — never the whole browser-local
      // object (spec §23). Blank optionals go out as null so the Backend
      // clears them (spec §15 decision).
      const updated = await settingsApi.update(buildSettingsPayload(settings));
      // Trust the returned server state over local form state (spec §29).
      setSettings(normalizeSettings(updated));
      toast.success('Settings saved', 'Your website settings have been updated.');
    } catch (error) {
      if (error?.status === 403) {
        toast.error('Could not save settings', 'Your account cannot edit site settings (settings.edit required).');
      } else if (error?.status === 400) {
        const detail = Array.isArray(error.details) && error.details.length
          ? error.details.map((d) => d.message).join(' ')
          : error.message;
        toast.error('Check the highlighted fields', detail || 'One or more values are invalid.');
      } else {
        toast.error('Could not save settings', error?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHead eyebrow="Configuration" title="Website Settings" desc="Control how your newspaper site presents itself to readers." />
        <div className="card"><div className="empty-state"><div className="t">Loading settings…</div></div></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <PageHead eyebrow="Configuration" title="Website Settings" desc="Control how your newspaper site presents itself to readers." />
        <div className="card">
          <div className="empty-state">
            <div className="t">Unable to load site settings</div>
            <div>{loadError}</div>
            <button className="btn btn-secondary" onClick={load}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHead
        eyebrow="Configuration"
        title="Website Settings"
        desc={canEdit
          ? 'Control how your newspaper site presents itself to readers.'
          : 'View your website settings (read-only — saving requires settings.edit).'}
        actions={canEdit ? (
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            <Save />{saving ? 'Saving…' : 'Save Changes'}
          </button>
        ) : null}
      />

      <div className="settings-tabs">
        {TABS.map((t) => (
          <div key={t} className={`settings-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</div>
        ))}
      </div>

      <div className="card card-pad" style={{ maxWidth: 700 }}>
        {tab === 'General' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="field">
              <label>Newspaper Name</label>
              <input className="input" value={settings.siteName} onChange={(e) => set('siteName', e.target.value)} disabled={!canEdit} />
            </div>
            <div className="field">
              <label>Tagline</label>
              <input className="input" value={settings.tagline} onChange={(e) => set('tagline', e.target.value)} disabled={!canEdit} />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Logo</label>
                {settings.logoUrl ? (
                  <div className="image-preview" style={{ maxWidth: 200 }}><img src={settings.logoUrl} alt="Logo" style={{ aspectRatio: '2/1' }} />
                    {canEdit && <button className="remove-btn" onClick={() => removeImage('logoUrl')}>×</button>}
                  </div>
                ) : (
                  canEdit && (
                    <div className="dropzone" onClick={() => logoRef.current?.click()}><Upload /><div style={{ fontSize: 12.5 }}>Upload logo</div></div>
                  )
                )}
                <input ref={logoRef} type="file" accept="image/*" hidden onChange={handleFile('logoUrl')} disabled={!canEdit} />
              </div>
              <div className="field">
                <label>Favicon</label>
                {settings.faviconUrl ? (
                  <div className="image-preview" style={{ maxWidth: 120 }}><img src={settings.faviconUrl} alt="Favicon" style={{ aspectRatio: '1/1' }} />
                    {canEdit && <button className="remove-btn" onClick={() => removeImage('faviconUrl')}>×</button>}
                  </div>
                ) : (
                  canEdit && (
                    <div className="dropzone" style={{ maxWidth: 200 }} onClick={() => faviconRef.current?.click()}><Upload /><div style={{ fontSize: 12.5 }}>Upload favicon</div></div>
                  )
                )}
                <input ref={faviconRef} type="file" accept="image/*" hidden onChange={handleFile('faviconUrl')} disabled={!canEdit} />
              </div>
            </div>
          </div>
        )}

        {/*tab === 'Contact' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="field">
              <label><Mail style={{ width: 13, height: 13, marginRight: 4, verticalAlign: -2 }} />Contact Email</label>
              <input className="input" value={settings.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} disabled={!canEdit} />
            </div>
            <div className="field">
              <label>Contact Phone</label>
              <input className="input" value={settings.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} disabled={!canEdit} />
            </div>
            <div className="field">
              <label>Office Address</label>
              <textarea className="input" rows={3} value={settings.address} onChange={(e) => set('address', e.target.value)} disabled={!canEdit} />
            </div>
            <div className="field-hint" style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
              Full office contact details (address, phones, map) are managed on the Contact Us page.
            </div>
          </div>
        )*/}

        {/*tab === 'Social Media' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {SOCIAL_KEYS.map((k) => (
              <div className="field" key={k}>
                <label><Link2 style={{ width: 13, height: 13, marginRight: 4, verticalAlign: -2 }} />{SOCIAL_LABELS[k]}</label>
                <input className="input" placeholder={`https://${k === 'googlenews' ? 'news.google.com' : k === 'telegram' ? 't.me' : k === 'whatsapp' ? 'wa.me' : k + '.com'}/…`} value={settings.social[k]} onChange={(e) => setSocial(k, e.target.value)} disabled={!canEdit} />
              </div>
            ))}
          </div>
        )*/}

        {/*tab === 'Header & Footer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="field">
              <label><Globe style={{ width: 13, height: 13, marginRight: 4, verticalAlign: -2 }} />Header Announcement</label>
              <input className="input" value={settings.headerNote} onChange={(e) => set('headerNote', e.target.value)} disabled={!canEdit} />
            </div>
            <div className="field">
              <label>Footer Text</label>
              <textarea className="input" rows={3} value={settings.footerText} onChange={(e) => set('footerText', e.target.value)} disabled={!canEdit} />
            </div>
          </div>
        )*/}
      </div>
    </div>
  );
}

import { useRef, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { Upload, Save, Globe, Mail, Link2 } from '../components/ui/Icons.jsx';
import { loadData, saveData } from '../utils/storage.js';
import { defaultSettings } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const TABS = ['General', 'Contact', 'Social Media', 'Header & Footer'];

export default function Settings() {
  const toast = useToast();
  const [tab, setTab] = useState('General');
  const [settings, setSettings] = useState(() => loadData('settings', defaultSettings));
  const logoRef = useRef(null);
  const faviconRef = useRef(null);

  const set = (key, value) => setSettings((s) => ({ ...s, [key]: value }));
  const setSocial = (key, value) => setSettings((s) => ({ ...s, social: { ...s.social, [key]: value } }));

  const handleFile = (key) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set(key, reader.result);
    reader.readAsDataURL(file);
  };

  const save = () => {
    saveData('settings', settings);
    toast.success('Settings saved', 'Your website settings have been updated.');
  };

  return (
    <div>
      <PageHead
        eyebrow="Configuration"
        title="Website Settings"
        desc="Control how your newspaper site presents itself to readers."
        actions={<button className="btn btn-primary" onClick={save}><Save />Save Changes</button>}
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
              <input className="input" value={settings.siteName} onChange={(e) => set('siteName', e.target.value)} />
            </div>
            <div className="field">
              <label>Tagline</label>
              <input className="input" value={settings.tagline} onChange={(e) => set('tagline', e.target.value)} />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Logo</label>
                {settings.logoUrl ? (
                  <div className="image-preview" style={{ maxWidth: 200 }}><img src={settings.logoUrl} alt="Logo" style={{ aspectRatio: '2/1' }} />
                    <button className="remove-btn" onClick={() => set('logoUrl', '')}>×</button>
                  </div>
                ) : (
                  <div className="dropzone" onClick={() => logoRef.current?.click()}><Upload /><div style={{ fontSize: 12.5 }}>Upload logo</div></div>
                )}
                <input ref={logoRef} type="file" accept="image/*" hidden onChange={handleFile('logoUrl')} />
              </div>
              <div className="field">
                <label>Favicon</label>
                {settings.faviconUrl ? (
                  <div className="image-preview" style={{ maxWidth: 120 }}><img src={settings.faviconUrl} alt="Favicon" style={{ aspectRatio: '1/1' }} />
                    <button className="remove-btn" onClick={() => set('faviconUrl', '')}>×</button>
                  </div>
                ) : (
                  <div className="dropzone" style={{ maxWidth: 200 }} onClick={() => faviconRef.current?.click()}><Upload /><div style={{ fontSize: 12.5 }}>Upload favicon</div></div>
                )}
                <input ref={faviconRef} type="file" accept="image/*" hidden onChange={handleFile('faviconUrl')} />
              </div>
            </div>
          </div>
        )}

        {tab === 'Contact' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="field">
              <label><Mail style={{ width: 13, height: 13, marginRight: 4, verticalAlign: -2 }} />Contact Email</label>
              <input className="input" value={settings.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
            </div>
            <div className="field">
              <label>Contact Phone</label>
              <input className="input" value={settings.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
            </div>
            <div className="field">
              <label>Office Address</label>
              <textarea className="input" rows={3} value={settings.address} onChange={(e) => set('address', e.target.value)} />
            </div>
          </div>
        )}

        {tab === 'Social Media' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {['facebook', 'twitter', 'instagram', 'youtube'].map((k) => (
              <div className="field" key={k}>
                <label><Link2 style={{ width: 13, height: 13, marginRight: 4, verticalAlign: -2 }} />{k[0].toUpperCase() + k.slice(1)}</label>
                <input className="input" value={settings.social[k]} onChange={(e) => setSocial(k, e.target.value)} />
              </div>
            ))}
          </div>
        )}

        {tab === 'Header & Footer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="field">
              <label><Globe style={{ width: 13, height: 13, marginRight: 4, verticalAlign: -2 }} />Header Announcement</label>
              <input className="input" value={settings.headerNote} onChange={(e) => set('headerNote', e.target.value)} />
            </div>
            <div className="field">
              <label>Footer Text</label>
              <textarea className="input" rows={3} value={settings.footerText} onChange={(e) => set('footerText', e.target.value)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

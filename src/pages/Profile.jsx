import { useRef, useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import { Save, Upload, Mail, Lock, User, Clock3 } from '../components/ui/Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const avatarRef = useRef(null);

  const [profile, setProfile] = useState({
    name: user?.name || 'Admin User',
    email: user?.email || 'admin@dailywire.in',
    phone: user?.phone || '+91 98765 00001',
    bio: user?.bio || 'Super Admin of The Daily Wire CMS. Oversees all editorial operations.',
    avatar: '',
  });

  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [tab, setTab] = useState('profile');

  const handleAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfile((p) => ({ ...p, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    toast.success('Profile updated', 'Your profile information has been saved.');
  };

  const changePassword = () => {
    const errs = {};
    if (!passwords.current) errs.current = 'Current password is required.';
    if (!passwords.newPass || passwords.newPass.length < 8) errs.newPass = 'New password must be at least 8 characters.';
    if (passwords.newPass !== passwords.confirm) errs.confirm = 'Passwords do not match.';
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    setPasswords({ current: '', newPass: '', confirm: '' });
    toast.success('Password changed', 'Your password has been updated successfully.');
  };

  const initials = profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const loginHistory = [
    { ip: '103.21.58.12', device: 'Chrome on Windows', time: 'Today, 09:42 AM', location: 'Chennai, TN' },
    { ip: '103.21.58.12', device: 'Chrome on Windows', time: 'Yesterday, 06:15 PM', location: 'Chennai, TN' },
    { ip: '49.206.11.8', device: 'Safari on iPhone', time: '16 Aug, 11:30 AM', location: 'Coimbatore, TN' },
    { ip: '103.21.58.12', device: 'Chrome on Windows', time: '15 Aug, 08:00 AM', location: 'Chennai, TN' },
  ];

  return (
    <div>
      <PageHead eyebrow="Account" title="My Profile" desc="Manage your account information, password and preferences." />

      <div className="two-col" style={{ alignItems: 'flex-start' }}>
        {/* Avatar card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-pad" style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)' }} />
              ) : (
                <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(145deg, var(--red-500), var(--ink-700))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-display)', border: '3px solid var(--border)' }}>
                  {initials}
                </div>
              )}
              <button
                onClick={() => avatarRef.current?.click()}
                style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--red-500)', border: '2px solid var(--surface)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Upload style={{ width: 12, height: 12 }} />
              </button>
            </div>
            <input ref={avatarRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>{profile.name}</h2>
            <p className="muted" style={{ fontSize: 12.5 }}>{user?.role || 'Super Admin'}</p>
            <p className="faint" style={{ fontSize: 12, marginTop: 4 }}>{profile.email}</p>
            <div className="divider" />
            <div style={{ textAlign: 'left', fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', gap: 8 }}><Mail style={{ width: 14, height: 14, flex: 'none' }} />{profile.email}</div>
              <div style={{ display: 'flex', gap: 8 }}><User style={{ width: 14, height: 14, flex: 'none' }} />{user?.role || 'Super Admin'}</div>
              <div style={{ display: 'flex', gap: 8 }}><Clock3 style={{ width: 14, height: 14, flex: 'none' }} />Joined {user?.joinDate || '2020-01-15'}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="settings-tabs">
            <div className={`settings-tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>Edit Profile</div>
            <div className={`settings-tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>Change Password</div>
            <div className={`settings-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Login History</div>
          </div>

          {tab === 'profile' && (
            <div className="card card-pad">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="form-grid">
                  <div className="field">
                    <label>Full Name</label>
                    <input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Email Address</label>
                    <input className="input" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Phone Number</label>
                    <input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Role</label>
                    <input className="input" value={user?.role || 'Super Admin'} disabled style={{ opacity: 0.6 }} />
                  </div>
                </div>
                <div className="field">
                  <label>Bio</label>
                  <textarea className="input" rows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={saveProfile}><Save />Save Profile</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'password' && (
            <div className="card card-pad">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="field">
                  <label><Lock style={{ width: 13, height: 13, marginRight: 4, verticalAlign: -2 }} />Current Password</label>
                  <input className={`input ${pwErrors.current ? 'error' : ''}`} type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} placeholder="Enter your current password" />
                  {pwErrors.current && <div className="field-error">{pwErrors.current}</div>}
                </div>
                <div className="field">
                  <label>New Password</label>
                  <input className={`input ${pwErrors.newPass ? 'error' : ''}`} type="password" value={passwords.newPass} onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })} placeholder="Minimum 8 characters" />
                  {pwErrors.newPass && <div className="field-error">{pwErrors.newPass}</div>}
                </div>
                <div className="field">
                  <label>Confirm New Password</label>
                  <input className={`input ${pwErrors.confirm ? 'error' : ''}`} type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="Re-enter your new password" />
                  {pwErrors.confirm && <div className="field-error">{pwErrors.confirm}</div>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={changePassword}><Lock />Update Password</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div className="card">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr><th>Time</th><th>Device</th><th>Location</th><th>IP Address</th></tr>
                  </thead>
                  <tbody>
                    {loginHistory.map((l, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: i === 0 ? 700 : 400 }}>{l.time}{i === 0 && <span className="pill pill-active" style={{ marginLeft: 8, fontSize: 10 }}>Current</span>}</td>
                        <td>{l.device}</td>
                        <td>{l.location}</td>
                        <td className="mono faint">{l.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

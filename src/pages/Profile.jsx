import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../components/ui/PageHead.jsx';
import { Save, Mail, Lock, User } from '../components/ui/Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({ name: '', phone: '', bio: '' });
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setProfile({
      name: user?.name || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
    });
  }, [user]);

  const saveProfile = async () => {
    if (!profile.name.trim()) {
      setProfileError('Name is required.');
      return;
    }
    setSavingProfile(true);
    setProfileError('');
    try {
      await updateProfile({
        name: profile.name.trim(),
        phone: profile.phone.trim() || null,
        bio: profile.bio.trim() || null,
      });
      toast.success('Profile updated', 'Your server-backed profile has been saved.');
    } catch (error) {
      setProfileError(error.message || 'Unable to update your profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async () => {
    const errors = {};
    if (!passwords.current) errors.current = 'Current password is required.';
    if (!passwords.newPass || passwords.newPass.length < 8) errors.newPass = 'New password must be at least 8 characters.';
    if (passwords.newPass !== passwords.confirm) errors.confirm = 'Passwords do not match.';
    setPwErrors(errors);
    if (Object.keys(errors).length) return;

    setSavingPassword(true);
    try {
      await changePassword(passwords.current, passwords.newPass);
      toast.success('Password changed', 'All sessions were revoked. Sign in with your new password.');
      navigate('/login', { replace: true });
    } catch (error) {
      setPwErrors({ form: error.message || 'Unable to change your password.' });
      setSavingPassword(false);
    }
  };

  const initials = (user?.name || 'Admin').split(' ').map((name) => name[0]).join('').slice(0, 2).toUpperCase();
  const roleLabel = user?.roleLabel || user?.role || '';

  return (
    <div>
      <PageHead eyebrow="Account" title="My Profile" desc="Manage your server-backed account information and password." />
      <div className="two-col" style={{ alignItems: 'flex-start' }}>
        <div className="card card-pad" style={{ textAlign: 'center' }}>
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)', marginBottom: 16 }} />
          ) : (
            <div style={{ width: 96, height: 96, borderRadius: '50%', margin: '0 auto 16px', background: 'linear-gradient(145deg, var(--red-500), var(--ink-700))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-display)', border: '3px solid var(--border)' }}>{initials}</div>
          )}
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>{user?.name}</h2>
          <p className="muted" style={{ fontSize: 12.5 }}>{roleLabel}</p>
          <p className="faint" style={{ fontSize: 12, marginTop: 4 }}>{user?.email}</p>
          <div className="divider" />
          <div style={{ textAlign: 'left', fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', gap: 8 }}><Mail style={{ width: 14, height: 14, flex: 'none' }} />{user?.email}</div>
            <div style={{ display: 'flex', gap: 8 }}><User style={{ width: 14, height: 14, flex: 'none' }} />{roleLabel}</div>
          </div>
        </div>

        <div>
          <div className="settings-tabs">
            <div className={`settings-tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>Edit Profile</div>
            <div className={`settings-tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>Change Password</div>
          </div>

          {tab === 'profile' && (
            <div className="card card-pad">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="form-grid">
                  <div className="field">
                    <label>Full Name</label>
                    <input className="input" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} />
                  </div>
                  <div className="field">
                    <label>Email Address</label>
                    <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
                  </div>
                  <div className="field">
                    <label>Phone Number</label>
                    <input className="input" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} />
                  </div>
                  <div className="field">
                    <label>Role</label>
                    <input className="input" value={roleLabel} disabled style={{ opacity: 0.6 }} />
                  </div>
                </div>
                <div className="field">
                  <label>Bio</label>
                  <textarea className="input" rows={3} value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} />
                </div>
                {profileError && <div className="field-error">{profileError}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={saveProfile} disabled={savingProfile}><Save />{savingProfile ? 'Saving…' : 'Save Profile'}</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'password' && (
            <div className="card card-pad">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="field">
                  <label><Lock style={{ width: 13, height: 13, marginRight: 4, verticalAlign: -2 }} />Current Password</label>
                  <input className={`input ${pwErrors.current ? 'error' : ''}`} type="password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} autoComplete="current-password" />
                  {pwErrors.current && <div className="field-error">{pwErrors.current}</div>}
                </div>
                <div className="field">
                  <label>New Password</label>
                  <input className={`input ${pwErrors.newPass ? 'error' : ''}`} type="password" value={passwords.newPass} onChange={(event) => setPasswords({ ...passwords, newPass: event.target.value })} autoComplete="new-password" />
                  {pwErrors.newPass && <div className="field-error">{pwErrors.newPass}</div>}
                </div>
                <div className="field">
                  <label>Confirm New Password</label>
                  <input className={`input ${pwErrors.confirm ? 'error' : ''}`} type="password" value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} autoComplete="new-password" />
                  {pwErrors.confirm && <div className="field-error">{pwErrors.confirm}</div>}
                </div>
                {pwErrors.form && <div className="field-error">{pwErrors.form}</div>}
                <p className="muted" style={{ fontSize: 12.5 }}>Changing your password revokes all sessions and returns you to sign in.</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={submitPassword} disabled={savingPassword}><Lock />{savingPassword ? 'Updating…' : 'Update Password'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../components/ui/PageHead.jsx';
import { Save, Mail, Lock, User, Upload } from '../components/ui/Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { mediaApi } from '../api/media.js';

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({ name: '', phone: '', bio: '' });
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
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

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    // Show local preview instantly
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    try {
      const media = await mediaApi.upload(file, 'image');
      await updateProfile({ avatar: media.url });
      toast.success('Profile photo updated', 'Your new avatar is now live.');
    } catch (error) {
      setAvatarPreview(null); // revert preview on failure
      toast.error('Upload failed', error.message || 'Could not update your profile photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

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
          {/* Clickable avatar with edit overlay */}
          <div
            style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 16px', cursor: 'pointer' }}
            onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
            title="Change profile photo"
          >
            {avatarPreview || user?.avatar ? (
              <img
                src={avatarPreview || user.avatar}
                alt="Avatar"
                style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)', display: 'block' }}
              />
            ) : (
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--surface-2)', border: '3px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {/* Person silhouette */}
                <svg viewBox="0 0 96 96" width="96" height="96" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="48" cy="36" r="18" fill="var(--text-muted)" />
                  <path d="M12 88c0-19.882 16.118-36 36-36s36 16.118 36 36" fill="var(--text-muted)" />
                </svg>
              </div>
            )}
            {/* Hover overlay */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: uploadingAvatar ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              transition: 'background 0.18s',
              color: '#fff',
            }}
              className="avatar-edit-overlay"
            >
              {uploadingAvatar ? (
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>Uploading…</span>
              ) : (
                <>
                  {/* <Upload style={{ width: 16, height: 16 }} />
                  <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em' }}>CHANGE</span> */}
                </>
              )}
            </div>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
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

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth.js';
import { Lock } from '../components/ui/Icons.jsx';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const tokenPresent = Boolean(searchParams.get('token'));

  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword(searchParams.get('token'), password);
      setComplete(true);
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (requestError) {
      setError(requestError.message || 'This reset link could not be used.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-mark"><div className="mark">KN</div><h1>Choose a password</h1><div className="sub">Admin Portal</div></div>
        {!tokenPresent ? (
          <div style={{ textAlign: 'center' }}>
            <div className="field-error">This reset link is missing its token. Request a new link.</div>
            <Link className="btn btn-primary btn-block" to="/forgot-password" style={{ marginTop: 20 }}>Request New Link</Link>
          </div>
        ) : complete ? (
          <div style={{ textAlign: 'center' }}>
            <p className="muted">Your password has been reset. Redirecting to sign in…</p>
            <Link className="btn btn-primary btn-block" to="/login" style={{ marginTop: 20 }}>Sign In</Link>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
            <div className="field">
              <label><Lock style={{ width: 13, height: 13, marginRight: 5, verticalAlign: -2 }} />New Password</label>
              <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" autoFocus />
            </div>
            <div className="field">
              <label>Confirm New Password</label>
              <input className="input" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" />
            </div>
            {error && <div className="field-error">{error}</div>}
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>{loading ? 'Resetting…' : 'Reset Password'}</button>
            <Link to="/login" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>Back to Sign In</Link>
          </form>
        )}
      </div>
    </div>
  );
}

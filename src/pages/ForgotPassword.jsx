import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth.js';
import { Mail } from '../components/ui/Icons.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (requestError) {
      setError(requestError.message || 'Unable to submit the request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-mark"><div className="mark">KN</div><h1>Reset access</h1><div className="sub">Admin Portal</div></div>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <p className="muted" style={{ lineHeight: 1.6 }}>
              If an active account matches that email, reset instructions have been sent.
            </p>
            <Link className="btn btn-primary btn-block" to="/login" style={{ marginTop: 20 }}>Back to Sign In</Link>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>Enter your account email. For security, the response is the same whether or not an account exists.</p>
            <div className="field">
              <label><Mail style={{ width: 13, height: 13, marginRight: 5, verticalAlign: -2 }} />Email Address</label>
              <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" autoFocus />
            </div>
            {error && <div className="field-error">{error}</div>}
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send Reset Instructions'}</button>
            <Link to="/login" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>Back to Sign In</Link>
          </form>
        )}
      </div>
    </div>
  );
}

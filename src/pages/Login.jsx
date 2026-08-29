import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Mail, Lock, Eye } from '../components/ui/Icons.jsx';
import logoImg from '../Image/WhatsApp_Image_2026-08-24_at_2.52.11_PM-removebg-preview.png';

// Inline EyeOff icon (not yet in Icons.jsx)
function EyeOffIcon(props) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M17.9 17.9A10.5 10.5 0 0 1 12 19C5 19 1.5 12 1.5 12a18.6 18.6 0 0 1 5.1-6.1" />
      <path d="M10.6 5.1A10.5 10.5 0 0 1 12 5c7 0 10.5 7 10.5 7a18.5 18.5 0 0 1-2.2 3.4" />
      <path d="M14.1 14.1A3 3 0 1 1 9.9 9.9" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back', 'You have signed in successfully.');
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Decorative background text */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.04 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${i * 14}%`,
              left: 0,
              right: 0,
              fontSize: 11,
              fontFamily: 'Georgia, serif',
              color: '#fff',
              letterSpacing: '0.14em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            BREAKING NEWS · LATEST UPDATES · EXCLUSIVE REPORT · LIVE COVERAGE · SPECIAL EDITION · KANYAKUMARI NEWS ·&nbsp;
          </div>
        ))}
      </div>

      <div className="login-card">
        {/* Brand mark */}
        <div className="login-mark">
          <img src={logoImg} alt="Kanyakumari Today" className="login-logo" />
          <div className="sub">Admin Portal</div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.55 }}>
          Sign in to access the newsroom management system.
        </p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
          {/* Email */}
          <div className="field">
            <label>
              <Mail style={{ width: 13, height: 13, marginRight: 5, verticalAlign: -2 }} />
              Email Address
            </label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@kanyakumarinews.in"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="field">
            <label>
              <Lock style={{ width: 13, height: 13, marginRight: 5, verticalAlign: -2 }} />
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ paddingRight: 42 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-faint)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                {showPw
                  ? <EyeOffIcon style={{ width: 16, height: 16 }} />
                  : <Eye style={{ width: 16, height: 16 }} />
                }
              </button>
            </div>
          </div>

          <div className="flex-between" style={{ fontSize: 12.5, justifyContent: 'flex-end' }}>
            <Link to="/forgot-password" style={{ color: 'var(--red-500)', fontWeight: 600 }}>
              Forgot password?
            </Link>
          </div>

          {/* Error message */}
          {error && (
            <div className="field-error" style={{ marginTop: -4 }}>{error}</div>
          )}

          {/* Submit button */}
          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={loading}
            style={{ padding: '12px 16px', marginTop: 4, fontSize: 14 }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{
                  width: 16,
                  height: 16,
                  border: '2px solid rgba(255,255,255,0.35)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                  flex: 'none',
                }} />
                Signing in…
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

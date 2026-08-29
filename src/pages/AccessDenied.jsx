import { Link } from 'react-router-dom';
import { ShieldCheck } from '../components/ui/Icons.jsx';

export default function AccessDenied({ permission }) {
  return (
    <div className="card card-pad" style={{ maxWidth: 560, margin: '48px auto', textAlign: 'center' }}>
      <ShieldCheck style={{ width: 42, height: 42, color: 'var(--red-500)', marginBottom: 14 }} />
      <div className="eyebrow">403 — Access Denied</div>
      <h1 style={{ margin: '8px 0' }}>You do not have permission to view this page.</h1>
      <p className="muted">Your session is still active. Ask an administrator if you need additional access.</p>
      {permission && <p className="faint mono" style={{ marginTop: 8 }}>Required: {permission}</p>}
      <Link className="btn btn-primary" to="/" style={{ marginTop: 20 }}>Return to Dashboard</Link>
    </div>
  );
}

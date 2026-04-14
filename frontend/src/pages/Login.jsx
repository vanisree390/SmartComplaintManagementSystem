import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, DEPARTMENTS } from '../utils/constants';

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loginEmail =
        role === 'admin'
          ? `${department.toLowerCase()}@rgukt.ac.in`
          : role === 'superadmin'
          ? 'superadmin@rgukt.ac.in'
          : email;

      const { data } = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: loginEmail,
        password
      });

      localStorage.setItem('user', JSON.stringify(data));

      if (data.role === 'superadmin') navigate('/superadmin');
      else if (data.role === 'admin') navigate('/admin');
      else navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleCards = [
    {
      key: 'user',
      icon: '🎓',
      title: 'Student',
      desc: 'Submit and track your complaints',
      bg: '#eff6ff',
      border: '#bfdbfe',
      color: '#1e3a7a'
    },
    {
      key: 'admin',
      icon: '🏢',
      title: 'Department Admin',
      desc: 'Manage and resolve complaints',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      color: '#166534'
    },
    {
      key: 'superadmin',
      icon: '🔐',
      title: 'Super Admin',
      desc: 'Full system access and control',
      bg: '#fef2f2',
      border: '#fecaca',
      color: '#991b1b'
    },
  ];

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: 460 }}>

        {/* Header */}
        <div className="auth-header">
          <div className="logo-badge">
            <span className="logo-initials">RGUKT</span>
            <span className="logo-sep" />
            <span className="logo-text">RK Valley<br />Complaint Portal</span>
          </div>
          <h1>Welcome Back</h1>
          <p>Select your role to sign in</p>
        </div>

        <div className="auth-card">
          {error && <div className="alert alert-error">{error}</div>}

          {/* ── Step 1: Role selector ── */}
          {!role && (
            <div>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
                marginBottom: 14, textAlign: 'center'
              }}>
                Who are you?
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {roleCards.map(r => (
                  <button
                    key={r.key}
                    onClick={() => setRole(r.key)}
                    style={{
                      padding: '14px 18px',
                      border: '2px solid var(--border)',
                      borderRadius: 10, background: '#fff',
                      cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 14,
                      transition: 'all 0.15s', width: '100%'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = r.border;
                      e.currentTarget.style.background = r.bg;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = '#fff';
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: r.bg, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, flexShrink: 0
                    }}>
                      {r.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {r.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {r.desc}
                      </div>
                    </div>
                    <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 18 }}>›</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Student login ── */}
          {role === 'user' && (
            <form onSubmit={handleSubmit}>
              <button type="button" onClick={() => { setRole(''); setError(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--accent)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                ← Back
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', marginBottom: 20 }}>
                <span style={{ fontSize: 20 }}>🎓</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e3a7a' }}>Student Login</span>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required autoFocus
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: 12 }}
                disabled={loading}>
                {loading ? <span className="spinner" /> : 'Sign In'}
              </button>
            </form>
          )}

          {/* ── Step 2: Admin login ── */}
          {role === 'admin' && (
            <form onSubmit={handleSubmit}>
              <button type="button" onClick={() => { setRole(''); setDepartment(''); setError(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--accent)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                ← Back
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', marginBottom: 20 }}>
                <span style={{ fontSize: 20 }}>🏢</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>Department Admin Login</span>
              </div>

              <div className="form-group">
                <label>Select Your Department</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
                  {DEPARTMENTS.map(dept => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setDepartment(dept)}
                      style={{
                        padding: '10px 12px',
                        border: `2px solid ${department === dept ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 8,
                        background: department === dept ? '#eff6ff' : '#fff',
                        color: department === dept ? 'var(--accent)' : 'var(--text-primary)',
                        fontSize: 13, fontWeight: department === dept ? 600 : 400,
                        cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center'
                      }}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
                {department && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    Logging in as: <strong>{department.toLowerCase()}@rgukt.ac.in</strong>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: 12 }}
                disabled={loading || !department}>
                {loading ? <span className="spinner" /> : 'Sign In'}
              </button>
            </form>
          )}

          {/* ── Step 2: Super Admin login ── */}
          {role === 'superadmin' && (
            <form onSubmit={handleSubmit}>
              <button type="button" onClick={() => { setRole(''); setError(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--accent)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                ← Back
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', marginBottom: 20 }}>
                <span style={{ fontSize: 20 }}>🔐</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#991b1b' }}>Super Admin Login</span>
              </div>

              <div style={{
                padding: '10px 14px', background: '#fffbeb',
                borderRadius: 8, border: '1px solid #fde68a',
                fontSize: 12, color: '#92400e', marginBottom: 20
              }}>
                ⚠️ Logging in as: <strong>superadmin@rgukt.ac.in</strong>
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter super admin password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required autoFocus
                />
              </div>

              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: 12, background: '#dc2626' }}
                disabled={loading}>
                {loading ? <span className="spinner" /> : 'Access Portal'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        {!role && (
          <div className="auth-footer">
            Don't have an account? <Link to="/register">Register here</Link>
          </div>
        )}
      </div>
    </div>
  );
}
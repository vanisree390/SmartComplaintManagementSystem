import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Home() {
  const navigate = useNavigate();

  // ✅ SAFE USER READ
  let user = null;

  try {
    const storedUser = localStorage.getItem('user');

    if (storedUser && storedUser !== "undefined") {
      user = JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Invalid user in localStorage:", error);
    localStorage.removeItem('user'); // cleanup bad data
  }

  // ✅ REDIRECT IF LOGGED IN
  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="auth-page" style={{ flexDirection: 'column', textAlign: 'center' }}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 540, padding: '0 24px' }}>

        {/* HEADER */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14,
          padding: '14px 24px',
          marginBottom: 32
        }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#4f8ef7' }}>
            RGUKT
          </span>

          <span style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.15)' }} />

          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
            RK Valley<br />Complaint Portal
          </span>
        </div>

        {/* TITLE */}
        <h1 style={{
          fontSize: 40,
          fontWeight: 700,
          color: '#fff',
          marginBottom: 14
        }}>
          Smart Complaint<br />Management System
        </h1>

        {/* TEXT */}
        <p style={{
          fontSize: 16,
          color: 'rgba(255,255,255,0.55)',
          marginBottom: 40
        }}>
          AI-powered complaint routing to the right department.
          Track your complaints in real time.
        </p>

        {/* BUTTONS */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/login')}
          >
            Login
          </button>

          <button
            className="btn btn-outline"
            onClick={() => navigate('/register')}
          >
            Register
          </button>
        </div>

        {/* FEATURES */}
        <div style={{
          display: 'flex',
          gap: 20,
          justifyContent: 'center',
          marginTop: 40,
          flexWrap: 'wrap'
        }}>
          {['AI Routing', 'Real-time Tracking', 'Email Alerts', '7 Departments'].map(f => (
            <div key={f} style={{ fontSize: 13, color: '#aaa' }}>
              ✓ {f}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
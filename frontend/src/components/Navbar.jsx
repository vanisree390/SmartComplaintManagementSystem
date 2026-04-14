import { useNavigate, useLocation } from 'react-router-dom';

const NavItem = ({ icon, label, active, onClick }) => (
  <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
    {icon}
    <span>{label}</span>
  </button>
);

export default function Navbar({ activePage, onNavigate }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="college-abbr">RGUKT-RKV</div>
        <div className="college-full">Rajiv Gandhi University of Knowledge Technologies</div>
        <span className="portal-tag">Complaint Portal</span>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <div className="user-name">{user?.name || 'User'}</div>
          <div className="user-role">{user?.role === 'admin' ? `Admin · ${user?.department}` : 'Student'}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">Navigation</div>

        {user?.role === 'user' && (
          <>
            <NavItem
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>}
              label="Dashboard"
              active={activePage === 'dashboard'}
              onClick={() => onNavigate?.('dashboard')}
            />
            <NavItem
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>}
              label="New Complaint"
              active={activePage === 'submit'}
              onClick={() => onNavigate?.('submit')}
            />
            <NavItem
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>}
              label="My Complaints"
              active={activePage === 'complaints'}
              onClick={() => onNavigate?.('complaints')}
            />
          </>
        )}

        {user?.role === 'admin' && (
          <>
            <NavItem
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>}
              label="Overview"
              active={activePage === 'overview'}
              onClick={() => onNavigate?.('overview')}
            />
            <NavItem
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>}
              label="All Complaints"
              active={activePage === 'complaints'}
              onClick={() => onNavigate?.('complaints')}
            />
          </>
        )}
      </nav>

      <div className="sidebar-bottom">
        <button className="nav-item btn-danger" style={{ color: '#fca5a5' }} onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
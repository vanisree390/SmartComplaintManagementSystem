// ============================================================
// REPLACE: src/pages/AdminDashboard.jsx  (full file)
// ============================================================

import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, STATUS_COLORS, PRIORITY_COLORS } from '../utils/constants';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};
const authHeaders = () => {
  const u = getUser();
  return { headers: { Authorization: `Bearer ${u?.token}` } };
};
const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

const DEPT_COLORS = {
  IT: '#4f8ef7', HR: '#a855f7', Finance: '#f59e0b',
  Maintenance: '#ef4444', Administration: '#06b6d4',
  Academics: '#10b981', Hostel: '#f97316',
};

// ── Status Timeline (3-step) ──────────────────────────────────────────────────
const steps = ['pending', 'working', 'completed'];
const stepLabels = { pending: 'Submitted', working: 'In Progress', completed: 'Resolved' };
const stepColors = { pending: '#f59e0b', working: '#4f8ef7', completed: '#16a34a' };

function StatusTimeline({ statusHistory }) {
  const historyMap = {};
  statusHistory?.forEach(h => { historyMap[h.status] = h; });
  const last = [...(statusHistory || [])].sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))[0];
  const currentIdx = steps.indexOf(last?.status || 'pending');

  return (
    <div style={{
      marginTop: 12, padding: '14px 18px', background: '#f8fafc',
      borderRadius: 10, border: '1px solid #e2e8f0'
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        Status Timeline
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
        {steps.map((step, i) => {
          const done = i <= currentIdx;
          const h = historyMap[step];
          return (
            <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: done ? stepColors[step] : '#e2e8f4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: done ? '#fff' : '#94a3b8',
                  fontWeight: 700, marginBottom: 6,
                  border: `2px solid ${done ? stepColors[step] : '#e2e8f4'}`,
                  boxShadow: done ? `0 0 0 4px ${stepColors[step]}22` : 'none'
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: done ? stepColors[step] : '#94a3b8', textAlign: 'center', marginBottom: 2 }}>
                  {stepLabels[step]}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
                  {h ? new Date(h.changedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  flex: 1, height: 2, margin: '0 4px', marginBottom: 38,
                  background: i < currentIdx ? stepColors[steps[i + 1]] : '#e2e8f4', borderRadius: 2
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Complaint Card (Admin view) ───────────────────────────────────────────────
function AdminComplaintCard({ c, onUpdate, updating }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [status, setStatus] = useState(c.status);
  const [remark, setRemark] = useState(c.adminRemark || '');

  const isStudentEscalated = c.escalation?.studentEscalated;
  const isWarnedBySuperAdmin = c.escalation?.warnedBySuperAdmin;

  return (
    <div style={{
      background: '#fff',
      border: isStudentEscalated
        ? '2px solid #dc2626'
        : isWarnedBySuperAdmin
          ? '2px solid #f97316'
          : '1px solid #e2e8f0',
      borderRadius: 14, marginBottom: 16, overflow: 'hidden',
      boxShadow: isStudentEscalated
        ? '0 4px 20px rgba(220,38,38,0.15)'
        : isWarnedBySuperAdmin
          ? '0 4px 20px rgba(249,115,22,0.12)'
          : '0 1px 6px rgba(0,0,0,0.06)'
    }}>
      {/* Top colour strip */}
      <div style={{
        height: 4,
        background: c.status === 'completed' ? '#16a34a' : c.status === 'working' ? '#4f8ef7' : '#f59e0b'
      }} />

      {/* 🚨 Student escalated banner */}
      {isStudentEscalated && (
        <div style={{
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10
        }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
              URGENT — Student has escalated this to Super Admin
            </div>
            <div style={{ color: '#fecaca', fontSize: 12, marginTop: 2 }}>
              "{c.escalation.studentEscalateMessage}"
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ Super Admin warning banner */}
      {isWarnedBySuperAdmin && (
        <div style={{
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          padding: '10px 20px', display: 'flex', alignItems: 'flex-start', gap: 10
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
              Super Admin Warning — Please resolve this urgently
            </div>
            <div style={{ color: '#fed7aa', fontSize: 12, marginTop: 2 }}>
              {c.escalation.warnMessage}
            </div>
            <div style={{ color: '#fdba74', fontSize: 11, marginTop: 4 }}>
              Warned on: {new Date(c.escalation.warnedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '16px 20px' }}>
        {/* Badges + date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="dept-badge">{c.department}</span>
            <span className="badge" style={{
              background: STATUS_COLORS?.[c.status]?.bg || '#f1f5f9',
              color: STATUS_COLORS?.[c.status]?.text || '#475569',
              border: `1px solid ${STATUS_COLORS?.[c.status]?.border || '#e2e8f0'}`
            }}>{c.status}</span>
            <span className="badge" style={{
              background: c.priority === 'high' ? '#fef2f2' : c.priority === 'medium' ? '#fffbeb' : '#f0fdf4',
              color: c.priority === 'high' ? '#dc2626' : c.priority === 'medium' ? '#d97706' : '#16a34a',
              border: `1px solid ${c.priority === 'high' ? '#fecaca' : c.priority === 'medium' ? '#fde68a' : '#bbf7d0'}`
            }}>{c.priority}</span>
          </div>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Complaint text */}
        <p style={{
          fontSize: 14, color: '#1e293b', lineHeight: 1.65,
          margin: '0 0 12px', padding: '10px 14px',
          background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0'
        }}>
          {c.text}
        </p>

        {/* Student info + Department routing row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', background: '#f8fafc',
          borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 14,
          flexWrap: 'wrap'
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f8ef7, #1e3a7a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0
          }}>
            {getInitials(c.user?.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{c.user?.name}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{c.user?.email}</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 8,
            background: '#f0f9ff', border: '1px solid #bae6fd'
          }}>
            <span style={{ fontSize: 11, color: '#0369a1', fontWeight: 600 }}>Dept:</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#075985' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: DEPT_COLORS[c.department] || '#94a3b8', display: 'inline-block' }} />
              {c.department}
            </span>
          </div>
        </div>

        {/* Track Complaint toggle button */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowTimeline(v => !v)}
            style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              background: showTimeline ? '#eff6ff' : '#fff',
              color: showTimeline ? '#1d4ed8' : '#475569',
              border: `1px solid ${showTimeline ? '#bfdbfe' : '#e2e8f0'}`,
              transition: 'all 0.15s'
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            {showTimeline ? 'Hide Timeline' : 'Track Complaint'}
          </button>
        </div>

        {/* Timeline (expandable) */}
        {showTimeline && c.statusHistory?.length > 0 && (
          <StatusTimeline statusHistory={c.statusHistory} />
        )}

        {/* Admin update panel */}
        <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Update Complaint</div>
          <input
            placeholder="Add a remark..."
            value={remark}
            onChange={e => setRemark(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, background: '#fff', boxSizing: 'border-box', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              style={{ flex: 1, padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, background: '#fff', cursor: 'pointer' }}
            >
              <option value="pending">Pending</option>
              <option value="working">Working</option>
              <option value="completed">Completed</option>
            </select>
            <button
              className="btn btn-primary"
              style={{ padding: '9px 24px', flexShrink: 0 }}
              onClick={() => onUpdate(c._id, status, remark)}
              disabled={updating === c._id}
            >
              {updating === c._id ? 'Saving...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main AdminDashboard ───────────────────────────────────────────────────────
export default function AdminDashboard() {
  const user = getUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [complaints, setComplaints] = useState([]);
  const [resolved, setResolved] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchComplaints();
  }, []);

  useEffect(() => {
    if (activeTab === 'resolved') fetchResolved();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/complaints/stats`, authHeaders());
      setStats(data);
    } catch (err) { console.error(err); }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/complaints?archived=false`, authHeaders());
      // Sort: student-escalated first, then warned, then by date
      const sorted = [...data].sort((a, b) => {
        if (a.escalation?.studentEscalated && !b.escalation?.studentEscalated) return -1;
        if (!a.escalation?.studentEscalated && b.escalation?.studentEscalated) return 1;
        if (a.escalation?.warnedBySuperAdmin && !b.escalation?.warnedBySuperAdmin) return -1;
        if (!a.escalation?.warnedBySuperAdmin && b.escalation?.warnedBySuperAdmin) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setComplaints(sorted);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchResolved = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/complaints?archived=true`, authHeaders());
      setResolved(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchAll = async () => {
    await Promise.all([fetchStats(), fetchComplaints()]);
  };

  const handleUpdate = async (id, status, remark) => {
    setUpdating(id);
    try {
      await axios.put(
        `${API_BASE_URL}/complaints/${id}`,
        { status, adminRemark: remark },
        authHeaders()
      );
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally { setUpdating(null); }
  };

  const handleDeleteResolved = async (id) => {
    if (!window.confirm('Delete this resolved complaint? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_BASE_URL}/complaints/${id}`, authHeaders());
      setResolved(prev => prev.filter(c => c._id !== id));
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const filtered = complaints.filter(c => {
    const matchSearch =
      c.text?.toLowerCase().includes(search.toLowerCase()) ||
      c.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.user?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || c.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const pieData = stats ? [
    { name: 'Pending',   value: stats.pending,   color: '#f59e0b' },
    { name: 'Working',   value: stats.working,   color: '#4f8ef7' },
    { name: 'Completed', value: stats.completed, color: '#16a34a' },
  ] : [];

  const barData = stats?.byDepartment?.map(d => ({
    name: d._id, count: d.count, fill: DEPT_COLORS[d._id] || '#4f8ef7'
  })) || [];

  const logout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const urgentCount = complaints.filter(
    c => c.escalation?.studentEscalated || c.escalation?.warnedBySuperAdmin
  ).length;

  const navItems = [
    {
      key: 'overview', label: 'Overview',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" /></svg>
    },
    {
      key: 'complaints', label: 'All Complaints',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
      badge: complaints.length
    },
    {
      key: 'resolved', label: 'Resolved Complaints',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
      badge: stats?.completed || 0
    },
  ];

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="college-abbr">RGUKT-RKV</div>
          <div className="college-full">Rajiv Gandhi University of Knowledge Technologies</div>
          <span className="portal-tag">Complaint Portal</span>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-avatar">{getInitials(user?.name)}</div>
          <div className="sidebar-user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">Admin · {user?.department}</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-label">Navigation</div>
          {navItems.map(item => (
            <button
              key={item.key}
              className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              {item.icon}
              {item.label}
              {item.badge > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: activeTab === item.key ? 'rgba(255,255,255,0.3)' : 'var(--accent)',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                  padding: '1px 7px', borderRadius: 99
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          {/* Urgent alert nav item */}
          {urgentCount > 0 && (
            <button
              className={`nav-item`}
              onClick={() => setActiveTab('complaints')}
              style={{ color: '#dc2626' }}
            >
              <span style={{ fontSize: 16 }}>🚨</span>
              Urgent ({urgentCount})
              <span style={{
                marginLeft: 'auto', background: '#dc2626', color: '#fff',
                fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99
              }}>{urgentCount}</span>
            </button>
          )}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={logout} style={{ color: '#fca5a5' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-content">
        <div className="top-bar">
          <div>
            <div className="top-bar-title">
              {activeTab === 'overview' ? 'Dashboard Overview' :
               activeTab === 'complaints' ? 'All Complaints' : 'Resolved Complaints'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <span style={{ background: '#eff6ff', color: '#1e3a7a', fontSize: 12, fontWeight: 600, padding: '4px 14px', borderRadius: 99, border: '1px solid #bfdbfe' }}>
            {user?.department} Dept
          </span>
        </div>

        <div className="page-content">
          {loading && activeTab !== 'resolved' ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>Loading...</div>

          ) : activeTab === 'overview' ? (
            <>
              {/* Urgent alert banner on overview */}
              {urgentCount > 0 && (
                <div
                  onClick={() => setActiveTab('complaints')}
                  style={{
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    borderRadius: 12, padding: '14px 20px', marginBottom: 20,
                    display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(220,38,38,0.25)'
                  }}
                >
                  <span style={{ fontSize: 28 }}>🚨</span>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
                      {urgentCount} complaint{urgentCount > 1 ? 's' : ''} need urgent attention!
                    </div>
                    <div style={{ color: '#fecaca', fontSize: 13 }}>
                      Click to view — escalated or warned by Super Admin
                    </div>
                  </div>
                  <span style={{ marginLeft: 'auto', color: '#fecaca', fontSize: 20 }}>→</span>
                </div>
              )}

              {/* Stats */}
              <div className="stats-grid">
                <div className="stat-card total">
                  <div className="stat-label">Total</div>
                  <div className="stat-value">{stats?.total || 0}</div>
                </div>
                <div className="stat-card pending">
                  <div className="stat-label">Pending</div>
                  <div className="stat-value">{stats?.pending || 0}</div>
                </div>
                <div className="stat-card working">
                  <div className="stat-label">Working</div>
                  <div className="stat-value">{stats?.working || 0}</div>
                </div>
                <div className="stat-card completed">
                  <div className="stat-label">Completed</div>
                  <div className="stat-value">{stats?.completed || 0}</div>
                </div>
                {stats?.avgRating && (
                  <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div className="stat-label">Avg Rating</div>
                    <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.avgRating} ★</div>
                  </div>
                )}
              </div>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
                <div className="card">
                  <div className="card-title" style={{ marginBottom: 16 }}>Status Breakdown</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="card">
                  <div className="card-title" style={{ marginBottom: 16 }}>Complaints by Department</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Active Complaints */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 16 }}>Recent Active Complaints</div>
                {complaints.slice(0, 5).map(c => (
                  <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.text}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.user?.name} · {c.department}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                      {c.escalation?.studentEscalated && <span title="Student escalated" style={{ fontSize: 14 }}>🚨</span>}
                      {c.escalation?.warnedBySuperAdmin && <span title="Super Admin warned" style={{ fontSize: 14 }}>⚠️</span>}
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: STATUS_COLORS?.[c.status]?.bg, color: STATUS_COLORS?.[c.status]?.text, border: `1px solid ${STATUS_COLORS?.[c.status]?.border}` }}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
                {complaints.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>No active complaints</div>
                )}
              </div>
            </>

          ) : activeTab === 'complaints' ? (
            <>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-muted)' }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
                  </svg>
                  <input
                    style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', boxSizing: 'border-box', outline: 'none' }}
                    placeholder="Search by name, email or complaint..."
                    value={search} onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)' }}
                  value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="working">Working</option>
                </select>
                <select style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)' }}
                  value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Showing {filtered.length} of {complaints.length} complaints
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>No complaints found</div>
              ) : (
                filtered.map(c => (
                  <AdminComplaintCard
                    key={c._id}
                    c={c}
                    onUpdate={handleUpdate}
                    updating={updating}
                  />
                ))
              )}
            </>

          ) : activeTab === 'resolved' ? (
            <>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>Loading...</div>
              ) : resolved.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>No resolved complaints yet</div>
                  <div style={{ fontSize: 13 }}>Complaints marked as completed will appear here.</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: '#166534', marginBottom: 16, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                    ✅ {resolved.length} complaint{resolved.length > 1 ? 's' : ''} resolved
                  </div>
                  {resolved.map(c => (
                    <div key={c._id} style={{ background: 'var(--surface)', border: '1px solid #bbf7d0', borderRadius: 12, marginBottom: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                      <div style={{ height: 4, background: '#16a34a' }} />
                      <div style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <span className="dept-badge">{c.department}</span>
                            <span className="badge" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>completed</span>
                            <span className="badge" style={{
                              background: c.priority === 'high' ? '#fef2f2' : c.priority === 'medium' ? '#fffbeb' : '#f0fdf4',
                              color: c.priority === 'high' ? '#dc2626' : c.priority === 'medium' ? '#d97706' : '#16a34a',
                              border: `1px solid ${c.priority === 'high' ? '#fecaca' : c.priority === 'medium' ? '#fde68a' : '#bbf7d0'}`
                            }}>{c.priority}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <button
                              onClick={() => handleDeleteResolved(c._id)}
                              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                            >
                              🗑 Delete
                            </button>
                          </div>
                        </div>

                        {/* Student info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--navy-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {getInitials(c.user?.name)}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.user?.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.user?.email}</div>
                          </div>
                        </div>

                        <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, margin: '0 0 10px', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                          {c.text}
                        </p>
                        {c.adminRemark && (
                          <div style={{ fontSize: 13, color: '#166534', padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', display: 'flex', gap: 8 }}>
                            <span style={{ fontWeight: 700, flexShrink: 0 }}>Admin note:</span>
                            <span>{c.adminRemark}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
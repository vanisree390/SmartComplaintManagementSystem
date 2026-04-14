// ============================================================
// REPLACE: src/pages/SuperAdminDashboard.jsx  (full file)
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
const getInitials = (name) =>
  name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

const DEPT_COLORS = {
  IT: '#4f8ef7', HR: '#a855f7', Finance: '#f59e0b',
  Maintenance: '#ef4444', Administration: '#06b6d4',
  Academics: '#10b981', Hostel: '#f97316',
};

const steps = ['pending', 'working', 'completed'];
const stepLabels = { pending: 'Submitted', working: 'In Progress', completed: 'Resolved' };
const stepColors = { pending: '#f59e0b', working: '#4f8ef7', completed: '#16a34a' };

// ── Status Timeline ────────────────────────────────────────────────────────────
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

// ── Warn Modal ─────────────────────────────────────────────────────────────────
function WarnModal({ complaint, onClose, onWarned }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const user = getUser();

  const handleWarn = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/complaints/${complaint._id}/warn`,
        { warnMessage: message },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      onWarned();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send warning');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28, width: '100%',
        maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: '#fef2f2',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
          }}>⚠️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Warn Department Admin</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {complaint.department} Department · {complaint.user?.name}
            </div>
          </div>
        </div>

        {/* Complaint preview */}
        <div style={{
          margin: '16px 0', padding: '10px 14px', background: '#f8fafc',
          borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#475569', lineHeight: 1.6
        }}>
          "{complaint.text}"
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
            Urgency Description
          </label>
          <textarea
            rows={4}
            placeholder="Describe how urgent this is and what action the department admin should take..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', border: '1.5px solid #fca5a5',
              borderRadius: 8, fontSize: 13, lineHeight: 1.6, resize: 'vertical',
              fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
              background: '#fffbfb'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 20px', border: '1px solid #e2e8f0', borderRadius: 8,
              background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleWarn}
            disabled={!message.trim() || loading}
            style={{
              padding: '9px 22px', border: 'none', borderRadius: 8,
              background: message.trim() ? '#dc2626' : '#e2e8f0',
              color: message.trim() ? '#fff' : '#94a3b8',
              fontSize: 13, fontWeight: 700, cursor: message.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            {loading ? 'Sending...' : '⚠️ Send Warning'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Complaint Card (SuperAdmin view) ──────────────────────────────────────────
function SuperComplaintCard({ c, onRefresh }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const isWarned = c.escalation?.warnedBySuperAdmin;
  const isStudentEscalated = c.escalation?.studentEscalated;

  return (
    <div style={{
      background: '#fff',
      border: isStudentEscalated
        ? '2px solid #dc2626'
        : isWarned
          ? '2px solid #f97316'
          : '1px solid #e2e8f0',
      borderRadius: 14, marginBottom: 16, overflow: 'hidden',
      boxShadow: isStudentEscalated
        ? '0 4px 20px rgba(220,38,38,0.15)'
        : isWarned
          ? '0 4px 20px rgba(249,115,22,0.12)'
          : '0 1px 6px rgba(0,0,0,0.06)'
    }}>
      {/* Top colour strip */}
      <div style={{
        height: 4,
        background:
          c.status === 'completed' ? '#16a34a' :
          c.status === 'working' ? '#4f8ef7' : '#f59e0b'
      }} />

      {/* URGENT banner if student escalated */}
      {isStudentEscalated && (
        <div style={{
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          padding: '8px 20px',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <span style={{ fontSize: 18 }}>🚨</span>
          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
              STUDENT ESCALATED — URGENT ATTENTION NEEDED
            </div>
            <div style={{ color: '#fecaca', fontSize: 12 }}>
              "{c.escalation.studentEscalateMessage}"
            </div>
          </div>
        </div>
      )}

      {/* Warned banner */}
      {isWarned && !isStudentEscalated && (
        <div style={{
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          padding: '6px 20px',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
            Warning sent to {c.department} Admin
          </span>
        </div>
      )}

      <div style={{ padding: '16px 20px' }}>
        {/* Badges + date row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8
        }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {/* Department badge */}
            <span style={{
              padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe'
            }}>
              {c.department}
            </span>
            {/* Status badge */}
            <span style={{
              padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              background: STATUS_COLORS?.[c.status]?.bg || '#f1f5f9',
              color: STATUS_COLORS?.[c.status]?.text || '#475569',
              border: `1px solid ${STATUS_COLORS?.[c.status]?.border || '#e2e8f0'}`
            }}>
              {c.status}
            </span>
            {/* Priority badge */}
            <span style={{
              padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              background: c.priority === 'high' ? '#fef2f2' : c.priority === 'medium' ? '#fffbeb' : '#f0fdf4',
              color: c.priority === 'high' ? '#dc2626' : c.priority === 'medium' ? '#d97706' : '#16a34a',
              border: `1px solid ${c.priority === 'high' ? '#fecaca' : c.priority === 'medium' ? '#fde68a' : '#bbf7d0'}`
            }}>
              {c.priority}
            </span>
          </div>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            {new Date(c.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
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

        {/* Student + Department info row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', background: '#f8fafc',
          borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12,
          flexWrap: 'wrap'
        }}>
          {/* Avatar */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f8ef7, #1e3a7a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0
          }}>
            {getInitials(c.user?.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
              {c.user?.name}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {c.user?.email}
            </div>
          </div>
          {/* Department destination */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 8,
            background: '#f0f9ff', border: '1px solid #bae6fd'
          }}>
            <span style={{ fontSize: 11, color: '#0369a1', fontWeight: 600 }}>→ Sent to:</span>
            <span style={{
              fontSize: 12, fontWeight: 700, color: '#075985',
              display: 'flex', alignItems: 'center', gap: 4
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: DEPT_COLORS[c.department] || '#94a3b8',
                display: 'inline-block'
              }} />
              {c.department} Dept.
            </span>
          </div>
        </div>

        {/* Warn message if already warned */}
        {isWarned && (
          <div style={{
            padding: '10px 14px', background: '#fff7ed',
            border: '1px solid #fed7aa', borderRadius: 8, marginBottom: 12,
            fontSize: 13, color: '#9a3412'
          }}>
            <strong>⚠️ Warning sent:</strong> {c.escalation.warnMessage}
            <span style={{ float: 'right', fontSize: 11, color: '#c2410c' }}>
              {new Date(c.escalation.warnedAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
              })}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Track Complaint */}
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
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {showTimeline ? 'Hide Timeline' : 'Track Complaint'}
          </button>

          {/* Warn button */}
          {c.status !== 'completed' && (
            <button
              onClick={() => setShowWarnModal(true)}
              style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                background: isWarned ? '#fef2f2' : '#fff',
                color: isWarned ? '#dc2626' : '#9a3412',
                border: `1px solid ${isWarned ? '#fecaca' : '#fed7aa'}`,
                transition: 'all 0.15s'
              }}
            >
              <span style={{ fontSize: 15 }}>⚠️</span>
              {isWarned ? 'Re-Warn Admin' : 'Warn Dept. Admin'}
            </button>
          )}
        </div>

        {/* Timeline (expandable) */}
        {showTimeline && c.statusHistory?.length > 0 && (
          <StatusTimeline statusHistory={c.statusHistory} />
        )}
      </div>

      {/* Warn Modal */}
      {showWarnModal && (
        <WarnModal
          complaint={c}
          onClose={() => setShowWarnModal(false)}
          onWarned={onRefresh}
        />
      )}
    </div>
  );
}

// ── Main SuperAdmin Dashboard ──────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const user = getUser();
  const token = user?.token;
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const [activeTab, setActiveTab] = useState('overview');
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [escalatedOnly, setEscalatedOnly] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/complaints`, authHeaders),
        axios.get(`${API_BASE_URL}/complaints/stats`, authHeaders)
      ]);
      setComplaints(cRes.data);
      setStats(sRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sort: student-escalated first, then warned, then by date
  const sorted = [...complaints].sort((a, b) => {
    if (a.escalation?.studentEscalated && !b.escalation?.studentEscalated) return -1;
    if (!a.escalation?.studentEscalated && b.escalation?.studentEscalated) return 1;
    if (a.escalation?.warnedBySuperAdmin && !b.escalation?.warnedBySuperAdmin) return -1;
    if (!a.escalation?.warnedBySuperAdmin && b.escalation?.warnedBySuperAdmin) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const filtered = sorted.filter(c => {
    const matchSearch =
      c.text?.toLowerCase().includes(search.toLowerCase()) ||
      c.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.user?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchDept = deptFilter === 'all' || c.department === deptFilter;
    const matchEscalated = !escalatedOnly || c.escalation?.studentEscalated;
    return matchSearch && matchStatus && matchDept && matchEscalated;
  });

  const escalatedCount = complaints.filter(c => c.escalation?.studentEscalated).length;

  const pieData = stats ? [
    { name: 'Pending',   value: stats.pending,   color: '#f59e0b' },
    { name: 'Working',   value: stats.working,   color: '#4f8ef7' },
    { name: 'Completed', value: stats.completed, color: '#16a34a' }
  ] : [];

  const barData = stats?.byDepartment?.map(d => ({
    name: d._id, count: d.count, fill: DEPT_COLORS[d._id] || '#4f8ef7'
  })) || [];

  const logout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="college-abbr">RGUKT-RKV</div>
          <div className="college-full">Rajiv Gandhi University of Knowledge Technologies</div>
          <span className="portal-tag">Super Admin</span>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{getInitials(user?.name)}</div>
          <div className="sidebar-user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">Super Admin</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Navigation</div>

          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Overview
          </button>

          <button
            className={`nav-item ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => { setActiveTab('complaints'); setEscalatedOnly(false); }}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            All Complaints
            {complaints.length > 0 && (
              <span style={{
                marginLeft: 'auto', background: 'var(--accent)', color: '#fff',
                fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99
              }}>{complaints.length}</span>
            )}
          </button>

          {/* Escalated Complaints (urgent) */}
          {escalatedCount > 0 && (
            <button
              className={`nav-item ${activeTab === 'complaints' && escalatedOnly ? 'active' : ''}`}
              onClick={() => { setActiveTab('complaints'); setEscalatedOnly(true); }}
              style={{ color: '#dc2626' }}
            >
              <span style={{ fontSize: 16 }}>🚨</span>
              Escalated
              <span style={{
                marginLeft: 'auto', background: '#dc2626', color: '#fff',
                fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99
              }}>{escalatedCount}</span>
            </button>
          )}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item" onClick={logout} style={{ color: '#fca5a5' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
              {activeTab === 'overview'
                ? 'System Overview'
                : escalatedOnly
                  ? '🚨 Escalated Complaints'
                  : 'All Complaints'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </div>
          </div>
          <span style={{
            background: '#fef2f2', color: '#991b1b', fontSize: 12,
            fontWeight: 600, padding: '4px 14px', borderRadius: 99,
            border: '1px solid #fecaca'
          }}>
            Super Admin
          </span>
        </div>

        <div className="page-content">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>
              Loading...
            </div>
          ) : activeTab === 'overview' ? (
            <>
              {/* Escalated alert banner */}
              {escalatedCount > 0 && (
                <div
                  onClick={() => { setActiveTab('complaints'); setEscalatedOnly(true); }}
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
                      {escalatedCount} complaint{escalatedCount > 1 ? 's' : ''} need urgent attention!
                    </div>
                    <div style={{ color: '#fecaca', fontSize: 13 }}>
                      Students have escalated these — click to review
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
                    <div className="stat-value" style={{ color: '#f59e0b' }}>
                      {stats.avgRating} ★
                    </div>
                  </div>
                )}
              </div>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <div className="card">
                  <div className="card-title" style={{ marginBottom: 16 }}>Status Breakdown</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="card">
                  <div className="card-title" style={{ marginBottom: 16 }}>Complaints by Department</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} margin={{ left: -20 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department table */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 16 }}>Department Summary</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Department</th>
                      <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Complaints</th>
                    </tr>
                  </thead>
                  <tbody>
                    {barData.map((d, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '11px 12px' }}>
                          <span style={{
                            display: 'inline-block', width: 10, height: 10,
                            borderRadius: '50%', background: d.fill, marginRight: 10
                          }} />
                          {d.name}
                        </td>
                        <td style={{ textAlign: 'center', padding: '11px 12px', fontWeight: 600 }}>
                          {d.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>

          ) : (
            /* ── Complaints Tab ── */
            <>
              <div className="filter-bar">
                <div className="search-wrap" style={{ flex: 1 }}>
                  <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
                  </svg>
                  <input
                    className="search-input"
                    placeholder="Search by name, email or complaint..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="working">Working</option>
                  <option value="completed">Completed</option>
                </select>
                <select className="filter-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                  <option value="all">All Departments</option>
                  {['IT','HR','Finance','Maintenance','Administration','Academics','Hostel'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {escalatedCount > 0 && (
                  <button
                    onClick={() => setEscalatedOnly(v => !v)}
                    style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer',
                      background: escalatedOnly ? '#dc2626' : '#fef2f2',
                      color: escalatedOnly ? '#fff' : '#dc2626',
                      border: '1px solid #fecaca'
                    }}
                  >
                    🚨 {escalatedOnly ? 'Show All' : `Escalated (${escalatedCount})`}
                  </button>
                )}
              </div>

              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Showing {filtered.length} of {complaints.length} complaints
                {escalatedOnly && (
                  <span style={{
                    marginLeft: 8, padding: '2px 10px', background: '#fef2f2',
                    color: '#dc2626', borderRadius: 99, fontSize: 12, fontWeight: 600,
                    border: '1px solid #fecaca'
                  }}>
                    🚨 Escalated only
                  </span>
                )}
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
                  No complaints found
                </div>
              ) : (
                filtered.map(c => (
                  <SuperComplaintCard key={c._id} c={c} onRefresh={fetchAll} />
                ))
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
// ============================================================
// REPLACE: src/pages/UserDashboard.jsx  (full file)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL, STATUS_COLORS, PRIORITY_COLORS, DEPT_COLORS } from '../utils/constants';

const getInitials = (name) =>
  name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};
const authHeaders = () => {
  const u = getUser();
  return { headers: { Authorization: `Bearer ${u?.token}` } };
};

// ── Keyword-based department detection (mirrors backend fallback) ──────────────
const DEPT_RULES = [
  { dept: 'IT',           keywords: ['computer','laptop','printer','lab','internet','wifi','network','software','hardware','system','server','website','portal','login','password','email','projector','screen','monitor','keyboard','mouse','usb','device','cable','router','browser','app','application','database','backup','virus','data','drive','storage'] },
  { dept: 'HR',           keywords: ['salary','leave','attendance','internship','certificate','bonafide','transfer','promotion','hr','human resource','payroll','offer letter','joining','resignation','noc','id card','employee','staff','faculty','appointment','contract','stipend'] },
  { dept: 'Hostel',       keywords: ['hostel','room','mess','food','warden','dormitory','bed','mattress','bathroom','toilet','wash','laundry','dining','canteen','kitchen','roommate','accommodation','allotment','curfew','gate','hostel fee'] },
  { dept: 'Academics',    keywords: ['exam','result','marks','grade','timetable','schedule','class','lecture','professor','teacher','course','subject','syllabus','assignment','project','thesis','attendance','semester','hall ticket','admit card','transcript','marksheet','degree'] },
  { dept: 'Maintenance',  keywords: ['electricity','power','light','fan','ac','air condition','water','pipe','leak','repair','broken','damage','wall','roof','floor','door','window','bench','chair','table','furniture','building','road','ground','cleaning','dustbin'] },
  { dept: 'Finance',      keywords: ['fee','fees','payment','refund','scholarship','fine','challan','receipt','invoice','account','bank','transaction','reimbursement','allowance','tuition','exam fee','dues'] },
];
const detectDeptLocally = (text) => {
  const lower = text.toLowerCase();
  for (const rule of DEPT_RULES) {
    if (rule.keywords.some(k => lower.includes(k))) return rule.dept;
  }
  return null;
};

const DEPT_STYLE_COLORS = {
  IT: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', dot: '#3b82f6' },
  HR: { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff', dot: '#a855f7' },
  Hostel: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', dot: '#f97316' },
  Academics: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', dot: '#22c55e' },
  Maintenance: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', dot: '#ef4444' },
  Finance: { bg: '#fffbeb', text: '#92400e', border: '#fde68a', dot: '#f59e0b' },
  Administration: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', dot: '#94a3b8' },
};

// ── Status Timeline (3-step) ──────────────────────────────────────────────────
const steps = ['pending', 'working', 'completed'];
const labels = { pending: 'Submitted', working: 'In Progress', completed: 'Resolved' };
const colors = { pending: '#f59e0b', working: '#4f8ef7', completed: '#16a34a' };

const StatusTimeline = ({ statusHistory }) => {
  const historyMap = {};
  statusHistory?.forEach(h => { historyMap[h.status] = h; });
  const last = [...(statusHistory || [])].sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))[0];
  const currentIdx = steps.indexOf(last?.status || 'pending');

  return (
    <div style={{ margin: '10px 0', padding: '16px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid var(--border)', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Status Timeline</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
        {steps.map((step, i) => {
          const done = i <= currentIdx;
          const h = historyMap[step];
          return (
            <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: done ? colors[step] : '#e2e8f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: done ? '#fff' : '#94a3b8', fontWeight: 700, marginBottom: 8, border: `2px solid ${done ? colors[step] : '#e2e8f4'}`, boxShadow: done ? `0 0 0 4px ${colors[step]}22` : 'none' }}>
                  {done ? '✓' : i + 1}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: done ? colors[step] : '#94a3b8', textAlign: 'center', marginBottom: 2 }}>{labels[step]}</div>
                {h ? (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>{new Date(h.changedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                ) : (
                  <div style={{ fontSize: 10, color: '#cbd5e1', textAlign: 'center' }}>—</div>
                )}
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 2, margin: '0 6px', marginBottom: 40, background: i < currentIdx ? colors[steps[i + 1]] : '#e2e8f4', borderRadius: 2 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Simplified 2-step timeline — Resolved Complaints
const ResolvedTimeline = ({ statusHistory }) => {
  const submittedEntry = statusHistory?.find(h => h.status === 'pending');
  const completedEntry = statusHistory?.find(h => h.status === 'completed');
  const resolvedSteps = [
    { key: 'submitted', label: 'Submitted', color: '#f59e0b', entry: submittedEntry },
    { key: 'completed', label: 'Completed', color: '#16a34a', entry: completedEntry },
  ];
  return (
    <div style={{ margin: '10px 0', padding: '16px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid var(--border)', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Status Timeline</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
        {resolvedSteps.map((step, i) => (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < resolvedSteps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#fff', fontWeight: 700, marginBottom: 8, border: `2px solid ${step.color}`, boxShadow: `0 0 0 4px ${step.color}22` }}>✓</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: step.color, textAlign: 'center', marginBottom: 2 }}>{step.label}</div>
              {step.entry ? (
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>{new Date(step.entry.changedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
              ) : (
                <div style={{ fontSize: 10, color: '#cbd5e1', textAlign: 'center' }}>—</div>
              )}
            </div>
            {i < resolvedSteps.length - 1 && (
              <div style={{ flex: 1, height: 2, margin: '0 6px', marginBottom: 40, background: '#16a34a', borderRadius: 2 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Star Rating ───────────────────────────────────────────────────────────────
const StarRating = ({ complaintId, existingFeedback, onFeedbackSubmit }) => {
  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existingFeedback?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(!!existingFeedback?.rating);

  const submit = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/complaints/${complaintId}/feedback`, { rating, comment }, authHeaders());
      setDone(true);
      onFeedbackSubmit?.();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit feedback');
    } finally { setSubmitting(false); }
  };

  if (done) {
    return (
      <div style={{ fontSize: 13, color: '#16a34a', padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>★</span>
        You rated this {existingFeedback?.rating || rating} out of 5 — Thank you!
      </div>
    );
  }

  return (
    <div style={{ marginTop: 14, padding: '14px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 10 }}>⭐ Rate this resolution</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
            style={{ fontSize: 28, cursor: 'pointer', color: star <= (hover || rating) ? '#f59e0b' : '#e2e8f4', transition: 'color 0.15s' }}>★</span>
        ))}
      </div>
      <input type="text" placeholder="Optional comment..." value={comment}
        onChange={e => setComment(e.target.value)}
        style={{ width: '100%', padding: '9px 12px', border: '1px solid #fde68a', borderRadius: 6, fontSize: 13, marginBottom: 12, background: '#fff', boxSizing: 'border-box', outline: 'none' }} />
      <button onClick={submit} disabled={!rating || submitting}
        style={{ padding: '8px 20px', background: rating ? '#f59e0b' : '#e2e8f4', color: rating ? '#fff' : '#94a3b8', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: rating ? 'pointer' : 'not-allowed' }}>
        {submitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </div>
  );
};

// ── Escalate Panel (inside ComplaintCard) ─────────────────────────────────────
function EscalatePanel({ complaint, onEscalated }) {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const alreadyEscalated = complaint.escalation?.studentEscalated;

  if (alreadyEscalated || done) {
    return (
      <div style={{
        marginTop: 14, padding: '12px 14px',
        background: 'linear-gradient(135deg, #fef2f2, #fff5f5)',
        borderRadius: 10, border: '2px solid #fecaca',
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <span style={{ fontSize: 20 }}>🚨</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>Escalated to Super Admin</div>
          <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 2 }}>
            "{complaint.escalation?.studentEscalateMessage || msg}"
          </div>
        </div>
      </div>
    );
  }

  const handleEscalate = async () => {
    if (!msg.trim()) return;
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/complaints/${complaint._id}/escalate`,
        { message: msg },
        authHeaders()
      );
      setDone(true);
      onEscalated?.();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to escalate');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      marginTop: 14, padding: '14px 16px',
      background: '#fef2f2', borderRadius: 10,
      border: '1.5px solid #fecaca'
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 16 }}>🚨</span> Alert Super Admin
      </div>
      <div style={{ fontSize: 12, color: '#b91c1c', marginBottom: 10 }}>
        Not getting a response? Escalate directly to the Super Admin with a short message explaining the urgency.
      </div>
      <textarea
        rows={2}
        placeholder="Briefly describe why this is urgent..."
        value={msg}
        onChange={e => setMsg(e.target.value)}
        style={{
          width: '100%', padding: '9px 12px', border: '1.5px solid #fca5a5',
          borderRadius: 8, fontSize: 13, lineHeight: 1.5, resize: 'vertical',
          fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
          background: '#fff', marginBottom: 10
        }}
      />
      <button
        onClick={handleEscalate}
        disabled={!msg.trim() || loading}
        style={{
          padding: '8px 20px', border: 'none', borderRadius: 8,
          background: msg.trim() ? '#dc2626' : '#e2e8f0',
          color: msg.trim() ? '#fff' : '#94a3b8',
          fontSize: 13, fontWeight: 700,
          cursor: msg.trim() ? 'pointer' : 'not-allowed'
        }}
      >
        {loading ? 'Sending...' : '🚨 Alert Super Admin'}
      </button>
    </div>
  );
}

// ── Track Complaints card — full 3-step timeline ──────────────────────────────
const ComplaintCard = ({ c, onDelete, onFeedbackSubmit, onEscalated, showDelete = false }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 20, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
    <div style={{ height: 4, background: c.status === 'completed' ? '#16a34a' : c.status === 'working' ? '#4f8ef7' : '#f59e0b' }} />
    <div style={{ padding: '18px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="dept-badge">{c.department}</span>
          <span className="badge" style={{ background: STATUS_COLORS[c.status]?.bg, color: STATUS_COLORS[c.status]?.text, border: `1px solid ${STATUS_COLORS[c.status]?.border}` }}>{c.status}</span>
          <span className="badge" style={{ background: PRIORITY_COLORS[c.priority]?.bg, color: PRIORITY_COLORS[c.priority]?.text, border: `1px solid ${PRIORITY_COLORS[c.priority]?.border}` }}>{c.priority} priority</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          {showDelete && c.status === 'pending' && !c.escalation?.studentEscalated && (
            <button onClick={() => onDelete(c._id)} title="Delete complaint"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}>
              🗑 Delete
            </button>
          )}
        </div>
      </div>
      <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, margin: '0 0 14px', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>{c.text}</p>
      {c.statusHistory?.length > 0 && <StatusTimeline statusHistory={c.statusHistory} />}
      {c.adminRemark && (
        <div style={{ fontSize: 13, color: '#166534', padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', marginTop: 12, display: 'flex', gap: 8 }}>
          <span style={{ fontWeight: 700, flexShrink: 0 }}>Admin:</span>
          <span>{c.adminRemark}</span>
        </div>
      )}

      {/* ── Escalate to Super Admin section ─────────────────────────────── */}
      {c.status !== 'completed' && (
        <EscalatePanel complaint={c} onEscalated={onEscalated} />
      )}
    </div>
  </div>
);

// Resolved tab card — simplified 2-step timeline
const ResolvedCard = ({ c, onFeedbackSubmit }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid #bbf7d0', borderRadius: 12, marginBottom: 20, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
    <div style={{ height: 4, background: '#16a34a' }} />
    <div style={{ padding: '18px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="dept-badge">{c.department}</span>
          <span className="badge" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>completed</span>
          <span className="badge" style={{ background: PRIORITY_COLORS[c.priority]?.bg, color: PRIORITY_COLORS[c.priority]?.text, border: `1px solid ${PRIORITY_COLORS[c.priority]?.border}` }}>{c.priority} priority</span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
      <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, margin: '0 0 14px', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>{c.text}</p>
      {c.statusHistory?.length > 0 && <ResolvedTimeline statusHistory={c.statusHistory} />}
      {c.adminRemark && (
        <div style={{ fontSize: 13, color: '#166534', padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', marginTop: 12, display: 'flex', gap: 8 }}>
          <span style={{ fontWeight: 700, flexShrink: 0 }}>Admin:</span>
          <span>{c.adminRemark}</span>
        </div>
      )}
      <StarRating complaintId={c._id} existingFeedback={c.feedback} onFeedbackSubmit={onFeedbackSubmit} />
    </div>
  </div>
);

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const user = getUser();
  const [activeTab, setActiveTab] = useState('submit');
  const [complaints, setComplaints] = useState([]);
  const [resolved, setResolved] = useState([]);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Live department prediction state
  const [predictedDept, setPredictedDept] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'track') fetchComplaints();
    if (activeTab === 'resolved') fetchResolved();
  }, [activeTab]);

  // Live prediction: debounce 600ms after user stops typing
  useEffect(() => {
    if (!text.trim() || text.trim().length < 4) {
      setPredictedDept(null);
      return;
    }

    const localDept = detectDeptLocally(text);
    if (localDept) setPredictedDept(localDept);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPredicting(true);
      try {
        const res = await axios.post('http://localhost:8000/predict', { text }, { timeout: 3000 });
        if (res.data.department) setPredictedDept(res.data.department);
      } catch {
        // ML offline — keep local keyword result
      } finally {
        setPredicting(false);
      }
    }, 600);

    return () => clearTimeout(debounceRef.current);
  }, [text]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/complaints?archived=false`, authHeaders());
      setComplaints(data);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await axios.post(`${API_BASE_URL}/complaints`, { text }, authHeaders());
      setSubmitSuccess('Complaint submitted! Our team will review it shortly.');
      setText('');
      setPredictedDept(null);
      setTimeout(() => setSubmitSuccess(''), 5000);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit complaint');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/complaints/${id}`, authHeaders());
      setComplaints(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const logout = () => { localStorage.removeItem('user'); window.location.href = '/login'; };

  const navItems = [
    { key: 'submit',   label: 'Submit Complaint', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> },
    { key: 'track',    label: 'Track Complaints', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>, badge: complaints.length },
    { key: 'resolved', label: 'Resolved',          icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>, badge: resolved.length },
  ];

  const deptStyle = predictedDept ? DEPT_STYLE_COLORS[predictedDept] || DEPT_STYLE_COLORS['Administration'] : null;

  return (
    <div className="app-layout">
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
            <div className="user-role">Student</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-label">Navigation</div>
          {navItems.map(item => (
            <button key={item.key} className={`nav-item ${activeTab === item.key ? 'active' : ''}`} onClick={() => setActiveTab(item.key)}>
              {item.icon}
              {item.label}
              {item.badge > 0 && (
                <span style={{ marginLeft: 'auto', background: activeTab === item.key ? 'rgba(255,255,255,0.3)' : 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99 }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
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

      <main className="main-content">
        <div className="top-bar">
          <div>
            <div className="top-bar-title">
              {activeTab === 'submit' ? 'Submit a Complaint' : activeTab === 'track' ? 'Track Your Complaints' : 'Resolved Complaints'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        <div className="page-content">

          {/* ── Submit ── */}
          {activeTab === 'submit' && (
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              <div className="card">
                <div className="card-title" style={{ marginBottom: 6 }}>Describe your issue</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Our AI will automatically classify your complaint and route it to the correct department.
                </p>
                {submitSuccess && <div className="alert alert-success" style={{ marginBottom: 16 }}>{submitSuccess}</div>}
                {submitError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{submitError}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Your Complaint</label>
                    <textarea className="form-control" rows={5}
                      placeholder="Describe your issue in detail..."
                      value={text} onChange={e => setText(e.target.value)} required style={{ resize: 'vertical' }} />
                  </div>

                  {/* Live department prediction pill */}
                  {text.trim().length >= 4 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 8, marginBottom: 12,
                      background: deptStyle ? deptStyle.bg : '#f1f5f9',
                      border: `1px solid ${deptStyle ? deptStyle.border : '#cbd5e1'}`,
                      transition: 'all 0.3s'
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: deptStyle ? deptStyle.dot : '#94a3b8',
                        flexShrink: 0,
                        animation: predicting ? 'pulse 1s infinite' : 'none'
                      }} />
                      <span style={{ fontSize: 13, color: deptStyle ? deptStyle.text : '#475569', fontWeight: 500 }}>
                        {predicting
                          ? 'Classifying...'
                          : predictedDept
                            ? <>Will be routed to: <strong>{predictedDept}</strong> Department</>
                            : 'Will be routed to: Administration'
                        }
                      </span>
                      {predicting && (
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>AI analyzing…</span>
                      )}
                    </div>
                  )}

                  {!text.trim() && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, padding: '10px 14px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                      💡 Your complaint will be automatically classified using AI.
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: 14 }}
                    disabled={submitting || !text.trim()}>
                    {submitting ? 'Submitting...' : 'Submit Complaint'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── Track — full 3-step timeline + escalate ── */}
          {activeTab === 'track' && (
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>Loading...</div>
              ) : complaints.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>No active complaints</div>
                  <div style={{ fontSize: 13 }}>Submit a complaint or check Resolved tab.</div>
                </div>
              ) : (
                complaints.map(c => (
                  <ComplaintCard
                    key={c._id}
                    c={c}
                    showDelete
                    onDelete={handleDelete}
                    onFeedbackSubmit={fetchComplaints}
                    onEscalated={fetchComplaints}
                  />
                ))
              )}
            </div>
          )}

          {/* ── Resolved — simplified 2-step timeline ── */}
          {activeTab === 'resolved' && (
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>Loading...</div>
              ) : resolved.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>No resolved complaints yet</div>
                  <div style={{ fontSize: 13 }}>Complaints marked completed will appear here.</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                    ✅ {resolved.length} complaint{resolved.length > 1 ? 's' : ''} resolved
                  </div>
                  {resolved.map(c => (
                    <ResolvedCard key={c._id} c={c} onFeedbackSubmit={fetchResolved} />
                  ))}
                </>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Pulse animation for predicting dot */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
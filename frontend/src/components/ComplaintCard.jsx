import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const accentColors = {
  pending: '#f59e0b',
  working: '#4f8ef7',
  completed: '#16a34a',
};

export default function ComplaintCard({ complaint, isAdmin = false, onUpdated }) {
  const [status, setStatus] = useState(complaint.status);
  const [remark, setRemark] = useState(complaint.adminRemark || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleUpdate = async () => {
    setLoading(true);
    setMsg('');
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await axios.put(
        `${API_BASE_URL}/complaints/${complaint._id}`,
        { status, adminRemark: remark },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setMsg('Updated!');
      onUpdated?.();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const initials = complaint.user?.name
    ? complaint.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const date = new Date(complaint.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  return (
    <div className="complaint-card">
      <div
        className="complaint-card-left-accent"
        style={{ background: accentColors[complaint.status] }}
      />
      <div className="complaint-card-body">
        <div className="card-header">
          <div className="card-meta">
            <span className="badge badge-dept">{complaint.department}</span>
            <span className={`badge badge-${complaint.status}`}>
              {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
            </span>
          </div>
          {isAdmin && complaint.user && (
            <div className="user-chip">
              <div className="user-chip-avatar">{initials}</div>
              <div>
                <div className="user-chip-name">{complaint.user.name}</div>
                <div className="card-time" style={{ marginTop: 0 }}>{complaint.user.email}</div>
              </div>
            </div>
          )}
        </div>

        <p className="complaint-text">{complaint.text}</p>

        {complaint.adminRemark && !isAdmin && (
          <div className="complaint-remark">
            <strong>Admin note:</strong> {complaint.adminRemark}
          </div>
        )}

        <div className="card-footer">
          <span className="card-time">Submitted on {date}</span>
        </div>

        {isAdmin && (
          <div className="admin-actions">
            <select
              className="filter-select"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="working">Working</option>
              <option value="completed">Completed</option>
            </select>
            <input
              type="text"
              placeholder="Add a remark..."
              value={remark}
              onChange={e => setRemark(e.target.value)}
              className="form-control"
              style={{ flex: 1, minWidth: 160 }}
            />
            <button className="btn btn-primary btn-sm" onClick={handleUpdate} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Update'}
            </button>
            {msg && <span style={{ fontSize: 12, color: msg === 'Updated!' ? 'var(--success)' : 'var(--danger)' }}>{msg}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
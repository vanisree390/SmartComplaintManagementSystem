export const API_BASE_URL = 'http://localhost:5000/api';

export const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Maintenance', 'Administration', 'Academics', 'Hostel'];

export const DEPT_COLORS = {
  IT:             '#4f8ef7',
  HR:             '#8b5cf6',
  Finance:        '#16a34a',
  Maintenance:    '#f59e0b',
  Administration: '#ef4444',
  Academics:      '#06b6d4',
  Hostel:         '#ec4899'
};

export const PRIORITY_COLORS = {
  high:   { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  medium: { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
  low:    { bg: '#f0fdf4', text: '#065f46', border: '#bbf7d0' }
};

export const STATUS_COLORS = {
  pending:   { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
  working:   { bg: '#eff6ff', text: '#1e3a7a', border: '#bfdbfe' },
  completed: { bg: '#f0fdf4', text: '#065f46', border: '#bbf7d0' }
};
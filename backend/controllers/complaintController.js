// ============================================================
// REPLACE: controllers/complaintController.js  (full file)
// ============================================================

const Complaint = require('../models/Complaint');
const { sendCompletionEmail } = require('../utils/sendEmail');
const axios = require('axios');

const detectPriority = (text) => {
  const lower = text.toLowerCase();
  const highKeywords = ['urgent', 'emergency', 'immediately', 'critical', 'not working since days', 'very serious', 'asap', 'danger', 'broken since', 'weeks'];
  const lowKeywords = ['minor', 'small', 'whenever possible', 'not urgent', 'suggestion', 'feedback'];
  if (highKeywords.some(k => lower.includes(k))) return 'high';
  if (lowKeywords.some(k => lower.includes(k))) return 'low';
  return 'medium';
};

// ── Keyword-based department fallback (used when ML model is offline) ──────────
const detectDepartmentFallback = (text) => {
  const lower = text.toLowerCase();

  const rules = [
    {
      dept: 'IT',
      keywords: [
        'computer', 'laptop', 'printer', 'lab', 'internet', 'wifi', 'network',
        'software', 'hardware', 'system', 'server', 'website', 'portal', 'login',
        'password', 'email', 'projector', 'screen', 'monitor', 'keyboard', 'mouse',
        'usb', 'device', 'cable', 'router', 'firewall', 'browser', 'app', 'application',
        'database', 'backup', 'virus', 'malware', 'data', 'drive', 'storage'
      ]
    },
    {
      dept: 'HR',
      keywords: [
        'salary', 'leave', 'attendance', 'internship', 'certificate', 'bonafide',
        'transfer', 'promotion', 'appraisal', 'hr', 'human resource', 'payroll',
        'offer letter', 'joining', 'resignation', 'noc', 'no objection', 'id card',
        'employee', 'staff', 'faculty', 'appointment', 'contract', 'stipend'
      ]
    },
    {
      dept: 'Hostel',
      keywords: [
        'hostel', 'room', 'mess', 'food', 'warden', 'dormitory', 'bed', 'mattress',
        'bathroom', 'toilet', 'wash', 'laundry', 'dining', 'canteen', 'kitchen',
        'roommate', 'accommodation', 'allotment', 'curfew', 'gate', 'hostel fee'
      ]
    },
    {
      dept: 'Academics',
      keywords: [
        'exam', 'result', 'marks', 'grade', 'timetable', 'schedule', 'class',
        'lecture', 'professor', 'teacher', 'course', 'subject', 'syllabus',
        'assignment', 'project', 'thesis', 'report', 'attendance', 'academic',
        'semester', 'hall ticket', 'admit card', 'transcript', 'marksheet', 'degree'
      ]
    },
    {
      dept: 'Maintenance',
      keywords: [
        'electricity', 'power', 'light', 'fan', 'ac', 'air condition', 'water',
        'pipe', 'leak', 'repair', 'broken', 'damage', 'wall', 'roof', 'floor',
        'door', 'window', 'bench', 'chair', 'table', 'furniture', 'building',
        'construction', 'road', 'path', 'ground', 'cleaning', 'sweeping', 'dustbin'
      ]
    },
    {
      dept: 'Finance',
      keywords: [
        'fee', 'fees', 'payment', 'refund', 'scholarship', 'stipend', 'fine',
        'challan', 'receipt', 'invoice', 'account', 'bank', 'transaction',
        'reimbursement', 'allowance', 'tuition', 'hostel fee', 'exam fee', 'dues'
      ]
    },
  ];

  for (const rule of rules) {
    if (rule.keywords.some(k => lower.includes(k))) {
      return rule.dept;
    }
  }

  return 'Administration';
};

// ── Submit complaint ──────────────────────────────────────────────────────────
const submitComplaint = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Complaint text is required' });

    let department = detectDepartmentFallback(text);
    try {
      const mlResponse = await axios.post('http://localhost:8000/predict', { text }, { timeout: 5000 });
      if (mlResponse.data.department) {
        department = mlResponse.data.department;
      }
    } catch (mlErr) {
      console.warn('ML model unavailable, using keyword fallback:', mlErr.message);
    }

    const priority = detectPriority(text);

    const complaint = await Complaint.create({
      user: req.user._id,
      text,
      department,
      priority,
      status: 'pending',
      archived: false,
      statusHistory: [{ status: 'pending', remark: 'Complaint submitted', changedAt: new Date() }]
    });

    res.status(201).json(complaint);
  } catch (err) {
    console.error('Submit error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── Get complaints ────────────────────────────────────────────────────────────
const getComplaints = async (req, res) => {
  try {
    const { archived } = req.query;
    let filter = {};

    if (archived === 'true') {
      filter.archived = true;
    } else {
      filter.archived = { $ne: true };
    }

    if (req.user.role === 'admin' && req.user.department) {
      filter.department = req.user.department;
    }
    if (req.user.role === 'user') {
      filter.user = req.user._id;
    }

    const complaints = await Complaint.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (err) {
    console.error('Get complaints error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── Update status ─────────────────────────────────────────────────────────────
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, adminRemark } = req.body;

    const complaint = await Complaint.findById(req.params.id).populate('user', 'name email');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (req.user.role === 'admin' && req.user.department && complaint.department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied: Not your department' });
    }

    const previousStatus = complaint.status;
    complaint.status = status || complaint.status;
    complaint.adminRemark = adminRemark !== undefined ? adminRemark : complaint.adminRemark;

    complaint.statusHistory.push({
      status: complaint.status,
      remark: adminRemark || '',
      changedAt: new Date()
    });

    if (status === 'completed' && previousStatus !== 'completed') {
      complaint.archived = true;

      if (complaint.user?.email) {
        try {
          await sendCompletionEmail({
            toEmail: complaint.user.email,
            toName: complaint.user.name,
            complaintText: complaint.text,
            department: complaint.department,
            adminRemark: complaint.adminRemark
          });
          console.log(`Email sent to ${complaint.user.email}`);
        } catch (emailErr) {
          console.error('Email error:', emailErr.message);
        }
      }
    }

    await complaint.save();
    res.json(complaint);
  } catch (err) {
    console.error('Update error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── Delete complaint ──────────────────────────────────────────────────────────
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (req.user.role === 'user') {
      if (complaint.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only delete your own complaints' });
      }
      if (complaint.status !== 'pending') {
        return res.status(400).json({ message: 'You can only delete pending complaints' });
      }
    }

    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Complaint deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── Stats ─────────────────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'admin' && req.user.department) {
      filter.department = req.user.department;
    }

    const total     = await Complaint.countDocuments(filter);
    const pending   = await Complaint.countDocuments({ ...filter, status: 'pending',   archived: { $ne: true } });
    const working   = await Complaint.countDocuments({ ...filter, status: 'working',   archived: { $ne: true } });
    const completed = await Complaint.countDocuments({ ...filter, archived: true });

    const byDepartment = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const byPriority = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const avgRating = await Complaint.aggregate([
      { $match: { ...filter, 'feedback.rating': { $exists: true } } },
      { $group: { _id: null, avg: { $avg: '$feedback.rating' } } }
    ]);

    res.json({
      total, pending, working, completed,
      byDepartment, byPriority,
      avgRating: avgRating[0]?.avg?.toFixed(1) || null
    });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── Feedback ──────────────────────────────────────────────────────────────────
const submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (complaint.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only rate your own complaints' });
    }
    if (complaint.status !== 'completed') {
      return res.status(400).json({ message: 'You can only rate completed complaints' });
    }
    if (complaint.feedback?.rating) {
      return res.status(400).json({ message: 'Feedback already submitted' });
    }

    complaint.feedback = { rating, comment, submittedAt: new Date() };
    await complaint.save();

    res.json({ message: 'Feedback submitted', complaint });
  } catch (err) {
    console.error('Feedback error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── NEW: Student escalates complaint to SuperAdmin ─────────────────────────────
const escalateComplaint = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Escalation message is required' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Only the owner student can escalate
    if (complaint.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (complaint.status === 'completed') {
      return res.status(400).json({ message: 'Cannot escalate a completed complaint' });
    }

    complaint.escalation = {
      ...complaint.escalation,
      studentEscalated: true,
      studentEscalateMessage: message.trim(),
      studentEscalatedAt: new Date()
    };

    await complaint.save();
    res.json({ message: 'Escalated to Super Admin successfully', complaint });
  } catch (err) {
    console.error('Escalate error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── NEW: SuperAdmin warns department admin ────────────────────────────────────
const warnDepartmentAdmin = async (req, res) => {
  try {
    const { warnMessage } = req.body;
    if (!warnMessage || !warnMessage.trim()) {
      return res.status(400).json({ message: 'Warning message is required' });
    }

    // Only superadmin can warn
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied: SuperAdmin only' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.escalation = {
      ...complaint.escalation,
      warnedBySuperAdmin: true,
      warnMessage: warnMessage.trim(),
      warnedAt: new Date()
    };

    await complaint.save();
    res.json({ message: 'Warning sent to department admin', complaint });
  } catch (err) {
    console.error('Warn error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  submitComplaint,
  getComplaints,
  updateComplaintStatus,
  deleteComplaint,
  getStats,
  submitFeedback,
  escalateComplaint,      // NEW
  warnDepartmentAdmin     // NEW
};
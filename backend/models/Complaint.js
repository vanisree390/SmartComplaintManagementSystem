// ============================================================
// REPLACE: models/Complaint.js  (full file)
// ============================================================

const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'working', 'completed']
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  remark: {
    type: String,
    default: ''
  }
});

const feedbackSchema = new mongoose.Schema({
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// ── NEW: escalation sub-doc ───────────────────────────────────────────────────
const escalationSchema = new mongoose.Schema({
  // Student → SuperAdmin
  studentEscalated: { type: Boolean, default: false },
  studentEscalateMessage: { type: String, default: '' },
  studentEscalatedAt: { type: Date },

  // SuperAdmin → Dept Admin
  warnedBySuperAdmin: { type: Boolean, default: false },
  warnMessage: { type: String, default: '' },
  warnedAt: { type: Date }
}, { _id: false });

const complaintSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Complaint text is required'],
    trim: true
  },
  department: {
    type: String,
    enum: ['IT', 'HR', 'Finance', 'Maintenance', 'Administration', 'Academics', 'Hostel'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'working', 'completed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  adminRemark: {
    type: String,
    default: ''
  },
  statusHistory: [statusHistorySchema],
  feedback: feedbackSchema,
  archived: {
    type: Boolean,
    default: false
  },
  // ── NEW field ──────────────────────────────────────────────────────────────
  escalation: {
    type: escalationSchema,
    default: () => ({})
  }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
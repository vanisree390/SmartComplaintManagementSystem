// ============================================================
// REPLACE: routes/complaintRoutes.js  (full file)
// ============================================================

const express = require('express');
const router = express.Router();
const {
  submitComplaint,
  getComplaints,
  updateComplaintStatus,
  deleteComplaint,
  getStats,
  submitFeedback,
  escalateComplaint,    // NEW
  warnDepartmentAdmin   // NEW
} = require('../controllers/complaintController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.post('/',                  protect,            submitComplaint);
router.get('/',                   protect,            getComplaints);
router.get('/stats',              protect,            getStats);
router.put('/:id',                protect, adminOnly, updateComplaintStatus);
router.delete('/:id',             protect,            deleteComplaint);
router.post('/:id/feedback',      protect,            submitFeedback);

// ── NEW routes ────────────────────────────────────────────────────────────────
// Student escalates their own complaint to SuperAdmin
router.post('/:id/escalate',      protect,            escalateComplaint);
// SuperAdmin warns the department admin about a complaint
router.post('/:id/warn',          protect,            warnDepartmentAdmin);

module.exports = router;
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { logActions } = require('../middleware/logger');

const router = express.Router();

// Define role-based permissions
const BENEFICIARY_ROLES = new Set(['Beneficiary']);
const ADMIN_ROLES = new Set(['Admin', 'Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor']);

// Middleware to check if user is a beneficiary
const requireBeneficiary = (req, res, next) => {
  if (!BENEFICIARY_ROLES.has(req.user.user.role)) {
    return res.status(403).json({ error: 'Access denied. Beneficiary role required.' });
  }
  next();
};

// Middleware to check if user is admin or beneficiary
const requireAdminOrBeneficiary = (req, res, next) => {
  if (!ADMIN_ROLES.has(req.user.user.role) && !BENEFICIARY_ROLES.has(req.user.user.role)) {
    return res.status(403).json({ error: 'Access denied. Admin or Beneficiary role required.' });
  }
  next();
};

// @route   POST /api/community/requests
// @desc    Submit a community request (public access)
// @access  Public
router.post('/requests', [
  body('fullName', 'Full name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('phone', 'Phone number is required').not().isEmpty(),
  body('requestType', 'Request type is required').not().isEmpty(),
  body('subject', 'Subject is required').not().isEmpty(),
  body('description', 'Description is required').isLength({ min: 20 }),
  body('priority').isIn(['Low', 'Medium', 'High', 'Urgent']),
  body('preferredContactMethod').isIn(['Email', 'Phone', 'SMS'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      fullName,
      email,
      phone,
      organization,
      requestType,
      subject,
      description,
      priority,
      preferredContactMethod,
      status = 'Pending',
      submittedAt
    } = req.body;

    const [result] = await db.promise.query(
      `INSERT INTO community_requests 
       (full_name, email, phone, organization, request_type, subject, description, priority, preferred_contact_method, status, submitted_at, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [fullName, email, phone, organization, requestType, subject, description, priority, preferredContactMethod, status, submittedAt]
    );

    res.status(201).json({ 
      message: 'Request submitted successfully',
      requestId: result.insertId 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/community/requests
// @desc    Get community requests (admin only)
// @access  Private (Admin)
router.get('/requests', [auth, requireAdminOrBeneficiary], async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let params = [];
    
    if (status) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }
    
    const [rows] = await db.promise.query(
      `SELECT * FROM community_requests ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    const [countResult] = await db.promise.query(
      `SELECT COUNT(*) as total FROM community_requests ${whereClause}`,
      params
    );
    
    res.json({
      requests: rows,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/community/feedback
// @desc    Submit community feedback (public access)
// @access  Public
router.post('/feedback', [
  body('fullName', 'Full name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('phone', 'Phone number is required').not().isEmpty(),
  body('feedbackType', 'Feedback type is required').not().isEmpty(),
  body('subject', 'Subject is required').not().isEmpty(),
  body('rating', 'Rating is required').isInt({ min: 1, max: 5 }),
  body('message', 'Message is required').isLength({ min: 10 }),
  body('allowPublicDisplay').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      fullName,
      email,
      phone,
      organization,
      feedbackType,
      subject,
      rating,
      message,
      allowPublicDisplay,
      preferredContactMethod,
      status = 'New',
      submittedAt
    } = req.body;

    const [result] = await db.promise.query(
      `INSERT INTO community_feedback 
       (full_name, email, phone, organization, feedback_type, subject, rating, message, allow_public_display, preferred_contact_method, status, submitted_at, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [fullName, email, phone, organization, feedbackType, subject, rating, message, allowPublicDisplay, preferredContactMethod, status, submittedAt]
    );

    res.status(201).json({ 
      message: 'Feedback submitted successfully',
      feedbackId: result.insertId 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/community/feedback
// @desc    Get community feedback (admin only)
// @access  Private (Admin)
router.get('/feedback', [auth, requireAdminOrBeneficiary], async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let params = [];
    
    if (status) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }
    
    const [rows] = await db.promise.query(
      `SELECT * FROM community_feedback ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    const [countResult] = await db.promise.query(
      `SELECT COUNT(*) as total FROM community_feedback ${whereClause}`,
      params
    );
    
    res.json({
      feedback: rows,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/community/announcements
// @desc    Get public announcements
// @access  Public
router.get('/announcements', async (req, res) => {
  try {
    const { category, priority, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE status = "Published"';
    let params = [];
    
    if (category && category !== 'All') {
      whereClause += ' AND category = ?';
      params.push(category);
    }
    
    if (priority && priority !== 'All') {
      whereClause += ' AND priority = ?';
      params.push(priority);
    }
    
    const [rows] = await db.promise.query(
      `SELECT id, title, content, category, priority, created_at FROM community_announcements ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    const [countResult] = await db.promise.query(
      `SELECT COUNT(*) as total FROM community_announcements ${whereClause}`,
      params
    );
    
    res.json({
      announcements: rows,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/community/announcements
// @desc    Create announcement (admin only)
// @access  Private (Admin)
router.post('/announcements', [
  auth,
  requireAdminOrBeneficiary,
  body('title', 'Title is required').not().isEmpty(),
  body('content', 'Content is required').not().isEmpty(),
  body('category', 'Category is required').not().isEmpty(),
  body('priority').isIn(['Low', 'Medium', 'High']),
  body('status').isIn(['Draft', 'Published'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, category, priority, status = 'Draft' } = req.body;

    const [result] = await db.promise.query(
      `INSERT INTO community_announcements (title, content, category, priority, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
      [title, content, category, priority, status]
    );

    res.status(201).json({ 
      message: 'Announcement created successfully',
      announcementId: result.insertId 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

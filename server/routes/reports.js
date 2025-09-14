const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { logActions } = require('../middleware/logger');

const router = express.Router();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/report-photos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `report-photo-${req.user.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only images
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @route   GET /api/reports
// @desc    Get all evaluation reports for the user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const requester = req.user.user;
    
    let sql = `
      SELECT r.*, p.title as project_title, p.status as project_status,
             u.fullname as created_by_name, u.department_college as created_by_department
      FROM reports r
      LEFT JOIN projects p ON p.project_id = r.project_id
      LEFT JOIN users u ON u.user_id = r.created_by
      WHERE 1=1
    `;
    const params = [];

    // Extension Coordinators can only see reports for their own projects
    if (requester.role === 'Extension Coordinator') {
      sql += ' AND p.coordinator_id = ?';
      params.push(requester.id);
    }

    sql += ' ORDER BY r.created_at DESC';

    const [rows] = await db.promise.query(sql, params);
    
    // Parse photos JSON for each report
    for (let report of rows) {
      try {
        report.photos = report.photos ? JSON.parse(report.photos) : [];
        // Add URL to each photo
        report.photos = report.photos.map(photo => ({
          ...photo,
          url: `/uploads/report-photos/${photo.filename}`
        }));
      } catch (err) {
        report.photos = [];
      }
    }

    res.json(rows);
  } catch (err) {
    console.error('Error fetching evaluation reports:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/reports/projects
// @desc    Get completed projects that can have evaluation reports
// @access  Private
router.get('/projects', auth, async (req, res) => {
  try {
    const requester = req.user.user;
    
    let sql = `
      SELECT p.project_id, p.title, p.status, p.start_date, p.end_date,
             u.fullname as coordinator_name
      FROM projects p
      LEFT JOIN users u ON u.user_id = p.coordinator_id
      WHERE p.status = 'Completed'
    `;
    const params = [];

    // Extension Coordinators can only see their own projects
    if (requester.role === 'Extension Coordinator') {
      sql += ' AND p.coordinator_id = ?';
      params.push(requester.id);
    }

    sql += ' ORDER BY p.title ASC';

    const [rows] = await db.promise.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching projects for evaluation reports:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/reports/:id
// @desc    Get a specific evaluation report
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const requester = req.user.user;
    const reportId = req.params.id;

    const [rows] = await db.promise.query(`
      SELECT r.*, p.title as project_title, p.status as project_status,
             u.fullname as created_by_name, u.department_college as created_by_department
      FROM reports r
      LEFT JOIN projects p ON p.project_id = r.project_id
      LEFT JOIN users u ON u.user_id = r.created_by
      WHERE r.report_id = ?
    `, [reportId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Evaluation report not found' });
    }

    const report = rows[0];

    // Check permissions
    if (requester.role === 'Extension Coordinator') {
      const [projectRows] = await db.promise.query(
        'SELECT coordinator_id FROM projects WHERE project_id = ?',
        [report.project_id]
      );
      if (projectRows.length === 0 || projectRows[0].coordinator_id !== requester.id) {
      return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Parse photos JSON for the report
    try {
      report.photos = report.photos ? JSON.parse(report.photos) : [];
      // Add URL to each photo
      report.photos = report.photos.map(photo => ({
        ...photo,
        url: `/uploads/report-photos/${photo.filename}`
      }));
    } catch (err) {
      report.photos = [];
    }

    res.json(report);
  } catch (err) {
    console.error('Error fetching evaluation report:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/reports
// @desc    Create a new evaluation report
// @access  Private
router.post('/', [
  auth,
  body('project_id').isInt().withMessage('Project ID must be a valid integer'),
  body('participant_type').optional().isString().withMessage('Participant type must be a string'),
  body('male_batstateu_participants').optional().isInt({ min: 0 }).withMessage('Male BatStateU participants must be a non-negative integer'),
  body('female_batstateu_participants').optional().isInt({ min: 0 }).withMessage('Female BatStateU participants must be a non-negative integer'),
  body('male_other_participants').optional().isInt({ min: 0 }).withMessage('Male other participants must be a non-negative integer'),
  body('female_other_participants').optional().isInt({ min: 0 }).withMessage('Female other participants must be a non-negative integer'),
  body('narrative_of_activity').optional().isString().withMessage('Narrative of activity must be a string'),
  // Activity rating fields
  body('activity_excellent_batstateu').optional().isInt({ min: 0 }).withMessage('Activity excellent BatStateU participants must be a non-negative integer'),
  body('activity_excellent_other').optional().isInt({ min: 0 }).withMessage('Activity excellent other participants must be a non-negative integer'),
  body('activity_very_satisfactory_batstateu').optional().isInt({ min: 0 }).withMessage('Activity very satisfactory BatStateU participants must be a non-negative integer'),
  body('activity_very_satisfactory_other').optional().isInt({ min: 0 }).withMessage('Activity very satisfactory other participants must be a non-negative integer'),
  body('activity_satisfactory_batstateu').optional().isInt({ min: 0 }).withMessage('Activity satisfactory BatStateU participants must be a non-negative integer'),
  body('activity_satisfactory_other').optional().isInt({ min: 0 }).withMessage('Activity satisfactory other participants must be a non-negative integer'),
  body('activity_fair_batstateu').optional().isInt({ min: 0 }).withMessage('Activity fair BatStateU participants must be a non-negative integer'),
  body('activity_fair_other').optional().isInt({ min: 0 }).withMessage('Activity fair other participants must be a non-negative integer'),
  body('activity_poor_batstateu').optional().isInt({ min: 0 }).withMessage('Activity poor BatStateU participants must be a non-negative integer'),
  body('activity_poor_other').optional().isInt({ min: 0 }).withMessage('Activity poor other participants must be a non-negative integer'),
  // Timeliness rating fields
  body('timeliness_excellent_batstateu').optional().isInt({ min: 0 }).withMessage('Timeliness excellent BatStateU participants must be a non-negative integer'),
  body('timeliness_excellent_other').optional().isInt({ min: 0 }).withMessage('Timeliness excellent other participants must be a non-negative integer'),
  body('timeliness_very_satisfactory_batstateu').optional().isInt({ min: 0 }).withMessage('Timeliness very satisfactory BatStateU participants must be a non-negative integer'),
  body('timeliness_very_satisfactory_other').optional().isInt({ min: 0 }).withMessage('Timeliness very satisfactory other participants must be a non-negative integer'),
  body('timeliness_satisfactory_batstateu').optional().isInt({ min: 0 }).withMessage('Timeliness satisfactory BatStateU participants must be a non-negative integer'),
  body('timeliness_satisfactory_other').optional().isInt({ min: 0 }).withMessage('Timeliness satisfactory other participants must be a non-negative integer'),
  body('timeliness_fair_batstateu').optional().isInt({ min: 0 }).withMessage('Timeliness fair BatStateU participants must be a non-negative integer'),
  body('timeliness_fair_other').optional().isInt({ min: 0 }).withMessage('Timeliness fair other participants must be a non-negative integer'),
  body('timeliness_poor_batstateu').optional().isInt({ min: 0 }).withMessage('Timeliness poor BatStateU participants must be a non-negative integer'),
  body('timeliness_poor_other').optional().isInt({ min: 0 }).withMessage('Timeliness poor other participants must be a non-negative integer'),
  logActions.createReport
], async (req, res) => {
  try {
    const requester = req.user.user;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      project_id, 
      participant_type, 
      male_batstateu_participants, 
      female_batstateu_participants, 
      male_other_participants, 
      female_other_participants,
      narrative_of_activity,
      // Activity rating fields
      activity_excellent_batstateu,
      activity_excellent_other,
      activity_very_satisfactory_batstateu,
      activity_very_satisfactory_other,
      activity_satisfactory_batstateu,
      activity_satisfactory_other,
      activity_fair_batstateu,
      activity_fair_other,
      activity_poor_batstateu,
      activity_poor_other,
      // Timeliness rating fields
      timeliness_excellent_batstateu,
      timeliness_excellent_other,
      timeliness_very_satisfactory_batstateu,
      timeliness_very_satisfactory_other,
      timeliness_satisfactory_batstateu,
      timeliness_satisfactory_other,
      timeliness_fair_batstateu,
      timeliness_fair_other,
      timeliness_poor_batstateu,
      timeliness_poor_other
    } = req.body;

    // Verify project exists and is completed
    const [projectRows] = await db.promise.query(
      'SELECT * FROM projects WHERE project_id = ?',
      [project_id]
    );

    if (projectRows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectRows[0];

    // Check if project is completed
    if (project.status !== 'Completed') {
      return res.status(400).json({ 
        error: 'Evaluation reports can only be created for completed projects' 
      });
    }

    // Extension Coordinators can only create reports for their own projects
    if (requester.role === 'Extension Coordinator' && project.coordinator_id !== requester.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if report already exists for this project
    const [existingReport] = await db.promise.query(
      'SELECT report_id FROM reports WHERE project_id = ?',
      [project_id]
    );

    if (existingReport.length > 0) {
      return res.status(400).json({ 
        error: 'An evaluation report already exists for this project' 
      });
    }

    // Create the evaluation report
    const [result] = await db.promise.query(`
      INSERT INTO reports (
        project_id, 
        participant_type, 
        male_batstateu_participants, 
        female_batstateu_participants, 
        male_other_participants, 
        female_other_participants,
        narrative_of_activity,
        activity_excellent_batstateu,
        activity_excellent_other,
        activity_very_satisfactory_batstateu,
        activity_very_satisfactory_other,
        activity_satisfactory_batstateu,
        activity_satisfactory_other,
        activity_fair_batstateu,
        activity_fair_other,
        activity_poor_batstateu,
        activity_poor_other,
        timeliness_excellent_batstateu,
        timeliness_excellent_other,
        timeliness_very_satisfactory_batstateu,
        timeliness_very_satisfactory_other,
        timeliness_satisfactory_batstateu,
        timeliness_satisfactory_other,
        timeliness_fair_batstateu,
        timeliness_fair_other,
        timeliness_poor_batstateu,
        timeliness_poor_other,
        photos,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      project_id, 
      participant_type || null, 
      male_batstateu_participants || 0, 
      female_batstateu_participants || 0, 
      male_other_participants || 0, 
      female_other_participants || 0,
      narrative_of_activity || null,
      activity_excellent_batstateu || 0,
      activity_excellent_other || 0,
      activity_very_satisfactory_batstateu || 0,
      activity_very_satisfactory_other || 0,
      activity_satisfactory_batstateu || 0,
      activity_satisfactory_other || 0,
      activity_fair_batstateu || 0,
      activity_fair_other || 0,
      activity_poor_batstateu || 0,
      activity_poor_other || 0,
      timeliness_excellent_batstateu || 0,
      timeliness_excellent_other || 0,
      timeliness_very_satisfactory_batstateu || 0,
      timeliness_very_satisfactory_other || 0,
      timeliness_satisfactory_batstateu || 0,
      timeliness_satisfactory_other || 0,
      timeliness_fair_batstateu || 0,
      timeliness_fair_other || 0,
      timeliness_poor_batstateu || 0,
      timeliness_poor_other || 0,
      JSON.stringify([]), // Initialize photos as empty array
      requester.id
    ]);

    const reportId = result.insertId;

    // Get the created report with project details
    const [newReport] = await db.promise.query(`
      SELECT r.*, p.title as project_title, p.status as project_status,
             u.fullname as created_by_name, u.department_college as created_by_department
      FROM reports r
      LEFT JOIN projects p ON p.project_id = r.project_id
      LEFT JOIN users u ON u.user_id = r.created_by
      WHERE r.report_id = ?
    `, [reportId]);

    res.status(201).json(newReport[0]);
  } catch (err) {
    console.error('Error creating evaluation report:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/reports/:id
// @desc    Update an evaluation report
// @access  Private
router.put('/:id', [
  auth,
  body('participant_type').optional().isString().withMessage('Participant type must be a string'),
  body('male_batstateu_participants').optional().isInt({ min: 0 }).withMessage('Male BatStateU participants must be a non-negative integer'),
  body('female_batstateu_participants').optional().isInt({ min: 0 }).withMessage('Female BatStateU participants must be a non-negative integer'),
  body('male_other_participants').optional().isInt({ min: 0 }).withMessage('Male other participants must be a non-negative integer'),
  body('female_other_participants').optional().isInt({ min: 0 }).withMessage('Female other participants must be a non-negative integer'),
  body('narrative_of_activity').optional().isString().withMessage('Narrative of activity must be a string'),
  // Activity rating fields
  body('activity_excellent_batstateu').optional().isInt({ min: 0 }).withMessage('Activity excellent BatStateU participants must be a non-negative integer'),
  body('activity_excellent_other').optional().isInt({ min: 0 }).withMessage('Activity excellent other participants must be a non-negative integer'),
  body('activity_very_satisfactory_batstateu').optional().isInt({ min: 0 }).withMessage('Activity very satisfactory BatStateU participants must be a non-negative integer'),
  body('activity_very_satisfactory_other').optional().isInt({ min: 0 }).withMessage('Activity very satisfactory other participants must be a non-negative integer'),
  body('activity_satisfactory_batstateu').optional().isInt({ min: 0 }).withMessage('Activity satisfactory BatStateU participants must be a non-negative integer'),
  body('activity_satisfactory_other').optional().isInt({ min: 0 }).withMessage('Activity satisfactory other participants must be a non-negative integer'),
  body('activity_fair_batstateu').optional().isInt({ min: 0 }).withMessage('Activity fair BatStateU participants must be a non-negative integer'),
  body('activity_fair_other').optional().isInt({ min: 0 }).withMessage('Activity fair other participants must be a non-negative integer'),
  body('activity_poor_batstateu').optional().isInt({ min: 0 }).withMessage('Activity poor BatStateU participants must be a non-negative integer'),
  body('activity_poor_other').optional().isInt({ min: 0 }).withMessage('Activity poor other participants must be a non-negative integer'),
  // Timeliness rating fields
  body('timeliness_excellent_batstateu').optional().isInt({ min: 0 }).withMessage('Timeliness excellent BatStateU participants must be a non-negative integer'),
  body('timeliness_excellent_other').optional().isInt({ min: 0 }).withMessage('Timeliness excellent other participants must be a non-negative integer'),
  body('timeliness_very_satisfactory_batstateu').optional().isInt({ min: 0 }).withMessage('Timeliness very satisfactory BatStateU participants must be a non-negative integer'),
  body('timeliness_very_satisfactory_other').optional().isInt({ min: 0 }).withMessage('Timeliness very satisfactory other participants must be a non-negative integer'),
  body('timeliness_satisfactory_batstateu').optional().isInt({ min: 0 }).withMessage('Timeliness satisfactory BatStateU participants must be a non-negative integer'),
  body('timeliness_satisfactory_other').optional().isInt({ min: 0 }).withMessage('Timeliness satisfactory other participants must be a non-negative integer'),
  body('timeliness_fair_batstateu').optional().isInt({ min: 0 }).withMessage('Timeliness fair BatStateU participants must be a non-negative integer'),
  body('timeliness_fair_other').optional().isInt({ min: 0 }).withMessage('Timeliness fair other participants must be a non-negative integer'),
  body('timeliness_poor_batstateu').optional().isInt({ min: 0 }).withMessage('Timeliness poor BatStateU participants must be a non-negative integer'),
  body('timeliness_poor_other').optional().isInt({ min: 0 }).withMessage('Timeliness poor other participants must be a non-negative integer'),
  logActions.updateReport
], async (req, res) => {
  try {
    const requester = req.user.user;
    const reportId = req.params.id;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get existing report
    const [reportRows] = await db.promise.query(`
      SELECT r.*, p.coordinator_id 
      FROM reports r
      LEFT JOIN projects p ON p.project_id = r.project_id
      WHERE r.report_id = ?
    `, [reportId]);

    if (reportRows.length === 0) {
      return res.status(404).json({ error: 'Evaluation report not found' });
    }

    const report = reportRows[0];

    // Check permissions
    if (requester.role === 'Extension Coordinator' && report.coordinator_id !== requester.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (req.body.participant_type !== undefined) {
      updates.push('participant_type = ?');
      params.push(req.body.participant_type || null);
    }

    if (req.body.male_batstateu_participants !== undefined) {
      updates.push('male_batstateu_participants = ?');
      params.push(req.body.male_batstateu_participants || 0);
    }

    if (req.body.female_batstateu_participants !== undefined) {
      updates.push('female_batstateu_participants = ?');
      params.push(req.body.female_batstateu_participants || 0);
    }

    if (req.body.male_other_participants !== undefined) {
      updates.push('male_other_participants = ?');
      params.push(req.body.male_other_participants || 0);
    }

    if (req.body.female_other_participants !== undefined) {
      updates.push('female_other_participants = ?');
      params.push(req.body.female_other_participants || 0);
    }

    if (req.body.narrative_of_activity !== undefined) {
      updates.push('narrative_of_activity = ?');
      params.push(req.body.narrative_of_activity || null);
    }

    // Activity rating fields
    if (req.body.activity_excellent_batstateu !== undefined) {
      updates.push('activity_excellent_batstateu = ?');
      params.push(req.body.activity_excellent_batstateu || 0);
    }
    if (req.body.activity_excellent_other !== undefined) {
      updates.push('activity_excellent_other = ?');
      params.push(req.body.activity_excellent_other || 0);
    }
    if (req.body.activity_very_satisfactory_batstateu !== undefined) {
      updates.push('activity_very_satisfactory_batstateu = ?');
      params.push(req.body.activity_very_satisfactory_batstateu || 0);
    }
    if (req.body.activity_very_satisfactory_other !== undefined) {
      updates.push('activity_very_satisfactory_other = ?');
      params.push(req.body.activity_very_satisfactory_other || 0);
    }
    if (req.body.activity_satisfactory_batstateu !== undefined) {
      updates.push('activity_satisfactory_batstateu = ?');
      params.push(req.body.activity_satisfactory_batstateu || 0);
    }
    if (req.body.activity_satisfactory_other !== undefined) {
      updates.push('activity_satisfactory_other = ?');
      params.push(req.body.activity_satisfactory_other || 0);
    }
    if (req.body.activity_fair_batstateu !== undefined) {
      updates.push('activity_fair_batstateu = ?');
      params.push(req.body.activity_fair_batstateu || 0);
    }
    if (req.body.activity_fair_other !== undefined) {
      updates.push('activity_fair_other = ?');
      params.push(req.body.activity_fair_other || 0);
    }
    if (req.body.activity_poor_batstateu !== undefined) {
      updates.push('activity_poor_batstateu = ?');
      params.push(req.body.activity_poor_batstateu || 0);
    }
    if (req.body.activity_poor_other !== undefined) {
      updates.push('activity_poor_other = ?');
      params.push(req.body.activity_poor_other || 0);
    }

    // Timeliness rating fields
    if (req.body.timeliness_excellent_batstateu !== undefined) {
      updates.push('timeliness_excellent_batstateu = ?');
      params.push(req.body.timeliness_excellent_batstateu || 0);
    }
    if (req.body.timeliness_excellent_other !== undefined) {
      updates.push('timeliness_excellent_other = ?');
      params.push(req.body.timeliness_excellent_other || 0);
    }
    if (req.body.timeliness_very_satisfactory_batstateu !== undefined) {
      updates.push('timeliness_very_satisfactory_batstateu = ?');
      params.push(req.body.timeliness_very_satisfactory_batstateu || 0);
    }
    if (req.body.timeliness_very_satisfactory_other !== undefined) {
      updates.push('timeliness_very_satisfactory_other = ?');
      params.push(req.body.timeliness_very_satisfactory_other || 0);
    }
    if (req.body.timeliness_satisfactory_batstateu !== undefined) {
      updates.push('timeliness_satisfactory_batstateu = ?');
      params.push(req.body.timeliness_satisfactory_batstateu || 0);
    }
    if (req.body.timeliness_satisfactory_other !== undefined) {
      updates.push('timeliness_satisfactory_other = ?');
      params.push(req.body.timeliness_satisfactory_other || 0);
    }
    if (req.body.timeliness_fair_batstateu !== undefined) {
      updates.push('timeliness_fair_batstateu = ?');
      params.push(req.body.timeliness_fair_batstateu || 0);
    }
    if (req.body.timeliness_fair_other !== undefined) {
      updates.push('timeliness_fair_other = ?');
      params.push(req.body.timeliness_fair_other || 0);
    }
    if (req.body.timeliness_poor_batstateu !== undefined) {
      updates.push('timeliness_poor_batstateu = ?');
      params.push(req.body.timeliness_poor_batstateu || 0);
    }
    if (req.body.timeliness_poor_other !== undefined) {
      updates.push('timeliness_poor_other = ?');
      params.push(req.body.timeliness_poor_other || 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(reportId);

    await db.promise.query(
      `UPDATE reports SET ${updates.join(', ')}, updated_at = NOW() WHERE report_id = ?`,
      params
    );

    // Get updated report
    const [updatedReport] = await db.promise.query(`
      SELECT r.*, p.title as project_title, p.status as project_status,
             u.fullname as created_by_name, u.department_college as created_by_department
      FROM reports r
      LEFT JOIN projects p ON p.project_id = r.project_id
      LEFT JOIN users u ON u.user_id = r.created_by
      WHERE r.report_id = ?
    `, [reportId]);

    res.json(updatedReport[0]);
  } catch (err) {
    console.error('Error updating evaluation report:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete an evaluation report
// @access  Private
router.delete('/:id', [auth, logActions.deleteReport], async (req, res) => {
  try {
    const requester = req.user.user;
    const reportId = req.params.id;

    // Get existing report
    const [reportRows] = await db.promise.query(`
      SELECT r.*, p.coordinator_id 
      FROM reports r
      LEFT JOIN projects p ON p.project_id = r.project_id
      WHERE r.report_id = ?
    `, [reportId]);

    if (reportRows.length === 0) {
      return res.status(404).json({ error: 'Evaluation report not found' });
    }

    const report = reportRows[0];

    // Check permissions
    if (requester.role === 'Extension Coordinator' && report.coordinator_id !== requester.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete the report
    await db.promise.query('DELETE FROM reports WHERE report_id = ?', [reportId]);

    res.json({ message: 'Evaluation report deleted successfully' });
  } catch (err) {
    console.error('Error deleting evaluation report:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/reports/:id/photos
// @desc    Upload photos for a report
// @access  Private
router.post('/:id/photos', [
  auth,
  upload.array('photos', 10), // Allow up to 10 photos
  body('captions').optional().isArray().withMessage('Captions must be an array'),
  logActions.createReport
], async (req, res) => {
  try {
    const requester = req.user.user;
    const reportId = req.params.id;
    let captions = [];
    try {
      if (req.body.captions) {
        if (typeof req.body.captions === 'string') {
          captions = JSON.parse(req.body.captions);
        } else if (Array.isArray(req.body.captions)) {
          captions = req.body.captions;
        }
      }
    } catch (err) {
      console.error('Error parsing captions:', err, 'Raw captions:', req.body.captions);
      captions = [];
    }

    // Check if report exists and user has permission
    const [reportRows] = await db.promise.query(`
      SELECT r.*, p.coordinator_id 
      FROM reports r
      LEFT JOIN projects p ON p.project_id = r.project_id
      WHERE r.report_id = ?
    `, [reportId]);

    if (reportRows.length === 0) {
      return res.status(404).json({ error: 'Evaluation report not found' });
    }

    const report = reportRows[0];

    // Check permissions
    if (requester.role === 'Extension Coordinator' && report.coordinator_id !== requester.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No photos uploaded' });
    }

    // Get existing photos from reports table
    const [existingPhotos] = await db.promise.query(
      'SELECT photos FROM reports WHERE report_id = ?',
      [reportId]
    );
    
    let currentPhotos = [];
    try {
      currentPhotos = existingPhotos[0]?.photos ? JSON.parse(existingPhotos[0].photos) : [];
    } catch (err) {
      currentPhotos = [];
    }

    // Add new photos to existing photos
    const uploadedPhotos = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const caption = captions[i] || '';

      const newPhoto = {
        photo_id: Date.now() + Math.random(), // Generate unique ID
        filename: file.filename,
        original_filename: file.originalname,
        file_size: file.size,
        caption: caption,
        uploaded_at: new Date().toISOString(),
        uploaded_by: requester.id
      };

      currentPhotos.push(newPhoto);
      uploadedPhotos.push({
        ...newPhoto,
        url: `/uploads/report-photos/${file.filename}`
      });
    }

    // Update reports table with new photos JSON
    await db.promise.query(
      'UPDATE reports SET photos = ? WHERE report_id = ?',
      [JSON.stringify(currentPhotos), reportId]
    );

    res.status(201).json({
      message: `${uploadedPhotos.length} photo(s) uploaded successfully`,
      photos: uploadedPhotos
    });
  } catch (err) {
    console.error('Error uploading photos:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/reports/:id/photos/:photoId
// @desc    Update photo caption
// @access  Private
router.put('/:id/photos/:photoId', [
  auth,
  body('caption').optional().isString().withMessage('Caption must be a string'),
  logActions.updateReport
], async (req, res) => {
  try {
    const requester = req.user.user;
    const { id: reportId, photoId } = req.params;
    const { caption } = req.body;

    // Check if report exists and user has permission
    const [reportRows] = await db.promise.query(`
      SELECT r.*, p.coordinator_id 
      FROM reports r
      LEFT JOIN projects p ON p.project_id = r.project_id
      WHERE r.report_id = ?
    `, [reportId]);

    if (reportRows.length === 0) {
      return res.status(404).json({ error: 'Evaluation report not found' });
    }

    const report = reportRows[0];

    // Check permissions
    if (requester.role === 'Extension Coordinator' && report.coordinator_id !== requester.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get current photos from reports table
    const [captionReportRows] = await db.promise.query(
      'SELECT photos FROM reports WHERE report_id = ?',
      [reportId]
    );

    if (captionReportRows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    let photos = [];
    try {
      photos = captionReportRows[0].photos ? JSON.parse(captionReportRows[0].photos) : [];
    } catch (err) {
      photos = [];
    }

    // Find and update the photo caption
    const photoIndex = photos.findIndex(photo => photo.photo_id == photoId);
    if (photoIndex === -1) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    photos[photoIndex].caption = caption || '';

    // Update reports table with modified photos
    await db.promise.query(
      'UPDATE reports SET photos = ? WHERE report_id = ?',
      [JSON.stringify(photos), reportId]
    );

    res.json({ message: 'Photo caption updated successfully' });
  } catch (err) {
    console.error('Error updating photo caption:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/reports/:id/photos/:photoId
// @desc    Delete a photo from a report
// @access  Private
router.delete('/:id/photos/:photoId', [auth, logActions.deleteReport], async (req, res) => {
  try {
    const requester = req.user.user;
    const { id: reportId, photoId } = req.params;

    // Check if report exists and user has permission
    const [reportRows] = await db.promise.query(`
      SELECT r.*, p.coordinator_id 
      FROM reports r
      LEFT JOIN projects p ON p.project_id = r.project_id
      WHERE r.report_id = ?
    `, [reportId]);

    if (reportRows.length === 0) {
      return res.status(404).json({ error: 'Evaluation report not found' });
    }

    const report = reportRows[0];

    // Check permissions
    if (requester.role === 'Extension Coordinator' && report.coordinator_id !== requester.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get current photos from reports table
    const [deleteReportRows] = await db.promise.query(
      'SELECT photos FROM reports WHERE report_id = ?',
      [reportId]
    );

    if (deleteReportRows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    let photos = [];
    try {
      photos = deleteReportRows[0].photos ? JSON.parse(deleteReportRows[0].photos) : [];
    } catch (err) {
      photos = [];
    }

    // Find the photo to delete
    const photoIndex = photos.findIndex(photo => photo.photo_id == photoId);
    if (photoIndex === -1) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photo = photos[photoIndex];

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../uploads/report-photos', photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove photo from array
    photos.splice(photoIndex, 1);

    // Update reports table with modified photos
    await db.promise.query(
      'UPDATE reports SET photos = ? WHERE report_id = ?',
      [JSON.stringify(photos), reportId]
    );

    res.json({ message: 'Photo deleted successfully' });
  } catch (err) {
    console.error('Error deleting photo:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
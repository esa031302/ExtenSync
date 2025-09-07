const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { logActions } = require('../middleware/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/reports');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `report-${req.user.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// @route   GET /api/reports
// @desc    Get all reports for the user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const requester = req.user.user;
    const { project_id, status } = req.query;
    
    let sql = `
      SELECT r.*, p.title as project_title, p.status as project_status,
             u.fullname as reporter_name, u.department_college as reporter_department
      FROM reports r
      LEFT JOIN projects p ON p.project_id = r.project_id
      LEFT JOIN users u ON u.user_id = r.reporter_id
      WHERE 1=1
    `;
    const params = [];

    // Filter by project if specified
    if (project_id) {
      sql += ' AND r.project_id = ?';
      params.push(project_id);
    }

    // Filter by status if specified
    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    // Extension Coordinators can only see their own reports
    if (requester.role === 'Extension Coordinator') {
      sql += ' AND r.reporter_id = ?';
      params.push(requester.id);
    }

    sql += ' ORDER BY r.created_at DESC';

    const [rows] = await db.promise.query(sql, params);
    
    // Get photos for each report and attach web URL
    for (let report of rows) {
      const [photos] = await db.promise.query(
        'SELECT * FROM reports_photos WHERE report_id = ? ORDER BY uploaded_at ASC',
        [report.report_id]
      );
      report.photos = photos.map(p => ({
        ...p,
        url: `/uploads/reports/${p.filename}`
      }));
    }

    res.json(rows);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/reports/projects
// @desc    Get projects that can have reports (On-Going or Completed)
// @access  Private
router.get('/projects', auth, async (req, res) => {
  try {
    const requester = req.user.user;
    
    let sql = `
      SELECT p.project_id, p.title, p.status, p.start_date, p.end_date,
             u.fullname as coordinator_name
      FROM projects p
      LEFT JOIN users u ON u.user_id = p.coordinator_id
      WHERE p.status IN ('On-Going', 'Completed')
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
    console.error('Error fetching projects for reports:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/reports/:id
// @desc    Get a specific report
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const requester = req.user.user;
    const reportId = req.params.id;

    const [rows] = await db.promise.query(`
      SELECT r.*, p.title as project_title, p.status as project_status,
             u.fullname as reporter_name, u.department_college as reporter_department
      FROM reports r
      LEFT JOIN projects p ON p.project_id = r.project_id
      LEFT JOIN users u ON u.user_id = r.reporter_id
      WHERE r.report_id = ?
    `, [reportId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = rows[0];

    // Check permissions
    if (requester.role === 'Extension Coordinator' && report.reporter_id !== requester.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get photos for the report
    const [photos] = await db.promise.query(
      'SELECT * FROM reports_photos WHERE report_id = ? ORDER BY uploaded_at ASC',
      [reportId]
    );
    report.photos = photos.map(p => ({
      ...p,
      url: `/uploads/reports/${p.filename}`
    }));

    res.json(report);
  } catch (err) {
    console.error('Error fetching report:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/reports
// @desc    Create a new report
// @access  Private
router.post('/', [
  auth,
  upload.array('photos', 10), // Allow up to 10 photos
  body('project_id').isInt().withMessage('Project ID must be a valid integer'),
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('type').optional().isIn(['Narrative', 'Terminal']).withMessage('Type must be Narrative or Terminal'),
  body('status').optional().isIn(['Draft', 'Submitted', 'Reviewed', 'Approved']).withMessage('Invalid status'),
  logActions.createReport
], async (req, res) => {
  try {
    const requester = req.user.user;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { project_id, title, content, type, status } = req.body;

    // Verify project exists and user has permission
    const [projectRows] = await db.promise.query(
      'SELECT * FROM projects WHERE project_id = ?',
      [project_id]
    );

    if (projectRows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectRows[0];

    // Check if project can have reports (must be On-Going or Completed)
    if (!['On-Going', 'Completed'].includes(project.status)) {
      return res.status(400).json({ 
        error: 'Reports can only be created for On-Going or Completed projects' 
      });
    }

    // Extension Coordinators can only create reports for their own projects
    if (requester.role === 'Extension Coordinator' && project.coordinator_id !== requester.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create the report
    const [result] = await db.promise.query(`
      INSERT INTO reports (project_id, reporter_id, title, content, type, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [project_id, requester.id, title, content, (type || 'Narrative'), (status || 'Draft')]);

    const reportId = result.insertId;

    // Handle photo uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await db.promise.query(`
          INSERT INTO reports_photos (report_id, filename, original_filename, file_path, file_size)
          VALUES (?, ?, ?, ?, ?)
        `, [reportId, file.filename, file.originalname, file.path, file.size]);
      }
    }

    // Get the created report with photos
    const [newReport] = await db.promise.query(`
      SELECT r.*, p.title as project_title, u.fullname as reporter_name
      FROM reports r
      LEFT JOIN projects p ON p.project_id = r.project_id
      LEFT JOIN users u ON u.user_id = r.reporter_id
      WHERE r.report_id = ?
    `, [reportId]);

    const [photos] = await db.promise.query(
      'SELECT * FROM reports_photos WHERE report_id = ? ORDER BY uploaded_at ASC',
      [reportId]
    );

    newReport[0].photos = photos.map(p => ({
      ...p,
      url: `/uploads/reports/${p.filename}`
    }));

    res.status(201).json(newReport[0]);
  } catch (err) {
    console.error('Error creating report:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/reports/:id
// @desc    Update a report
// @access  Private
router.put('/:id', [
  auth,
  upload.array('photos', 10),
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
  body('type').optional().isIn(['Narrative', 'Terminal']).withMessage('Type must be Narrative or Terminal'),
  body('status').optional().isIn(['Draft', 'Submitted', 'Reviewed', 'Approved']).withMessage('Invalid status'),
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
    const [reportRows] = await db.promise.query(
      'SELECT * FROM reports WHERE report_id = ?',
      [reportId]
    );

    if (reportRows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reportRows[0];

    // Check permissions
    if (requester.role === 'Extension Coordinator' && report.reporter_id !== requester.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (req.body.title) {
      updates.push('title = ?');
      params.push(req.body.title);
    }

    if (req.body.content) {
      updates.push('content = ?');
      params.push(req.body.content);
    }

    if (req.body.type) {
      updates.push('type = ?');
      params.push(req.body.type);
    }

    if (req.body.status) {
      updates.push('status = ?');
      params.push(req.body.status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(reportId);

    await db.promise.query(
      `UPDATE reports SET ${updates.join(', ')}, updated_at = NOW() WHERE report_id = ?`,
      params
    );

    // Handle new photo uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await db.promise.query(`
          INSERT INTO reports_photos (report_id, filename, original_filename, file_path, file_size)
          VALUES (?, ?, ?, ?, ?)
        `, [reportId, file.filename, file.originalname, file.path, file.size]);
      }
    }

    // Get updated report
    const [updatedReport] = await db.promise.query(`
      SELECT r.*, p.title as project_title, u.fullname as reporter_name
      FROM reports r
      LEFT JOIN projects p ON p.project_id = r.project_id
      LEFT JOIN users u ON u.user_id = r.reporter_id
      WHERE r.report_id = ?
    `, [reportId]);

    const [photos] = await db.promise.query(
      'SELECT * FROM reports_photos WHERE report_id = ? ORDER BY uploaded_at ASC',
      [reportId]
    );

    updatedReport[0].photos = photos.map(p => ({
      ...p,
      url: `/uploads/reports/${p.filename}`
    }));

    res.json(updatedReport[0]);
  } catch (err) {
    console.error('Error updating report:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete a report
// @access  Private
router.delete('/:id', [auth, logActions.deleteReport], async (req, res) => {
  try {
    const requester = req.user.user;
    const reportId = req.params.id;

    // Get existing report
    const [reportRows] = await db.promise.query(
      'SELECT * FROM reports WHERE report_id = ?',
      [reportId]
    );

    if (reportRows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reportRows[0];

    // Check permissions
    if (requester.role === 'Extension Coordinator' && report.reporter_id !== requester.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete photos from filesystem
    const [photos] = await db.promise.query(
      'SELECT file_path FROM reports_photos WHERE report_id = ?',
      [reportId]
    );

    for (const photo of photos) {
      if (fs.existsSync(photo.file_path)) {
        fs.unlinkSync(photo.file_path);
      }
    }

    // Delete from database (photos will be deleted by CASCADE)
    await db.promise.query('DELETE FROM reports WHERE report_id = ?', [reportId]);

    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    console.error('Error deleting report:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/reports/:id/photos/:photoId
// @desc    Delete a specific photo from a report
// @access  Private
router.delete('/:id/photos/:photoId', auth, async (req, res) => {
  try {
    const requester = req.user.user;
    const { id: reportId, photoId } = req.params;

    // Check if report exists and user has permission
    const [reportRows] = await db.promise.query(
      'SELECT * FROM reports WHERE report_id = ?',
      [reportId]
    );

    if (reportRows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reportRows[0];

    if (requester.role === 'Extension Coordinator' && report.reporter_id !== requester.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get photo info
    const [photoRows] = await db.promise.query(
      'SELECT * FROM reports_photos WHERE id = ? AND report_id = ?',
      [photoId, reportId]
    );

    if (photoRows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photo = photoRows[0];

    // Delete file from filesystem
    if (fs.existsSync(photo.file_path)) {
      fs.unlinkSync(photo.file_path);
    }

    // Delete from database
    await db.promise.query('DELETE FROM reports_photos WHERE id = ?', [photoId]);

    res.json({ message: 'Photo deleted successfully' });
  } catch (err) {
    console.error('Error deleting photo:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

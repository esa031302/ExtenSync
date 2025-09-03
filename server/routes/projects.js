const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { logActions } = require('../middleware/logger');

const router = express.Router();

const ALLOWED_PROPOSERS = new Set([
  'Extension Coordinator',
  'Extension Head',
  'GAD',
  'Admin'
]);

const ELEVATED_ROLES = new Set([
  'Extension Head',
  'GAD',
  'Vice Chancellor',
  'Chancellor',
  'Admin'
]);

// @route   GET /api/projects
// @desc    List projects
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const requester = req.user.user;
    const { status, mine } = req.query;
    const params = [];
    let where = [];

    if (status) {
      where.push('p.status = ?');
      params.push(status);
    }

    // Extension Coordinators can only view their own projects; any role can request their own via ?mine=1
    if (requester.role === 'Extension Coordinator' || String(mine).toLowerCase() === '1' || String(mine).toLowerCase() === 'true') {
      where.push('p.coordinator_id = ?');
      params.push(requester.id);
    }

    let sql = `
      SELECT p.*, u.fullname AS coordinator_fullname, u.department_college AS coordinator_department
      FROM projects p
      LEFT JOIN users u ON u.user_id = p.coordinator_id
    `;

    if (where.length > 0) {
      sql += ' WHERE ' + where.join(' AND ');
    }

    sql += ' ORDER BY p.date_submitted DESC, p.project_id DESC';

    const [rows] = await db.promise.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const requester = req.user.user;
    const [rows] = await db.promise.query(
      `SELECT p.*, u.fullname AS coordinator_fullname, u.department_college AS coordinator_department
       FROM projects p
       LEFT JOIN users u ON u.user_id = p.coordinator_id
       WHERE p.project_id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = rows[0];
    if (requester.role === 'Extension Coordinator' && project.coordinator_id !== requester.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/projects
// @desc    Create a new project proposal
// @access  Private
router.post(
  '/',
  [
    auth,
    body('title', 'Project title is required').trim().not().isEmpty(),
    logActions.createProject
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const requester = req.user.user;
      if (!ALLOWED_PROPOSERS.has(requester.role)) {
        return res.status(403).json({ error: 'You are not allowed to submit proposals' });
      }

      const {
        request_type,
        initiative_type,
        title,
        location,
        duration,
        start_date,
        end_date,
        start_time,
        end_time,
        extension_agenda = [],
        sdg_goals = [],
        offices_involved,
        programs_involved,
        project_leaders,
        partner_agencies,
        beneficiaries,
        total_cost,
        fund_source = [],
        rationale,
        objectives_general,
        objectives_specific,
        expected_output,
        strategies_methods,
        financial_plan_details,
        functional_relationships,
        monitoring_evaluation,
        sustainability_plan
      } = req.body;

      const insertParams = [
        request_type || null,
        initiative_type || null,
        title,
        location || null,
        duration || null,
        Array.isArray(extension_agenda) ? JSON.stringify(extension_agenda) : (extension_agenda || null),
        Array.isArray(sdg_goals) ? JSON.stringify(sdg_goals) : (sdg_goals || null),
        offices_involved || null,
        programs_involved || null,
        project_leaders || null,
        partner_agencies || null,
        beneficiaries || null,
        requester.id,
        null, // remarks - initially null for new proposals
        start_date || null,
        end_date || null,
        start_time || null,
        end_time || null
      ];

      let result;
      try {
        [result] = await db.promise.query(
          `INSERT INTO projects (
            request_type, initiative_type, title, location, duration,
            extension_agenda, sdg_goals, offices_involved, programs_involved,
            project_leaders, partner_agencies, beneficiaries,
            coordinator_id, remarks, status, date_submitted, last_updated,
            start_date, end_date, start_time, end_time
          ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, 'Pending', NOW(), NOW(),
            ?, ?, ?, ?
          )`,
          insertParams
        );
      } catch (insertError) {
        console.error('❌ Database insertion error:', insertError.message);
        return res.status(500).json({ 
          error: 'Failed to create project', 
          details: insertError.message
        });
      }

      const [created] = await db.promise.query(
        `SELECT p.*, u.fullname AS coordinator_fullname
         FROM projects p
         LEFT JOIN users u ON u.user_id = p.coordinator_id
         WHERE p.project_id = ?`,
        [result.insertId]
      );

      res.status(201).json(created[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// @route   DELETE /api/projects/:id
// @desc    Delete a project (elevated roles only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const requester = req.user.user;
    if (!ELEVATED_ROLES.has(requester.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [rows] = await db.promise.query('SELECT * FROM projects WHERE project_id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = rows[0];

    await db.promise.query('DELETE FROM projects WHERE project_id = ?', [req.params.id]);

    // Notify coordinator about deletion
    if (project.coordinator_id && project.coordinator_id !== requester.id) {
      await db.promise.query(
        'INSERT INTO notifications (user_id, message, link, status) VALUES (?, ?, ?, "Unread")',
        [
          project.coordinator_id,
          `Your project "${project.title}" was deleted by ${requester.fullname}`,
          `/projects/${project.project_id}`
        ]
      );
    }

    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/projects/:id/decision
// @desc    Approve or reject a project (elevated roles only)
// @access  Private
router.post('/:id/decision', [
  auth,
  body('decision').isIn(['Approved','Rejected']).withMessage('Decision must be Approved or Rejected'),
  body('remarks').optional().isString(),
  logActions.evaluateProject
], async (req, res) => {
  try {
    const requester = req.user.user;
    if (!ELEVATED_ROLES.has(requester.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { decision, remarks } = req.body;
    if (decision === 'Rejected' && (!remarks || !remarks.trim())) {
      return res.status(400).json({ error: 'Remarks are required when rejecting a project' });
    }

    const [rows] = await db.promise.query('SELECT * FROM projects WHERE project_id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = rows[0];

    await db.promise.query(
      'UPDATE projects SET status = ?, remarks = ?, last_updated = NOW() WHERE project_id = ?',
      [decision, decision === 'Rejected' ? remarks : project.remarks, req.params.id]
    );

    // If project is approved and has date/time information, create calendar event
    if (decision === 'Approved') {
      try {
        // Parse start_date, end_date, start_time, end_time from project data if available
        let startDate = null;
        let endDate = null;
        let startTime = null;
        let endTime = null;
        
        // Check if the project has these fields (they might be in JSON format or separate fields)
        if (project.start_date) {
          startDate = project.start_date;
        }
        if (project.end_date) {
          endDate = project.end_date;
        }
        if (project.start_time) {
          startTime = project.start_time;
        }
        if (project.end_time) {
          endTime = project.end_time;
        }
        
        // If we have at least a start date, create calendar event
        if (startDate) {
          await db.promise.query(
            `INSERT INTO calendar_events 
             (project_id, title, location, start_date, end_date, start_time, end_time, description, event_type) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              project.project_id,
              project.title,
              project.location || '',
              startDate,
              endDate,
              startTime,
              endTime,
              `${project.initiative_type || 'Project'}: ${project.title}`,
              project.initiative_type || 'Project'
            ]
          );
          console.log(`Calendar event created automatically for approved project: ${project.project_id}`);
        }
      } catch (calendarError) {
        // Don't fail the approval if calendar event creation fails
        console.error('Failed to create calendar event for approved project:', calendarError.message);
      }
    }

    // Notify coordinator about decision
    if (project.coordinator_id && project.coordinator_id !== requester.id) {
      const message = decision === 'Approved'
        ? `Your project "${project.title}" was approved by ${requester.fullname}`
        : `Your project "${project.title}" was rejected by ${requester.fullname}: ${remarks}`;
      await db.promise.query(
        'INSERT INTO notifications (user_id, message, link, status) VALUES (?, ?, ?, "Unread")',
        [project.coordinator_id, message, `/projects/${project.project_id}`]
      );
    }

    const [updated] = await db.promise.query(
      `SELECT p.*, u.fullname AS coordinator_fullname, u.department_college AS coordinator_department
       FROM projects p LEFT JOIN users u ON u.user_id = p.coordinator_id WHERE p.project_id = ?`,
      [req.params.id]
    );

    res.json(updated[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});
// @route   PUT /api/projects/:id
// @desc    Update an existing project proposal
// @access  Private
router.put(
  '/:id',
  [
    auth,
    body('title', 'Project title is required').optional().trim().not().isEmpty(),
  ],
  async (req, res) => {
    try {
      const [existingRows] = await db.promise.query('SELECT * FROM projects WHERE project_id = ?', [req.params.id]);
      if (existingRows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const project = existingRows[0];
      const requester = req.user.user;
      if (!(requester.role === 'Admin' || requester.id === project.coordinator_id)) {
        return res.status(403).json({ error: 'You are not allowed to edit this project' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const fields = [
        'request_type','initiative_type','title','location','duration','start_date','end_date','start_time','end_time',
        'offices_involved','programs_involved','project_leaders','partner_agencies','beneficiaries','total_cost',
        'rationale','objectives_general','objectives_specific','expected_output','strategies_methods',
        'financial_plan_details','functional_relationships','monitoring_evaluation','sustainability_plan'
      ];

      const toUpdate = {};
      for (const f of fields) {
        if (f in req.body) toUpdate[f] = req.body[f] || null;
      }

      // Handle arrays
      if ('extension_agenda' in req.body) {
        const v = req.body.extension_agenda;
        toUpdate.extension_agenda = Array.isArray(v) ? JSON.stringify(v) : (v || null);
      }
      if ('sdg_goals' in req.body) {
        const v = req.body.sdg_goals;
        toUpdate.sdg_goals = Array.isArray(v) ? JSON.stringify(v) : (v || null);
      }
      if ('fund_source' in req.body) {
        const v = req.body.fund_source;
        toUpdate.fund_source = Array.isArray(v) ? JSON.stringify(v) : (v || null);
      }

      if (Object.keys(toUpdate).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const setClause = Object.keys(toUpdate).map(k => `${k} = ?`).join(', ');
      const params = [...Object.values(toUpdate), req.params.id];

      await db.promise.query(`UPDATE projects SET ${setClause}, last_updated = NOW() WHERE project_id = ?`, params);

      const [updated] = await db.promise.query(
        `SELECT p.*, u.fullname AS coordinator_fullname, u.department_college AS coordinator_department
         FROM projects p LEFT JOIN users u ON u.user_id = p.coordinator_id WHERE p.project_id = ?`,
        [req.params.id]
      );
      // Notify coordinator if edited by someone else
      if (project.coordinator_id && requester.id !== project.coordinator_id) {
        await db.promise.query(
          'INSERT INTO notifications (user_id, message, link, status) VALUES (?, ?, ?, "Unread")',
          [
            project.coordinator_id,
            `Your project "${project.title}" was updated by ${requester.fullname}`,
            `/projects/${project.project_id}`
          ]
        );
      }

      res.json(updated[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// @route   PUT /api/projects/:id/complete
// @desc    Mark a project as completed
// @access  Private (Admin, Extension Head, GAD, Vice Chancellor, Chancellor)
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const requester = req.user.user;
    
    // Check if user has permission to mark projects as completed
    const allowedRoles = ['Admin', 'Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor'];
    if (!allowedRoles.includes(requester.role)) {
      return res.status(403).json({ error: 'Insufficient permissions to mark projects as completed' });
    }

    const [existingRows] = await db.promise.query('SELECT * FROM projects WHERE project_id = ?', [req.params.id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = existingRows[0];
    
    // Only allow marking approved projects as completed
    if (project.status !== 'Approved') {
      return res.status(400).json({ error: 'Only approved projects can be marked as completed' });
    }

    // Update project status to completed
    await db.promise.query(
      'UPDATE projects SET status = ?, last_updated = NOW() WHERE project_id = ?',
      ['Completed', req.params.id]
    );

    // Create notification for project coordinator
    if (project.coordinator_id) {
      await db.promise.query(
        'INSERT INTO notifications (user_id, message, link, status) VALUES (?, ?, ?, "Unread")',
        [
          project.coordinator_id,
          `Your project "${project.title}" has been marked as completed`,
          `/projects/${project.project_id}`
        ]
      );
    }

    // Get updated project
    const [updated] = await db.promise.query(
      `SELECT p.*, u.fullname AS coordinator_fullname, u.department_college AS coordinator_department
       FROM projects p LEFT JOIN users u ON u.user_id = p.coordinator_id WHERE p.project_id = ?`,
      [req.params.id]
    );

    res.json(updated[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/projects/stats/dashboard
// @desc    Get project statistics for dashboard (Extension Coordinators get status breakdown)
// @access  Private
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    const requester = req.user.user;
    const params = [];
    let where = [];

    // Extension Coordinators can only view their own projects
    if (requester.role === 'Extension Coordinator') {
      where.push('p.coordinator_id = ?');
      params.push(requester.id);
    }

    // For Extension Coordinators, get count by status
    if (requester.role === 'Extension Coordinator') {
      let sql = `
        SELECT 
          p.status,
          COUNT(*) as count
        FROM projects p
      `;

      if (where.length > 0) {
        sql += ' WHERE ' + where.join(' AND ');
      }

      sql += ' GROUP BY p.status ORDER BY p.status';

      const [rows] = await db.promise.query(sql, params);
      
      // Ensure we have all statuses represented
      const statusCounts = {
        'Pending': 0,
        'Approved': 0,
        'Rejected': 0,
        'Completed': 0
      };

      rows.forEach(row => {
        if (statusCounts.hasOwnProperty(row.status)) {
          statusCounts[row.status] = row.count;
        }
      });

      res.json({
        role: 'Extension Coordinator',
        projectsByStatus: statusCounts,
        totalProjects: Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
      });
    } else {
      // For other roles, get total project count
      let sql = `
        SELECT COUNT(*) as total
        FROM projects p
      `;

      if (where.length > 0) {
        sql += ' WHERE ' + where.join(' AND ');
      }

      const [rows] = await db.promise.query(sql, params);
      
      res.json({
        role: requester.role,
        totalProjects: rows[0].total
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;



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

const BENEFICIARY_ROLES = new Set([
  'Beneficiary'
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

    // Extension Coordinators can view projects they coordinate OR where they are a participant
    // Any role can request their own via ?mine=1 (still filters to coordinator_id)
    if (requester.role === 'Extension Coordinator') {
      where.push('(p.coordinator_id = ? OR EXISTS (SELECT 1 FROM project_participants pp WHERE pp.project_id = p.project_id AND pp.user_id = ?))');
      params.push(requester.id, requester.id);
    } else if (String(mine).toLowerCase() === '1' || String(mine).toLowerCase() === 'true') {
      where.push('p.coordinator_id = ?');
      params.push(requester.id);
    }
    
    // Beneficiaries can only view projects where they are listed as beneficiaries
    if (BENEFICIARY_ROLES.has(requester.role)) {
      where.push('p.beneficiaries LIKE ?');
      params.push(`%${requester.fullname}%`);
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
      // Allow if the requester is a participant in this project
      const [pp] = await db.promise.query(
        'SELECT 1 FROM project_participants WHERE project_id = ? AND user_id = ? LIMIT 1',
        [req.params.id, requester.id]
      );
      if (pp.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
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
        start_date,
        end_date,
        start_time,
        end_time,
        extension_agenda = [],
        sdg_goals = [],
        offices_involved,
        programs_involved,
        project_leader_id,
        assistant_project_leader_ids = [],
        coordinator_ids = [],
        partner_agencies,
        beneficiaries,
        total_cost,
        fund_source = [],
        rationale,
        objectives,
        expected_output,
        strategies_methods,
        financial_plan_details,
        functional_relationships,
        monitoring_evaluation,
        monitoring_evaluation_table,
        sustainability_plan,
        participants = []
      } = req.body;

      // Handle objectives - use the new combined field
      const objectivesValue = objectives || null;
      
      // Handle monitoring evaluation - use table data if available, otherwise use text field
      const monitoringEvaluationValue = monitoring_evaluation_table ? 
        JSON.stringify(monitoring_evaluation_table) : 
        (monitoring_evaluation || null);

      // Derive display names from request body (frontend sends selected user objects)
      const leaderNameFromBody = (req.body.project_leader && req.body.project_leader.fullname) || null;
      const assistantNamesFromBody = Array.isArray(req.body.assistant_project_leaders)
        ? req.body.assistant_project_leaders.map(u => u.fullname).join(', ')
        : null;
      const coordinatorNamesFromBody = Array.isArray(req.body.coordinators)
        ? req.body.coordinators.map(u => u.fullname).join(', ')
        : null;

      const insertParams = [
        request_type || null,
        initiative_type || null,
        title,
        location || null,
        Array.isArray(extension_agenda) ? JSON.stringify(extension_agenda) : (extension_agenda || null),
        Array.isArray(sdg_goals) ? JSON.stringify(sdg_goals) : (sdg_goals || null),
        offices_involved || null,
        programs_involved || null,
        leaderNameFromBody,
        assistantNamesFromBody,
        coordinatorNamesFromBody,
        partner_agencies || null,
        beneficiaries || null,
        total_cost || null,
        Array.isArray(fund_source) ? JSON.stringify(fund_source) : (fund_source || null),
        rationale || null,
        objectivesValue,
        expected_output || null,
        strategies_methods || null,
        financial_plan_details || null,
        functional_relationships || null,
        monitoringEvaluationValue,
        sustainability_plan || null,
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
            request_type, initiative_type, title, location,
            extension_agenda, sdg_goals, offices_involved, programs_involved,
            project_leader_name, assistant_project_leader_names, coordinator_names, partner_agencies, beneficiaries, total_cost, fund_source,
            rationale, objectives, expected_output,
            strategies_methods, financial_plan_details, functional_relationships,
            monitoring_evaluation, sustainability_plan,
            coordinator_id, remarks, status, date_submitted, last_updated,
            start_date, end_date, start_time, end_time
          ) VALUES (
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?,
            'Pending', NOW(), NOW(),
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

      // Insert participants into join table if provided and notify them even if join table insert fails
      if (Array.isArray(participants) && participants.length > 0) {
        const values = participants
          .filter((id) => Number.isInteger(id) || (typeof id === 'string' && id.trim() !== ''))
          .map((id) => [result.insertId, parseInt(id, 10)])
          .filter((pair) => !Number.isNaN(pair[1]));
        console.log('Participants received:', participants);
        console.log('Cleaned participant pairs for insert:', values);

        if (values.length > 0) {
          // Ensure join table exists, then try to insert participant links
          try {
            await db.promise.query(`
              CREATE TABLE IF NOT EXISTS project_participants (
                project_id INT NOT NULL,
                user_id INT NOT NULL,
                PRIMARY KEY (project_id, user_id),
                INDEX idx_pp_user (user_id),
                CONSTRAINT fk_pp_project FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
                CONSTRAINT fk_pp_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            await db.promise.query(
              'INSERT INTO project_participants (project_id, user_id) VALUES ?'
              , [values]
            );
          } catch (participantError) {
            console.error('Failed to insert participants:', participantError.message);
          }

          // Insert notifications regardless of participant link insert outcome
          try {
            const message = `You have been selected as a participant in "${title}".`;
            const link = `/projects/${result.insertId}`;
            const notifValues = values.map(([, userId]) => [userId, message, link, 'Unread']);
            console.log('Inserting notifications:', notifValues);
            await db.promise.query(
              'INSERT INTO notifications (user_id, message, link, status) VALUES ?'
              , [notifValues]
            );
            console.log('Notifications inserted for participants');
          } catch (notifError) {
            console.error('Failed to insert notifications:', notifError.message);
          }
        }
      }

      // Resolve and update names (best-effort; ignore failures)
      try {
        if (project_leader_id) {
          const [rows] = await db.promise.query('SELECT fullname FROM users WHERE user_id = ?', [project_leader_id]);
          const leaderName = rows[0]?.fullname || null;
          if (leaderName) {
            await db.promise.query('UPDATE projects SET project_leader_name = ? WHERE project_id = ?', [leaderName, result.insertId]);
          }
        }
        if (Array.isArray(assistant_project_leader_ids) && assistant_project_leader_ids.length > 0) {
          const [rows] = await db.promise.query(
            `SELECT GROUP_CONCAT(fullname SEPARATOR ', ') AS names FROM users WHERE user_id IN (${assistant_project_leader_ids.map(() => '?').join(',')})`,
            assistant_project_leader_ids
          );
          const names = rows[0]?.names || null;
          if (names) {
            await db.promise.query('UPDATE projects SET assistant_project_leader_names = ? WHERE project_id = ?', [names, result.insertId]);
          }
        }
        if (Array.isArray(coordinator_ids) && coordinator_ids.length > 0) {
          const [rows] = await db.promise.query(
            `SELECT GROUP_CONCAT(fullname SEPARATOR ', ') AS names FROM users WHERE user_id IN (${coordinator_ids.map(() => '?').join(',')})`,
            coordinator_ids
          );
          const names = rows[0]?.names || null;
          if (names) {
            await db.promise.query('UPDATE projects SET coordinator_names = ? WHERE project_id = ?', [names, result.insertId]);
          }
        }
      } catch (nameErr) {
        console.warn('Name resolution warning:', nameErr.message);
      }

      // Notify assistant project leaders
      if (Array.isArray(assistant_project_leader_ids) && assistant_project_leader_ids.length > 0) {
        try {
          const message = `You have been selected as an Assistant Project Leader for "${title}".`;
          const link = `/projects/${result.insertId}`;
          const notifValues = assistant_project_leader_ids.map((id) => [parseInt(id, 10), message, link, 'Unread']);
          await db.promise.query(
            'INSERT INTO notifications (user_id, message, link, status) VALUES ?',
            [notifValues]
          );
        } catch (error) {
          console.error('Failed to notify assistant project leaders:', error.message);
        }
      }

      // Notify coordinators
      if (Array.isArray(coordinator_ids) && coordinator_ids.length > 0) {
        try {
          const message = `You have been selected as a Coordinator for "${title}".`;
          const link = `/projects/${result.insertId}`;
          const notifValues = coordinator_ids.map((id) => [parseInt(id, 10), message, link, 'Unread']);
          await db.promise.query(
            'INSERT INTO notifications (user_id, message, link, status) VALUES ?',
            [notifValues]
          );
        } catch (error) {
          console.error('Failed to notify coordinators:', error.message);
        }
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
router.delete('/:id', [auth, logActions.deleteProject], async (req, res) => {
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
  (req, res, next) => {
    // Use appropriate logger based on decision
    if (req.body.decision === 'Approved') {
      return logActions.approveProject(req, res, next);
    } else if (req.body.decision === 'Rejected') {
      return logActions.rejectProject(req, res, next);
    } else {
      return logActions.evaluateProject(req, res, next);
    }
  }
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
    logActions.updateProject
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
        'request_type','initiative_type','title','location','start_date','end_date','start_time','end_time',
        'offices_involved','programs_involved','project_leaders','partner_agencies','beneficiaries','total_cost',
        'rationale','objectives','expected_output','strategies_methods',
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
      if ('monitoring_evaluation_table' in req.body) {
        const v = req.body.monitoring_evaluation_table;
        toUpdate.monitoring_evaluation = v ? JSON.stringify(v) : null;
      }

      // Handle status changes (elevated roles only)
      if ('status' in req.body) {
        const elevatedRoles = ['Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor', 'Admin'];
        if (!elevatedRoles.includes(requester.role)) {
          return res.status(403).json({ error: 'Only elevated roles can change project status' });
        }
        
        const newStatus = req.body.status;
        const validStatuses = ['Pending', 'Approved', 'On-Going', 'Completed', 'Rejected'];
        if (!validStatuses.includes(newStatus)) {
          return res.status(400).json({ error: 'Invalid status value' });
        }
        
        toUpdate.status = newStatus;
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
      // Enhanced notification system for project changes
      const statusChanged = 'status' in req.body && req.body.status !== project.status;
      const oldStatus = project.status;
      const newStatus = req.body.status;

      // Notify coordinator if edited by someone else (always notify for any changes)
      if (project.coordinator_id && requester.id !== project.coordinator_id) {
        let notificationMessage;
        
        if (statusChanged) {
          // Status-specific notifications
          switch (newStatus) {
            case 'Approved':
              notificationMessage = `🎉 Great news! Your project "${project.title}" has been approved by ${requester.fullname}`;
              break;
            case 'Rejected':
              notificationMessage = `❌ Your project "${project.title}" has been rejected by ${requester.fullname}. Please check the remarks for details.`;
              break;
            case 'On-Going':
              notificationMessage = `🚀 Your project "${project.title}" has been marked as On-Going by ${requester.fullname}`;
              break;
            case 'Completed':
              notificationMessage = `✅ Your project "${project.title}" has been marked as Completed by ${requester.fullname}`;
              break;
            case 'Pending':
              notificationMessage = `⏳ Your project "${project.title}" status has been changed to Pending by ${requester.fullname}`;
              break;
            default:
              notificationMessage = `📝 Your project "${project.title}" status was changed to "${newStatus}" by ${requester.fullname}`;
          }
        } else {
          // General project update notification
          notificationMessage = `📝 Your project "${project.title}" has been updated by ${requester.fullname}`;
        }
        
        await db.promise.query(
          'INSERT INTO notifications (user_id, message, link, status) VALUES (?, ?, ?, "Unread")',
          [
            project.coordinator_id,
            notificationMessage,
            `/projects/${project.project_id}`
          ]
        );
      }

      // Notify elevated users for important status changes
      if (statusChanged) {
        const elevatedUsers = await db.promise.query(
          'SELECT user_id FROM users WHERE role IN ("Extension Head", "GAD", "Vice Chancellor", "Chancellor", "Admin") AND account_status = "Active" AND user_id != ?',
          [requester.id]
        );
        
        // Different notifications based on status changes
        let elevatedNotificationMessage = '';
        let shouldNotifyElevated = false;

        switch (newStatus) {
          case 'Approved':
            if (oldStatus === 'Pending') {
              elevatedNotificationMessage = `✅ Project "${project.title}" has been approved by ${requester.fullname}`;
              shouldNotifyElevated = true;
            }
            break;
          case 'Rejected':
            if (oldStatus === 'Pending') {
              elevatedNotificationMessage = `❌ Project "${project.title}" has been rejected by ${requester.fullname}`;
              shouldNotifyElevated = true;
            }
            break;
          case 'On-Going':
            elevatedNotificationMessage = `🚀 Project "${project.title}" has started (changed to On-Going) by ${requester.fullname}`;
            shouldNotifyElevated = true;
            break;
          case 'Completed':
            elevatedNotificationMessage = `🎯 Project "${project.title}" has been completed by ${requester.fullname}`;
            shouldNotifyElevated = true;
            break;
        }

        if (shouldNotifyElevated && elevatedNotificationMessage) {
          for (const user of elevatedUsers[0]) {
            await db.promise.query(
              'INSERT INTO notifications (user_id, message, link, status) VALUES (?, ?, ?, "Unread")',
              [
                user.user_id,
                elevatedNotificationMessage,
                `/projects/${project.project_id}`
              ]
            );
          }
        }
      }

      res.json(updated[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// @route   PUT /api/projects/:id/start
// @desc    Start a project (Extension Coordinator - project proposer only)
// @access  Private
router.put('/:id/start', [auth, logActions.startProject], async (req, res) => {
  try {
    const requester = req.user.user;

    const [existingRows] = await db.promise.query('SELECT * FROM projects WHERE project_id = ?', [req.params.id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = existingRows[0];
    
    // Project coordinator or elevated roles can start projects
    const allowedRoles = ['Admin', 'Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor'];
    const isProjectCoordinator = project.coordinator_id === requester.id;
    const hasElevatedRole = allowedRoles.includes(requester.role);
    
    if (!isProjectCoordinator && !hasElevatedRole) {
      return res.status(403).json({ error: 'Only the project proposer or elevated roles can start this project' });
    }
    
    // Project must be approved to be started
    if (project.status !== 'Approved') {
      return res.status(400).json({ error: 'Only approved projects can be started' });
    }

    // Check if today is on or after the start date
    if (project.start_date) {
      const today = new Date();
      const startDate = new Date(project.start_date);
      today.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      
      if (today < startDate) {
        return res.status(400).json({ error: 'Project can only be started on or after the start date' });
      }
    }

    // Update project status to On-Going
    await db.promise.query(
      'UPDATE projects SET status = ?, last_updated = NOW() WHERE project_id = ?',
      ['On-Going', req.params.id]
    );

    // Enhanced notifications for project start
    // Notify coordinator if started by someone else
    if (project.coordinator_id && project.coordinator_id !== requester.id) {
      await db.promise.query(
        'INSERT INTO notifications (user_id, message, link, status) VALUES (?, ?, ?, "Unread")',
        [
          project.coordinator_id,
          `🚀 Your project "${project.title}" has been started by ${requester.fullname}`,
          `/projects/${project.project_id}`
        ]
      );
    }

    // Create notification for elevated users
    const elevatedUsers = await db.promise.query(
      'SELECT user_id FROM users WHERE role IN ("Extension Head", "GAD", "Vice Chancellor", "Chancellor", "Admin") AND account_status = "Active" AND user_id != ?',
      [requester.id]
    );
    
    for (const user of elevatedUsers[0]) {
      await db.promise.query(
        'INSERT INTO notifications (user_id, message, link, status) VALUES (?, ?, ?, "Unread")',
        [
          user.user_id,
          `🚀 Project "${project.title}" has been started by ${requester.fullname}`,
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

// @route   PUT /api/projects/:id/complete
// @desc    Mark a project as completed
// @access  Private (Extension Coordinator - project proposer, or elevated roles)
router.put('/:id/complete', [auth, logActions.completeProject], async (req, res) => {
  try {
    const requester = req.user.user;

    const [existingRows] = await db.promise.query('SELECT * FROM projects WHERE project_id = ?', [req.params.id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = existingRows[0];
    
    // Allow project coordinator or elevated roles to complete projects
    const allowedRoles = ['Admin', 'Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor'];
    const isProjectCoordinator = project.coordinator_id === requester.id;
    const hasElevatedRole = allowedRoles.includes(requester.role);
    
    if (!isProjectCoordinator && !hasElevatedRole) {
      return res.status(403).json({ error: 'Insufficient permissions to mark projects as completed' });
    }
    
    // Only allow completing On-Going projects
    if (project.status !== 'On-Going') {
      return res.status(400).json({ error: 'Only on-going projects can be marked as completed' });
    }

    // Check if completing early and handle early completion reason
    let earlyCompletionReason = null;
    if (isProjectCoordinator && project.end_date) {
      const today = new Date();
      const endDate = new Date(project.end_date);
      today.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      if (today < endDate) {
        // Completing before end date - require reason
        earlyCompletionReason = req.body.early_completion_reason;
        if (!earlyCompletionReason || earlyCompletionReason.trim() === '') {
          return res.status(400).json({ 
            error: 'Early completion reason is required when completing project before the scheduled end date',
            requiresReason: true,
            endDate: project.end_date
          });
        }
      }
    }

    // Update project status to completed (with early completion reason if applicable)
    if (earlyCompletionReason) {
      await db.promise.query(
        'UPDATE projects SET status = ?, early_completion_reason = ?, last_updated = NOW() WHERE project_id = ?',
        ['Completed', earlyCompletionReason.trim(), req.params.id]
      );
    } else {
      await db.promise.query(
        'UPDATE projects SET status = ?, last_updated = NOW() WHERE project_id = ?',
        ['Completed', req.params.id]
      );
    }

    // Enhanced notifications for project completion
    // Create notification for project coordinator if completed by someone else
    if (project.coordinator_id && project.coordinator_id !== requester.id) {
      let coordinatorMessage = `✅ Your project "${project.title}" has been marked as completed by ${requester.fullname}`;
      if (earlyCompletionReason) {
        coordinatorMessage = `✅ Your project "${project.title}" has been completed early by ${requester.fullname}. Reason: "${earlyCompletionReason}"`;
      }
      
      await db.promise.query(
        'INSERT INTO notifications (user_id, message, link, status) VALUES (?, ?, ?, "Unread")',
        [
          project.coordinator_id,
          coordinatorMessage,
          `/projects/${project.project_id}`
        ]
      );
    }
    
    // Create notification for elevated users
    const elevatedUsers = await db.promise.query(
      'SELECT user_id FROM users WHERE role IN ("Extension Head", "GAD", "Vice Chancellor", "Chancellor", "Admin") AND account_status = "Active" AND user_id != ?',
      [requester.id]
    );
    
    let elevatedMessage = `🎯 Project "${project.title}" has been completed by ${requester.fullname}`;
    if (earlyCompletionReason) {
      elevatedMessage = `🎯 Project "${project.title}" has been completed early by ${requester.fullname}. Reason: "${earlyCompletionReason}"`;
    }
    
    for (const user of elevatedUsers[0]) {
      await db.promise.query(
        'INSERT INTO notifications (user_id, message, link, status) VALUES (?, ?, ?, "Unread")',
        [
          user.user_id,
          elevatedMessage,
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

// @route   PUT /api/projects/:id/repropose
// @desc    Repropose a rejected project (project coordinator only)
// @access  Private
router.put('/:id/repropose', [auth, logActions.reproposeProject], async (req, res) => {
  try {
    const requester = req.user.user;
    
    const [existingRows] = await db.promise.query('SELECT * FROM projects WHERE project_id = ?', [req.params.id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = existingRows[0];
    
    // Only the project coordinator can repropose their rejected project
    if (project.coordinator_id !== requester.id) {
      return res.status(403).json({ error: 'Only the project coordinator can repropose this project' });
    }
    
    // Only rejected projects can be reproposed
    if (project.status !== 'Rejected') {
      return res.status(400).json({ error: 'Only rejected projects can be reproposed' });
    }

    // Update project status to Pending and clear remarks
    await db.promise.query(
      'UPDATE projects SET status = ?, remarks = NULL, last_updated = NOW() WHERE project_id = ?',
      ['Pending', req.params.id]
    );

    // Create notification for elevated users about reproposal
    const elevatedUsers = await db.promise.query(
      'SELECT user_id FROM users WHERE role IN ("Extension Head", "GAD", "Vice Chancellor", "Chancellor", "Admin") AND account_status = "Active"'
    );
    
    for (const user of elevatedUsers[0]) {
      await db.promise.query(
        'INSERT INTO notifications (user_id, message, link, status) VALUES (?, ?, ?, "Unread")',
        [
          user.user_id,
          `📝 Project "${project.title}" has been reproposed by ${requester.fullname}`,
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

// @route   PUT /api/projects/:id/dates
// @desc    Update project dates (elevated roles only - not Extension Coordinator)
// @access  Private
router.put('/:id/dates', [
  auth,
  body('start_date').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('end_date').optional().isISO8601().withMessage('End date must be a valid date'),
  body('start_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
  body('end_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format'),
  logActions.updateProject
], async (req, res) => {
  try {
    const requester = req.user.user;
    
    // Only elevated roles can adjust dates, OR coordinators can adjust dates for their own rejected projects
    const allowedRoles = ['Admin', 'Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor'];
    const isElevatedRole = allowedRoles.includes(requester.role);
    const isCoordinatorEditingRejected = requester.role === 'Extension Coordinator' && 
                                        project.coordinator_id === requester.id && 
                                        project.status === 'Rejected';
    
    if (!isElevatedRole && !isCoordinatorEditingRejected) {
      return res.status(403).json({ error: 'Insufficient permissions to adjust project dates' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const [existingRows] = await db.promise.query('SELECT * FROM projects WHERE project_id = ?', [req.params.id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = existingRows[0];
    const { start_date, end_date, start_time, end_time } = req.body;

    // Validate that end date is not before start date
    if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'End date cannot be before start date' });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    
    if (start_date !== undefined) {
      updates.push('start_date = ?');
      params.push(start_date || null);
    }
    if (end_date !== undefined) {
      updates.push('end_date = ?');
      params.push(end_date || null);
    }
    if (start_time !== undefined) {
      updates.push('start_time = ?');
      params.push(start_time || null);
    }
    if (end_time !== undefined) {
      updates.push('end_time = ?');
      params.push(end_time || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No date/time fields provided for update' });
    }

    // Update the project
    params.push(req.params.id);
    await db.promise.query(
      `UPDATE projects SET ${updates.join(', ')}, last_updated = NOW() WHERE project_id = ?`,
      params
    );

    // Create notification for project coordinator
    if (project.coordinator_id) {
      await db.promise.query(
        'INSERT INTO notifications (user_id, message, link, status) VALUES (?, ?, ?, "Unread")',
        [
          project.coordinator_id,
          `The dates for your project "${project.title}" have been updated by ${requester.fullname}`,
          `/projects/${project.project_id}`
        ]
      );
    }

    // Update calendar event if it exists
    try {
      const [calendarEvents] = await db.promise.query(
        'SELECT * FROM calendar_events WHERE project_id = ?',
        [req.params.id]
      );
      
      if (calendarEvents.length > 0) {
        const calendarUpdates = [];
        const calendarParams = [];
        
        if (start_date !== undefined) {
          calendarUpdates.push('start_date = ?');
          calendarParams.push(start_date || null);
        }
        if (end_date !== undefined) {
          calendarUpdates.push('end_date = ?');
          calendarParams.push(end_date || null);
        }
        if (start_time !== undefined) {
          calendarUpdates.push('start_time = ?');
          calendarParams.push(start_time || null);
        }
        if (end_time !== undefined) {
          calendarUpdates.push('end_time = ?');
          calendarParams.push(end_time || null);
        }
        
        if (calendarUpdates.length > 0) {
          calendarParams.push(req.params.id);
          await db.promise.query(
            `UPDATE calendar_events SET ${calendarUpdates.join(', ')} WHERE project_id = ?`,
            calendarParams
          );
        }
      }
    } catch (calendarError) {
      console.error('Failed to update calendar event:', calendarError.message);
      // Don't fail the request if calendar update fails
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
        'On-Going': 0,
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
      // For other roles, get counts by initiative type (Program, Project, Activity)
      let sql = `
        SELECT 
          p.initiative_type,
          COUNT(*) as count
        FROM projects p
      `;

      if (where.length > 0) {
        sql += ' WHERE ' + where.join(' AND ');
      }

      sql += ' GROUP BY p.initiative_type ORDER BY p.initiative_type';

      const [rows] = await db.promise.query(sql, params);
      
      // Ensure we have all initiative types represented
      const initiativeCounts = {
        'Program': 0,
        'Project': 0,
        'Activity': 0
      };

      rows.forEach(row => {
        if (row.initiative_type && initiativeCounts.hasOwnProperty(row.initiative_type)) {
          initiativeCounts[row.initiative_type] = row.count;
        }
      });

      const totalProjects = Object.values(initiativeCounts).reduce((sum, count) => sum + count, 0);
      
      res.json({
        role: requester.role,
        totalProjects: totalProjects,
        initiativesByType: initiativeCounts,
        totalPrograms: initiativeCounts.Program,
        totalActivities: initiativeCounts.Activity
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;



const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const auth = require('../middleware/auth');
const { logSystemActivity } = require('../middleware/logger');
const pool = require('../config/database');
const promisePool = require('../config/database').promise;

// Get all evaluations with project and evaluator details
router.get('/', auth, async (req, res) => {
  let connection;
  try {
    connection = await promisePool.getConnection();
    
    const query = `
      SELECT 
        e.eval_id,
        e.project_id,
        e.evaluator_id,
        e.feedback,
        e.decision,
        e.total_score,
        e.max_score,
        e.score_percentage,
        e.rubric_scores,
        e.created_at,
        p.title as project_title,
        p.status as project_status,
        u.fullname as evaluator_name,
        u.role as evaluator_role
      FROM evaluations e
      JOIN projects p ON e.project_id = p.project_id
      JOIN users u ON e.evaluator_id = u.user_id
      ORDER BY e.created_at DESC
    `;
    
    const [evaluations] = await connection.execute(query);
    
    res.json(evaluations);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({ error: 'Failed to fetch evaluations' });
  } finally {
    if (connection) connection.release();
  }
});

// Get evaluations for a specific project
router.get('/project/:projectId', auth, async (req, res) => {
  let connection;
  try {
    const { projectId } = req.params;
    connection = await promisePool.getConnection();
    
    const query = `
      SELECT 
        e.eval_id,
        e.project_id,
        e.evaluator_id,
        e.feedback,
        e.decision,
        e.total_score,
        e.max_score,
        e.score_percentage,
        e.rubric_scores,
        e.created_at,
        u.fullname as evaluator_name,
        u.role as evaluator_role
      FROM evaluations e
      JOIN users u ON e.evaluator_id = u.user_id
      WHERE e.project_id = ?
      ORDER BY e.created_at DESC
    `;
    
    const [evaluations] = await connection.execute(query, [projectId]);
    
    res.json(evaluations);
  } catch (error) {
    console.error('Error fetching project evaluations:', error);
    res.status(500).json({ error: 'Failed to fetch project evaluations' });
  } finally {
    if (connection) connection.release();
  }
});

// Get evaluations by evaluator
router.get('/evaluator/:evaluatorId', auth, async (req, res) => {
  let connection;
  try {
    const { evaluatorId } = req.params;
    connection = await promisePool.getConnection();
    
    const query = `
      SELECT 
        e.eval_id,
        e.project_id,
        e.evaluator_id,
        e.feedback,
        e.decision,
        e.total_score,
        e.max_score,
        e.score_percentage,
        e.rubric_scores,
        e.created_at,
        p.title as project_title,
        p.status as project_status
      FROM evaluations e
      JOIN projects p ON e.project_id = p.project_id
      WHERE e.evaluator_id = ?
      ORDER BY e.created_at DESC
    `;
    
    const [evaluations] = await connection.execute(query, [evaluatorId]);
    
    res.json(evaluations);
  } catch (error) {
    console.error('Error fetching evaluator evaluations:', error);
    res.status(500).json({ error: 'Failed to fetch evaluator evaluations' });
  } finally {
    if (connection) connection.release();
  }
});

// Get a specific evaluation
router.get('/:evalId', auth, async (req, res) => {
  let connection;
  try {
    const { evalId } = req.params;
    connection = await promisePool.getConnection();
    
    const query = `
      SELECT 
        e.eval_id,
        e.project_id,
        e.evaluator_id,
        e.feedback,
        e.decision,
        e.total_score,
        e.max_score,
        e.score_percentage,
        e.rubric_scores,
        e.created_at,
        p.title as project_title,
        p.status as project_status,
        u.fullname as evaluator_name,
        u.role as evaluator_role
      FROM evaluations e
      JOIN projects p ON e.project_id = p.project_id
      JOIN users u ON e.evaluator_id = u.user_id
      WHERE e.eval_id = ?
    `;
    
    const [evaluations] = await connection.execute(query, [evalId]);
    
    if (evaluations.length === 0) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    
    res.json(evaluations[0]);
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    res.status(500).json({ error: 'Failed to fetch evaluation' });
  } finally {
    if (connection) connection.release();
  }
});

// Create a new evaluation
router.post('/', auth, async (req, res) => {
  let connection;
  try {
    const { project_id, feedback, decision } = req.body;
    const evaluator_id = req.user.user.id;
    
    // Validate required fields
    if (!project_id || !feedback || !decision) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate decision enum
    const validDecisions = ['Approved', 'Rejected', 'Needs Revision'];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision value' });
    }
    
    // Check if user has permission to evaluate (Extension Head, GAD, Vice Chancellor, Chancellor, Admin, System Administrator)
    const allowedRoles = ['Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor', 'Admin', 'System Administrator'];
    if (!allowedRoles.includes(req.user.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions to create evaluations' });
    }
    
    connection = await promisePool.getConnection();
    
         // Check if project exists and is completed
     const [projects] = await connection.execute(
       'SELECT project_id, title, status FROM projects WHERE project_id = ?',
       [project_id]
     );
    
         if (projects.length === 0) {
       return res.status(404).json({ error: 'Project not found' });
     }
     
     // Only allow evaluation of completed projects
     if (projects[0].status !== 'Completed') {
       return res.status(400).json({ error: 'Only completed projects can be evaluated' });
     }
    
    // Check if evaluation already exists for this project by this evaluator
    const [existingEvals] = await connection.execute(
      'SELECT eval_id FROM evaluations WHERE project_id = ? AND evaluator_id = ?',
      [project_id, evaluator_id]
    );
    
    if (existingEvals.length > 0) {
      return res.status(409).json({ error: 'Evaluation already exists for this project by this evaluator' });
    }
    
    // Insert evaluation
    const [result] = await connection.execute(
      'INSERT INTO evaluations (project_id, evaluator_id, feedback, decision, total_score, max_score, score_percentage, rubric_scores) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [project_id, evaluator_id, feedback, decision, req.body.total_score || 0, req.body.max_score || 100, req.body.score_percentage || 0, JSON.stringify(req.body.rubric_scores || {})]
    );
    
              // Note: Project status remains "Completed" - evaluations don't change project status
    
    // Create notification for project coordinator
    const [projectCoords] = await connection.execute(
      'SELECT coordinator_id FROM projects WHERE project_id = ?',
      [project_id]
    );
    
    if (projectCoords.length > 0 && projectCoords[0].coordinator_id) {
             const notificationMessage = `Your completed project "${projects[0].title}" has been evaluated with decision: ${decision}`;
      await connection.execute(
        'INSERT INTO notifications (user_id, message, link) VALUES (?, ?, ?)',
        [projectCoords[0].coordinator_id, notificationMessage, `/projects/${project_id}`]
      );
    }
    
    // Get the created evaluation
    const [newEvaluation] = await connection.execute(
      `SELECT 
        e.eval_id,
        e.project_id,
        e.evaluator_id,
        e.feedback,
        e.decision,
        e.total_score,
        e.max_score,
        e.score_percentage,
        e.rubric_scores,
        e.created_at,
        p.title as project_title,
        u.fullname as evaluator_name,
        u.role as evaluator_role
      FROM evaluations e
      JOIN projects p ON e.project_id = p.project_id
      JOIN users u ON e.evaluator_id = u.user_id
      WHERE e.eval_id = ?`,
      [result.insertId]
    );
    
    console.log(`Evaluation created: ${result.insertId} for project: ${project_id} by user: ${evaluator_id}`);
    res.status(201).json(newEvaluation[0]);
  } catch (error) {
    console.error('Error creating evaluation:', error);
    res.status(500).json({ error: 'Failed to create evaluation' });
  } finally {
    if (connection) connection.release();
  }
});

// Update an evaluation
router.put('/:evalId', auth, async (req, res) => {
  let connection;
  try {
    const { evalId } = req.params;
    const { feedback, decision } = req.body;
    
    // Validate required fields
    if (!feedback || !decision) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate decision enum
    const validDecisions = ['Approved', 'Rejected', 'Needs Revision'];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision value' });
    }
    
    // Check if user has permission to update evaluations
    const allowedRoles = ['Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor', 'Admin'];
    if (!allowedRoles.includes(req.user.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions to update evaluations' });
    }
    
        connection = await promisePool.getConnection();
    
    // Check if evaluation exists and belongs to the user or user is admin
     const [evaluations] = await connection.execute(
       'SELECT eval_id, evaluator_id, project_id FROM evaluations WHERE eval_id = ?',
       [evalId]
     );
     
     if (evaluations.length === 0) {
       return res.status(404).json({ error: 'Evaluation not found' });
     }
     
     const evaluation = evaluations[0];
     
     // Check if the associated project is completed
     const [projects] = await connection.execute(
       'SELECT project_id, title, status FROM projects WHERE project_id = ?',
       [evaluation.project_id]
     );
     
     if (projects.length === 0) {
       return res.status(404).json({ error: 'Associated project not found' });
     }
     
          if (projects[0].status !== 'Completed') {
       return res.status(400).json({ error: 'Can only edit evaluations for completed projects' });
     }
    
    // Only allow updates if user is the evaluator or is admin
    if (evaluation.evaluator_id !== req.user.user.id && req.user.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Can only update your own evaluations' });
    }
    
    // Update evaluation
    await connection.execute(
      'UPDATE evaluations SET feedback = ?, decision = ?, total_score = ?, max_score = ?, score_percentage = ?, rubric_scores = ? WHERE eval_id = ?',
      [feedback, decision, req.body.total_score || 0, req.body.max_score || 100, req.body.score_percentage || 0, JSON.stringify(req.body.rubric_scores || {}), evalId]
    );
    
              // Note: Project status remains "Completed" - evaluations don't change project status
    
    // Get the updated evaluation
    const [updatedEvaluation] = await connection.execute(
      `SELECT 
        e.eval_id,
        e.project_id,
        e.evaluator_id,
        e.feedback,
        e.decision,
        e.total_score,
        e.max_score,
        e.score_percentage,
        e.rubric_scores,
        e.created_at,
        p.title as project_title,
        u.fullname as evaluator_name,
        u.role as evaluator_role
      FROM evaluations e
      JOIN projects p ON e.project_id = p.project_id
      JOIN users u ON e.evaluator_id = u.user_id
      WHERE e.eval_id = ?`,
      [evalId]
    );
    
    console.log(`Evaluation updated: ${evalId} by user: ${req.user.user.id}`);
    res.json(updatedEvaluation[0]);
  } catch (error) {
    console.error('Error updating evaluation:', error);
    res.status(500).json({ error: 'Failed to update evaluation' });
  } finally {
    if (connection) connection.release();
  }
});

// Delete an evaluation
router.delete('/:evalId', auth, async (req, res) => {
  let connection;
  try {
    const { evalId } = req.params;
    
    // Check if user has permission to delete evaluations
    if (req.user.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can delete evaluations' });
    }
    
    connection = await promisePool.getConnection();
    
    // Check if evaluation exists
    const [evaluations] = await connection.execute(
      'SELECT eval_id, project_id FROM evaluations WHERE eval_id = ?',
      [evalId]
    );
    
    if (evaluations.length === 0) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    
    // Delete evaluation
    await connection.execute('DELETE FROM evaluations WHERE eval_id = ?', [evalId]);
    
    console.log(`Evaluation deleted: ${evalId} by admin: ${req.user.user.id}`);
    res.json({ message: 'Evaluation deleted successfully' });
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    res.status(500).json({ error: 'Failed to delete evaluation' });
  } finally {
    if (connection) connection.release();
  }
});

// Get evaluation statistics
router.get('/stats/overview', auth, async (req, res) => {
  let connection;
  try {
    connection = await promisePool.getConnection();
    
    // Get total evaluations
    const [totalEvals] = await connection.execute('SELECT COUNT(*) as total FROM evaluations');
    
    // Get evaluations by decision
    const [decisionStats] = await connection.execute(`
      SELECT decision, COUNT(*) as count 
      FROM evaluations 
      GROUP BY decision
    `);
    
    // Get evaluations by month (last 6 months)
    const [monthlyStats] = await connection.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM evaluations 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `);
    
    // Get top evaluators
    const [topEvaluators] = await connection.execute(`
      SELECT 
        u.fullname,
        u.role,
        COUNT(*) as evaluation_count
      FROM evaluations e
      JOIN users u ON e.evaluator_id = u.user_id
      GROUP BY e.evaluator_id
      ORDER BY evaluation_count DESC
      LIMIT 5
    `);
    
    res.json({
      total: totalEvals[0].total,
      byDecision: decisionStats,
      monthly: monthlyStats,
      topEvaluators
    });
  } catch (error) {
    console.error('Error fetching evaluation statistics:', error);
    res.status(500).json({ error: 'Failed to fetch evaluation statistics' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const auth = require('../middleware/auth');
const { logSystemActivity, logActions } = require('../middleware/logger');
const pool = require('../config/database');
const promisePool = require('../config/database').promise;

// Get all evaluations with project and evaluator details
router.get('/', auth, async (req, res) => {
  let connection;
  try {
    const requester = req.user.user;
    connection = await promisePool.getConnection();
    
    let query = `
      SELECT 
        e.eval_id,
        e.project_id,
        e.evaluator_id,
        e.feedback,
        e.decision,
        e.created_at,
        p.title as project_title,
        p.status as project_status,
        p.coordinator_id,
        u.fullname as evaluator_name,
        u.role as evaluator_role
      FROM evaluations e
      JOIN projects p ON e.project_id = p.project_id
      JOIN users u ON e.evaluator_id = u.user_id
    `;
    
    const params = [];
    
    // Extension Coordinators can only view evaluations for their own projects
    if (requester.role === 'Extension Coordinator') {
      query += ' WHERE p.coordinator_id = ?';
      params.push(requester.id);
    }
    
    query += ' ORDER BY e.created_at DESC';
    
    const [evaluations] = await connection.execute(query, params);
    
    // Return evaluations as-is (no parsing needed)
    const parsedEvaluations = evaluations;
    
    res.json(parsedEvaluations);
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
        e.created_at,
        u.fullname as evaluator_name,
        u.role as evaluator_role
      FROM evaluations e
      JOIN users u ON e.evaluator_id = u.user_id
      WHERE e.project_id = ?
      ORDER BY e.created_at DESC
    `;
    
    const [evaluations] = await connection.execute(query, [projectId]);
    
    // Return evaluations as-is (no parsing needed)
    const parsedEvaluations = evaluations;
    
    res.json(parsedEvaluations);
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
        e.created_at,
        p.title as project_title,
        p.status as project_status
      FROM evaluations e
      JOIN projects p ON e.project_id = p.project_id
      WHERE e.evaluator_id = ?
      ORDER BY e.created_at DESC
    `;
    
    const [evaluations] = await connection.execute(query, [evaluatorId]);
    
    // Return evaluations as-is (no parsing needed)
    const parsedEvaluations = evaluations;
    
    res.json(parsedEvaluations);
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
    const requester = req.user.user;
    connection = await promisePool.getConnection();
    
    const query = `
      SELECT 
        e.eval_id,
        e.project_id,
        e.evaluator_id,
        e.feedback,
        e.decision,
        e.created_at,
        p.title as project_title,
        p.status as project_status,
        p.coordinator_id,
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
    
    const evaluation = evaluations[0];
    
    // Extension Coordinators can only view evaluations for their own projects
    if (requester.role === 'Extension Coordinator' && evaluation.coordinator_id !== requester.id) {
      return res.status(403).json({ error: 'Access denied. You can only view evaluations for your own projects.' });
    }
    
    // Return evaluation as-is (no parsing needed)
    const parsedEvaluation = evaluation;
    
    res.json(parsedEvaluation);
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    res.status(500).json({ error: 'Failed to fetch evaluation' });
  } finally {
    if (connection) connection.release();
  }
});


// Update an evaluation
router.put('/:evalId', [auth, logActions.updateEvaluation], async (req, res) => {
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
      'UPDATE evaluations SET feedback = ?, decision = ? WHERE eval_id = ?',
      [feedback, decision, evalId]
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
    
    // Return evaluation as-is (no parsing needed)
    const parsedEvaluation = updatedEvaluation[0];
    
    res.json(parsedEvaluation);
  } catch (error) {
    console.error('Error updating evaluation:', error);
    res.status(500).json({ error: 'Failed to update evaluation' });
  } finally {
    if (connection) connection.release();
  }
});

// Delete an evaluation
router.delete('/:evalId', [auth, logActions.deleteEvaluation], async (req, res) => {
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
    const requester = req.user.user;
    connection = await promisePool.getConnection();
    
    let whereClause = '';
    const params = [];
    
    // Extension Coordinators can only see stats for evaluations of their own projects
    if (requester.role === 'Extension Coordinator') {
      whereClause = ' WHERE p.coordinator_id = ?';
      params.push(requester.id);
    }
    
    // Get total evaluations
    const totalQuery = `
      SELECT COUNT(*) as total 
      FROM evaluations e 
      JOIN projects p ON e.project_id = p.project_id
      ${whereClause}
    `;
    const [totalEvals] = await connection.execute(totalQuery, params);
    
    // Get evaluations by decision
    const decisionQuery = `
      SELECT decision, COUNT(*) as count 
      FROM evaluations e
      JOIN projects p ON e.project_id = p.project_id
      ${whereClause}
      GROUP BY decision
    `;
    const [decisionStats] = await connection.execute(decisionQuery, params);
    
    // Get evaluations by month (last 6 months)
    const monthlyQuery = `
      SELECT 
        DATE_FORMAT(e.created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM evaluations e
      JOIN projects p ON e.project_id = p.project_id
      ${whereClause}
      ${whereClause ? 'AND' : 'WHERE'} e.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(e.created_at, '%Y-%m')
      ORDER BY month DESC
    `;
    const monthlyParams = [...params];
    if (requester.role === 'Extension Coordinator') {
      monthlyParams.push(requester.id);
    }
    const [monthlyStats] = await connection.execute(monthlyQuery, monthlyParams);
    
    // Get top evaluators
    const evaluatorsQuery = `
      SELECT 
        u.fullname,
        u.role,
        COUNT(*) as evaluation_count
      FROM evaluations e
      JOIN projects p ON e.project_id = p.project_id
      JOIN users u ON e.evaluator_id = u.user_id
      ${whereClause}
      GROUP BY e.evaluator_id
      ORDER BY evaluation_count DESC
      LIMIT 5
    `;
    const [topEvaluators] = await connection.execute(evaluatorsQuery, params);
    
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

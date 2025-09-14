const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/logs
// @desc    Get system logs (filtered by user role)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = req.user.user;
    const { 
      page = 1, 
      limit = 50, 
      action, 
      entity_type, 
      start_date, 
      end_date,
      user_id 
    } = req.query;

    const offset = (page - 1) * limit;
    const params = [];
    let whereConditions = [];

    // Non-admin users can only see their own logs
    if (user.role !== 'Admin') {
      whereConditions.push('sl.user_id = ?');
      params.push(user.id);
    } else if (user_id) {
      // Admin can filter by specific user
      whereConditions.push('sl.user_id = ?');
      params.push(user_id);
    }

    // Filter by action
    if (action) {
      whereConditions.push('sl.action = ?');
      params.push(action);
    }

    // Filter by entity type
    if (entity_type) {
      whereConditions.push('sl.entity_type = ?');
      params.push(entity_type);
    }

    // Filter by date range
    if (start_date) {
      whereConditions.push('DATE(sl.created_at) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('DATE(sl.created_at) <= ?');
      params.push(end_date);
    }

    // Build WHERE clause
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM system_logs sl 
      LEFT JOIN users u ON sl.user_id = u.user_id 
      ${whereClause}
    `;
    
    const [countResult] = await db.promise.query(countQuery, params);
    const totalLogs = countResult[0].total;

    // Get logs with user information
    const logsQuery = `
      SELECT 
        sl.log_id,
        sl.user_id,
        sl.action,
        sl.entity_type,
        sl.entity_id,
        sl.description,
        sl.ip_address,
        sl.user_agent,
        sl.request_method,
        sl.request_url,
        sl.status_code,
        sl.response_time,
        sl.error_message,
        sl.additional_data,
        sl.created_at,
        u.fullname as user_fullname,
        u.email as user_email,
        u.role as user_role
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.user_id
      ${whereClause}
      ORDER BY sl.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [logs] = await db.promise.query(logsQuery, [...params, parseInt(limit), offset]);

    // Parse additional_data JSON
    const parsedLogs = logs.map(log => ({
      ...log,
      additional_data: log.additional_data ? JSON.parse(log.additional_data) : null
    }));

    res.json({
      logs: parsedLogs,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalLogs / limit),
        total_logs: totalLogs,
        logs_per_page: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/logs/actions
// @desc    Get available actions for filtering
// @access  Private
router.get('/actions', auth, async (req, res) => {
  try {
    const user = req.user.user;
    const params = [];
    let whereClause = '';

    // Non-admin users can only see their own actions
    if (user.role !== 'Admin') {
      whereClause = 'WHERE user_id = ?';
      params.push(user.id);
    }

    const query = `
      SELECT DISTINCT action 
      FROM system_logs 
      ${whereClause}
      ORDER BY action
    `;

    const [actions] = await db.promise.query(query, params);
    res.json(actions.map(row => row.action));
  } catch (err) {
    console.error('Error fetching actions:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/logs/entity-types
// @desc    Get available entity types for filtering
// @access  Private
router.get('/entity-types', auth, async (req, res) => {
  try {
    const user = req.user.user;
    const params = [];
    let whereClause = '';

    // Non-admin users can only see their own entity types
    if (user.role !== 'Admin') {
      whereClause = 'WHERE user_id = ?';
      params.push(user.id);
    }

    const query = `
      SELECT DISTINCT entity_type 
      FROM system_logs 
      ${whereClause}
      ORDER BY entity_type
    `;

    const [entityTypes] = await db.promise.query(query, params);
    res.json(entityTypes.map(row => row.entity_type));
  } catch (err) {
    console.error('Error fetching entity types:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/logs/stats
// @desc    Get log statistics
// @access  Private (Admin only)
router.get('/stats', auth, async (req, res) => {
  try {
    const user = req.user.user;
    
    // Only admins can see statistics
    if (user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { start_date, end_date } = req.query;
    const params = [];
    let whereClause = '';

    if (start_date) {
      whereClause += 'WHERE DATE(created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += whereClause ? ' AND DATE(created_at) <= ?' : 'WHERE DATE(created_at) <= ?';
      params.push(end_date);
    }

    // Total logs
    const totalQuery = `SELECT COUNT(*) as total FROM system_logs ${whereClause}`;
    const [totalResult] = await db.promise.query(totalQuery, params);

    // Logs by action
    const actionsQuery = `
      SELECT action, COUNT(*) as count 
      FROM system_logs 
      ${whereClause}
      GROUP BY action 
      ORDER BY count DESC
    `;
    const [actionsResult] = await db.promise.query(actionsQuery, params);

    // Logs by entity type
    const entityTypesQuery = `
      SELECT entity_type, COUNT(*) as count 
      FROM system_logs 
      ${whereClause}
      GROUP BY entity_type 
      ORDER BY count DESC
    `;
    const [entityTypesResult] = await db.promise.query(entityTypesQuery, params);

    // Logs by user
    const usersQuery = `
      SELECT u.fullname, u.email, u.role, COUNT(sl.log_id) as count 
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.user_id
      ${whereClause}
      GROUP BY sl.user_id, u.fullname, u.email, u.role
      ORDER BY count DESC
      LIMIT 10
    `;
    const [usersResult] = await db.promise.query(usersQuery, params);

    // Daily activity for the last 30 days
    const dailyQuery = `
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM system_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    const [dailyResult] = await db.promise.query(dailyQuery);

    res.json({
      total_logs: totalResult[0].total,
      actions: actionsResult,
      entity_types: entityTypesResult,
      top_users: usersResult,
      daily_activity: dailyResult
    });
  } catch (err) {
    console.error('Error fetching log statistics:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/logs/:id
// @desc    Delete a specific log entry (Admin only)
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = req.user.user;
    
    // Only admins can delete logs
    if (user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const [result] = await db.promise.query(
      'DELETE FROM system_logs WHERE log_id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Log entry not found' });
    }

    res.json({ message: 'Log entry deleted successfully' });
  } catch (err) {
    console.error('Error deleting log entry:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/logs
// @desc    Clear old logs (Admin only)
// @access  Private (Admin only)
router.delete('/', auth, async (req, res) => {
  try {
    const user = req.user.user;
    
    // Only admins can clear logs
    if (user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { days = 90 } = req.query;

    const [result] = await db.promise.query(
      'DELETE FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [parseInt(days)]
    );

    res.json({ 
      message: `Cleared ${result.affectedRows} log entries older than ${days} days` 
    });
  } catch (err) {
    console.error('Error clearing logs:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

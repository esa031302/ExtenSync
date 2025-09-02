const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    List current user's notifications
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const requester = req.user.user;
    const [rows] = await db.promise.query(
      'SELECT notif_id, message, link, status, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
      [requester.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.post('/:id/read', auth, async (req, res) => {
  try {
    const requester = req.user.user;
    await db.promise.query('UPDATE notifications SET status = "Read" WHERE notif_id = ? AND user_id = ?', [req.params.id, requester.id]);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;



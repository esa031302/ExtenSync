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

// @route   POST /api/notifications/mark-all-read
// @desc    Mark all current user's notifications as read
// @access  Private
router.post('/mark-all-read', auth, async (req, res) => {
  try {
    const requester = req.user.user;
    await db.promise.query('UPDATE notifications SET status = "Read" WHERE user_id = ? AND status = "Unread"', [requester.id]);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all as read:', err);
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

// @route   POST /api/notifications/:id/unread
// @desc    Mark a notification as unread
// @access  Private
router.post('/:id/unread', auth, async (req, res) => {
  try {
    const requester = req.user.user;
    await db.promise.query('UPDATE notifications SET status = "Unread" WHERE notif_id = ? AND user_id = ?', [req.params.id, requester.id]);
    res.json({ message: 'Notification marked as unread' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const requester = req.user.user;
    const [result] = await db.promise.query('DELETE FROM notifications WHERE notif_id = ? AND user_id = ?', [req.params.id, requester.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;



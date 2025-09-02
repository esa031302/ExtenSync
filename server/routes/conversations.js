const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../config/database');
const { logActions } = require('../middleware/logger');

// Get all conversations for the user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.user.id;
    
    const [conversations] = await db.promise.query(`
      SELECT 
        c.conversation_id,
        c.conversation_name,
        c.conversation_type,
        c.created_at,
        c.updated_at,
        cp.role as user_role,
        cp.last_read_at,
        u.fullname as created_by_name,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.conversation_id AND m.is_deleted = 0) as message_count,
        (SELECT COUNT(*) FROM messages m 
         WHERE m.conversation_id = c.conversation_id 
         AND m.is_deleted = 0 
         AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01')) as unread_count,
        (SELECT GROUP_CONCAT(u2.fullname SEPARATOR ', ') 
         FROM conversation_participants cp2 
         JOIN users u2 ON cp2.user_id = u2.user_id 
         WHERE cp2.conversation_id = c.conversation_id 
         AND cp2.user_id != ? 
         AND cp2.is_active = 1) as participants_names,
        (SELECT GROUP_CONCAT(COALESCE(u3.profile_photo, '') SEPARATOR ',')
         FROM conversation_participants cp3
         JOIN users u3 ON cp3.user_id = u3.user_id
         WHERE cp3.conversation_id = c.conversation_id
         AND cp3.user_id != ?
         AND cp3.is_active = 1) as participants_photos,
        (SELECT m4.content FROM messages m4 WHERE m4.conversation_id = c.conversation_id AND m4.is_deleted = 0 ORDER BY m4.created_at DESC LIMIT 1) as last_message_content,
        (SELECT m5.message_type FROM messages m5 WHERE m5.conversation_id = c.conversation_id AND m5.is_deleted = 0 ORDER BY m5.created_at DESC LIMIT 1) as last_message_type,
        (SELECT m6.created_at FROM messages m6 WHERE m6.conversation_id = c.conversation_id AND m6.is_deleted = 0 ORDER BY m6.created_at DESC LIMIT 1) as last_message_created_at,
        (SELECT u7.fullname FROM messages m7 JOIN users u7 ON m7.sender_id = u7.user_id WHERE m7.conversation_id = c.conversation_id AND m7.is_deleted = 0 ORDER BY m7.created_at DESC LIMIT 1) as last_message_sender
      FROM conversations c
      INNER JOIN conversation_participants cp ON c.conversation_id = cp.conversation_id
      LEFT JOIN users u ON c.created_by = u.user_id
      WHERE cp.user_id = ? AND cp.is_active = 1 AND c.is_active = 1
      ORDER BY c.updated_at DESC
    `, [userId, userId, userId]);

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific conversation
router.get('/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Check if user is participant in the conversation
    const [participants] = await db.promise.query(`
      SELECT 1 FROM conversation_participants 
      WHERE conversation_id = ? AND user_id = ? AND is_active = 1
    `, [conversationId, userId]);

    if (participants.length === 0) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    // Get messages with sender info
    const [messages] = await db.promise.query(`
      SELECT 
        m.message_id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.message_type,
        m.file_url,
        m.file_name,
        m.file_size,
        m.is_edited,
        m.edited_at,
        m.created_at,
        u.fullname as sender_name,
        u.role as sender_role,
        u.profile_photo as sender_photo
      FROM messages m
      INNER JOIN users u ON m.sender_id = u.user_id
      WHERE m.conversation_id = ? AND m.is_deleted = 0
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [conversationId, limit, offset]);

    // Update last read timestamp
    await db.promise.query(`
      UPDATE conversation_participants 
      SET last_read_at = NOW()
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, userId]);

    res.json(messages.reverse()); // Return in chronological order
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create a new conversation
router.post('/', auth, logActions.systemAction('CREATE', 'conversation', null, 'Created new conversation'), async (req, res) => {
  try {
    const userId = req.user.user.id;
    const { conversationName, conversationType, participants } = req.body;

    // Validate required fields
    if (!conversationType || !participants || participants.length === 0) {
      return res.status(400).json({ error: 'Conversation type and participants are required' });
    }

    // Create the conversation
    const [conversationResult] = await db.promise.query(`
      INSERT INTO conversations (conversation_name, conversation_type, created_by)
      VALUES (?, ?, ?)
    `, [conversationName || null, conversationType, userId]);

    const conversationId = conversationResult.insertId;

    // Add creator as admin
    await db.promise.query(`
      INSERT INTO conversation_participants (conversation_id, user_id, role)
      VALUES (?, ?, 'admin')
    `, [conversationId, userId]);

    // Add other participants
    const participantValues = participants.map(p => [conversationId, p.userId, p.role || 'member']);
    await db.promise.query(`
      INSERT INTO conversation_participants (conversation_id, user_id, role)
      VALUES ?
    `, [participantValues]);

    // Get the created conversation with details
    const [conversations] = await db.promise.query(`
      SELECT 
        c.conversation_id,
        c.conversation_name,
        c.conversation_type,
        c.created_at,
        c.updated_at,
        'admin' as user_role,
        u.fullname as created_by_name
      FROM conversations c
      LEFT JOIN users u ON c.created_by = u.user_id
      WHERE c.conversation_id = ?
    `, [conversationId]);

    res.status(201).json(conversations[0]);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get available users for conversation (filtered by role and department)
router.get('/users/available', auth, async (req, res) => {
  try {
    const { role, department } = req.query;
    let query = `
      SELECT 
        u.user_id,
        u.fullname,
        u.email,
        u.role,
        u.department_college as department,
        u.profile_photo
      FROM users u
      WHERE u.account_status = 'Active'
    `;
    
    const params = [];
    
    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }
    
    if (department) {
      query += ` AND u.department_college = ?`;
      params.push(department);
    }
    
    query += ` ORDER BY u.fullname`;
    
    const [users] = await db.promise.query(query, params);
    res.json(users);
  } catch (error) {
    console.error('Error fetching available users:', error);
    res.status(500).json({ error: 'Failed to fetch available users' });
  }
});

// Add participants to a conversation
router.post('/:conversationId/participants', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.user.id;
    const { participants } = req.body;

    // Check if user is admin of the conversation
    const [adminCheck] = await db.promise.query(`
      SELECT role FROM conversation_participants 
      WHERE conversation_id = ? AND user_id = ? AND is_active = 1
    `, [conversationId, userId]);

    if (adminCheck.length === 0 || adminCheck[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only conversation admins can add participants' });
    }

    // Add participants
    const participantValues = participants.map(p => [conversationId, p.userId, p.role || 'member']);
    await db.promise.query(`
      INSERT INTO conversation_participants (conversation_id, user_id, role)
      VALUES ?
      ON DUPLICATE KEY UPDATE role = VALUES(role), is_active = 1
    `, [participantValues]);

    res.json({ message: 'Participants added successfully' });
  } catch (error) {
    console.error('Error adding participants:', error);
    res.status(500).json({ error: 'Failed to add participants' });
  }
});

// Remove participant from conversation
router.delete('/:conversationId/participants/:participantId', auth, async (req, res) => {
  try {
    const { conversationId, participantId } = req.params;
    const userId = req.user.user.id;

    // Check if user is admin of the conversation
    const [adminCheck] = await db.promise.query(`
      SELECT role FROM conversation_participants 
      WHERE conversation_id = ? AND user_id = ? AND is_active = 1
    `, [conversationId, userId]);

    if (adminCheck.length === 0 || adminCheck[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only conversation admins can remove participants' });
    }

    // Remove participant
    await db.promise.query(`
      UPDATE conversation_participants 
      SET is_active = 0
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, participantId]);

    res.json({ message: 'Participant removed successfully' });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ error: 'Failed to remove participant' });
  }
});

// Edit message
router.put('/messages/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.user.id;
    const { content } = req.body;

    // Check if user owns the message
    const [messageCheck] = await db.promise.query(`
      SELECT sender_id FROM messages WHERE message_id = ?
    `, [messageId]);

    if (messageCheck.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (messageCheck[0].sender_id !== userId) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    // Update message
    await db.promise.query(`
      UPDATE messages 
      SET content = ?, is_edited = 1, edited_at = NOW()
      WHERE message_id = ?
    `, [content, messageId]);

    res.json({ message: 'Message updated successfully' });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// Delete message (soft delete)
router.delete('/messages/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.user.id;

    // Check if user owns the message or is admin
    const [messageCheck] = await db.promise.query(`
      SELECT sender_id FROM messages WHERE message_id = ?
    `, [messageId]);

    if (messageCheck.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Allow deletion if user owns message or is admin
    const isOwner = messageCheck[0].sender_id === userId;
    const isAdmin = req.user.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    // Soft delete message
    await db.promise.query(`
      UPDATE messages 
      SET is_deleted = 1, deleted_at = NOW()
      WHERE message_id = ?
    `, [messageId]);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;

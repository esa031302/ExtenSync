const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./config/database');

let io;

// Store online users
const onlineUsers = new Map();

// Initialize Socket.IO server
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.user.id;
      socket.userRole = decoded.user.role;
      socket.userName = decoded.user.fullname;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userName} (${socket.userId})`);
    
    // Add user to online users
    onlineUsers.set(socket.userId, {
      socketId: socket.id,
      userName: socket.userName,
      userRole: socket.userRole,
      connectedAt: new Date()
    });

    // Join user to their accessible conversations
    joinUserToConversations(socket);

    // Handle joining a specific conversation
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`${socket.userName} joined conversation ${conversationId}`);
      
      // Update last read timestamp
      updateLastRead(socket.userId, conversationId);
    });

    // Handle leaving a conversation
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`${socket.userName} left conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, messageType = 'text', fileUrl = null, fileName = null, fileSize = null } = data;
        
        // Save message to database
        const messageId = await saveMessage(socket.userId, conversationId, content, messageType, fileUrl, fileName, fileSize);
        
        // Get message with sender info
        const message = await getMessageWithSender(messageId);
        
        // Emit to conversation (excluding sender)
        socket.to(`conversation_${conversationId}`).emit('new_message', {
          ...message,
          isOwn: false
        });
        
        // Emit to sender (to confirm message sent)
        socket.emit('message_sent', {
          ...message,
          isOwn: true
        });

        // Log the message
        console.log(`Message sent in conversation ${conversationId}: ${socket.userName}: ${content}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (conversationId) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName,
        conversationId: conversationId
      });
    });

    socket.on('typing_stop', (conversationId) => {
      socket.to(`conversation_${conversationId}`).emit('user_stop_typing', {
        userId: socket.userId,
        conversationId: conversationId
      });
    });

    // Handle message reactions
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, reactionType } = data;
        await addReaction(socket.userId, messageId, reactionType);
        
        // Emit reaction to conversation
        io.emit('reaction_added', {
          messageId,
          userId: socket.userId,
          userName: socket.userName,
          reactionType
        });
      } catch (error) {
        console.error('Error adding reaction:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userName} (${socket.userId})`);
      
      // Remove from online users
      onlineUsers.delete(socket.userId);
    });
  });

  return io;
};

// Helper functions
const joinUserToConversations = async (socket) => {
  try {
    const [conversations] = await db.promise.query(`
      SELECT c.conversation_id, c.conversation_name, c.conversation_type
      FROM conversations c
      INNER JOIN conversation_participants cp ON c.conversation_id = cp.conversation_id
      WHERE cp.user_id = ? AND cp.is_active = 1 AND c.is_active = 1
    `, [socket.userId]);

    conversations.forEach(conversation => {
      socket.join(`conversation_${conversation.conversation_id}`);
      console.log(`${socket.userName} auto-joined conversation: ${conversation.conversation_name || conversation.conversation_id}`);
    });
  } catch (error) {
    console.error('Error joining conversations:', error);
  }
};

const saveMessage = async (senderId, conversationId, content, messageType, fileUrl, fileName, fileSize) => {
  const [result] = await db.promise.query(`
    INSERT INTO messages (sender_id, conversation_id, content, message_type, file_url, file_name, file_size)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [senderId, conversationId, content, messageType, fileUrl, fileName, fileSize]);
  
  return result.insertId;
};

const getMessageWithSender = async (messageId) => {
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
      m.created_at,
      u.fullname as sender_name,
      u.role as sender_role
    FROM messages m
    INNER JOIN users u ON m.sender_id = u.user_id
    WHERE m.message_id = ?
  `, [messageId]);
  
  return messages[0];
};

const updateLastRead = async (userId, conversationId) => {
  try {
    await db.promise.query(`
      UPDATE conversation_participants 
      SET last_read_at = NOW()
      WHERE user_id = ? AND conversation_id = ?
    `, [userId, conversationId]);
  } catch (error) {
    console.error('Error updating last read:', error);
  }
};

const addReaction = async (userId, messageId, reactionType) => {
  await db.promise.query(`
    INSERT INTO message_reactions (message_id, user_id, reaction_type)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE reaction_type = VALUES(reaction_type)
  `, [messageId, userId, reactionType]);
};

// Get Socket.IO instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO
};

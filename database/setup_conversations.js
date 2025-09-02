const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'extensync_db',
  port: process.env.DB_PORT || 3306
};

// Create connection
const connection = mysql.createConnection(dbConfig);

// SQL statements to execute
const statements = [
  // Drop old chat tables if they exist
  `DROP TABLE IF EXISTS message_reactions`,
  `DROP TABLE IF EXISTS messages`,
  `DROP TABLE IF EXISTS conversation_participants`,
  `DROP TABLE IF EXISTS conversations`,
  `DROP TABLE IF EXISTS chat_message_reactions`,
  `DROP TABLE IF EXISTS chat_messages`,
  `DROP TABLE IF EXISTS chat_room_participants`,
  `DROP TABLE IF EXISTS chat_rooms`,
  `DROP TABLE IF EXISTS online_users`,

  // Conversations Table
  `CREATE TABLE IF NOT EXISTS conversations (
    conversation_id int(11) NOT NULL AUTO_INCREMENT,
    conversation_name varchar(255) DEFAULT NULL,
    conversation_type enum('direct', 'group') NOT NULL DEFAULT 'direct',
    created_by int(11) NOT NULL,
    created_at timestamp NOT NULL DEFAULT current_timestamp(),
    updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    is_active tinyint(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (conversation_id),
    KEY idx_created_by (created_by),
    KEY idx_conversation_type (conversation_type),
    CONSTRAINT conversations_ibfk_1 FOREIGN KEY (created_by) REFERENCES users (user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // Conversation Participants Table
  `CREATE TABLE IF NOT EXISTS conversation_participants (
    participant_id int(11) NOT NULL AUTO_INCREMENT,
    conversation_id int(11) NOT NULL,
    user_id int(11) NOT NULL,
    role enum('admin', 'member') NOT NULL DEFAULT 'member',
    joined_at timestamp NOT NULL DEFAULT current_timestamp(),
    last_read_at timestamp NULL DEFAULT NULL,
    is_active tinyint(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (participant_id),
    UNIQUE KEY unique_conversation_user (conversation_id, user_id),
    KEY idx_conversation_id (conversation_id),
    KEY idx_user_id (user_id),
    CONSTRAINT conversation_participants_ibfk_1 FOREIGN KEY (conversation_id) REFERENCES conversations (conversation_id) ON DELETE CASCADE,
    CONSTRAINT conversation_participants_ibfk_2 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // Messages Table
  `CREATE TABLE IF NOT EXISTS messages (
    message_id int(11) NOT NULL AUTO_INCREMENT,
    conversation_id int(11) NOT NULL,
    sender_id int(11) NULL,
    message_type enum('text', 'file', 'image', 'system') NOT NULL DEFAULT 'text',
    content text NOT NULL,
    file_url varchar(500) DEFAULT NULL,
    file_name varchar(255) DEFAULT NULL,
    file_size int(11) DEFAULT NULL,
    is_edited tinyint(1) NOT NULL DEFAULT 0,
    edited_at timestamp NULL DEFAULT NULL,
    is_deleted tinyint(1) NOT NULL DEFAULT 0,
    deleted_at timestamp NULL DEFAULT NULL,
    created_at timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (message_id),
    KEY idx_conversation_id (conversation_id),
    KEY idx_sender_id (sender_id),
    KEY idx_created_at (created_at),
    CONSTRAINT messages_ibfk_1 FOREIGN KEY (conversation_id) REFERENCES conversations (conversation_id) ON DELETE CASCADE,
    CONSTRAINT messages_ibfk_2 FOREIGN KEY (sender_id) REFERENCES users (user_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // Message Reactions Table
  `CREATE TABLE IF NOT EXISTS message_reactions (
    reaction_id int(11) NOT NULL AUTO_INCREMENT,
    message_id int(11) NOT NULL,
    user_id int(11) NOT NULL,
    reaction_type varchar(50) NOT NULL,
    created_at timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (reaction_id),
    UNIQUE KEY unique_message_user_reaction (message_id, user_id, reaction_type),
    KEY idx_message_id (message_id),
    KEY idx_user_id (user_id),
    CONSTRAINT message_reactions_ibfk_1 FOREIGN KEY (message_id) REFERENCES messages (message_id) ON DELETE CASCADE,
    CONSTRAINT message_reactions_ibfk_2 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
];

// Execute statements one by one
const executeStatements = async () => {
  console.log('🚀 Starting conversation database setup...');
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      await new Promise((resolve, reject) => {
        connection.query(statement, (err, results) => {
          if (err) {
            console.error(`❌ Error executing statement ${i + 1}:`, err.message);
            reject(err);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            resolve(results);
          }
        });
      });
    } catch (error) {
      console.error('Failed to execute statement:', statement);
      process.exit(1);
    }
  }
  
  console.log('🎉 Conversation database setup completed successfully!');
  connection.end();
};

// Execute all statements
executeStatements();

const mysql = require('mysql2/promise');
require('dotenv').config();

async function addEarlyCompletionReason() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'extensync'
    });
    console.log('Connected to database');

    // Add early_completion_reason column
    await connection.execute(`
      ALTER TABLE projects 
      ADD COLUMN early_completion_reason TEXT NULL 
      COMMENT 'Reason provided when project is completed before scheduled end date'
    `);
    
    console.log('✅ Successfully added early_completion_reason column to projects table');
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  early_completion_reason column already exists');
    } else {
      console.error('❌ Error adding early_completion_reason column:', error.message);
    }
  } finally {
    if (connection) await connection.end();
    console.log('Database connection closed');
  }
}

addEarlyCompletionReason();

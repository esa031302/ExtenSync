const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkEarlyCompletionField() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'extensync_db'
    });
    console.log('Connected to database');

    // Check if early_completion_reason column exists
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM projects LIKE 'early_completion_reason'
    `);
    
    if (columns.length > 0) {
      console.log('✅ early_completion_reason column exists:', columns[0]);
    } else {
      console.log('❌ early_completion_reason column does NOT exist');
      console.log('Creating the column now...');
      
      await connection.execute(`
        ALTER TABLE projects 
        ADD COLUMN early_completion_reason TEXT NULL 
        COMMENT 'Reason provided when project is completed before scheduled end date'
      `);
      
      console.log('✅ early_completion_reason column created successfully');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
    console.log('Database connection closed');
  }
}

checkEarlyCompletionField();

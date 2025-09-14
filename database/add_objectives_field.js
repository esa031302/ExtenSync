const mysql = require('mysql2/promise');
require('dotenv').config();

const addObjectivesField = async () => {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'extensync_db'
    });

    console.log('Connected to database');

    // Check if objectives field exists
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'objectives'",
      [process.env.DB_NAME || 'extensync_db']
    );

    if (columns.length === 0) {
      // Add objectives field
      await connection.execute(
        'ALTER TABLE projects ADD COLUMN objectives TEXT DEFAULT NULL AFTER rationale'
      );
      console.log('✅ Added objectives field to projects table');
    } else {
      console.log('✅ Objectives field already exists in projects table');
    }

  } catch (error) {
    console.error('❌ Error adding objectives field:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

addObjectivesField();

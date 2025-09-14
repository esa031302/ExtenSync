const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../server/.env' });

// Use the same configuration as the server
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'extensync_db',
  port: process.env.DB_PORT || 3306
};

async function addProjectDateTimeFields() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check current table structure
    console.log('🔍 Checking current projects table structure...');
    const [columns] = await connection.execute('DESCRIBE projects');
    const existingColumns = columns.map(col => col.Field);
    console.log('Current columns:', existingColumns);

    // Add new date/time fields
    const fieldsToAdd = [
      {
        name: 'start_date',
        sql: 'ALTER TABLE projects ADD COLUMN start_date DATE DEFAULT NULL'
      },
      {
        name: 'end_date',
        sql: 'ALTER TABLE projects ADD COLUMN end_date DATE DEFAULT NULL'
      },
      {
        name: 'start_time',
        sql: 'ALTER TABLE projects ADD COLUMN start_time TIME DEFAULT NULL'
      },
      {
        name: 'end_time',
        sql: 'ALTER TABLE projects ADD COLUMN end_time TIME DEFAULT NULL'
      }
    ];

    for (const field of fieldsToAdd) {
      if (!existingColumns.includes(field.name)) {
        console.log(`🔧 Adding column: ${field.name}`);
        await connection.execute(field.sql);
        console.log(`✅ Added column: ${field.name}`);
      } else {
        console.log(`ℹ️  Column already exists: ${field.name}`);
      }
    }

    console.log('🎉 Project date/time fields migration completed successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
addProjectDateTimeFields();

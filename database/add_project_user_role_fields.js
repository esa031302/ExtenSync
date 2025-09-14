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

async function addProjectUserRoleFields() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check current table structure
    console.log('🔍 Checking current projects table structure...');
    const [columns] = await connection.execute('DESCRIBE projects');
    const existing = new Set(columns.map(col => col.Field));
    console.log('Current columns:', columns.map(c => c.Field));

    const migrations = [];

    // Add single project leader foreign key column
    if (!existing.has('project_leader_id')) {
      migrations.push({
        name: 'project_leader_id',
        sql: 'ALTER TABLE projects ADD COLUMN project_leader_id INT NULL AFTER programs_involved'
      });
    }

    // Add assistant leader ids array column (JSON stored as TEXT)
    if (!existing.has('assistant_project_leader_ids')) {
      migrations.push({
        name: 'assistant_project_leader_ids',
        sql: 'ALTER TABLE projects ADD COLUMN assistant_project_leader_ids TEXT NULL AFTER project_leader_id'
      });
    }

    // Add coordinator ids array column (JSON stored as TEXT)
    if (!existing.has('coordinator_ids')) {
      migrations.push({
        name: 'coordinator_ids',
        sql: 'ALTER TABLE projects ADD COLUMN coordinator_ids TEXT NULL AFTER assistant_project_leader_ids'
      });
    }

    for (const m of migrations) {
      console.log(`🔧 Adding column: ${m.name}`);
      await connection.execute(m.sql);
      console.log(`✅ Added column: ${m.name}`);
    }

    if (migrations.length === 0) {
      console.log('ℹ️  All target columns already exist; nothing to do.');
    } else {
      console.log('🎉 Project user role fields migration completed successfully!');
    }

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
addProjectUserRoleFields();



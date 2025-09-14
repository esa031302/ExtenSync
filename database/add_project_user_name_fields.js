const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../server/.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'extensync_db',
  port: process.env.DB_PORT || 3306
};

async function addProjectUserNameFields() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    const [columns] = await connection.execute('DESCRIBE projects');
    const existing = new Set(columns.map(c => c.Field));
    console.log('Current columns:', columns.map(c => c.Field));

    const statements = [];

    // Drop legacy text column storing leaders blob
    if (existing.has('project_leaders')) {
      statements.push('ALTER TABLE projects DROP COLUMN project_leaders');
    }

    if (!existing.has('project_leader_name')) {
      statements.push('ALTER TABLE projects ADD COLUMN project_leader_name VARCHAR(255) NULL AFTER project_leader_id');
    }

    if (!existing.has('assistant_project_leader_names')) {
      statements.push('ALTER TABLE projects ADD COLUMN assistant_project_leader_names TEXT NULL AFTER assistant_project_leader_ids');
    }

    if (!existing.has('coordinator_names')) {
      statements.push('ALTER TABLE projects ADD COLUMN coordinator_names TEXT NULL AFTER coordinator_ids');
    }

    for (const sql of statements) {
      console.log('🔧 Running:', sql);
      await connection.execute(sql);
      console.log('✅ Done');
    }

    if (statements.length === 0) {
      console.log('ℹ️  No changes needed; all columns already in place.');
    } else {
      console.log('🎉 Name fields migration completed successfully!');
    }
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

addProjectUserNameFields();



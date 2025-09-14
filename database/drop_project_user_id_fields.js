const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../server/.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'extensync_db',
  port: process.env.DB_PORT || 3306
};

async function dropProjectUserIdFields() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    const [columns] = await connection.execute('DESCRIBE projects');
    const existing = new Set(columns.map(c => c.Field));
    console.log('Current columns:', columns.map(c => c.Field));

    const toDrop = [];
    if (existing.has('assistant_project_leader_ids')) toDrop.push('assistant_project_leader_ids');
    if (existing.has('coordinator_ids')) toDrop.push('coordinator_ids');
    if (existing.has('project_leader_id')) toDrop.push('project_leader_id');

    for (const col of toDrop) {
      const sql = `ALTER TABLE projects DROP COLUMN ${col}`;
      console.log('🔧 Running:', sql);
      await connection.execute(sql);
      console.log('✅ Dropped:', col);
    }

    if (toDrop.length === 0) {
      console.log('ℹ️  No ID columns to drop.');
    } else {
      console.log('🎉 Dropped ID columns successfully.');
    }
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

dropProjectUserIdFields();



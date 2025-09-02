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

async function testDatabase() {
  let connection;
  
  try {
    console.log('🔍 Testing database connection...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Check if evaluations table exists
    console.log('\n🔍 Checking evaluations table...');
    const [tables] = await connection.execute('SHOW TABLES LIKE "evaluations"');
    console.log('Evaluations table exists:', tables.length > 0);

    if (tables.length > 0) {
      const [count] = await connection.execute('SELECT COUNT(*) as count FROM evaluations');
      console.log('Evaluations count:', count[0].count);
      
      // Check table structure
      const [columns] = await connection.execute('DESCRIBE evaluations');
      console.log('\n📋 Evaluations table structure:');
      columns.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } else {
      console.log('❌ Evaluations table does not exist');
    }

    // Check projects table
    console.log('\n🔍 Checking projects table...');
    const [projectTables] = await connection.execute('SHOW TABLES LIKE "projects"');
    console.log('Projects table exists:', projectTables.length > 0);

    if (projectTables.length > 0) {
      const [projectCount] = await connection.execute('SELECT COUNT(*) as count FROM projects');
      console.log('Projects count:', projectCount[0].count);
    }

    // Check users table
    console.log('\n🔍 Checking users table...');
    const [userTables] = await connection.execute('SHOW TABLES LIKE "users"');
    console.log('Users table exists:', userTables.length > 0);

    if (userTables.length > 0) {
      const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log('Users count:', userCount[0].count);
    }

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

testDatabase();

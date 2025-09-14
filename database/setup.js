const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
};

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔧 Setting up database...');
    
    // Create connection without database
    connection = mysql.createConnection(dbConfig);
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await connection.promise().query(schema);
    
    console.log('✅ Database schema created successfully!');
    
    // Test connection to the new database
    const testConfig = {
      ...dbConfig,
      database: process.env.DB_NAME || 'extensync_db'
    };
    
    const testConnection = mysql.createConnection(testConfig);
    await testConnection.promise().query('SELECT 1');
    console.log('✅ Database connection test successful!');
    
    testConnection.end();
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      connection.end();
    }
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;

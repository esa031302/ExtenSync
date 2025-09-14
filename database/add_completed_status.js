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

async function addCompletedStatus() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check current status enum values
    console.log('🔍 Checking current status enum values...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'status'
    `, [dbConfig.database]);
    
    console.log('Current status enum:', columns[0].COLUMN_TYPE);

    // Add "Completed" to the status enum
    console.log('🔧 Adding "Completed" status to projects table...');
    await connection.execute(`
      ALTER TABLE projects 
      MODIFY COLUMN status ENUM('Pending', 'Approved', 'Rejected', 'Completed') DEFAULT 'Pending'
    `);
    
    console.log('✅ Successfully added "Completed" status to projects table');

    // Verify the change
    const [updatedColumns] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'status'
    `, [dbConfig.database]);
    
    console.log('Updated status enum:', updatedColumns[0].COLUMN_TYPE);
    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  "Completed" status already exists in the enum');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

if (require.main === module) {
  addCompletedStatus();
}

module.exports = addCompletedStatus;

const mysql = require('mysql2/promise');

// Database configuration - adjust these if different
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Add your MySQL password if you have one
  database: 'extensync_db',
  port: 3306
};

async function updateStatusEnum() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check current status enum
    const [tableInfo] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'status'
    `, [dbConfig.database]);
    
    if (tableInfo.length > 0) {
      console.log('Current status enum:', tableInfo[0].COLUMN_TYPE);
      
      // Check if 'On-Going' is already included
      if (tableInfo[0].COLUMN_TYPE.includes('On-Going')) {
        console.log('ℹ️  "On-Going" status already exists in the enum');
        return;
      }
    }

    // Add 'On-Going' to the status enum
    console.log('🔧 Adding "On-Going" status to projects table...');
    await connection.execute(`
      ALTER TABLE projects 
      MODIFY COLUMN status ENUM('Pending','Approved','Rejected','On-Going','Completed') 
      DEFAULT 'Pending'
    `);
    
    console.log('✅ Successfully added "On-Going" status to projects table');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 If connection failed, you may need to:');
    console.log('1. Start your MySQL server');
    console.log('2. Update the database credentials in this script');
    console.log('3. Or run this SQL manually in your database:');
    console.log(`   ALTER TABLE projects MODIFY COLUMN status ENUM('Pending','Approved','Rejected','On-Going','Completed') DEFAULT 'Pending';`);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateStatusEnum();

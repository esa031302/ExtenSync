const mysql = require('mysql2/promise');
require('dotenv').config();

const cleanupUnusedColumns = async () => {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'extensync_db'
    });

    console.log('Connected to database');

    // Check if columns exist before trying to drop them
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects' 
       AND COLUMN_NAME IN ('duration', 'objectives_general', 'objectives_specific')`,
      [process.env.DB_NAME || 'extensync_db']
    );

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('Found columns to remove:', existingColumns);

    // Drop unused columns
    const columnsToRemove = ['duration', 'objectives_general', 'objectives_specific'];
    
    for (const columnName of columnsToRemove) {
      if (existingColumns.includes(columnName)) {
        try {
          await connection.execute(`ALTER TABLE projects DROP COLUMN ${columnName}`);
          console.log(`✅ Removed column: ${columnName}`);
        } catch (error) {
          console.log(`❌ Failed to remove column ${columnName}:`, error.message);
        }
      } else {
        console.log(`ℹ️  Column ${columnName} does not exist, skipping`);
      }
    }

    // Show final table structure
    const [finalColumns] = await connection.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects' 
       ORDER BY ORDINAL_POSITION`,
      [process.env.DB_NAME || 'extensync_db']
    );

    console.log('\n📋 Final Projects Table Structure:');
    console.log('===================================');
    finalColumns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.COLUMN_NAME} (${col.DATA_TYPE}) - ${col.IS_NULLABLE === 'YES' ? 'Nullable' : 'Required'}`);
    });

  } catch (error) {
    console.error('❌ Error cleaning up unused columns:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

cleanupUnusedColumns();

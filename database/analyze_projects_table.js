const mysql = require('mysql2/promise');
require('dotenv').config();

const analyzeProjectsTable = async () => {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'extensync_db'
    });

    console.log('Connected to database');

    // Get all columns in the projects table
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects' 
       ORDER BY ORDINAL_POSITION`,
      [process.env.DB_NAME || 'extensync_db']
    );

    console.log('\n📋 Current Projects Table Columns:');
    console.log('=====================================');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.COLUMN_NAME} (${col.DATA_TYPE}) - ${col.IS_NULLABLE === 'YES' ? 'Nullable' : 'Required'}`);
    });

    // Check if there's any data in the potentially unused columns
    const [durationData] = await connection.execute(
      'SELECT COUNT(*) as count FROM projects WHERE duration IS NOT NULL AND duration != ""'
    );
    
    const [objectivesGeneralData] = await connection.execute(
      'SELECT COUNT(*) as count FROM projects WHERE objectives_general IS NOT NULL AND objectives_general != ""'
    );
    
    const [objectivesSpecificData] = await connection.execute(
      'SELECT COUNT(*) as count FROM projects WHERE objectives_specific IS NOT NULL AND objectives_specific != ""'
    );

    console.log('\n📊 Data Analysis:');
    console.log('==================');
    console.log(`Duration field has data: ${durationData[0].count} records`);
    console.log(`Objectives_general has data: ${objectivesGeneralData[0].count} records`);
    console.log(`Objectives_specific has data: ${objectivesSpecificData[0].count} records`);

    // Check total projects
    const [totalProjects] = await connection.execute('SELECT COUNT(*) as count FROM projects');
    console.log(`Total projects in database: ${totalProjects[0].count}`);

  } catch (error) {
    console.error('❌ Error analyzing projects table:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

analyzeProjectsTable();

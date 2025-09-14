const mysql = require('mysql2');
require('dotenv').config();

// Create connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'extensync_db'
});

// Enhanced reports table with photo support
const setupReportsTable = async () => {
  try {
    console.log('Setting up enhanced reports table...');

    // First, check if we need to modify the existing reports table
    const [existingTable] = await connection.promise().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reports'
    `, [process.env.DB_NAME || 'extensync_db']);

    const existingColumns = existingTable.map(row => row.COLUMN_NAME);

    // Add new columns if they don't exist
    const newColumns = [
      {
        name: 'title',
        definition: 'VARCHAR(255) NOT NULL DEFAULT "Project Report"'
      },
      {
        name: 'photos',
        definition: 'JSON DEFAULT NULL'
      },
      {
        name: 'status',
        definition: 'ENUM("Draft", "Submitted", "Reviewed", "Approved") DEFAULT "Draft"'
      },
      {
        name: 'updated_at',
        definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
      }
    ];

    for (const column of newColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`Adding column: ${column.name}`);
        await connection.promise().query(`
          ALTER TABLE reports ADD COLUMN ${column.name} ${column.definition}
        `);
      }
    }

    // Create reports_photos table for better photo management
    await connection.promise().query(`
      CREATE TABLE IF NOT EXISTS reports_photos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
        INDEX idx_report_id (report_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Reports table setup completed successfully');
  } catch (error) {
    console.error('❌ Error setting up reports table:', error);
    throw error;
  }
};

// Run the setup
setupReportsTable()
  .then(() => {
    console.log('Reports setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });

const mysql = require('mysql2/promise');
const db = require('../server/config/database');

async function setupEvaluationReports() {
  try {
    console.log('Setting up evaluation reports table...');
    
    // Drop existing reports_photos table first (it has foreign key to reports)
    await db.promise.query('DROP TABLE IF EXISTS reports_photos');
    console.log('Dropped existing reports_photos table');
    
    // Drop existing reports table if it exists
    await db.promise.query('DROP TABLE IF EXISTS reports');
    console.log('Dropped existing reports table');
    
    // Create new evaluation reports table
    const createTableSQL = `
      CREATE TABLE reports (
        report_id INT PRIMARY KEY AUTO_INCREMENT,
        project_id INT NOT NULL,
        participant_type VARCHAR(255),
        male_batstateu_participants INT DEFAULT 0,
        female_batstateu_participants INT DEFAULT 0,
        male_other_participants INT DEFAULT 0,
        female_other_participants INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT,
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
        UNIQUE KEY unique_project_report (project_id)
      )
    `;
    
    await db.promise.query(createTableSQL);
    console.log('Created new evaluation reports table');
    
    // Add indexes for better performance
    await db.promise.query('CREATE INDEX idx_reports_project_id ON reports(project_id)');
    await db.promise.query('CREATE INDEX idx_reports_created_by ON reports(created_by)');
    await db.promise.query('CREATE INDEX idx_reports_created_at ON reports(created_at)');
    console.log('Added indexes to reports table');
    
    console.log('✅ Evaluation reports table setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up evaluation reports table:', error);
    throw error;
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupEvaluationReports()
    .then(() => {
      console.log('Setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupEvaluationReports;

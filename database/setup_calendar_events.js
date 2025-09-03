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

async function setupCalendarEvents() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Create calendar_events table
    const createCalendarEventsTable = `
      CREATE TABLE IF NOT EXISTS calendar_events (
        event_id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        start_date DATE NOT NULL,
        end_date DATE,
        start_time TIME,
        end_time TIME,
        description TEXT,
        event_type ENUM('Project', 'Program', 'Activity') DEFAULT 'Project',
        status ENUM('Scheduled', 'Ongoing', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
        INDEX idx_calendar_events_dates (start_date, end_date),
        INDEX idx_calendar_events_project (project_id),
        INDEX idx_calendar_events_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `;

    await connection.execute(createCalendarEventsTable);
    console.log('✅ Calendar events table created/verified');

    console.log('🎉 Calendar events setup completed successfully!');

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
setupCalendarEvents();

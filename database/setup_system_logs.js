const mysql = require('mysql2');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'extensync_db',
  port: process.env.DB_PORT || 3306
};

// Create connection
const connection = mysql.createConnection(dbConfig);

// SQL to create system_logs table
const createSystemLogsTable = `
CREATE TABLE IF NOT EXISTS \`system_logs\` (
  \`log_id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) DEFAULT NULL,
  \`action\` varchar(255) NOT NULL,
  \`entity_type\` varchar(100) NOT NULL,
  \`entity_id\` int(11) DEFAULT NULL,
  \`description\` text NOT NULL,
  \`ip_address\` varchar(45) DEFAULT NULL,
  \`user_agent\` text DEFAULT NULL,
  \`request_method\` varchar(10) DEFAULT NULL,
  \`request_url\` varchar(500) DEFAULT NULL,
  \`status_code\` int(3) DEFAULT NULL,
  \`response_time\` int(11) DEFAULT NULL,
  \`error_message\` text DEFAULT NULL,
  \`additional_data\` json DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`log_id\`),
  KEY \`idx_user_id\` (\`user_id\`),
  KEY \`idx_action\` (\`action\`),
  KEY \`idx_entity_type\` (\`entity_type\`),
  KEY \`idx_created_at\` (\`created_at\`),
  KEY \`idx_user_action\` (\`user_id\`, \`action\`),
  KEY \`idx_entity\` (\`entity_type\`, \`entity_id\`),
  CONSTRAINT \`system_logs_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

// Sample data to insert
const sampleData = [
  {
    user_id: 2,
    action: 'LOGIN',
    entity_type: 'auth',
    entity_id: null,
    description: 'User logged in successfully',
    ip_address: '::1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    request_method: 'POST',
    request_url: '/api/auth/login',
    status_code: 200,
    response_time: 150,
    error_message: null,
    additional_data: JSON.stringify({ email: 'admin@example.com' })
  },
  {
    user_id: 2,
    action: 'CREATE',
    entity_type: 'user',
    entity_id: 3,
    description: 'Created new user account',
    ip_address: '::1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    request_method: 'POST',
    request_url: '/api/users',
    status_code: 201,
    response_time: 300,
    error_message: null,
    additional_data: JSON.stringify({ 
      fullname: 'Test User', 
      email: 'test@example.com', 
      role: 'Extension Coordinator' 
    })
  },
  {
    user_id: 2,
    action: 'UPDATE',
    entity_type: 'user',
    entity_id: 3,
    description: 'Updated user profile information',
    ip_address: '::1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    request_method: 'PUT',
    request_url: '/api/users/3',
    status_code: 200,
    response_time: 250,
    error_message: null,
    additional_data: JSON.stringify({ 
      fullname: 'Updated Test User', 
      department_college: 'Computer Science' 
    })
  },
  {
    user_id: 2,
    action: 'CREATE',
    entity_type: 'project',
    entity_id: 1,
    description: 'Created new extension project',
    ip_address: '::1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    request_method: 'POST',
    request_url: '/api/projects',
    status_code: 201,
    response_time: 500,
    error_message: null,
    additional_data: JSON.stringify({ 
      title: 'Sample Extension Project', 
      coordinator_id: 2 
    })
  },
  {
    user_id: 2,
    action: 'UPLOAD',
    entity_type: 'document',
    entity_id: 1,
    description: 'Uploaded project document',
    ip_address: '::1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    request_method: 'POST',
    request_url: '/api/documents/upload',
    status_code: 200,
    response_time: 800,
    error_message: null,
    additional_data: JSON.stringify({ 
      filename: 'project_proposal.pdf', 
      file_size: 1024000 
    })
  },
  {
    user_id: 2,
    action: 'EVALUATE',
    entity_type: 'project',
    entity_id: 1,
    description: 'Evaluated project proposal',
    ip_address: '::1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    request_method: 'POST',
    request_url: '/api/projects/1/evaluate',
    status_code: 200,
    response_time: 400,
    error_message: null,
    additional_data: JSON.stringify({ 
      decision: 'Approved', 
      feedback: 'Excellent proposal' 
    })
  },
  {
    user_id: 2,
    action: 'LOGOUT',
    entity_type: 'auth',
    entity_id: null,
    description: 'User logged out',
    ip_address: '::1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    request_method: 'POST',
    request_url: '/api/auth/logout',
    status_code: 200,
    response_time: 50,
    error_message: null,
    additional_data: JSON.stringify({})
  }
];

// Function to insert sample data
const insertSampleData = () => {
  const insertQuery = `
    INSERT INTO system_logs 
    (user_id, action, entity_type, entity_id, description, ip_address, user_agent, 
     request_method, request_url, status_code, response_time, error_message, additional_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  sampleData.forEach((log, index) => {
    const values = [
      log.user_id,
      log.action,
      log.entity_type,
      log.entity_id,
      log.description,
      log.ip_address,
      log.user_agent,
      log.request_method,
      log.request_url,
      log.status_code,
      log.response_time,
      log.error_message,
      log.additional_data
    ];

    connection.query(insertQuery, values, (err, result) => {
      if (err) {
        console.error(`Error inserting sample log ${index + 1}:`, err);
      } else {
        console.log(`✅ Sample log ${index + 1} inserted successfully`);
      }
    });
  });
};

// Main execution
connection.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    process.exit(1);
  }

  console.log('✅ Connected to database successfully');

  // Create system_logs table
  connection.query(createSystemLogsTable, (err, result) => {
    if (err) {
      console.error('❌ Error creating system_logs table:', err);
      connection.end();
      process.exit(1);
    }

    console.log('✅ System logs table created successfully');

    // Check if table is empty before inserting sample data
    connection.query('SELECT COUNT(*) as count FROM system_logs', (err, result) => {
      if (err) {
        console.error('❌ Error checking table count:', err);
        connection.end();
        process.exit(1);
      }

      const count = result[0].count;
      if (count === 0) {
        console.log('📝 Inserting sample data...');
        insertSampleData();
        
        // Wait a bit for inserts to complete
        setTimeout(() => {
          console.log('✅ System logs setup completed successfully!');
          connection.end();
        }, 2000);
      } else {
        console.log(`✅ System logs table already contains ${count} records`);
        console.log('✅ System logs setup completed successfully!');
        connection.end();
      }
    });
  });
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Process terminated by user');
  connection.end();
  process.exit(0);
});

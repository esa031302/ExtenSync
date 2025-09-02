const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Database configuration (same as server)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'extensync_db',
  port: process.env.DB_PORT || 3306
};

// Create connection
const connection = mysql.createConnection(dbConfig);

// Read the SQL file
const sqlFile = fs.readFileSync(path.join(__dirname, 'documents_table.sql'), 'utf8');

// Execute the SQL
connection.query(sqlFile, (err, results) => {
  if (err) {
    console.error('Error creating documents table:', err);
    process.exit(1);
  }
  
  console.log('✅ Documents table created successfully!');
  console.log('Results:', results);
  
  connection.end();
});

const mysql = require('mysql2');
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

async function checkAndCreateTable() {
  try {
    console.log('🔍 Checking documents table structure...');
    
    // Check if documents table exists
    const [tables] = await connection.promise().query(
      "SHOW TABLES LIKE 'documents'"
    );
    
    if (tables.length === 0) {
      console.log('📝 Documents table does not exist. Creating it...');
      
      // Create the documents table
      const createTableSQL = `
        CREATE TABLE documents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          original_filename VARCHAR(255) NOT NULL,
          file_size BIGINT NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          uploaded_by INT NOT NULL,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `;
      
      await connection.promise().query(createTableSQL);
      
      // Create indexes
      await connection.promise().query(
        'CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by)'
      );
      await connection.promise().query(
        'CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at)'
      );
      
      console.log('✅ Documents table created successfully!');
    } else {
      console.log('✅ Documents table already exists.');
      
      // Check table structure
      const [columns] = await connection.promise().query(
        "DESCRIBE documents"
      );
      
      console.log('📋 Current table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    connection.end();
  }
}

checkAndCreateTable();

const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

const setupCommunityTables = async () => {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'extensync_db'
    });

    console.log('Connected to database');

    // Read and execute the SQL file
    const sqlContent = fs.readFileSync('./setup_community_tables.sql', 'utf8');
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log('✅ Executed SQL statement successfully');
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('⚠️  Table already exists, skipping...');
          } else {
            console.error('❌ Error executing statement:', error.message);
          }
        }
      }
    }

    console.log('✅ Community tables setup completed successfully');

  } catch (error) {
    console.error('❌ Error setting up community tables:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
};

// Run the setup
if (require.main === module) {
  setupCommunityTables()
    .then(() => {
      console.log('Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupCommunityTables;

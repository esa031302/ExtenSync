const mysql = require('mysql2/promise');
require('dotenv').config();

const addUserProfileFields = async () => {
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

    // Add phone field if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN phone VARCHAR(50) DEFAULT NULL
      `);
      console.log('✅ Successfully added phone field to users table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Phone field already exists, skipping...');
      } else {
        throw error;
      }
    }

    // Add address field if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN address TEXT DEFAULT NULL
      `);
      console.log('✅ Successfully added address field to users table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Address field already exists, skipping...');
      } else {
        throw error;
      }
    }

    // Verify the changes
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('phone', 'address')
    `, [process.env.DB_NAME || 'extensync_db']);

    console.log('Updated user table fields:');
    columns.forEach(col => {
      console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });

  } catch (error) {
    console.error('❌ Error adding user profile fields:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
};

// Run the migration
if (require.main === module) {
  addUserProfileFields()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addUserProfileFields;

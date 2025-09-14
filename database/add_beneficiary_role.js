const mysql = require('mysql2/promise');
require('dotenv').config();

const addBeneficiaryRole = async () => {
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

    // Check current role enum values
    const [columns] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'role'
    `, [process.env.DB_NAME || 'extensync_db']);

    console.log('Current role enum:', columns[0].COLUMN_TYPE);

    // Add Beneficiary to the role enum
    const alterQuery = `
      ALTER TABLE users 
      MODIFY COLUMN role ENUM(
        'Extension Coordinator',
        'Extension Head', 
        'GAD',
        'Vice Chancellor',
        'Chancellor',
        'Admin',
        'Beneficiary'
      ) NOT NULL
    `;

    await connection.execute(alterQuery);
    console.log('✅ Successfully added Beneficiary role to the database');

    // Verify the change
    const [updatedColumns] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'role'
    `, [process.env.DB_NAME || 'extensync_db']);

    console.log('Updated role enum:', updatedColumns[0].COLUMN_TYPE);

  } catch (error) {
    console.error('❌ Error adding Beneficiary role:', error.message);
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
  addBeneficiaryRole()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addBeneficiaryRole;

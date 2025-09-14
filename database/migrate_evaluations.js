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

async function migrateEvaluations() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check current table structure
    console.log('🔍 Checking current evaluations table structure...');
    const [columns] = await connection.execute('DESCRIBE evaluations');
    const existingColumns = columns.map(col => col.Field);
    console.log('Current columns:', existingColumns);

    // Add missing columns
    const migrations = [
      {
        column: 'total_score',
        sql: 'ALTER TABLE evaluations ADD COLUMN total_score INT DEFAULT 0'
      },
      {
        column: 'max_score',
        sql: 'ALTER TABLE evaluations ADD COLUMN max_score INT DEFAULT 100'
      },
      {
        column: 'score_percentage',
        sql: 'ALTER TABLE evaluations ADD COLUMN score_percentage DECIMAL(5,2) DEFAULT 0.00'
      },
      {
        column: 'rubric_scores',
        sql: 'ALTER TABLE evaluations ADD COLUMN rubric_scores JSON'
      },
      {
        column: 'updated_at',
        sql: 'ALTER TABLE evaluations ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
      }
    ];

    for (const migration of migrations) {
      if (!existingColumns.includes(migration.column)) {
        console.log(`🔧 Adding column: ${migration.column}`);
        await connection.execute(migration.sql);
        console.log(`✅ Added column: ${migration.column}`);
      } else {
        console.log(`ℹ️  Column already exists: ${migration.column}`);
      }
    }

    // Add unique constraint if it doesn't exist
    try {
      await connection.execute('ALTER TABLE evaluations ADD CONSTRAINT unique_evaluation UNIQUE (project_id, evaluator_id)');
      console.log('✅ Added unique constraint');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  Unique constraint already exists');
      } else {
        throw error;
      }
    }

    // Verify the final structure
    console.log('\n📋 Final evaluations table structure:');
    const [finalColumns] = await connection.execute('DESCRIBE evaluations');
    finalColumns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n🎉 Evaluations table migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateEvaluations()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateEvaluations;

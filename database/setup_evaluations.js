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

async function setupEvaluations() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Create evaluations table with rubric support
    const createEvaluationsTable = `
      CREATE TABLE IF NOT EXISTS evaluations (
        eval_id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        evaluator_id INT NOT NULL,
        feedback TEXT NOT NULL,
        decision ENUM('Approved', 'Rejected', 'Needs Revision') NOT NULL,
        total_score INT DEFAULT 0,
        max_score INT DEFAULT 100,
        score_percentage DECIMAL(5,2) DEFAULT 0.00,
        rubric_scores JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
        FOREIGN KEY (evaluator_id) REFERENCES users(user_id) ON DELETE CASCADE,
        UNIQUE KEY unique_evaluation (project_id, evaluator_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `;

    await connection.execute(createEvaluationsTable);
    console.log('✅ Evaluations table created/verified');

    // Add indexes for better performance
    const addIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_evaluations_project_id ON evaluations(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator_id ON evaluations(evaluator_id)',
      'CREATE INDEX IF NOT EXISTS idx_evaluations_decision ON evaluations(decision)',
      'CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at)'
    ];

    for (const indexQuery of addIndexes) {
      try {
        await connection.execute(indexQuery);
      } catch (error) {
        // Index might already exist, continue
        console.log(`ℹ️  Index creation skipped (might already exist): ${error.message}`);
      }
    }

    console.log('✅ Evaluation indexes created/verified');

    // Insert sample evaluation data (optional)
    const sampleEvaluations = [
      {
        project_id: 1,
        evaluator_id: 2, // Assuming user_id 2 is an evaluator
        feedback: 'Sample evaluation feedback for demonstration purposes.',
        decision: 'Needs Revision',
        total_score: 75,
        max_score: 100,
        score_percentage: 75.00,
        rubric_scores: JSON.stringify({
          relevance: { score: 12, maxPoints: 15, comments: 'Good alignment with SDGs' },
          baseline_data_availability: { score: 4, maxPoints: 5, comments: 'Needs assessment included' },
          baseline_data_discussion: { score: 4, maxPoints: 5, comments: 'Problem addressed clearly' },
          baseline_measures_objectives: { score: 8, maxPoints: 10, comments: 'SMART objectives present' },
          gender_disaggregated_data: { score: 6, maxPoints: 8, comments: 'Gender analysis included' },
          problem_solution_discussion: { score: 8, maxPoints: 10, comments: 'Clear problem statement' },
          implementation_strategies: { score: 7, maxPoints: 8, comments: 'Appropriate strategies' },
          innovation_efforts: { score: 6, maxPoints: 8, comments: 'Some innovative approaches' },
          partnerships_linkages: { score: 7, maxPoints: 8, comments: 'Good partnership plan' },
          monitoring_evaluation_plan: { score: 6, maxPoints: 8, comments: 'Monitoring plan present' },
          adopters_demonstration: { score: 7, maxPoints: 10, comments: 'Replication plan included' },
          sustainability_plan: { score: 4, maxPoints: 5, comments: 'Sustainability addressed' }
        })
      }
    ];

    // Check if sample data already exists
    const [existingSamples] = await connection.execute(
      'SELECT COUNT(*) as count FROM evaluations WHERE project_id = 1 AND evaluator_id = 2'
    );

    if (existingSamples[0].count === 0) {
      for (const evaluation of sampleEvaluations) {
        await connection.execute(
          `INSERT INTO evaluations (
            project_id, evaluator_id, feedback, decision, 
            total_score, max_score, score_percentage, rubric_scores
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            evaluation.project_id,
            evaluation.evaluator_id,
            evaluation.feedback,
            evaluation.decision,
            evaluation.total_score,
            evaluation.max_score,
            evaluation.score_percentage,
            evaluation.rubric_scores
          ]
        );
      }
      console.log('✅ Sample evaluation data inserted');
    } else {
      console.log('ℹ️  Sample evaluation data already exists, skipping insertion');
    }

    console.log('🎉 Evaluations table setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up evaluations table:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupEvaluations()
    .then(() => {
      console.log('✅ Evaluations setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Evaluations setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupEvaluations;

-- Drop existing reports table if it exists
DROP TABLE IF EXISTS reports;

-- Create new evaluation reports table
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
);

-- Add indexes for better performance
CREATE INDEX idx_reports_project_id ON reports(project_id);
CREATE INDEX idx_reports_created_by ON reports(created_by);
CREATE INDEX idx_reports_created_at ON reports(created_at);

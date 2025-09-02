-- System Logs Table for ExtenSync
-- This table will store all system activities and user actions

CREATE TABLE IF NOT EXISTS `system_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `entity_type` varchar(100) NOT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `description` text NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `request_method` varchar(10) DEFAULT NULL,
  `request_url` varchar(500) DEFAULT NULL,
  `status_code` int(3) DEFAULT NULL,
  `response_time` int(11) DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `additional_data` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_entity_type` (`entity_type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_action` (`user_id`, `action`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  CONSTRAINT `system_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert some sample log entries for testing
INSERT INTO `system_logs` (`user_id`, `action`, `entity_type`, `entity_id`, `description`, `ip_address`, `user_agent`, `request_method`, `request_url`, `status_code`, `response_time`, `additional_data`) VALUES
(2, 'LOGIN', 'auth', NULL, 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'POST', '/api/auth/login', 200, 150, '{"email": "admin@example.com"}'),
(2, 'CREATE', 'user', 3, 'Created new user account', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'POST', '/api/users', 201, 300, '{"fullname": "Test User", "email": "test@example.com", "role": "Extension Coordinator"}'),
(2, 'UPDATE', 'user', 3, 'Updated user profile information', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'PUT', '/api/users/3', 200, 250, '{"fullname": "Updated Test User", "department_college": "Computer Science"}'),
(2, 'CREATE', 'project', 1, 'Created new extension project', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'POST', '/api/projects', 201, 500, '{"title": "Sample Extension Project", "coordinator_id": 2}'),
(2, 'UPLOAD', 'document', 1, 'Uploaded project document', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'POST', '/api/documents/upload', 200, 800, '{"filename": "project_proposal.pdf", "file_size": 1024000}'),
(2, 'EVALUATE', 'project', 1, 'Evaluated project proposal', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'POST', '/api/projects/1/evaluate', 200, 400, '{"decision": "Approved", "feedback": "Excellent proposal"}'),
(2, 'LOGOUT', 'auth', NULL, 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'POST', '/api/auth/logout', 200, 50, '{}');

-- Create tables for community portal features

-- Community Requests Table
CREATE TABLE IF NOT EXISTS `community_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `organization` varchar(255) DEFAULT NULL,
  `request_type` varchar(100) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `priority` enum('Low','Medium','High','Urgent') NOT NULL DEFAULT 'Medium',
  `preferred_contact_method` enum('Email','Phone','SMS') NOT NULL DEFAULT 'Email',
  `status` enum('Pending','In Review','In Progress','Completed','Rejected') NOT NULL DEFAULT 'Pending',
  `submitted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_request_type` (`request_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Community Feedback Table
CREATE TABLE IF NOT EXISTS `community_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `organization` varchar(255) DEFAULT NULL,
  `feedback_type` varchar(100) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `rating` int(1) NOT NULL,
  `message` text NOT NULL,
  `allow_public_display` boolean NOT NULL DEFAULT false,
  `preferred_contact_method` enum('Email','Phone','SMS') NOT NULL DEFAULT 'Email',
  `status` enum('New','Reviewed','In Progress','Resolved','Closed') NOT NULL DEFAULT 'New',
  `submitted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_feedback_type` (`feedback_type`),
  KEY `idx_rating` (`rating`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Community Announcements Table
CREATE TABLE IF NOT EXISTS `community_announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `category` enum('General','Program Updates','Event Announcements','Service Changes','Community News','Important Notices','Training Opportunities','Partnership Updates') NOT NULL,
  `priority` enum('Low','Medium','High') NOT NULL DEFAULT 'Medium',
  `status` enum('Draft','Published','Archived') NOT NULL DEFAULT 'Draft',
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_category` (`category`),
  KEY `idx_priority` (`priority`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some sample announcements
INSERT INTO `community_announcements` (`title`, `content`, `category`, `priority`, `status`) VALUES
('New Educational Programs Available', 'We are pleased to announce several new educational programs starting this semester. These programs include technology training, leadership development, and community service initiatives. Registration is now open.', 'Program Updates', 'Medium', 'Published'),
('Community Service Day - Save the Date', 'Join us for our annual Community Service Day on March 15th. This event brings together volunteers from across the community to work on various service projects. More details will be announced soon.', 'Event Announcements', 'Medium', 'Published'),
('Improved Request Processing', 'We have implemented new systems to process community requests more efficiently. You can now expect faster response times and better tracking of your requests through our portal.', 'Service Changes', 'Low', 'Published');

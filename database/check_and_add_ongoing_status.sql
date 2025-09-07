-- Check current status enum
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'extensync_db' AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'status';

-- Add 'On-Going' to the status enum if it's not already there
-- Run this only if the above query shows that 'On-Going' is missing
-- ALTER TABLE projects 
-- MODIFY COLUMN status ENUM('Pending','Approved','Rejected','On-Going','Completed') 
-- DEFAULT 'Pending';

-- Add Beneficiary role to the users table
-- This script updates the role enum to include 'Beneficiary'

ALTER TABLE users 
MODIFY COLUMN role ENUM(
  'Extension Coordinator',
  'Extension Head', 
  'GAD',
  'Vice Chancellor',
  'Chancellor',
  'Admin',
  'Beneficiary'
) NOT NULL;

-- Verify the change
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'extensync_db' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'role';

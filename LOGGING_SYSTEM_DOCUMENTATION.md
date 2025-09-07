# ExtenSync System Logging Documentation

## Overview

The ExtenSync system now includes comprehensive logging functionality that tracks all user activities, project lifecycle events, and evaluation operations. This documentation outlines the logging system implementation and usage.

## Features Implemented

### Project Lifecycle Logging
- **Project Creation**: Logs when new extension projects are created
- **Project Editing**: Logs when project information is updated
- **Project Start**: Logs when projects transition from "Approved" to "On-Going"
- **Project Completion**: Logs when projects are marked as "Completed" (including early completion with reasons)
- **Project Approval**: Logs when projects are approved by elevated roles
- **Project Rejection**: Logs when projects are rejected with remarks
- **Project Deletion**: Logs when projects are deleted by authorized users

### Evaluation Logging
- **Evaluation Creation**: Logs when new project evaluations are created
- **Evaluation Editing**: Logs when evaluation details are modified
- **Evaluation Deletion**: Logs when evaluations are removed (Admin only)

### System Architecture

#### Database Schema
The logging system uses the `system_logs` table with the following structure:

```sql
CREATE TABLE `system_logs` (
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
  CONSTRAINT `system_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
);
```

#### Logging Actions

The system now supports the following action types:

| Action | Description | Entity Type | Usage |
|--------|-------------|-------------|-------|
| `CREATE` | Creating new resources | project, evaluation, user, etc. | New project proposals, evaluations |
| `UPDATE` | Updating existing resources | project, evaluation, user, etc. | Editing project details |
| `DELETE` | Deleting resources | project, evaluation, user, etc. | Removing projects or evaluations |
| `START` | Starting project execution | project | When projects move to "On-Going" |
| `COMPLETE` | Completing projects | project | When projects are marked "Completed" |
| `APPROVE` | Approving project proposals | project | When projects are approved |
| `REJECT` | Rejecting project proposals | project | When projects are rejected |
| `LOGIN` | User authentication | auth | User login attempts |
| `LOGOUT` | User session termination | auth | User logout |
| `UPLOAD` | File uploads | document | Document uploads |
| `EVALUATE` | General evaluation actions | project | Legacy evaluation logging |

## Implementation Details

### Middleware Integration

The logging system uses Express middleware that intercepts requests and responses to automatically capture activity data:

```javascript
// Example usage in routes
router.post('/', [auth, logActions.createProject], async (req, res) => {
  // Route handler logic
});

router.put('/:id/start', [auth, logActions.startProject], async (req, res) => {
  // Route handler logic
});
```

### Enhanced Project Route Logging

#### Projects Router (`/server/routes/projects.js`)
- `POST /api/projects` - Uses `logActions.createProject`
- `PUT /api/projects/:id` - Uses `logActions.updateProject`
- `DELETE /api/projects/:id` - Uses `logActions.deleteProject`
- `POST /api/projects/:id/decision` - Uses conditional logging (`logActions.approveProject` or `logActions.rejectProject`)
- `PUT /api/projects/:id/start` - Uses `logActions.startProject`
- `PUT /api/projects/:id/complete` - Uses `logActions.completeProject`

#### Evaluations Router (`/server/routes/evaluations.js`)
- `POST /api/evaluations` - Uses `logActions.createEvaluation`
- `PUT /api/evaluations/:evalId` - Uses `logActions.updateEvaluation`
- `DELETE /api/evaluations/:evalId` - Uses `logActions.deleteEvaluation`

### Logged Data Structure

Each log entry captures comprehensive information:

```json
{
  "log_id": 123,
  "user_id": 5,
  "action": "START",
  "entity_type": "project",
  "entity_id": 42,
  "description": "Started project execution",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "request_method": "PUT",
  "request_url": "/api/projects/42/start",
  "status_code": 200,
  "response_time": 150,
  "error_message": null,
  "additional_data": {
    "status": "On-Going",
    "request_body": {...},
    "response_data": {...},
    "user_role": "Extension Coordinator"
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Frontend Integration

The System Logs component (`/client/src/components/SystemLogs.js`) has been enhanced to support the new action types with appropriate color coding:

- **START**: Info (blue) badge
- **COMPLETE**: Success (green) badge  
- **APPROVE**: Success (green) badge
- **REJECT**: Danger (red) badge

## Usage Examples

### Viewing Logs

**For Extension Coordinators:**
- Can only view logs related to their own projects
- See their own project creation, editing, start, and completion activities

**For Elevated Roles (Admin, Extension Head, etc.):**
- Can view all system logs
- Access to comprehensive filtering and statistics
- Can delete log entries (Admin only)

### Filtering Logs

The system supports filtering by:
- Action type (CREATE, UPDATE, START, COMPLETE, etc.)
- Entity type (project, evaluation, user, etc.)
- Date range (start and end dates)
- User (Admin only)

### Log Statistics (Admin Only)

Administrators can access detailed statistics including:
- Total log entries
- Top actions by frequency
- Top entity types by activity
- Most active users
- Daily activity trends

## Security and Privacy

### Access Control
- **Extension Coordinators**: Can only view logs for their own projects
- **Elevated Roles**: Can view all logs with filtering capabilities
- **Admins**: Full access including log deletion and statistics

### Data Protection
- Sensitive information in request bodies is logged but access is restricted
- IP addresses and user agents are captured for security auditing
- User IDs are foreign-keyed to maintain data integrity

### Retention Policy
- Admins can clear old logs using the bulk delete functionality
- Default retention can be configured (e.g., logs older than 90 days)

## Monitoring and Maintenance

### Performance Considerations
- Logging is asynchronous and doesn't block main request processing
- Database indexes on key fields (user_id, action, entity_type, created_at) ensure fast queries
- JSON additional_data field allows flexible data storage

### Error Handling
- Logging failures don't break main application functionality
- Errors in logging are captured in server console logs
- System continues to operate even if logging temporarily fails

## Troubleshooting

### Common Issues

1. **Logs not appearing**: Check that middleware is properly attached to routes
2. **Missing user information**: Ensure authentication middleware runs before logging middleware
3. **Performance issues**: Consider log retention policies and database indexing

### Debug Mode
Enable additional logging details by setting appropriate log levels in the application configuration.

## Future Enhancements

Potential improvements to consider:
- Real-time log streaming via WebSocket
- Log export functionality
- Advanced analytics and reporting
- Integration with external monitoring tools
- Automated alerts for suspicious activities

## Conclusion

The enhanced logging system provides comprehensive audit trails for all critical system operations, ensuring accountability, security, and compliance with organizational requirements. The system balances detailed logging with performance and privacy considerations.

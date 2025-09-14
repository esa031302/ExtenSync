const db = require('../config/database');

// Logging middleware to capture system activities
const logger = (action, entityType = null, entityId = null, description = '', additionalData = {}) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Store original send method
    const originalSend = res.send;
    
    // Override send method to capture response data
    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      
      // Parse response data if it's JSON
      let responseData = {};
      try {
        if (typeof data === 'string') {
          responseData = JSON.parse(data);
        } else {
          responseData = data;
        }
      } catch (e) {
        responseData = { raw: data };
      }
      
      // Log the activity
      logActivity({
        user_id: req.user?.user?.id || null,
        action: action,
        entity_type: entityType,
        entity_id: entityId,
        description: description,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent'),
        request_method: req.method,
        request_url: req.originalUrl,
        status_code: res.statusCode,
        response_time: responseTime,
        error_message: res.statusCode >= 400 ? (responseData.error || responseData.message || 'Error occurred') : null,
        additional_data: JSON.stringify({
          ...additionalData,
          request_body: req.body,
          response_data: responseData,
          user_role: req.user?.user?.role || null
        })
      });
      
      // Call original send method
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Function to log activity to database
const logActivity = async (logData) => {
  try {
    const query = `
      INSERT INTO system_logs 
      (user_id, action, entity_type, entity_id, description, ip_address, user_agent, 
       request_method, request_url, status_code, response_time, error_message, additional_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      logData.user_id,
      logData.action,
      logData.entity_type,
      logData.entity_id,
      logData.description,
      logData.ip_address,
      logData.user_agent,
      logData.request_method,
      logData.request_url,
      logData.status_code,
      logData.response_time,
      logData.error_message,
      logData.additional_data
    ];
    
    await db.promise.query(query, values);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Helper function to log activities without middleware
const logSystemActivity = async (logData) => {
  await logActivity(logData);
};

// Predefined logging functions for common actions
const logActions = {
  login: (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    
    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      
      // Parse response data if it's JSON
      let responseData = {};
      try {
        if (typeof data === 'string') {
          responseData = JSON.parse(data);
        } else {
          responseData = data;
        }
      } catch (e) {
        responseData = { raw: data };
      }
      
      // For login, we need to get user info from the request body
      const userEmail = req.body.email;
      
      // Only log successful logins (status 200)
      if (res.statusCode === 200) {
        // For successful logins, we'll create a temporary log and update it later
        logActivity({
          user_id: null, // Will be updated after user lookup
          action: 'LOGIN',
          entity_type: 'auth',
          entity_id: null,
          description: `Login attempt: ${userEmail}`,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          request_method: req.method,
          request_url: req.originalUrl,
          status_code: res.statusCode,
          response_time: responseTime,
          error_message: null,
          additional_data: JSON.stringify({
            email: userEmail,
            request_body: req.body,
            response_data: responseData,
            login_status: 'success'
          })
        });
      } else {
        // Log failed login attempts
        logActivity({
          user_id: null,
          action: 'LOGIN',
          entity_type: 'auth',
          entity_id: null,
          description: `Failed login attempt: ${userEmail}`,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          request_method: req.method,
          request_url: req.originalUrl,
          status_code: res.statusCode,
          response_time: responseTime,
          error_message: responseData.error || 'Login failed',
          additional_data: JSON.stringify({
            email: userEmail,
            request_body: req.body,
            response_data: responseData,
            login_status: 'failed'
          })
        });
      }
      
      // Call original send method
      originalSend.call(this, data);
    };
    
    next();
  },
  logout: (req, res, next) => logger('LOGOUT', 'auth', null, 'User logged out')(req, res, next),
  
  // User actions
  createUser: (req, res, next) => logger('CREATE', 'user', null, 'Created new user account', { email: req.body.email })(req, res, next),
  updateUser: (req, res, next) => logger('UPDATE', 'user', req.params.id, 'Updated user profile information')(req, res, next),
  deleteUser: (req, res, next) => logger('DELETE', 'user', req.params.id, 'Deleted user account')(req, res, next),
  
  // Project lifecycle actions
  createProject: (req, res, next) => logger('CREATE', 'project', null, 'Created new extension project', { title: req.body.title })(req, res, next),
  updateProject: (req, res, next) => logger('UPDATE', 'project', req.params.id, 'Updated project information')(req, res, next),
  deleteProject: (req, res, next) => logger('DELETE', 'project', req.params.id, 'Deleted project')(req, res, next),
  startProject: (req, res, next) => logger('START', 'project', req.params.id, 'Started project execution', { status: 'On-Going' })(req, res, next),
  completeProject: (req, res, next) => logger('COMPLETE', 'project', req.params.id, 'Completed project execution', { 
    status: 'Completed',
    early_completion: req.body.early_completion_reason ? true : false,
    early_completion_reason: req.body.early_completion_reason || null
  })(req, res, next),
  approveProject: (req, res, next) => logger('APPROVE', 'project', req.params.id, 'Approved project proposal', { 
    decision: req.body.decision,
    remarks: req.body.remarks 
  })(req, res, next),
  rejectProject: (req, res, next) => logger('REJECT', 'project', req.params.id, 'Rejected project proposal', { 
    decision: req.body.decision,
    remarks: req.body.remarks 
  })(req, res, next),
  evaluateProject: (req, res, next) => logger('EVALUATE', 'project', req.params.id, 'Evaluated project proposal', { 
    decision: req.body.decision,
    remarks: req.body.remarks 
  })(req, res, next),
  reproposeProject: (req, res, next) => logger('REPROPOSE', 'project', req.params.id, 'Reproposed rejected project', { 
    status: 'Pending',
    previous_status: 'Rejected'
  })(req, res, next),
  
  // Evaluation actions
  updateEvaluation: (req, res, next) => logger('UPDATE', 'evaluation', req.params.evalId, 'Updated project evaluation', { 
    decision: req.body.decision,
    total_score: req.body.total_score,
    score_percentage: req.body.score_percentage
  })(req, res, next),
  deleteEvaluation: (req, res, next) => logger('DELETE', 'evaluation', req.params.evalId, 'Deleted project evaluation')(req, res, next),
  
  // Document actions
  uploadDocument: (req, res, next) => logger('UPLOAD', 'document', null, 'Uploaded project document', { filename: req.file?.originalname })(req, res, next),
  deleteDocument: (req, res, next) => logger('DELETE', 'document', req.params.id, 'Deleted document')(req, res, next),
  
  // Notification actions
  createNotification: (req, res, next) => logger('CREATE', 'notification', null, 'Created notification')(req, res, next),
  updateNotification: (req, res, next) => logger('UPDATE', 'notification', req.params.id, 'Updated notification status')(req, res, next),
  
  // Report actions
  createReport: (req, res, next) => logger('CREATE', 'report', null, 'Created project report', { 
    project_id: req.body.project_id,
    type: req.body.type,
    title: req.body.title
  })(req, res, next),
  updateReport: (req, res, next) => logger('UPDATE', 'report', req.params.id, 'Updated project report', { 
    type: req.body.type,
    title: req.body.title,
    status: req.body.status
  })(req, res, next),
  deleteReport: (req, res, next) => logger('DELETE', 'report', req.params.id, 'Deleted project report')(req, res, next),
  
  // General purpose action
  systemAction: (action, entityType, entityId, description, additionalData) => 
    (req, res, next) => logger(action, entityType, entityId, description, additionalData)(req, res, next)
};

module.exports = {
  logger,
  logActivity,
  logSystemActivity,
  logActions
};

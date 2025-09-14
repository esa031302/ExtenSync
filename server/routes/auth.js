const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { logActions } = require('../middleware/logger');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('fullname', 'Full name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  body('role', 'Role is required').not().isEmpty(),
  body('department_college', 'Department/College is required').not().isEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, email, password, role, department_college } = req.body;

    // Check if user already exists
    const [existingUsers] = await db.promise.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const [result] = await db.promise.query(
      'INSERT INTO users (fullname, email, password, role, department_college, date_registered) VALUES (?, ?, ?, ?, ?, NOW())',
      [fullname, email, hashedPassword, role, department_college]
    );

    // Create JWT token
    const payload = {
      user: {
        id: result.insertId,
        fullname,
        email,
        role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate employee & get token (employees only)
// @access  Public
router.post('/login', [
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password is required').exists(),
  logActions.login
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const [users] = await db.promise.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if account is active
    if (user.account_status !== 'Active') {
      return res.status(400).json({ error: 'Account is inactive' });
    }

    // Check if user is NOT a beneficiary (employees only)
    if (user.role === 'Beneficiary') {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await db.promise.query(
      'UPDATE users SET last_login = NOW() WHERE user_id = ?',
      [user.user_id]
    );

    // Create JWT token
    const payload = {
      user: {
        id: user.user_id,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
      async (err, token) => {
        if (err) throw err;
        
        // Update the log entry with the actual user_id
        try {
          // First, let's find the most recent login log for this email that has null user_id
          const [findResult] = await db.promise.query(
            'SELECT log_id FROM system_logs WHERE action = ? AND additional_data LIKE ? AND user_id IS NULL ORDER BY created_at DESC LIMIT 1',
            ['LOGIN', `%${user.email}%`]
          );
          
          if (findResult.length > 0) {
            const logId = findResult[0].log_id;
            const [updateResult] = await db.promise.query(
              'UPDATE system_logs SET user_id = ?, description = ? WHERE log_id = ?',
              [
                user.user_id,
                `User logged in successfully: ${user.fullname} (${user.email}) - ${user.role}`,
                logId
              ]
            );
            console.log(`Updated login log ID ${logId} for user ${user.email} (${user.role}), rows affected: ${updateResult.affectedRows}`);
          } else {
            console.log(`No login log found to update for user ${user.email}`);
          }
        } catch (logError) {
          console.error('Error updating login log:', logError);
        }
        
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/beneficiary-login
// @desc    Authenticate beneficiary & get token (beneficiaries only)
// @access  Public
router.post('/beneficiary-login', [
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password is required').exists(),
  logActions.login
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const [users] = await db.promise.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if account is active
    if (user.account_status !== 'Active') {
      return res.status(400).json({ error: 'Account is inactive' });
    }

    // Check if user IS a beneficiary (beneficiaries only)
    if (user.role !== 'Beneficiary') {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await db.promise.query(
      'UPDATE users SET last_login = NOW() WHERE user_id = ?',
      [user.user_id]
    );

    // Create JWT token
    const payload = {
      user: {
        id: user.user_id,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
      async (err, token) => {
        if (err) throw err;
        
        // Update the log entry with the actual user_id
        try {
          // First, let's find the most recent login log for this email that has null user_id
          const [findResult] = await db.promise.query(
            'SELECT log_id FROM system_logs WHERE action = ? AND additional_data LIKE ? AND user_id IS NULL ORDER BY created_at DESC LIMIT 1',
            ['LOGIN', `%${user.email}%`]
          );
          
          if (findResult.length > 0) {
            const logId = findResult[0].log_id;
            const [updateResult] = await db.promise.query(
              'UPDATE system_logs SET user_id = ?, description = ? WHERE log_id = ?',
              [
                user.user_id,
                `Beneficiary logged in successfully: ${user.fullname} (${user.email}) - ${user.role}`,
                logId
              ]
            );
            console.log(`Updated beneficiary login log ID ${logId} for user ${user.email} (${user.role}), rows affected: ${updateResult.affectedRows}`);
          } else {
            console.log(`No login log found to update for beneficiary ${user.email}`);
          }
        } catch (logError) {
          console.error('Error updating beneficiary login log:', logError);
        }
        
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, logActions.logout, async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const [users] = await db.promise.query(
      'SELECT user_id, fullname, email, role, department_college, profile_photo, signature_path, account_status, date_registered, last_login, created_at FROM users WHERE user_id = ?',
      [req.user.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

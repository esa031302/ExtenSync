const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { logActions } = require('../middleware/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/profile-photos');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.params.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer for signature uploads
const signatureStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/signatures');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'signature-' + req.params.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const signatureUpload = multer({
  storage: signatureStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const [users] = await db.promise.query(
      'SELECT user_id, fullname, email, role, department_college, account_status, date_registered, last_login FROM users ORDER BY date_registered DESC'
    );
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/eligible-participants
// @desc    Get users eligible to participate in projects (Extension Coordinator and above, excluding Beneficiary and Admin)
// @access  Private
router.get('/eligible-participants', auth, async (req, res) => {
  try {
    const allowedRoles = [
      'Extension Coordinator',
      'Extension Head',
      'GAD',
      'Vice Chancellor',
      'Chancellor'
    ];

    const [users] = await db.promise.query(
      `SELECT user_id, fullname, email, role, department_college
       FROM users
       WHERE role IN (?) AND account_status = 'Active'
       ORDER BY role ASC, fullname ASC`,
      [allowedRoles]
    );

    res.json(users);
  } catch (err) {
    console.error('Failed to fetch eligible participants:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/users
// @desc    Create a new user (admin only)
// @access  Private
router.post('/', [
  auth,
  body('fullname', 'Full name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  body('role', 'Role is required').isIn(['Extension Coordinator', 'Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor', 'Admin', 'Beneficiary']),
  body('department_college', 'Department/College is required').not().isEmpty(),
  body('account_status', 'Account status must be Active or Inactive').optional().isIn(['Active', 'Inactive']),
  logActions.createUser
], async (req, res) => {
  try {
    // Debug logging
    console.log('=== USER CREATION DEBUG ===');
    console.log('Request body:', req.body);
    console.log('User making request:', req.user);
    console.log('User role:', req.user?.user?.role);
    
    // Check if user is admin
    if (req.user.user.role !== 'Admin') {
      console.log('Access denied - user is not admin');
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, email, password, role, department_college, account_status = 'Active' } = req.body;
    console.log('Extracted data:', { fullname, email, role, department_college, account_status });

    // Check if user already exists
    const [existingUsers] = await db.promise.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('Attempting to insert user into database...');

    // Create user
    const [result] = await db.promise.query(
      'INSERT INTO users (fullname, email, password, role, department_college, account_status, date_registered) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [fullname, email, hashedPassword, role, department_college, account_status]
    );

    console.log('User inserted successfully, ID:', result.insertId);

    // Get the created user (without password)
    const [newUser] = await db.promise.query(
      'SELECT user_id, fullname, email, role, department_college, account_status, date_registered FROM users WHERE user_id = ?',
      [result.insertId]
    );

    console.log('User creation completed successfully');
    res.status(201).json(newUser[0]);
  } catch (err) {
    console.error('=== USER CREATION ERROR ===');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Full error object:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const [users] = await db.promise.query(
      'SELECT user_id, fullname, email, role, department_college, profile_photo, account_status, date_registered, last_login, created_at FROM users WHERE user_id = ?',
      [req.params.id]
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

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', [
  auth,
  body('fullname', 'Full name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('role', 'Role is required').isIn(['Extension Coordinator', 'Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor', 'Admin', 'Beneficiary']),
  body('department_college', 'Department/College is required').not().isEmpty(),
  body('account_status', 'Account status must be Active or Inactive').optional().isIn(['Active', 'Inactive']),
  logActions.updateUser
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user exists
    const [existingUsers] = await db.promise.query(
      'SELECT * FROM users WHERE user_id = ?',
      [req.params.id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is updating their own profile or is admin
    if (req.user.user.id !== parseInt(req.params.id) && req.user.user.role !== 'Admin') {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const { fullname, email, role, department_college, account_status } = req.body;

    // Check if email is already taken by another user
    const [emailCheck] = await db.promise.query(
      'SELECT * FROM users WHERE email = ? AND user_id != ?',
      [email, req.params.id]
    );

    if (emailCheck.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Update user
    await db.promise.query(
      'UPDATE users SET fullname = ?, email = ?, role = ?, department_college = ?, account_status = ? WHERE user_id = ?',
      [fullname, email, role, department_college, account_status, req.params.id]
    );

    // Get updated user
    const [updatedUsers] = await db.promise.query(
      'SELECT user_id, fullname, email, role, department_college, profile_photo, account_status, date_registered, last_login, created_at FROM users WHERE user_id = ?',
      [req.params.id]
    );

    res.json(updatedUsers[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Check if user exists
    const [existingUsers] = await db.promise.query(
      'SELECT * FROM users WHERE user_id = ?',
      [req.params.id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (req.user.user.id === parseInt(req.params.id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete user
    await db.promise.query('DELETE FROM users WHERE user_id = ?', [req.params.id]);

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/users/:id/photo
// @desc    Upload profile photo
// @access  Private
router.post('/:id/photo', auth, upload.single('profilePhoto'), async (req, res) => {
  try {
    // Check if user exists
    const [existingUsers] = await db.promise.query(
      'SELECT * FROM users WHERE user_id = ?',
      [req.params.id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is updating their own profile or is admin
    if (req.user.user.id !== parseInt(req.params.id) && req.user.user.role !== 'Admin') {
      return res.status(401).json({ error: 'Not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the file path relative to the uploads directory
    const relativePath = path.relative(path.join(__dirname, '../uploads'), req.file.path);
    const photoUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;

    // Delete old profile photo if it exists
    const [currentUser] = await db.promise.query(
      'SELECT profile_photo FROM users WHERE user_id = ?',
      [req.params.id]
    );

    if (currentUser[0].profile_photo) {
      const oldPhotoPath = path.join(__dirname, '../uploads', currentUser[0].profile_photo.replace('/uploads/', ''));
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Update user with new profile photo
    await db.promise.query(
      'UPDATE users SET profile_photo = ? WHERE user_id = ?',
      [photoUrl, req.params.id]
    );

    // Get updated user
    const [updatedUsers] = await db.promise.query(
      'SELECT user_id, fullname, email, role, department_college, profile_photo, account_status, date_registered, last_login, created_at FROM users WHERE user_id = ?',
      [req.params.id]
    );

    res.json(updatedUsers[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/users/:id/photo
// @desc    Delete profile photo
// @access  Private
router.delete('/:id/photo', auth, async (req, res) => {
  try {
    // Check if user exists
    const [existingUsers] = await db.promise.query(
      'SELECT profile_photo FROM users WHERE user_id = ?',
      [req.params.id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is updating their own profile or is admin
    if (req.user.user.id !== parseInt(req.params.id) && req.user.user.role !== 'Admin') {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const currentPhoto = existingUsers[0].profile_photo;

    if (!currentPhoto) {
      return res.status(400).json({ error: 'No profile photo to delete' });
    }

    // Delete the file from the filesystem
    const photoPath = path.join(__dirname, '../uploads', currentPhoto.replace('/uploads/', ''));
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    // Update user to remove profile photo
    await db.promise.query(
      'UPDATE users SET profile_photo = NULL WHERE user_id = ?',
      [req.params.id]
    );

    // Get updated user
    const [updatedUsers] = await db.promise.query(
      'SELECT user_id, fullname, email, role, department_college, profile_photo, account_status, date_registered, last_login, created_at FROM users WHERE user_id = ?',
      [req.params.id]
    );

    res.json(updatedUsers[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/users/:id/signature
// @desc    Upload digital signature
// @access  Private
router.post('/:id/signature', auth, signatureUpload.single('signature'), async (req, res) => {
  try {
    // Check if user exists
    const [existingUsers] = await db.promise.query(
      'SELECT * FROM users WHERE user_id = ?',
      [req.params.id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is updating their own profile or is admin
    if (req.user.user.id !== parseInt(req.params.id) && req.user.user.role !== 'Admin') {
      return res.status(401).json({ error: 'Not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the file path relative to the uploads directory
    const relativePath = path.relative(path.join(__dirname, '../uploads'), req.file.path);
    const signatureUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;

    // Delete old signature if it exists
    const [currentUser] = await db.promise.query(
      'SELECT signature_path FROM users WHERE user_id = ?',
      [req.params.id]
    );

    if (currentUser[0].signature_path) {
      const oldSignaturePath = path.join(__dirname, '../uploads', currentUser[0].signature_path.replace('/uploads/', ''));
      if (fs.existsSync(oldSignaturePath)) {
        fs.unlinkSync(oldSignaturePath);
      }
    }

    // Update user with new signature
    await db.promise.query(
      'UPDATE users SET signature_path = ? WHERE user_id = ?',
      [signatureUrl, req.params.id]
    );

    // Get updated user
    const [updatedUsers] = await db.promise.query(
      'SELECT user_id, fullname, email, role, department_college, profile_photo, signature_path, account_status, date_registered, last_login, created_at FROM users WHERE user_id = ?',
      [req.params.id]
    );

    res.json(updatedUsers[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/users/:id/signature
// @desc    Delete digital signature
// @access  Private
router.delete('/:id/signature', auth, async (req, res) => {
  try {
    // Check if user exists
    const [existingUsers] = await db.promise.query(
      'SELECT signature_path FROM users WHERE user_id = ?',
      [req.params.id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is updating their own profile or is admin
    if (req.user.user.id !== parseInt(req.params.id) && req.user.user.role !== 'Admin') {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const currentSignature = existingUsers[0].signature_path;

    if (!currentSignature) {
      return res.status(400).json({ error: 'No digital signature to delete' });
    }

    // Delete the file from the filesystem
    const signaturePath = path.join(__dirname, '../uploads', currentSignature.replace('/uploads/', ''));
    if (fs.existsSync(signaturePath)) {
      fs.unlinkSync(signaturePath);
    }

    // Update user to remove signature
    await db.promise.query(
      'UPDATE users SET signature_path = NULL WHERE user_id = ?',
      [req.params.id]
    );

    // Get updated user
    const [updatedUsers] = await db.promise.query(
      'SELECT user_id, fullname, email, role, department_college, profile_photo, signature_path, account_status, date_registered, last_login, created_at FROM users WHERE user_id = ?',
      [req.params.id]
    );

    res.json(updatedUsers[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('fullname', 'Full name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('phone').optional().isString(),
  body('organization').optional().isString(),
  body('address').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, email, phone, organization, address } = req.body;
    const userId = req.user.user.id;

    // Check if email is already taken by another user
    const [existingUsers] = await db.promise.query(
      'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
      [email, userId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email is already taken by another user' });
    }

    // Update user profile
    await db.promise.query(
      `UPDATE users 
       SET fullname = ?, email = ?, phone = ?, department_college = ?, address = ?, updated_at = NOW()
       WHERE user_id = ?`,
      [fullname, email, phone, organization, address, userId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

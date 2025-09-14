const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { logActions } = require('../middleware/logger');

const router = express.Router();

// Define role-based permissions
const BENEFICIARY_ROLES = new Set(['Beneficiary']);
const ADMIN_ROLES = new Set(['Admin', 'Extension Head', 'GAD', 'Vice Chancellor', 'Chancellor']);

// Middleware to check if user is a beneficiary
const requireBeneficiary = (req, res, next) => {
  if (!BENEFICIARY_ROLES.has(req.user.user.role)) {
    return res.status(403).json({ error: 'Access denied. Beneficiary role required.' });
  }
  next();
};

// Middleware to check if user is admin or beneficiary
const requireAdminOrBeneficiary = (req, res, next) => {
  if (!ADMIN_ROLES.has(req.user.user.role) && !BENEFICIARY_ROLES.has(req.user.user.role)) {
    return res.status(403).json({ error: 'Access denied. Admin or Beneficiary role required.' });
  }
  next();
};






module.exports = router;

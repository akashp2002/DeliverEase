const express = require('express');
const router = express.Router();
const { login, logout, register } = require('../controllers/authController');

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login', login);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', logout);

/**
 * POST /api/auth/register
 * Register a new user (admin or agent)
 */
router.post('/register', register);

module.exports = router;

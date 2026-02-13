const express = require('express');
const { TYPES } = require('../config/inversify.config');
const { authenticateToken } = require('../middleware/auth');

function createAuthRoutes(container) {
  const router = express.Router();
  const authController = container.get(TYPES.AuthController);

  // Public routes
  router.post('/login', (req, res) => authController.login(req, res));

  // Protected routes
  router.get('/profile', authenticateToken, (req, res) => authController.getProfile(req, res));
  router.post('/change-password', authenticateToken, (req, res) => authController.changePassword(req, res));

  return router;
}

module.exports = createAuthRoutes;

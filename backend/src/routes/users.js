const express = require('express');
const { TYPES } = require('../config/inversify.config');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

function createUserRoutes(container) {
  const router = express.Router();
  const controller = container.get(TYPES.UserController);

  router.use(authenticateToken);
  router.use(authorizeRoles('admin'));

  router.get('/', (req, res) => controller.getAllUsers(req, res));
  router.get('/:id', (req, res) => controller.getUser(req, res));
  router.post('/', (req, res) => controller.createUser(req, res));
  router.put('/:id', (req, res) => controller.updateUser(req, res));
  router.delete('/:id', (req, res) => controller.deleteUser(req, res));
  router.post('/:id/reset-password', (req, res) => controller.resetPassword(req, res));

  return router;
}

module.exports = createUserRoutes;

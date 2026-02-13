const express = require('express');
const { TYPES } = require('../config/inversify.config');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

function createSettingRoutes(container) {
  const router = express.Router();
  const controller = container.get(TYPES.SettingController);

  router.use(authenticateToken);

  router.get('/', (req, res) => controller.getAllSettings(req, res));
  router.get('/:key', (req, res) => controller.getSetting(req, res));
  router.put('/:key', authorizeRoles('admin'), (req, res) => controller.updateSetting(req, res));

  return router;
}

module.exports = createSettingRoutes;

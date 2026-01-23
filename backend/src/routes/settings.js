const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET all settings - accessible by all authenticated users
router.get('/', settingsController.getAllSettings);

// GET single setting - accessible by all authenticated users
router.get('/:key', settingsController.getSetting);

// UPDATE setting - admin only
router.put('/:key', authorizeRoles('admin'), settingsController.updateSetting);

module.exports = router;

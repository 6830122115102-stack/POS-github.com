const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/', usersController.getAllUsers);
router.get('/:id', usersController.getUser);
router.post('/', usersController.createUser);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);
router.post('/:id/reset-password', usersController.resetPassword);

module.exports = router;

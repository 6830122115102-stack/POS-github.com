const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customersController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', customersController.getAllCustomers);
router.get('/:id', customersController.getCustomer);
router.get('/:id/history', customersController.getCustomerHistory);

// Admin/Manager only routes
router.post('/',
  authorizeRoles('admin', 'manager'),
  customersController.createCustomer
);

router.put('/:id',
  authorizeRoles('admin', 'manager'),
  customersController.updateCustomer
);

router.delete('/:id',
  authorizeRoles('admin', 'manager'),
  customersController.deleteCustomer
);

module.exports = router;

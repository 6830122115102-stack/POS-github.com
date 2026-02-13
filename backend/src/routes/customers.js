const express = require('express');
const { TYPES } = require('../config/inversify.config');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

function createCustomerRoutes(container) {
  const router = express.Router();
  const controller = container.get(TYPES.CustomerController);

  router.use(authenticateToken);

  router.get('/', (req, res) => controller.getAllCustomers(req, res));
  router.get('/:id', (req, res) => controller.getCustomer(req, res));
  router.get('/:id/history', (req, res) => controller.getCustomerHistory(req, res));

  router.post('/',
    authorizeRoles('admin', 'manager'),
    (req, res) => controller.createCustomer(req, res)
  );

  router.put('/:id',
    authorizeRoles('admin', 'manager'),
    (req, res) => controller.updateCustomer(req, res)
  );

  router.delete('/:id',
    authorizeRoles('admin', 'manager'),
    (req, res) => controller.deleteCustomer(req, res)
  );

  return router;
}

module.exports = createCustomerRoutes;

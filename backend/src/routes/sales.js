const express = require('express');
const { TYPES } = require('../config/inversify.config');
const { authenticateToken } = require('../middleware/auth');

function createSalesRoutes(container) {
  const router = express.Router();
  const controller = container.get(TYPES.SalesController);

  router.use(authenticateToken);

  router.get('/', (req, res) => controller.getAllSales(req, res));
  router.get('/:id', (req, res) => controller.getSale(req, res));
  router.post('/', (req, res) => controller.createSale(req, res));
  router.get('/:id/invoice', (req, res) => controller.generateInvoice(req, res));

  return router;
}

module.exports = createSalesRoutes;

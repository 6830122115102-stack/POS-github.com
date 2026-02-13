const express = require('express');
const { TYPES } = require('../config/inversify.config');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

function createReportRoutes(container) {
  const router = express.Router();
  const controller = container.get(TYPES.ReportController);

  router.use(authenticateToken);

  router.get('/dashboard', (req, res) => controller.getDashboardStats(req, res));
  router.get('/sales-summary', (req, res) => controller.getSalesSummary(req, res));
  router.get('/top-products', (req, res) => controller.getTopProducts(req, res));
  router.get('/sales-by-period', (req, res) => controller.getSalesByPeriod(req, res));

  router.get('/export/csv',
    authorizeRoles('admin', 'manager'),
    (req, res) => controller.exportSalesCSV(req, res)
  );

  router.get('/export/pdf',
    authorizeRoles('admin', 'manager'),
    (req, res) => controller.exportSalesPDF(req, res)
  );

  return router;
}

module.exports = createReportRoutes;

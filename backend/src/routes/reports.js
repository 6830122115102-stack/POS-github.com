const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/dashboard', reportsController.getDashboardStats);
router.get('/sales-summary', reportsController.getSalesSummary);
router.get('/top-products', reportsController.getTopProducts);
router.get('/sales-by-period', reportsController.getSalesByPeriod);

// Export routes (admin/manager only)
router.get('/export/csv',
  authorizeRoles('admin', 'manager'),
  reportsController.exportSalesCSV
);

router.get('/export/pdf',
  authorizeRoles('admin', 'manager'),
  reportsController.exportSalesPDF
);

module.exports = router;

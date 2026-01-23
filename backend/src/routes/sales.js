const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', salesController.getAllSales);
router.get('/:id', salesController.getSale);
router.post('/', salesController.createSale);
router.get('/:id/invoice', salesController.generateInvoice);

module.exports = router;

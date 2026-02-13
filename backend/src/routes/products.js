const express = require('express');
const multer = require('multer');
const path = require('path');
const { TYPES } = require('../config/inversify.config');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/products/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

function createProductRoutes(container) {
  const router = express.Router();
  const controller = container.get(TYPES.ProductController);

  router.use(authenticateToken);

  router.get('/', (req, res) => controller.getAllProducts(req, res));
  router.get('/categories', (req, res) => controller.getCategories(req, res));
  router.get('/low-stock', (req, res) => controller.getLowStock(req, res));
  router.get('/:id', (req, res) => controller.getProduct(req, res));

  router.post('/',
    authorizeRoles('admin', 'manager'),
    upload.single('image'),
    (req, res) => controller.createProduct(req, res)
  );

  router.put('/:id',
    authorizeRoles('admin', 'manager'),
    upload.single('image'),
    (req, res) => controller.updateProduct(req, res)
  );

  router.delete('/:id',
    authorizeRoles('admin', 'manager'),
    (req, res) => controller.deleteProduct(req, res)
  );

  return router;
}

module.exports = createProductRoutes;

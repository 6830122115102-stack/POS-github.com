const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const productsController = require('../controllers/productsController');
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// All routes require authentication
router.use(authenticateToken);

// Public (authenticated) routes
router.get('/', productsController.getAllProducts);
router.get('/categories', productsController.getCategories);
router.get('/low-stock', productsController.getLowStock);
router.get('/:id', productsController.getProduct);

// Admin/Manager only routes
router.post('/',
  authorizeRoles('admin', 'manager'),
  upload.single('image'),
  productsController.createProduct
);

router.put('/:id',
  authorizeRoles('admin', 'manager'),
  upload.single('image'),
  productsController.updateProduct
);

router.delete('/:id',
  authorizeRoles('admin', 'manager'),
  productsController.deleteProduct
);

module.exports = router;

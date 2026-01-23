const { dbAsync } = require('../models/db');
const path = require('path');
const fs = require('fs').promises;

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY name ASC';

    const products = await dbAsync.all(sql, params);
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await dbAsync.get(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      cost,
      stock_quantity,
      low_stock_threshold,
      sku
    } = req.body;

    // Handle image upload
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/products/${req.file.filename}`;
    }

    const result = await dbAsync.run(
      `INSERT INTO products (name, description, category, price, cost, stock_quantity,
       low_stock_threshold, image_path, sku)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, category, parseFloat(price), parseFloat(cost || 0),
       parseInt(stock_quantity || 0), parseInt(low_stock_threshold || 10), imagePath, sku]
    );

    // Record stock movement
    if (stock_quantity > 0) {
      await dbAsync.run(
        `INSERT INTO stock_movements (product_id, quantity_change, movement_type, created_by)
         VALUES (?, ?, 'adjustment', ?)`,
        [result.id, stock_quantity, req.user.id]
      );
    }

    const product = await dbAsync.get('SELECT * FROM products WHERE id = ?', [result.id]);
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      cost,
      stock_quantity,
      low_stock_threshold,
      sku
    } = req.body;

    // Get current product
    const currentProduct = await dbAsync.get(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );

    if (!currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Handle image upload
    let imagePath = currentProduct.image_path;
    if (req.file) {
      // Delete old image if exists
      if (currentProduct.image_path) {
        const oldImagePath = path.join(__dirname, '../../', currentProduct.image_path);
        try {
          await fs.unlink(oldImagePath);
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }
      imagePath = `/uploads/products/${req.file.filename}`;
    }

    await dbAsync.run(
      `UPDATE products SET
       name = ?, description = ?, category = ?, price = ?, cost = ?,
       stock_quantity = ?, low_stock_threshold = ?, image_path = ?, sku = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, description, category, parseFloat(price), parseFloat(cost || 0),
       parseInt(stock_quantity), parseInt(low_stock_threshold || 10),
       imagePath, sku, req.params.id]
    );

    // Record stock movement if quantity changed
    if (stock_quantity !== currentProduct.stock_quantity) {
      const quantityChange = stock_quantity - currentProduct.stock_quantity;
      await dbAsync.run(
        `INSERT INTO stock_movements (product_id, quantity_change, movement_type, created_by)
         VALUES (?, ?, 'adjustment', ?)`,
        [req.params.id, quantityChange, req.user.id]
      );
    }

    const product = await dbAsync.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Delete product (hard delete)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await dbAsync.get(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product has been used in sales
    const salesCount = await dbAsync.get(
      'SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?',
      [req.params.id]
    );

    if (salesCount.count > 0) {
      return res.status(400).json({
        error: 'Cannot delete product that has been used in sales'
      });
    }

    // Delete product image if exists
    if (product.image_path) {
      const fs = require('fs').promises;
      const path = require('path');
      const imagePath = path.join(__dirname, '../../', product.image_path);
      try {
        await fs.unlink(imagePath);
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }

    // Delete product permanently
    await dbAsync.run('DELETE FROM products WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get low stock products
exports.getLowStock = async (req, res) => {
  try {
    const products = await dbAsync.all(
      `SELECT * FROM products
       WHERE stock_quantity <= low_stock_threshold
       ORDER BY stock_quantity ASC`
    );

    res.json(products);
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get product categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await dbAsync.all(
      'SELECT DISTINCT category FROM products ORDER BY category'
    );

    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

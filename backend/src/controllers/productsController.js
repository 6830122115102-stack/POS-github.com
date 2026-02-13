const path = require('path');
const fs = require('fs').promises;

class ProductController {
  constructor(productRepository, stockMovementRepository) {
    this.productRepository = productRepository;
    this.stockMovementRepository = stockMovementRepository;
  }

  async getAllProducts(req, res) {
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

      const products = await this.productRepository.query(sql, params);
      res.json(products);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async getProduct(req, res) {
    try {
      const product = await this.productRepository.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async createProduct(req, res) {
    try {
      const {
        name, description, category, price, cost,
        stock_quantity, low_stock_threshold, sku
      } = req.body;

      let imagePath = null;
      if (req.file) {
        imagePath = `/uploads/products/${req.file.filename}`;
      }

      const product = await this.productRepository.create({
        name, description, category,
        price: parseFloat(price),
        cost: parseFloat(cost || 0),
        stock_quantity: parseInt(stock_quantity || 0),
        low_stock_threshold: parseInt(low_stock_threshold || 10),
        image_path: imagePath,
        sku
      });

      if (stock_quantity > 0) {
        await this.stockMovementRepository.create({
          product_id: product.id,
          quantity_change: stock_quantity,
          movement_type: 'adjustment',
          created_by: req.user.id
        });
      }

      res.status(201).json(product);
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  }

  async updateProduct(req, res) {
    try {
      const {
        name, description, category, price, cost,
        stock_quantity, low_stock_threshold, sku
      } = req.body;

      const currentProduct = await this.productRepository.findById(req.params.id);

      if (!currentProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      let imagePath = currentProduct.image_path;
      if (req.file) {
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

      await this.productRepository.update(req.params.id, {
        name, description, category,
        price: parseFloat(price),
        cost: parseFloat(cost || 0),
        stock_quantity: parseInt(stock_quantity),
        low_stock_threshold: parseInt(low_stock_threshold || 10),
        image_path: imagePath,
        sku
      });

      if (stock_quantity !== currentProduct.stock_quantity) {
        const quantityChange = stock_quantity - currentProduct.stock_quantity;
        await this.stockMovementRepository.create({
          product_id: req.params.id,
          quantity_change: quantityChange,
          movement_type: 'adjustment',
          created_by: req.user.id
        });
      }

      const product = await this.productRepository.findById(req.params.id);
      res.json(product);
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  }

  async deleteProduct(req, res) {
    try {
      const product = await this.productRepository.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const salesCount = await this.productRepository.queryOne(
        'SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?',
        [req.params.id]
      );

      if (salesCount.count > 0) {
        return res.status(400).json({
          error: 'Cannot delete product that has been used in sales'
        });
      }

      if (product.image_path) {
        const imagePath = path.join(__dirname, '../../', product.image_path);
        try {
          await fs.unlink(imagePath);
        } catch (err) {
          console.error('Error deleting image:', err);
        }
      }

      await this.productRepository.delete(req.params.id);

      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async getLowStock(req, res) {
    try {
      const products = await this.productRepository.query(
        `SELECT * FROM products
         WHERE stock_quantity <= low_stock_threshold
         ORDER BY stock_quantity ASC`
      );

      res.json(products);
    } catch (error) {
      console.error('Get low stock error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async getCategories(req, res) {
    try {
      const categories = await this.productRepository.query(
        'SELECT DISTINCT category FROM products ORDER BY category'
      );

      res.json(categories.map(c => c.category));
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = ProductController;

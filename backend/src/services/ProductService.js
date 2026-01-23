/**
 * ProductService - Handles product management
 * Business logic for CRUD, inventory management, and file uploads
 */

const fs = require('fs').promises;
const path = require('path');

class ProductService {
  /**
   * Constructor
   * @param {ProductRepository} productRepository - Product data access
   * @param {StockMovementRepository} stockMovementRepository - Stock tracking
   * @param {FileService} fileService - File operations
   */
  constructor(productRepository, stockMovementRepository, fileService) {
    this.productRepository = productRepository;
    this.stockMovementRepository = stockMovementRepository;
    this.fileService = fileService;
  }

  /**
   * Get all products with filtering
   * @param {object} filters - {category, search, limit, offset}
   * @returns {Promise<array>}
   */
  async getAllProducts(filters = {}) {
    let products = await this.productRepository.findActive();

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      products = products.filter(p => p.category === filters.category);
    }

    // Search by name/description
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        (p.description && p.description.toLowerCase().includes(searchTerm))
      );
    }

    // Apply pagination
    if (filters.limit) {
      const offset = filters.offset || 0;
      products = products.slice(offset, offset + filters.limit);
    }

    return products;
  }

  /**
   * Get single product by ID
   * @param {number} id - Product ID
   * @returns {Promise<Product>}
   * @throws {Error} If product not found
   */
  async getProduct(id) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }
    return product;
  }

  /**
   * Create new product
   * @param {object} data - Product data {name, category, price, cost, stock_quantity, etc}
   * @param {object} imageFile - Uploaded image file (optional)
   * @returns {Promise<Product>}
   */
  async createProduct(data, imageFile = null) {
    // Validate required fields
    if (!data.name || !data.category || !data.price) {
      throw new Error('Name, category, and price are required');
    }

    // Validate price
    if (isNaN(data.price) || data.price < 0) {
      throw new Error('Price must be a valid positive number');
    }

    // Handle image upload
    let imagePath = null;
    if (imageFile) {
      imagePath = await this.fileService.uploadImage(imageFile);
    }

    // Create product
    const product = await this.productRepository.create({
      name: data.name,
      description: data.description || null,
      category: data.category,
      price: parseFloat(data.price),
      cost: data.cost ? parseFloat(data.cost) : 0,
      stock_quantity: data.stock_quantity ? parseInt(data.stock_quantity) : 0,
      low_stock_threshold: data.low_stock_threshold ? parseInt(data.low_stock_threshold) : 10,
      image_path: imagePath,
      sku: data.sku || null,
      is_active: 1
    });

    return product;
  }

  /**
   * Update product
   * @param {number} id - Product ID
   * @param {object} data - Updated data
   * @param {object} imageFile - New image file (optional)
   * @returns {Promise<Product>}
   */
  async updateProduct(id, data, imageFile = null) {
    const product = await this.getProduct(id);

    // Prepare update data
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.price !== undefined) updateData.price = parseFloat(data.price);
    if (data.cost !== undefined) updateData.cost = parseFloat(data.cost);
    if (data.low_stock_threshold !== undefined) updateData.low_stock_threshold = parseInt(data.low_stock_threshold);
    if (data.sku !== undefined) updateData.sku = data.sku;

    // Handle image update
    if (imageFile) {
      // Delete old image
      if (product.image_path) {
        await this.fileService.deleteImage(product.image_path);
      }
      // Upload new image
      updateData.image_path = await this.fileService.uploadImage(imageFile);
    }

    // Update product
    return this.productRepository.update(id, updateData);
  }

  /**
   * Delete product
   * @param {number} id - Product ID
   * @returns {Promise<boolean>}
   * @throws {Error} If product has sales
   */
  async deleteProduct(id) {
    const product = await this.getProduct(id);

    // Check if product has sales
    const movements = await this.stockMovementRepository.findByProduct(id);
    const hasSales = movements.some(m => m.movement_type === 'sale');
    if (hasSales) {
      throw new Error('Cannot delete product that has been sold');
    }

    // Delete image file
    if (product.image_path) {
      await this.fileService.deleteImage(product.image_path);
    }

    // Delete product
    return this.productRepository.delete(id);
  }

  /**
   * Get low stock products
   * @returns {Promise<array>}
   */
  async getLowStockProducts() {
    return this.productRepository.findLowStock();
  }

  /**
   * Get all categories
   * @returns {Promise<array>}
   */
  async getCategories() {
    return this.productRepository.getCategories();
  }

  /**
   * Update product stock
   * @param {number} productId - Product ID
   * @param {number} quantity - Quantity to add/subtract
   * @param {string} reason - Reason for change (sale, adjustment, etc)
   * @param {number} userId - User ID making the change
   * @returns {Promise<Product>}
   */
  async updateStock(productId, quantity, reason = 'adjustment', userId = null) {
    // Update stock in product
    const product = await this.productRepository.updateStock(productId, quantity);

    // Record stock movement
    await this.stockMovementRepository.create({
      product_id: productId,
      quantity_change: quantity,
      movement_type: reason,
      created_by: userId
    });

    return product;
  }

  /**
   * Search products
   * @param {string} query - Search query
   * @returns {Promise<array>}
   */
  async searchProducts(query) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return this.productRepository.search(query);
  }

  /**
   * Get product with full details
   * @param {number} id - Product ID
   * @returns {Promise<object>}
   */
  async getProductDetails(id) {
    const product = await this.getProduct(id);
    const movements = await this.stockMovementRepository.findByProduct(id);

    return {
      product: product.toJSON(),
      stock_movements: movements.map(m => m.toJSON()),
      profit_margin: product.getProfitMargin(),
      stock_status: product.getStockStatus()
    };
  }
}

module.exports = ProductService;

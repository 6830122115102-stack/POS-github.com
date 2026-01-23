/**
 * Product Entity - Represents inventory items
 */
class Product {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description || null;
    this.category = data.category;
    this.price = data.price;
    this.cost = data.cost || 0;
    this.stock_quantity = data.stock_quantity || 0;
    this.low_stock_threshold = data.low_stock_threshold || 10;
    this.image_path = data.image_path || null;
    this.sku = data.sku || null;
    this.is_active = data.is_active !== undefined ? data.is_active : 1;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  /**
   * Check if product is in stock
   * @returns {boolean}
   */
  isInStock() {
    return this.stock_quantity > 0;
  }

  /**
   * Check if stock is low
   * @returns {boolean}
   */
  isLowStock() {
    return this.stock_quantity <= this.low_stock_threshold;
  }

  /**
   * Check if product has image
   * @returns {boolean}
   */
  hasImage() {
    return !!this.image_path;
  }

  /**
   * Get profit margin
   * @returns {number}
   */
  getProfitMargin() {
    if (this.cost === 0) return 0;
    return ((this.price - this.cost) / this.cost) * 100;
  }

  /**
   * Check if sufficient stock available
   * @param {number} quantity - Quantity to check
   * @returns {boolean}
   */
  hasEnoughStock(quantity) {
    return this.stock_quantity >= quantity;
  }

  /**
   * Update stock quantity
   * @param {number} quantity - Amount to add (negative to decrease)
   * @returns {number} - New stock quantity
   */
  updateStock(quantity) {
    this.stock_quantity += quantity;
    this.updated_at = new Date();
    return this.stock_quantity;
  }

  /**
   * Get stock status message
   * @returns {string}
   */
  getStockStatus() {
    if (!this.isInStock()) return 'Out of stock';
    if (this.isLowStock()) return 'Low stock';
    return 'In stock';
  }

  /**
   * Check if product is active
   * @returns {boolean}
   */
  isActive() {
    return this.is_active === 1;
  }

  /**
   * Get product with safe data (excluding sensitive info)
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      price: this.price,
      cost: this.cost,
      stock_quantity: this.stock_quantity,
      low_stock_threshold: this.low_stock_threshold,
      image_path: this.image_path,
      sku: this.sku,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * Static factory method to create product from database row
   * @param {object} row - Database row
   * @returns {Product}
   */
  static fromDatabase(row) {
    return new Product({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      price: row.price,
      cost: row.cost,
      stock_quantity: row.stock_quantity,
      low_stock_threshold: row.low_stock_threshold,
      image_path: row.image_path,
      sku: row.sku,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at
    });
  }
}

module.exports = Product;

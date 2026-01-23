/**
 * StockMovement Entity - Tracks inventory changes for audit trail
 */
class StockMovement {
  constructor(data = {}) {
    this.id = data.id;
    this.product_id = data.product_id;
    this.quantity_change = data.quantity_change; // Positive or negative number
    this.movement_type = data.movement_type; // purchase, sale, adjustment, return
    this.reference_id = data.reference_id || null; // Sale ID, Purchase ID, etc.
    this.notes = data.notes || null;
    this.created_by = data.created_by || null; // User ID who created this movement
    this.created_at = data.created_at || new Date();
  }

  /**
   * Check if this is a stock increase
   * @returns {boolean}
   */
  isIncrease() {
    return this.quantity_change > 0;
  }

  /**
   * Check if this is a stock decrease
   * @returns {boolean}
   */
  isDecrease() {
    return this.quantity_change < 0;
  }

  /**
   * Get absolute quantity change
   * @returns {number}
   */
  getAbsoluteQuantity() {
    return Math.abs(this.quantity_change);
  }

  /**
   * Get movement type display name
   * @returns {string}
   */
  getMovementTypeDisplay() {
    const types = {
      'purchase': 'Purchase',
      'sale': 'Sale',
      'adjustment': 'Adjustment',
      'return': 'Return'
    };
    return types[this.movement_type] || this.movement_type;
  }

  /**
   * Get movement data
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      product_id: this.product_id,
      quantity_change: this.quantity_change,
      movement_type: this.movement_type,
      reference_id: this.reference_id,
      notes: this.notes,
      created_by: this.created_by,
      created_at: this.created_at
    };
  }

  /**
   * Static factory method to create stock movement from database row
   * @param {object} row - Database row
   * @returns {StockMovement}
   */
  static fromDatabase(row) {
    return new StockMovement({
      id: row.id,
      product_id: row.product_id,
      quantity_change: row.quantity_change,
      movement_type: row.movement_type,
      reference_id: row.reference_id,
      notes: row.notes,
      created_by: row.created_by,
      created_at: row.created_at
    });
  }

  /**
   * Static factory to create a sale stock movement
   * @param {number} productId - Product ID
   * @param {number} quantity - Quantity sold
   * @param {number} saleId - Sale ID
   * @param {number} userId - User ID
   * @returns {StockMovement}
   */
  static createSaleMovement(productId, quantity, saleId, userId) {
    return new StockMovement({
      product_id: productId,
      quantity_change: -quantity,
      movement_type: 'sale',
      reference_id: saleId,
      created_by: userId
    });
  }
}

module.exports = StockMovement;

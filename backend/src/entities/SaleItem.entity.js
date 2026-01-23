/**
 * SaleItem Entity - Represents individual line items in a sale
 */
class SaleItem {
  constructor(data = {}) {
    this.id = data.id;
    this.sale_id = data.sale_id;
    this.product_id = data.product_id;
    this.product_name = data.product_name;
    this.quantity = data.quantity;
    this.unit_price = data.unit_price;
    this.total_price = data.total_price || 0;
  }

  /**
   * Calculate total price
   * @returns {number}
   */
  calculateTotal() {
    return this.quantity * this.unit_price;
  }

  /**
   * Get item discount (if any)
   * @returns {number}
   */
  getDiscount() {
    return 0; // Can be extended for item-level discounts
  }

  /**
   * Get profit on this item
   * @param {number} cost - Product cost
   * @returns {number}
   */
  getProfit(cost) {
    const profit_per_unit = this.unit_price - cost;
    return profit_per_unit * this.quantity;
  }

  /**
   * Get item data
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      sale_id: this.sale_id,
      product_id: this.product_id,
      product_name: this.product_name,
      quantity: this.quantity,
      unit_price: this.unit_price,
      total_price: this.total_price
    };
  }

  /**
   * Static factory method to create sale item from database row
   * @param {object} row - Database row
   * @returns {SaleItem}
   */
  static fromDatabase(row) {
    return new SaleItem({
      id: row.id,
      sale_id: row.sale_id,
      product_id: row.product_id,
      product_name: row.product_name,
      quantity: row.quantity,
      unit_price: row.unit_price,
      total_price: row.total_price
    });
  }
}

module.exports = SaleItem;

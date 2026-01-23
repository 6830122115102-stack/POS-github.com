/**
 * Sale Entity - Represents sales transactions
 */
class Sale {
  constructor(data = {}) {
    this.id = data.id;
    this.invoice_number = data.invoice_number;
    this.customer_id = data.customer_id || null;
    this.user_id = data.user_id;
    this.subtotal = data.subtotal || 0;
    this.tax_amount = data.tax_amount || 0;
    this.discount_amount = data.discount_amount || 0;
    this.total_amount = data.total_amount || 0;
    this.payment_method = data.payment_method || 'cash'; // cash, card, check
    this.status = data.status || 'completed'; // completed, pending, cancelled
    this.created_at = data.created_at || new Date();
    this.items = data.items || []; // SaleItem instances
  }

  /**
   * Calculate total including tax and discount
   * @returns {number}
   */
  calculateTotal() {
    const withTax = this.subtotal + this.tax_amount;
    return Math.max(0, withTax - this.discount_amount);
  }

  /**
   * Get effective tax rate
   * @returns {number}
   */
  getTaxRate() {
    if (this.subtotal === 0) return 0;
    return (this.tax_amount / this.subtotal) * 100;
  }

  /**
   * Get discount percentage
   * @returns {number}
   */
  getDiscountPercentage() {
    const total = this.subtotal + this.tax_amount;
    if (total === 0) return 0;
    return (this.discount_amount / total) * 100;
  }

  /**
   * Get number of items in sale
   * @returns {number}
   */
  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Check if sale is completed
   * @returns {boolean}
   */
  isCompleted() {
    return this.status === 'completed';
  }

  /**
   * Check if sale has customer
   * @returns {boolean}
   */
  hasCustomer() {
    return !!this.customer_id;
  }

  /**
   * Get payment method display name
   * @returns {string}
   */
  getPaymentMethodDisplay() {
    const methods = {
      'cash': 'Cash',
      'card': 'Credit/Debit Card',
      'check': 'Check'
    };
    return methods[this.payment_method] || this.payment_method;
  }

  /**
   * Add item to sale
   * @param {object} item - SaleItem instance
   */
  addItem(item) {
    this.items.push(item);
  }

  /**
   * Get sale summary
   * @returns {object}
   */
  getSummary() {
    return {
      invoice_number: this.invoice_number,
      item_count: this.getItemCount(),
      subtotal: this.subtotal,
      tax: this.tax_amount,
      discount: this.discount_amount,
      total: this.calculateTotal(),
      payment_method: this.getPaymentMethodDisplay()
    };
  }

  /**
   * Get safe sale data without items
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      invoice_number: this.invoice_number,
      customer_id: this.customer_id,
      user_id: this.user_id,
      subtotal: this.subtotal,
      tax_amount: this.tax_amount,
      discount_amount: this.discount_amount,
      total_amount: this.total_amount,
      payment_method: this.payment_method,
      status: this.status,
      created_at: this.created_at
    };
  }

  /**
   * Static factory method to create sale from database row
   * @param {object} row - Database row
   * @returns {Sale}
   */
  static fromDatabase(row) {
    return new Sale({
      id: row.id,
      invoice_number: row.invoice_number,
      customer_id: row.customer_id,
      user_id: row.user_id,
      subtotal: row.subtotal,
      tax_amount: row.tax_amount,
      discount_amount: row.discount_amount,
      total_amount: row.total_amount,
      payment_method: row.payment_method,
      status: row.status,
      created_at: row.created_at
    });
  }
}

module.exports = Sale;

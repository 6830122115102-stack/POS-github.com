/**
 * Customer Entity - Represents customers for CRM
 */
class Customer {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email || null;
    this.phone = data.phone || null;
    this.address = data.address || null;
    this.total_purchases = data.total_purchases || 0;
    this.visit_count = data.visit_count || 0;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  /**
   * Get average purchase value
   * @returns {number}
   */
  getAveragePurchaseValue() {
    if (this.visit_count === 0) return 0;
    return this.total_purchases / this.visit_count;
  }

  /**
   * Record a purchase
   * @param {number} amount - Purchase amount
   */
  recordPurchase(amount) {
    this.total_purchases += amount;
    this.visit_count += 1;
    this.updated_at = new Date();
  }

  /**
   * Check if customer has contact info
   * @returns {boolean}
   */
  hasContactInfo() {
    return !!(this.email || this.phone);
  }

  /**
   * Get primary contact method
   * @returns {string}
   */
  getPrimaryContact() {
    if (this.email) return this.email;
    if (this.phone) return this.phone;
    return null;
  }

  /**
   * Check if customer is frequent (more than 5 visits)
   * @returns {boolean}
   */
  isFrequentCustomer() {
    return this.visit_count > 5;
  }

  /**
   * Get customer loyalty status
   * @returns {string}
   */
  getLoyaltyStatus() {
    if (this.visit_count === 0) return 'New';
    if (this.visit_count < 3) return 'Regular';
    if (this.visit_count < 10) return 'Loyal';
    return 'VIP';
  }

  /**
   * Get safe customer data
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      address: this.address,
      total_purchases: this.total_purchases,
      visit_count: this.visit_count,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * Static factory method to create customer from database row
   * @param {object} row - Database row
   * @returns {Customer}
   */
  static fromDatabase(row) {
    return new Customer({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      total_purchases: row.total_purchases,
      visit_count: row.visit_count,
      created_at: row.created_at,
      updated_at: row.updated_at
    });
  }
}

module.exports = Customer;

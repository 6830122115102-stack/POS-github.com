/**
 * SaleRepository - Data access layer for Sale entity
 */

const BaseRepository = require('./BaseRepository');
const Sale = require('../entities/Sale.entity');

class SaleRepository extends BaseRepository {
  constructor(db) {
    super(db, 'sales');
  }

  async findById(id) {
    const row = await super.findById(id);
    return row ? Sale.fromDatabase(row) : null;
  }

  async findAll() {
    const rows = await super.findAll({ orderBy: 'created_at DESC' });
    return rows.map(row => Sale.fromDatabase(row));
  }

  async findByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM ${this.tableName} WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC`;
      this.db.all(sql, [startDate, endDate], (err, rows) => {
        if (err) reject(err);
        else resolve((rows || []).map(row => Sale.fromDatabase(row)));
      });
    });
  }

  async findByCustomer(customerId) {
    const rows = await this.find({ customer_id: customerId });
    return rows.map(row => Sale.fromDatabase(row));
  }

  async findByInvoiceNumber(invoiceNumber) {
    const row = await this.findOne({ invoice_number: invoiceNumber });
    return row ? Sale.fromDatabase(row) : null;
  }

  async create(saleData) {
    const row = await super.create({
      invoice_number: saleData.invoice_number,
      customer_id: saleData.customer_id || null,
      user_id: saleData.user_id,
      subtotal: saleData.subtotal,
      tax_amount: saleData.tax_amount || 0,
      discount_amount: saleData.discount_amount || 0,
      total_amount: saleData.total_amount,
      payment_method: saleData.payment_method || 'cash',
      status: saleData.status || 'completed'
    });
    return Sale.fromDatabase(row);
  }

  async update(id, data) {
    const row = await super.update(id, data);
    return Sale.fromDatabase(row);
  }

  async getTodaySales() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM ${this.tableName} WHERE DATE(created_at) = DATE('now') ORDER BY created_at DESC`;
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve((rows || []).map(row => Sale.fromDatabase(row)));
      });
    });
  }

  async getSalesCount(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE created_at >= ? AND created_at <= ?`;
      this.db.get(sql, [startDate, endDate], (err, row) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });
  }

  async getSalesTotal(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT SUM(total_amount) as total FROM ${this.tableName} WHERE created_at >= ? AND created_at <= ?`;
      this.db.get(sql, [startDate, endDate], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });
  }

  async getTaxTotal(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT SUM(tax_amount) as total FROM ${this.tableName} WHERE created_at >= ? AND created_at <= ?`;
      this.db.get(sql, [startDate, endDate], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });
  }

  async getAverageSale(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT AVG(total_amount) as average FROM ${this.tableName} WHERE created_at >= ? AND created_at <= ?`;
      this.db.get(sql, [startDate, endDate], (err, row) => {
        if (err) reject(err);
        else resolve(row?.average || 0);
      });
    });
  }
}

module.exports = SaleRepository;

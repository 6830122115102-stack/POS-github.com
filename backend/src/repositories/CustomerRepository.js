/**
 * CustomerRepository - Data access layer for Customer entity
 */

const BaseRepository = require('./BaseRepository');
const Customer = require('../entities/Customer.entity');

class CustomerRepository extends BaseRepository {
  constructor(db) {
    super(db, 'customers');
  }

  async findById(id) {
    const row = await super.findById(id);
    return row ? Customer.fromDatabase(row) : null;
  }

  async findAll() {
    const rows = await super.findAll({ orderBy: 'name ASC' });
    return rows.map(row => Customer.fromDatabase(row));
  }

  async search(query) {
    return new Promise((resolve, reject) => {
      const searchTerm = `%${query}%`;
      const sql = `SELECT * FROM ${this.tableName} WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? ORDER BY name ASC`;
      this.db.all(sql, [searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (err) reject(err);
        else resolve((rows || []).map(row => Customer.fromDatabase(row)));
      });
    });
  }

  async create(customerData) {
    const row = await super.create({
      name: customerData.name,
      email: customerData.email || null,
      phone: customerData.phone || null,
      address: customerData.address || null,
      total_purchases: customerData.total_purchases || 0,
      visit_count: customerData.visit_count || 0
    });
    return Customer.fromDatabase(row);
  }

  async update(id, data) {
    const row = await super.update(id, data);
    return Customer.fromDatabase(row);
  }

  async recordPurchase(id, amount) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE ${this.tableName} SET total_purchases = total_purchases + ?, visit_count = visit_count + 1 WHERE id = ?`;
      this.db.run(sql, [amount, id], (err) => {
        if (err) reject(err);
        else {
          this.db.get(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id], (err, row) => {
            if (err) reject(err);
            else resolve(row ? Customer.fromDatabase(row) : null);
          });
        }
      });
    });
  }

  async findFrequent() {
    const rows = await this.query(`SELECT * FROM ${this.tableName} WHERE visit_count > 5 ORDER BY total_purchases DESC`);
    return rows.map(row => Customer.fromDatabase(row));
  }

  async getTotalCustomers() {
    return this.count();
  }
}

module.exports = CustomerRepository;

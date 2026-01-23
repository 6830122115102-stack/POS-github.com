/**
 * ProductRepository - Data access layer for Product entity
 */

const BaseRepository = require('./BaseRepository');
const Product = require('../entities/Product.entity');

class ProductRepository extends BaseRepository {
  constructor(db) {
    super(db, 'products');
  }

  async findById(id) {
    const row = await super.findById(id);
    return row ? Product.fromDatabase(row) : null;
  }

  async findAll() {
    const rows = await super.findAll({ orderBy: 'name ASC' });
    return rows.map(row => Product.fromDatabase(row));
  }

  async findActive() {
    const rows = await this.find({ is_active: 1 });
    return rows.map(row => Product.fromDatabase(row));
  }

  async findByCategory(category) {
    const rows = await this.find({ category, is_active: 1 });
    return rows.map(row => Product.fromDatabase(row));
  }

  async findLowStock() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM ${this.tableName} WHERE stock_quantity <= low_stock_threshold AND is_active = 1 ORDER BY stock_quantity ASC`;
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve((rows || []).map(row => Product.fromDatabase(row)));
      });
    });
  }

  async findOutOfStock() {
    const rows = await this.find({ stock_quantity: 0 });
    return rows.map(row => Product.fromDatabase(row));
  }

  async getCategories() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT DISTINCT category FROM ${this.tableName} WHERE is_active = 1 ORDER BY category ASC`;
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve((rows || []).map(row => row.category));
      });
    });
  }

  async findBySku(sku) {
    const row = await this.findOne({ sku });
    return row ? Product.fromDatabase(row) : null;
  }

  async create(productData) {
    const row = await super.create({
      name: productData.name,
      description: productData.description || null,
      category: productData.category,
      price: productData.price,
      cost: productData.cost || 0,
      stock_quantity: productData.stock_quantity || 0,
      low_stock_threshold: productData.low_stock_threshold || 10,
      image_path: productData.image_path || null,
      sku: productData.sku || null,
      is_active: productData.is_active !== undefined ? productData.is_active : 1
    });
    return Product.fromDatabase(row);
  }

  async update(id, data) {
    const row = await super.update(id, data);
    return Product.fromDatabase(row);
  }

  async updateStock(id, quantityChange) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE ${this.tableName} SET stock_quantity = stock_quantity + ? WHERE id = ?`;
      this.db.run(sql, [quantityChange, id], (err) => {
        if (err) reject(err);
        else {
          this.db.get(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id], (err, row) => {
            if (err) reject(err);
            else resolve(row ? Product.fromDatabase(row) : null);
          });
        }
      });
    });
  }

  async search(query) {
    return new Promise((resolve, reject) => {
      const searchTerm = `%${query}%`;
      const sql = `SELECT * FROM ${this.tableName} WHERE (name LIKE ? OR description LIKE ? OR category LIKE ?) AND is_active = 1 ORDER BY name ASC`;
      this.db.all(sql, [searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (err) reject(err);
        else resolve((rows || []).map(row => Product.fromDatabase(row)));
      });
    });
  }

  async countByCategory(category) {
    return this.count({ category, is_active: 1 });
  }

  async getTotalValue() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT SUM(price * stock_quantity) as total_value FROM ${this.tableName} WHERE is_active = 1`;
      this.db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total_value || 0);
      });
    });
  }
}

module.exports = ProductRepository;

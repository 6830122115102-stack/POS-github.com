/**
 * SaleItemRepository - Data access layer for SaleItem entity
 */

const BaseRepository = require('./BaseRepository');
const SaleItem = require('../entities/SaleItem.entity');

class SaleItemRepository extends BaseRepository {
  constructor(db) {
    super(db, 'sale_items');
  }

  async findById(id) {
    const row = await super.findById(id);
    return row ? SaleItem.fromDatabase(row) : null;
  }

  async findBySale(saleId) {
    const rows = await this.find({ sale_id: saleId });
    return rows.map(row => SaleItem.fromDatabase(row));
  }

  async findByProduct(productId) {
    const rows = await this.find({ product_id: productId });
    return rows.map(row => SaleItem.fromDatabase(row));
  }

  async create(itemData) {
    const row = await super.create({
      sale_id: itemData.sale_id,
      product_id: itemData.product_id,
      product_name: itemData.product_name,
      quantity: itemData.quantity,
      unit_price: itemData.unit_price,
      total_price: itemData.quantity * itemData.unit_price
    });
    return SaleItem.fromDatabase(row);
  }

  async update(id, data) {
    const row = await super.update(id, data);
    return SaleItem.fromDatabase(row);
  }

  async deleteBySale(saleId) {
    return this.deleteWhere({ sale_id: saleId });
  }

  async getItemsCount(saleId) {
    return this.count({ sale_id: saleId });
  }

  async getTotalQuantity(saleId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT SUM(quantity) as total FROM ${this.tableName} WHERE sale_id = ?`;
      this.db.get(sql, [saleId], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });
  }
}

module.exports = SaleItemRepository;

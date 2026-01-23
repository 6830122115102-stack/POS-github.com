/**
 * StockMovementRepository - Data access layer for StockMovement entity
 */

const BaseRepository = require('./BaseRepository');
const StockMovement = require('../entities/StockMovement.entity');

class StockMovementRepository extends BaseRepository {
  constructor(db) {
    super(db, 'stock_movements');
  }

  async findById(id) {
    const row = await super.findById(id);
    return row ? StockMovement.fromDatabase(row) : null;
  }

  async findByProduct(productId) {
    const rows = await this.find({ product_id: productId });
    return rows.map(row => StockMovement.fromDatabase(row));
  }

  async findByType(movementType) {
    const rows = await this.find({ movement_type: movementType });
    return rows.map(row => StockMovement.fromDatabase(row));
  }

  async create(movementData) {
    const row = await super.create({
      product_id: movementData.product_id,
      quantity_change: movementData.quantity_change,
      movement_type: movementData.movement_type,
      reference_id: movementData.reference_id || null,
      notes: movementData.notes || null,
      created_by: movementData.created_by || null
    });
    return StockMovement.fromDatabase(row);
  }

  async update(id, data) {
    const row = await super.update(id, data);
    return StockMovement.fromDatabase(row);
  }

  async findByReference(referenceId) {
    const rows = await this.find({ reference_id: referenceId });
    return rows.map(row => StockMovement.fromDatabase(row));
  }

  async getMovementHistory(productId, limit = 50) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM ${this.tableName} WHERE product_id = ? ORDER BY created_at DESC LIMIT ?`;
      this.db.all(sql, [productId, limit], (err, rows) => {
        if (err) reject(err);
        else resolve((rows || []).map(row => StockMovement.fromDatabase(row)));
      });
    });
  }

  async getTotalMovement(productId, movementType) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT SUM(quantity_change) as total FROM ${this.tableName} WHERE product_id = ? AND movement_type = ?`;
      this.db.get(sql, [productId, movementType], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });
  }

  async recordSaleMovement(productId, quantity, saleId, userId) {
    const movement = StockMovement.createSaleMovement(productId, quantity, saleId, userId);
    return this.create(movement);
  }
}

module.exports = StockMovementRepository;

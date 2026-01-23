/**
 * BaseRepository - Abstract base class for all repositories
 * Provides common CRUD operations using direct database access
 */

class BaseRepository {
  /**
   * Constructor
   * @param {object} db - Database connection instance (from db.js)
   * @param {string} tableName - Name of the database table
   */
  constructor(db, tableName) {
    this.db = db;
    this.tableName = tableName;
  }

  /**
   * Find record by ID
   * @param {number} id - Record ID
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      this.db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  /**
   * Find all records
   * @param {object} options - Query options {limit, offset, orderBy}
   * @returns {Promise<array>}
   */
  async findAll(options = {}) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT * FROM ${this.tableName}`;
      const params = [];

      if (options.orderBy) {
        sql += ` ORDER BY ${options.orderBy}`;
      } else {
        sql += ` ORDER BY id DESC`;
      }

      if (options.limit) {
        sql += ` LIMIT ?`;
        params.push(options.limit);
      }

      if (options.offset) {
        sql += ` OFFSET ?`;
        params.push(options.offset);
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Find one record matching criteria
   * @param {object} criteria - WHERE clause conditions {column: value}
   * @returns {Promise<object|null>}
   */
  async findOne(criteria = {}) {
    return new Promise((resolve, reject) => {
      const columns = Object.keys(criteria);
      const values = Object.values(criteria);
      const whereClause = columns.map(col => `${col} = ?`).join(' AND ');
      const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`;

      this.db.get(sql, values, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  /**
   * Find multiple records matching criteria
   * @param {object} criteria - WHERE clause conditions
   * @returns {Promise<array>}
   */
  async find(criteria = {}) {
    return new Promise((resolve, reject) => {
      const columns = Object.keys(criteria);
      const values = Object.values(criteria);

      if (columns.length === 0) {
        return this.findAll().then(resolve).catch(reject);
      }

      const whereClause = columns.map(col => `${col} = ?`).join(' AND ');
      const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;

      this.db.all(sql, values, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Count records matching criteria
   * @param {object} criteria - WHERE clause conditions
   * @returns {Promise<number>}
   */
  async count(criteria = {}) {
    return new Promise((resolve, reject) => {
      const columns = Object.keys(criteria);
      const values = Object.values(criteria);

      let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      if (columns.length > 0) {
        const whereClause = columns.map(col => `${col} = ?`).join(' AND ');
        sql += ` WHERE ${whereClause}`;
      }

      this.db.get(sql, values, (err, row) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });
  }

  /**
   * Create a new record
   * @param {object} data - Record data
   * @returns {Promise<object>}
   */
  async create(data) {
    return new Promise((resolve, reject) => {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map(() => '?').join(',');
      const sql = `INSERT INTO ${this.tableName} (${columns.join(',')}) VALUES (${placeholders})`;

      this.db.run(sql, values, function(err) {
        if (err) reject(err);
        else {
          const newId = this.lastID;
          // Fetch and return the created record
          this.db.get(`SELECT * FROM ${this.tableName} WHERE id = ?`, [newId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        }
      });
    });
  }

  /**
   * Update a record by ID
   * @param {number} id - Record ID
   * @param {object} data - Updated data
   * @returns {Promise<object>}
   */
  async update(id, data) {
    return new Promise((resolve, reject) => {
      const columns = Object.keys(data);
      const values = Object.values(data);
      values.push(id);

      const setClause = columns.map(col => `${col} = ?`).join(',');
      const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;

      this.db.run(sql, values, function(err) {
        if (err) reject(err);
        else {
          // Fetch and return updated record
          this.db.get(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        }
      });
    });
  }

  /**
   * Delete a record by ID
   * @param {number} id - Record ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
      this.db.run(sql, [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  /**
   * Delete multiple records matching criteria
   * @param {object} criteria - WHERE clause conditions
   * @returns {Promise<number>} - Number of deleted records
   */
  async deleteWhere(criteria = {}) {
    return new Promise((resolve, reject) => {
      const columns = Object.keys(criteria);
      const values = Object.values(criteria);

      if (columns.length === 0) {
        return reject(new Error('Cannot delete all records without explicit criteria'));
      }

      const whereClause = columns.map(col => `${col} = ?`).join(' AND ');
      const sql = `DELETE FROM ${this.tableName} WHERE ${whereClause}`;

      this.db.run(sql, values, function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  /**
   * Check if record exists
   * @param {object} criteria - WHERE clause conditions
   * @returns {Promise<boolean>}
   */
  async exists(criteria) {
    const count = await this.count(criteria);
    return count > 0;
  }

  /**
   * Execute raw SQL query
   * @param {string} sql - SQL query
   * @param {array} params - Query parameters
   * @returns {Promise<array>}
   */
  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Execute raw SQL with single result
   * @param {string} sql - SQL query
   * @param {array} params - Query parameters
   * @returns {Promise<object|null>}
   */
  async queryOne(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }
}

module.exports = BaseRepository;

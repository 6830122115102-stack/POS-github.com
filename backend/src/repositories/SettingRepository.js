/**
 * SettingRepository - Data access layer for Setting entity
 */

const BaseRepository = require('./BaseRepository');
const Setting = require('../entities/Setting.entity');

class SettingRepository extends BaseRepository {
  constructor(db) {
    super(db, 'settings');
  }

  async findById(id) {
    const row = await super.findById(id);
    return row ? Setting.fromDatabase(row) : null;
  }

  async findByKey(key) {
    const row = await this.findOne({ setting_key: key });
    return row ? Setting.fromDatabase(row) : null;
  }

  async getAll() {
    const rows = await super.findAll();
    const settings = {};
    rows.forEach(row => {
      const setting = Setting.fromDatabase(row);
      settings[setting.setting_key] = setting.setting_value;
    });
    return settings;
  }

  async getAllWithMetadata() {
    const rows = await super.findAll();
    return rows.map(row => Setting.fromDatabase(row));
  }

  async create(settingData) {
    const row = await super.create({
      setting_key: settingData.setting_key,
      setting_value: typeof settingData.setting_value === 'object'
        ? JSON.stringify(settingData.setting_value)
        : String(settingData.setting_value),
      description: settingData.description || null
    });
    return Setting.fromDatabase(row);
  }

  async update(key, value) {
    const settingValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    const sql = `UPDATE ${this.tableName} SET setting_value = ? WHERE setting_key = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [settingValue, key], (err) => {
        if (err) reject(err);
        else {
          this.db.get(`SELECT * FROM ${this.tableName} WHERE setting_key = ?`, [key], (err, row) => {
            if (err) reject(err);
            else resolve(row ? Setting.fromDatabase(row) : null);
          });
        }
      });
    });
  }

  async upsert(key, value, description = null) {
    const existing = await this.findByKey(key);
    if (existing) {
      return this.update(key, value);
    } else {
      return this.create({
        setting_key: key,
        setting_value: value,
        description
      });
    }
  }

  async deleteByKey(key) {
    const sql = `DELETE FROM ${this.tableName} WHERE setting_key = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [key], (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }

  async keyExists(key) {
    return this.exists({ setting_key: key });
  }
}

module.exports = SettingRepository;

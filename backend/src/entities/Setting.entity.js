/**
 * Setting Entity - Represents system configuration settings
 */
class Setting {
  constructor(data = {}) {
    this.id = data.id;
    this.setting_key = data.setting_key; // Unique key like 'tax_rate', 'product_categories'
    this.setting_value = data.setting_value; // String value (JSON for complex data)
    this.description = data.description || null;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  /**
   * Get setting value as number
   * @returns {number}
   */
  asNumber() {
    return parseFloat(this.setting_value);
  }

  /**
   * Get setting value as JSON
   * @returns {object|array}
   */
  asJSON() {
    try {
      return JSON.parse(this.setting_value);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get setting value as boolean
   * @returns {boolean}
   */
  asBoolean() {
    return this.setting_value === '1' || this.setting_value === 'true' || this.setting_value === true;
  }

  /**
   * Get setting value as string
   * @returns {string}
   */
  asString() {
    return String(this.setting_value);
  }

  /**
   * Update setting value
   * @param {any} value - New value
   */
  setValue(value) {
    if (typeof value === 'object') {
      this.setting_value = JSON.stringify(value);
    } else {
      this.setting_value = String(value);
    }
    this.updated_at = new Date();
  }

  /**
   * Get setting data
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      setting_key: this.setting_key,
      setting_value: this.setting_value,
      description: this.description,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * Static factory method to create setting from database row
   * @param {object} row - Database row
   * @returns {Setting}
   */
  static fromDatabase(row) {
    return new Setting({
      id: row.id,
      setting_key: row.setting_key,
      setting_value: row.setting_value,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at
    });
  }
}

module.exports = Setting;

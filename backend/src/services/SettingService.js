/**
 * SettingService - Handles system configuration settings
 */

class SettingService {
  constructor(settingRepository) {
    this.settingRepository = settingRepository;
  }

  async getAllSettings() {
    return this.settingRepository.getAll();
  }

  async getAllSettingsWithMetadata() {
    return this.settingRepository.getAllWithMetadata();
  }

  async getSetting(key) {
    const setting = await this.settingRepository.findByKey(key);
    if (!setting) {
      throw new Error(`Setting ${key} not found`);
    }
    return setting.setting_value;
  }

  async getSettingObject(key) {
    const setting = await this.settingRepository.findByKey(key);
    if (!setting) {
      throw new Error(`Setting ${key} not found`);
    }
    return setting;
  }

  async updateSetting(key, value) {
    const updated = await this.settingRepository.update(key, value);
    return updated.setting_value;
  }

  async updateSettingObject(key, value, description = null) {
    return this.settingRepository.upsert(key, value, description);
  }

  async getTaxRate() {
    try {
      const value = await this.getSetting('tax_rate');
      return parseFloat(value) || 10;
    } catch {
      return 10; // Default
    }
  }

  async setTaxRate(rate) {
    if (isNaN(rate) || rate < 0 || rate > 100) {
      throw new Error('Tax rate must be between 0 and 100');
    }
    return this.updateSetting('tax_rate', rate.toString());
  }

  async getProductCategories() {
    try {
      const value = await this.getSetting('product_categories');
      return JSON.parse(value);
    } catch {
      return ['Beverages', 'Food', 'Desserts', 'Snacks'];
    }
  }

  async setProductCategories(categories) {
    if (!Array.isArray(categories) || categories.length === 0) {
      throw new Error('Categories must be a non-empty array');
    }
    return this.updateSetting('product_categories', JSON.stringify(categories));
  }

  async deleteSetting(key) {
    return this.settingRepository.deleteByKey(key);
  }

  async settingExists(key) {
    return this.settingRepository.keyExists(key);
  }
}

module.exports = SettingService;

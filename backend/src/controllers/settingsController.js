const { dbAsync } = require('../models/db');

// Get all settings
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await dbAsync.all('SELECT * FROM settings ORDER BY setting_key');

    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(setting => {
      // Parse JSON arrays
      if (setting.setting_key === 'product_categories') {
        settingsObj[setting.setting_key] = JSON.parse(setting.setting_value);
      } else {
        settingsObj[setting.setting_key] = setting.setting_value;
      }
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single setting by key
exports.getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await dbAsync.get(
      'SELECT * FROM settings WHERE setting_key = ?',
      [key]
    );

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    // Parse JSON if needed
    let value = setting.setting_value;
    if (key === 'product_categories') {
      value = JSON.parse(value);
    }

    res.json({ key: setting.setting_key, value });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update single setting by key
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({ error: 'Value is required' });
    }

    // Validate tax_rate
    if (key === 'tax_rate') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        return res.status(400).json({ error: 'Tax rate must be between 0 and 100' });
      }
    }

    // Validate product_categories
    if (key === 'product_categories') {
      if (!Array.isArray(value) || value.length === 0) {
        return res.status(400).json({ error: 'Categories must be a non-empty array' });
      }
    }

    // Convert arrays to JSON string
    const valueToStore = Array.isArray(value) ? JSON.stringify(value) : value;

    await dbAsync.run(
      'UPDATE settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
      [valueToStore, key]
    );

    res.json({ success: true, key, value });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

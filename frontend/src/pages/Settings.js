import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { Settings as SettingsIcon, Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

function Settings() {
  const [taxRate, setTaxRate] = useState('10');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getAll();
      setTaxRate(response.data.tax_rate || '10');
      setCategories(response.data.product_categories || []);
    } catch (error) {
      console.error('Fetch settings error:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTaxRate = async () => {
    try {
      setSaving(true);
      await settingsAPI.update('tax_rate', taxRate);
      toast.success('Tax rate updated');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update tax rate');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }
    if (categories.includes(newCategory.trim())) {
      toast.error('Category already exists');
      return;
    }
    setCategories([...categories, newCategory.trim()]);
    setNewCategory('');
  };

  const handleRemoveCategory = (categoryToRemove) => {
    setCategories(categories.filter(cat => cat !== categoryToRemove));
  };

  const handleSaveCategories = async () => {
    try {
      setSaving(true);
      await settingsAPI.update('product_categories', categories);
      toast.success('Categories updated');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update categories');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <SettingsIcon className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        </div>
      </div>

      {/* Tax Rate Section */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Tax Rate</h2>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="label">Default Tax Rate (%)</label>
            <input
              type="number"
              className="input"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          <button
            onClick={handleSaveTaxRate}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center whitespace-nowrap"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Tax Rate
          </button>
        </div>
      </div>

      {/* Product Categories Section */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Product Categories</h2>

        {/* Add Category */}
        <div className="flex items-center gap-4 mb-4">
          <input
            type="text"
            className="input flex-1"
            placeholder="Enter new category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            maxLength="50"
          />
          <button
            onClick={handleAddCategory}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </button>
        </div>

        {/* Categories List */}
        <div className="space-y-2 mb-4">
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No categories defined</p>
          ) : (
            categories.map((category, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">{category}</span>
                <button
                  onClick={() => handleRemoveCategory(category)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={handleSaveCategories}
          disabled={saving}
          className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Categories
        </button>
      </div>
    </div>
  );
}

export default Settings;

import React, { useState, useEffect } from 'react';
import { productsAPI, settingsAPI } from '../services/api';
import { formatCurrency } from '../utils/format';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, AlertTriangle, Package } from 'lucide-react';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useProducts } from '../context/ProductContext';

// Get API base URL (without /api suffix)
const getApiBaseUrl = () => {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace('/api', '');
};

const Products = () => {
  const { products, fetchProducts, deleteProduct } = useProducts();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    cost: '',
    stock_quantity: '',
    low_stock_threshold: '10',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts]);

  const fetchCategories = async () => {
    try {
      const response = await settingsAPI.get('product_categories');
      setCategories(response.data.value || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const price = parseFloat(formData.price);
    const cost = parseFloat(formData.cost || 0);
    const stock = parseInt(formData.stock_quantity);
    const threshold = parseInt(formData.low_stock_threshold);

    if (price < 0.01) {
      toast.error('Price must be greater than 0');
      return;
    }

    // Validate price has max 2 decimal places
    if (!/^\d+(\.\d{1,2})?$/.test(price.toFixed(2))) {
      toast.error('Price must have at most 2 decimal places');
      return;
    }

    if (cost < 0) {
      toast.error('Cost cannot be negative');
      return;
    }

    // Validate cost has max 2 decimal places
    if (formData.cost && !/^\d+(\.\d{1,2})?$/.test(cost.toFixed(2))) {
      toast.error('Cost must have at most 2 decimal places');
      return;
    }

    if (stock < 0) {
      toast.error('Stock quantity cannot be negative');
      return;
    }

    if (threshold < 0) {
      toast.error('Low stock threshold cannot be negative');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!formData.category.trim()) {
      toast.error('Category is required');
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });

    if (imageFile) {
      data.append('image', imageFile);
    }

    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, data);
        toast.success('Product updated successfully');
      } else {
        await productsAPI.create(data);
        toast.success('Product created successfully');
      }

      fetchProducts();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving product');
    }
  };

  const handleDeleteClick = (product) => {
    setDeleteConfirm({ isOpen: true, id: product.id, name: product.name });
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await productsAPI.delete(deleteConfirm.id);
      // Update global state immediately
      deleteProduct(deleteConfirm.id);
      // Refetch to ensure data is in sync with server
      await fetchProducts();
      toast.success('Product deleted');
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
    } catch (error) {
      toast.error('Error deleting product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, id: null, name: '' });
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        cost: product.cost || '',
        stock_quantity: product.stock_quantity,
        low_stock_threshold: product.low_stock_threshold,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        price: '',
        cost: '',
        stock_quantity: '',
        low_stock_threshold: '10',
      });
    }
    setImageFile(null);
    setImageError(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setImageFile(null);
    setImageError(false);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6 animate-slide-right">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
          Products
        </h1>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus className="w-5 h-5 mr-2 inline" />
          Add Product
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.image_path ? (
                      <>
                        <img
                          src={`${getApiBaseUrl()}${product.image_path}`}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-xl shadow-sm"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl items-center justify-center hidden">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      </>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="font-medium">{product.name}</div>
                  </td>
                  <td>{product.category}</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>
                    <div className="flex items-center">
                      <span>{product.stock_quantity}</span>
                      {product.stock_quantity <= product.low_stock_threshold && (
                        <AlertTriangle className="w-4 h-4 text-yellow-500 ml-2" />
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(product)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        itemName={deleteConfirm.name}
        itemType="Product"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      maxLength="100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category <span className="text-red-600">*</span>
                    </label>
                    <select
                      className="input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category, index) => (
                        <option key={index} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Low Stock Alert
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Image
                    </label>
                    <div className="flex items-start gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        className="input flex-1"
                        onChange={(e) => setImageFile(e.target.files[0])}
                      />
                      {(imageFile || (editingProduct?.image_path && !imageError)) && (
                        <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
                          <img
                            src={imageFile ? URL.createObjectURL(imageFile) : `${getApiBaseUrl()}${editingProduct.image_path}`}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingProduct ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

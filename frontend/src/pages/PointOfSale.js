import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { customersAPI, salesAPI, settingsAPI } from '../services/api';
import { formatCurrency } from '../utils/format';
import toast from 'react-hot-toast';
import { Search, Plus, Minus, Trash2, ShoppingCart, Printer, X } from 'lucide-react';
import { useProducts } from '../context/ProductContext';

const PointOfSale = () => {
  const location = useLocation();
  const { products, fetchProducts, updateProductStock } = useProducts();
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [taxRate, setTaxRate] = useState(10);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [pendingSaleId, setPendingSaleId] = useState(null);

  // Refresh products and customers when route changes
  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchTaxRate();
  }, [location.pathname, fetchProducts]);

  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.getAll();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const fetchTaxRate = async () => {
    try {
      const response = await settingsAPI.get('tax_rate');
      setTaxRate(parseFloat(response.data.value) || 10);
    } catch (error) {
      console.error('Error loading tax rate:', error);
      // Keep default 10% if fetch fails
    }
  };

  // Filter customers based on search input
  useEffect(() => {
    if (customerSearch.trim() === '') {
      setFilteredCustomers([]);
      setShowCustomerDropdown(false);
      return;
    }

    const searchLower = customerSearch.toLowerCase();
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchLower))
    );

    setFilteredCustomers(filtered);
    setShowCustomerDropdown(filtered.length > 0);
  }, [customerSearch, customers]);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast.error('Not enough stock');
        return;
      }
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (product.stock_quantity < 1) {
        toast.error('Product out of stock');
        return;
      }
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
      }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    const product = products.find(p => p.id === productId);

    if (newQuantity > product.stock_quantity) {
      toast.error('Not enough stock');
      return;
    }

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item =>
      item.product_id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const tax = subtotal * taxRate / 100;
    const subtotalWithTax = subtotal + tax;

    // Ensure discount doesn't exceed subtotal + tax
    const validDiscount = Math.min(discount, subtotalWithTax);
    const total = subtotalWithTax - validDiscount;

    return { subtotal, tax, total, validDiscount };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setLoading(true);

    try {
      const { subtotal, tax, total, validDiscount } = calculateTotals();

      const saleData = {
        customer_id: selectedCustomer?.id || null,
        items: cart,
        tax_rate: taxRate,
        discount_amount: validDiscount,
        payment_method: paymentMethod,
      };

      const response = await salesAPI.create(saleData);

      toast.success('Sale completed successfully!');

      // Update stock in global state immediately
      cart.forEach(item => {
        updateProductStock(item.product_id, item.quantity);
      });

      // Show print modal
      setPendingSaleId(response.data.id);
      setShowPrintModal(true);

      // Reset cart and customer search
      setCart([]);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setDiscount(0);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error processing sale');
    } finally {
      setLoading(false);
    }
  };

  const printInvoice = async (saleId) => {
    try {
      const response = await salesAPI.generateInvoice(saleId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      toast.error('Error generating invoice');
    }
  };

  const filteredProducts = products.filter(product =>
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
    product.price > 0 &&
    product.stock_quantity > 0
  );

  const { subtotal, tax, total, validDiscount } = calculateTotals();

  return (
    <div>
      <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-6 animate-slide-right">
        Point of Sale
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-8rem)]">
        {/* Products Section */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="mb-4">
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

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredProducts.map((product, idx) => {
              const gradients = [
                'from-blue-500/10 to-indigo-500/10',
                'from-purple-500/10 to-pink-500/10',
                'from-emerald-500/10 to-teal-500/10',
                'from-orange-500/10 to-red-500/10',
              ];
              return (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="group bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 cursor-pointer transition-all duration-300 overflow-hidden hover:scale-102"
              >
                {product.image_path ? (
                  <div className="relative w-full h-40 bg-gray-200 overflow-hidden rounded-t-lg">
                    <img
                      src={`http://localhost:5000${product.image_path}`}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-40 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center rounded-t-lg">
                    <ShoppingCart className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm">{product.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{product.category}</p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <span className="text-emerald-600 font-bold text-base">{product.price}฿</span>
                    <span className="text-xs text-gray-400">Stock: {product.stock_quantity}</span>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* Cart Section */}
        <div className="card flex flex-col h-fit lg:sticky lg:top-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-4 relative z-10">
            Shopping Cart
          </h2>

          {/* Customer Selection - Autocomplete */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer
            </label>

            {/* Search input with autocomplete dropdown */}
            <div className="relative">
              <input
                type="text"
                className={`input ${selectedCustomer ? 'bg-blue-50 border-blue-200' : ''}`}
                placeholder="Walk-in Customer (type to search)"
                value={selectedCustomer ? selectedCustomer.name : customerSearch}
                onChange={(e) => {
                  if (!selectedCustomer) {
                    setCustomerSearch(e.target.value);
                  }
                }}
                onFocus={() => {
                  if (customerSearch) {
                    setShowCustomerDropdown(filteredCustomers.length > 0);
                  }
                }}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
              />

              {/* Clear button when customer is selected */}
              {selectedCustomer && (
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearch('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-700 transition-colors"
                  title="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Autocomplete Dropdown */}
              {showCustomerDropdown && filteredCustomers.length > 0 && !selectedCustomer && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedCustomer(customer);
                        setCustomerSearch(customer.name);
                        setShowCustomerDropdown(false);
                      }}
                      className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      {customer.phone && (
                        <p className="text-sm text-gray-600">{customer.phone}</p>
                      )}
                      {customer.email && (
                        <p className="text-sm text-gray-500">{customer.email}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Walk-in indicator */}
            {!selectedCustomer && !customerSearch && (
              <p className="text-xs text-gray-500 mt-1">
                No customer selected - defaults to Walk-in
              </p>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto mb-4">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product_id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-gray-600">{formatCurrency(item.unit_price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="p-1 hover:bg-red-50 text-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span>Tax ({taxRate}%):</span>
              <span>{formatCurrency(tax)}</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm flex-1">Discount:</label>
              <input
                type="number"
                className="input text-sm w-24"
                value={discount === 0 ? '' : discount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || value === '0') {
                    setDiscount(0);
                  } else {
                    const numValue = parseFloat(value);
                    const { subtotal, tax } = calculateTotals();
                    const maxDiscount = subtotal + tax;

                    if (!isNaN(numValue) && numValue >= 0) {
                      if (numValue > maxDiscount) {
                        toast.error(`Discount cannot exceed ฿${maxDiscount.toFixed(2)}`);
                        setDiscount(maxDiscount);
                      } else {
                        setDiscount(numValue);
                      }
                    }
                  }
                }}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                className="input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile">Mobile Payment</option>
              </select>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || loading}
              className="btn btn-primary w-full mt-4 py-3"
            >
              {loading ? 'Processing...' : 'Complete Sale'}
            </button>
          </div>
        </div>
      </div>

      {/* Print Invoice Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Print Invoice?</h2>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  printInvoice(pendingSaleId);
                  setShowPrintModal(false);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Yes
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition-all duration-200"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointOfSale;

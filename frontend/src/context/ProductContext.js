import React, { createContext, useContext, useState, useCallback } from 'react';
import { productsAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all products from server
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      toast.error('Error loading products');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add product to local state
  const addProduct = useCallback((product) => {
    setProducts(prev => [...prev, product]);
  }, []);

  // Update product in local state
  const updateProduct = useCallback((productId, updatedProduct) => {
    setProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, ...updatedProduct } : p)
    );
  }, []);

  // Delete product from local state immediately
  const deleteProduct = useCallback((productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  // Update product stock after a sale
  const updateProductStock = useCallback((productId, quantitySold) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? { ...p, stock_quantity: p.stock_quantity - quantitySold }
          : p
      )
    );
  }, []);

  const value = {
    products,
    loading,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

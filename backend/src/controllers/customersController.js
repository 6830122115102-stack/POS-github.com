const { dbAsync } = require('../models/db');

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY name ASC';

    const customers = await dbAsync.all(sql, params);
    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single customer
exports.getCustomer = async (req, res) => {
  try {
    const customer = await dbAsync.get(
      'SELECT * FROM customers WHERE id = ?',
      [req.params.id]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create customer
exports.createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const result = await dbAsync.run(
      'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
      [name, email || null, phone || null, address || null]
    );

    const customer = await dbAsync.get(
      'SELECT * FROM customers WHERE id = ?',
      [result.id]
    );

    res.status(201).json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const customer = await dbAsync.get(
      'SELECT * FROM customers WHERE id = ?',
      [req.params.id]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await dbAsync.run(
      `UPDATE customers SET
       name = ?, email = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, email || null, phone || null, address || null, req.params.id]
    );

    const updatedCustomer = await dbAsync.get(
      'SELECT * FROM customers WHERE id = ?',
      [req.params.id]
    );

    res.json(updatedCustomer);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await dbAsync.get(
      'SELECT * FROM customers WHERE id = ?',
      [req.params.id]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if customer has sales
    const sales = await dbAsync.get(
      'SELECT COUNT(*) as count FROM sales WHERE customer_id = ?',
      [req.params.id]
    );

    if (sales.count > 0) {
      return res.status(400).json({
        error: 'Cannot delete customer with existing sales records'
      });
    }

    await dbAsync.run('DELETE FROM customers WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get customer purchase history
exports.getCustomerHistory = async (req, res) => {
  try {
    const customer = await dbAsync.get(
      'SELECT * FROM customers WHERE id = ?',
      [req.params.id]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const sales = await dbAsync.all(
      `SELECT s.*, u.full_name as cashier_name
       FROM sales s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.customer_id = ?
       ORDER BY s.created_at DESC`,
      [req.params.id]
    );

    res.json({
      customer,
      sales
    });
  } catch (error) {
    console.error('Get customer history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

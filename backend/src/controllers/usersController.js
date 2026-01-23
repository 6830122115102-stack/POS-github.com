const bcrypt = require('bcryptjs');
const { dbAsync } = require('../models/db');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await dbAsync.all(
      `SELECT id, username, email, full_name, role, is_active, created_at
       FROM users ORDER BY created_at DESC`
    );

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single user
exports.getUser = async (req, res) => {
  try {
    const user = await dbAsync.get(
      `SELECT id, username, email, full_name, role, is_active, created_at
       FROM users WHERE id = ?`,
      [req.params.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create user
exports.createUser = async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;

    if (!username || !password || !full_name || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['admin', 'manager', 'cashier'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await dbAsync.run(
      `INSERT INTO users (username, email, password, full_name, role)
       VALUES (?, ?, ?, ?, ?)`,
      [username, null, hashedPassword, full_name, role]
    );

    const user = await dbAsync.get(
      `SELECT id, username, email, full_name, role, is_active, created_at
       FROM users WHERE id = ?`,
      [result.id]
    );

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { username, email, full_name, role, is_active } = req.body;

    const user = await dbAsync.get(
      'SELECT * FROM users WHERE id = ?',
      [req.params.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (role && !['admin', 'manager', 'cashier'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await dbAsync.run(
      `UPDATE users SET
       username = ?, email = ?, full_name = ?, role = ?, is_active = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [username, email, full_name, role, is_active !== undefined ? is_active : 1,
       req.params.id]
    );

    const updatedUser = await dbAsync.get(
      `SELECT id, username, email, full_name, role, is_active, created_at
       FROM users WHERE id = ?`,
      [req.params.id]
    );

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Delete user (hard delete - removes from system completely)
exports.deleteUser = async (req, res) => {
  try {
    const user = await dbAsync.get(
      'SELECT * FROM users WHERE id = ?',
      [req.params.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await dbAsync.get(
        'SELECT COUNT(*) as count FROM users WHERE role = "admin"'
      );

      if (adminCount.count <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    // Hard delete - completely remove from system
    await dbAsync.run(
      'DELETE FROM users WHERE id = ?',
      [req.params.id]
    );

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Reset user password
exports.resetPassword = async (req, res) => {
  try {
    const { new_password } = req.body;

    if (!new_password) {
      return res.status(400).json({ error: 'New password is required' });
    }

    const user = await dbAsync.get(
      'SELECT * FROM users WHERE id = ?',
      [req.params.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await dbAsync.run(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, req.params.id]
    );

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

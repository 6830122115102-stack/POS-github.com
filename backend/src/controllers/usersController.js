const bcrypt = require('bcryptjs');

class UserController {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async getAllUsers(req, res) {
    try {
      const users = await this.userRepository.query(
        `SELECT id, username, email, full_name, role, is_active, created_at
         FROM users ORDER BY created_at DESC`
      );

      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async getUser(req, res) {
    try {
      const user = await this.userRepository.queryOne(
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
  }

  async createUser(req, res) {
    try {
      const { username, password, full_name, role } = req.body;

      if (!username || !password || !full_name || !role) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (!['admin', 'manager', 'cashier'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await this.userRepository.create({
        username,
        email: null,
        password: hashedPassword,
        full_name,
        role
      });

      const user = await this.userRepository.queryOne(
        `SELECT id, username, email, full_name, role, is_active, created_at
         FROM users WHERE id = ?`,
        [newUser.id]
      );

      res.status(201).json(user);
    } catch (error) {
      console.error('Create user error:', error);
      if (error.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(500).json({ error: error.message || 'Server error' });
    }
  }

  async updateUser(req, res) {
    try {
      const { username, email, full_name, role, is_active } = req.body;

      const user = await this.userRepository.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (role && !['admin', 'manager', 'cashier'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      await this.userRepository.update(req.params.id, {
        username,
        email,
        full_name,
        role,
        is_active: is_active !== undefined ? is_active : 1
      });

      const updatedUser = await this.userRepository.queryOne(
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
  }

  async deleteUser(req, res) {
    try {
      const user = await this.userRepository.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.role === 'admin') {
        const adminCount = await this.userRepository.queryOne(
          'SELECT COUNT(*) as count FROM users WHERE role = "admin"'
        );

        if (adminCount.count <= 1) {
          return res.status(400).json({ error: 'Cannot delete the last admin user' });
        }
      }

      await this.userRepository.delete(req.params.id);

      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async resetPassword(req, res) {
    try {
      const { new_password } = req.body;

      if (!new_password) {
        return res.status(400).json({ error: 'New password is required' });
      }

      const user = await this.userRepository.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);

      await this.userRepository.query(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, req.params.id]
      );

      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = UserController;

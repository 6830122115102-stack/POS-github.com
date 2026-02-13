const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
  constructor(authService, userRepository) {
    this.authService = authService;
    this.userRepository = userRepository;
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required'
        });
      }

      // Find user directly via repository (raw row, not entity)
      const user = await this.userRepository.findOne({ username, is_active: 1 });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid username or password'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid username or password'
        });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      const userResponse = { ...user };
      delete userResponse.password;

      res.json({
        success: true,
        token,
        user: userResponse
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error during login'
      });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await this.userRepository.queryOne(
        'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?',
        [req.user.id]
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password and new password are required'
        });
      }

      const user = await this.userRepository.queryOne(
        'SELECT * FROM users WHERE id = ?',
        [req.user.id]
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 6 characters'
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.userRepository.query(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, req.user.id]
      );

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }
}

module.exports = AuthController;

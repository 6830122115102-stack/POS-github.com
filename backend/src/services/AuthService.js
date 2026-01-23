/**
 * AuthService - Handles authentication and authorization
 * Business logic for user login, JWT token generation, and password management
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
  /**
   * Constructor
   * @param {UserRepository} userRepository - User data access
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.jwtExpiration = '7d';
  }

  /**
   * Authenticate user and generate JWT token
   * @param {string} username - Username
   * @param {string} password - Password (plain text)
   * @returns {Promise<{token: string, user: object}>}
   * @throws {Error} If authentication fails
   */
  async login(username, password) {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    // Find user by username
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Check if user is active
    if (!user.isActive()) {
      throw new Error('User account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    // Return token and user data (without password)
    return {
      token,
      user: user.toJSON()
    };
  }

  /**
   * Generate JWT token
   * @param {User} user - User entity
   * @returns {string} JWT token
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiration
    });
  }

  /**
   * Verify and decode JWT token
   * @param {string} token - JWT token
   * @returns {Promise<object>} Decoded token payload
   * @throws {Error} If token is invalid
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get user from token
   * @param {string} token - JWT token
   * @returns {Promise<User>}
   */
  async getUserFromToken(token) {
    const decoded = await this.verifyToken(token);
    return this.userRepository.findById(decoded.id);
  }

  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<User>}
   * @throws {Error} If old password is incorrect
   */
  async changePassword(userId, oldPassword, newPassword) {
    if (!oldPassword || !newPassword) {
      throw new Error('Old password and new password are required');
    }

    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Old password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    return this.userRepository.updatePassword(userId, hashedPassword);
  }

  /**
   * Validate user role
   * @param {User} user - User entity
   * @param {string|array} requiredRoles - Required role(s)
   * @returns {boolean}
   */
  validateRole(user, requiredRoles) {
    if (!user) return false;
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return user.hasRole(roles);
  }

  /**
   * Hash password for storage
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  /**
   * Compare password with hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>}
   */
  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
}

module.exports = AuthService;

/**
 * User Entity - Represents application users with role-based access
 * Roles: admin (full access), manager (product/sales management), cashier (sales only)
 */
class User {
  constructor(data = {}) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email || null;
    this.password = data.password; // Hashed password (never expose)
    this.full_name = data.full_name || '';
    this.role = data.role || 'cashier'; // admin, manager, cashier
    this.is_active = data.is_active !== undefined ? data.is_active : 1;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  /**
   * Check if user has a specific role
   * @param {string|array} roles - Role name(s) to check
   * @returns {boolean}
   */
  hasRole(roles) {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(this.role);
  }

  /**
   * Check if user is admin
   * @returns {boolean}
   */
  isAdmin() {
    return this.role === 'admin';
  }

  /**
   * Check if user is manager
   * @returns {boolean}
   */
  isManager() {
    return this.role === 'manager' || this.role === 'admin';
  }

  /**
   * Check if user account is active
   * @returns {boolean}
   */
  isActive() {
    return this.is_active === 1;
  }

  /**
   * Get user display name
   * @returns {string}
   */
  getDisplayName() {
    return this.full_name || this.username;
  }

  /**
   * Validate password presence (password validation done in AuthService with bcrypt)
   * @returns {boolean}
   */
  hasPassword() {
    return !!this.password;
  }

  /**
   * Get safe user object without password
   * @returns {object}
   */
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }

  /**
   * Static factory method to create user from database row
   * @param {object} row - Database row
   * @returns {User}
   */
  static fromDatabase(row) {
    return new User({
      id: row.id,
      username: row.username,
      email: row.email,
      password: row.password,
      full_name: row.full_name,
      role: row.role,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at
    });
  }
}

module.exports = User;

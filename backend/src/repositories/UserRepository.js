/**
 * UserRepository - Data access layer for User entity
 */

const BaseRepository = require('./BaseRepository');
const User = require('../entities/User.entity');

class UserRepository extends BaseRepository {
  /**
   * Constructor
   * @param {object} db - Database connection
   */
  constructor(db) {
    super(db, 'users');
  }

  /**
   * Find user by username
   * @param {string} username - Username to find
   * @returns {Promise<User|null>}
   */
  async findByUsername(username) {
    const row = await this.findOne({ username });
    return row ? User.fromDatabase(row) : null;
  }

  /**
   * Find user by email
   * @param {string} email - Email to find
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    const row = await this.findOne({ email });
    return row ? User.fromDatabase(row) : null;
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<User|null>}
   */
  async findById(id) {
    const row = await super.findById(id);
    return row ? User.fromDatabase(row) : null;
  }

  /**
   * Find all active users
   * @returns {Promise<array>}
   */
  async findActive() {
    const rows = await this.find({ is_active: 1 });
    return rows.map(row => User.fromDatabase(row));
  }

  /**
   * Find all users by role
   * @param {string} role - Role to filter by
   * @returns {Promise<array>}
   */
  async findByRole(role) {
    const rows = await this.find({ role });
    return rows.map(row => User.fromDatabase(row));
  }

  /**
   * Get all users (excluding passwords)
   * @returns {Promise<array>}
   */
  async findAll() {
    const rows = await super.findAll({ orderBy: 'created_at DESC' });
    return rows.map(row => {
      const user = User.fromDatabase(row);
      return user.toJSON();
    });
  }

  /**
   * Create new user
   * @param {User} user - User instance or data object
   * @returns {Promise<User>}
   */
  async create(userData) {
    const row = await super.create({
      username: userData.username,
      email: userData.email || null,
      password: userData.password,
      full_name: userData.full_name,
      role: userData.role || 'cashier',
      is_active: userData.is_active !== undefined ? userData.is_active : 1
    });
    return User.fromDatabase(row);
  }

  /**
   * Update user
   * @param {number} id - User ID
   * @param {object} data - Updated data
   * @returns {Promise<User>}
   */
  async update(id, data) {
    const row = await super.update(id, data);
    return User.fromDatabase(row);
  }

  /**
   * Count total users
   * @returns {Promise<number>}
   */
  async countAll() {
    return this.count();
  }

  /**
   * Count users by role
   * @param {string} role - Role to count
   * @returns {Promise<number>}
   */
  async countByRole(role) {
    return this.count({ role });
  }

  /**
   * Check if username exists
   * @param {string} username - Username to check
   * @returns {Promise<boolean>}
   */
  async usernameExists(username) {
    return this.exists({ username });
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>}
   */
  async emailExists(email) {
    return email ? this.exists({ email }) : false;
  }

  /**
   * Deactivate user
   * @param {number} id - User ID
   * @returns {Promise<User>}
   */
  async deactivate(id) {
    return this.update(id, { is_active: 0 });
  }

  /**
   * Activate user
   * @param {number} id - User ID
   * @returns {Promise<User>}
   */
  async activate(id) {
    return this.update(id, { is_active: 1 });
  }

  /**
   * Update user password
   * @param {number} id - User ID
   * @param {string} hashedPassword - Hashed password
   * @returns {Promise<User>}
   */
  async updatePassword(id, hashedPassword) {
    return this.update(id, { password: hashedPassword });
  }

  /**
   * Get count of admin users
   * @returns {Promise<number>}
   */
  async countAdmins() {
    return this.count({ role: 'admin' });
  }
}

module.exports = UserRepository;

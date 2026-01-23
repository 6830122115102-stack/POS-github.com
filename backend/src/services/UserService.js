/**
 * UserService - Handles user account management
 */

const bcrypt = require('bcryptjs');

class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async getAllUsers() {
    return this.userRepository.findAll();
  }

  async getUser(id) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error(`User ${id} not found`);
    }
    return user.toJSON();
  }

  async createUser(data) {
    if (!data.username || !data.password || !data.full_name) {
      throw new Error('Username, password, and full name are required');
    }

    // Check if username exists
    const existing = await this.userRepository.findByUsername(data.username);
    if (existing) {
      throw new Error('Username already exists');
    }

    // Validate password length
    if (data.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.userRepository.create({
      username: data.username,
      email: data.email || null,
      password: hashedPassword,
      full_name: data.full_name,
      role: data.role || 'cashier'
    });
  }

  async updateUser(id, data) {
    await this.getUser(id); // Verify exists

    const updateData = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.full_name !== undefined) updateData.full_name = data.full_name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.is_active !== undefined) updateData.is_active = data.is_active ? 1 : 0;

    const updated = await this.userRepository.update(id, updateData);
    return updated.toJSON();
  }

  async deleteUser(id) {
    // Prevent deleting last admin
    const admins = await this.userRepository.countAdmins();
    const user = await this.userRepository.findById(id);

    if (user.isAdmin() && admins === 1) {
      throw new Error('Cannot delete the last admin user');
    }

    return this.userRepository.delete(id);
  }

  async resetPassword(id, newPassword) {
    await this.getUser(id);

    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await this.userRepository.updatePassword(id, hashedPassword);
    return updated.toJSON();
  }

  async changePasswordByUser(userId, oldPassword, newPassword) {
    // This is handled by AuthService
    throw new Error('Use AuthService.changePassword instead');
  }

  async getUserByUsername(username) {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      return null;
    }
    return user.toJSON();
  }

  async deactivateUser(id) {
    return this.userRepository.deactivate(id);
  }

  async activateUser(id) {
    return this.userRepository.activate(id);
  }
}

module.exports = UserService;

/**
 * FileService - Handles file operations (upload, download, delete)
 */

const fs = require('fs').promises;
const path = require('path');

class FileService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  }

  /**
   * Initialize upload directory
   * @returns {Promise<void>}
   */
  async initializeUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  /**
   * Upload image file
   * @param {object} file - Express multer file object
   * @returns {Promise<string>} - File path relative to server
   * @throws {Error} If file is invalid
   */
  async uploadImage(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file
    this.validateImageFile(file);

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}-${randomStr}${ext}`;

    // Save file
    const filepath = path.join(this.uploadDir, filename);
    await fs.writeFile(filepath, file.buffer);

    // Return relative path for storage in database
    return `/uploads/${filename}`;
  }

  /**
   * Delete image file
   * @param {string} imagePath - Relative path to image
   * @returns {Promise<boolean>}
   */
  async deleteImage(imagePath) {
    if (!imagePath) return false;

    try {
      const filename = path.basename(imagePath);
      const filepath = path.join(this.uploadDir, filename);
      await fs.unlink(filepath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Validate image file
   * @param {object} file - File object
   * @throws {Error} If file is invalid
   */
  validateImageFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      throw new Error('File size exceeds 5MB limit');
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      throw new Error('Only JPG, PNG, and GIF files are allowed');
    }

    // Check MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type');
    }
  }

  /**
   * Check if file exists
   * @param {string} imagePath - Relative path
   * @returns {Promise<boolean>}
   */
  async fileExists(imagePath) {
    try {
      const filename = path.basename(imagePath);
      const filepath = path.join(this.uploadDir, filename);
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get absolute file path
   * @param {string} imagePath - Relative path
   * @returns {string}
   */
  getAbsolutePath(imagePath) {
    if (!imagePath) return null;
    const filename = path.basename(imagePath);
    return path.join(this.uploadDir, filename);
  }
}

module.exports = FileService;

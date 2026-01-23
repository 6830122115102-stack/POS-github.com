/**
 * Database Configuration for TypeORM
 * Provides SQLite database connection setup
 */

const path = require('path');

class DatabaseConfig {
  /**
   * Get database configuration based on environment
   * @returns {object} - TypeORM configuration
   */
  static getConfig() {
    const dbPath = process.env.NODE_ENV === 'production'
      ? '/tmp/pos.db' // Use temp for production (Render)
      : path.join(__dirname, '../../database/pos.db');

    return {
      type: 'sqlite',
      database: dbPath,
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.DATABASE_LOGGING === 'true',
      entities: [
        path.join(__dirname, '../entities/*.entity.js')
      ],
      subscribers: [],
      migrations: [
        path.join(__dirname, '../migrations/*.js')
      ]
    };
  }

  /**
   * Get database connection options
   * @returns {object}
   */
  static getConnectionOptions() {
    const config = this.getConfig();
    return {
      name: 'default',
      type: config.type,
      database: config.database,
      synchronize: config.synchronize,
      logging: config.logging,
      entities: config.entities,
      subscribers: config.subscribers,
      migrations: config.migrations,
      cli: {
        entitiesDir: path.join(__dirname, '../entities'),
        migrationsDir: path.join(__dirname, '../migrations'),
        subscribersDir: path.join(__dirname, '../subscribers')
      }
    };
  }
}

module.exports = DatabaseConfig;

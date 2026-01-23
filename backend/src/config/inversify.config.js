/**
 * InversifyJS Dependency Injection Configuration
 * Registers all repositories and services for dependency injection
 */

require('reflect-metadata');
const { Container } = require('inversify');

// Import repositories
const UserRepository = require('../repositories/UserRepository');
const ProductRepository = require('../repositories/ProductRepository');
const CustomerRepository = require('../repositories/CustomerRepository');
const SaleRepository = require('../repositories/SaleRepository');
const SaleItemRepository = require('../repositories/SaleItemRepository');
const StockMovementRepository = require('../repositories/StockMovementRepository');
const SettingRepository = require('../repositories/SettingRepository');

// Repository symbols
const TYPES = {
  // Database
  Database: Symbol('Database'),

  // Repositories
  UserRepository: Symbol('UserRepository'),
  ProductRepository: Symbol('ProductRepository'),
  CustomerRepository: Symbol('CustomerRepository'),
  SaleRepository: Symbol('SaleRepository'),
  SaleItemRepository: Symbol('SaleItemRepository'),
  StockMovementRepository: Symbol('StockMovementRepository'),
  SettingRepository: Symbol('SettingRepository'),

  // Services (will be added when we create them)
  AuthService: Symbol('AuthService'),
  ProductService: Symbol('ProductService'),
  SalesService: Symbol('SalesService'),
  CustomerService: Symbol('CustomerService'),
  UserService: Symbol('UserService'),
  ReportService: Symbol('ReportService'),
  SettingService: Symbol('SettingService'),
  FileService: Symbol('FileService')
};

/**
 * Setup dependency injection container
 * @param {object} db - Database connection instance
 * @returns {Container} - Configured container
 */
function setupContainer(db) {
  const container = new Container();

  // Register database connection
  container.bind(TYPES.Database).toConstantValue(db);

  // Register repositories
  container.bind(TYPES.UserRepository).toDynamicValue(() => {
    return new UserRepository(db);
  }).inSingletonScope();

  container.bind(TYPES.ProductRepository).toDynamicValue(() => {
    return new ProductRepository(db);
  }).inSingletonScope();

  container.bind(TYPES.CustomerRepository).toDynamicValue(() => {
    return new CustomerRepository(db);
  }).inSingletonScope();

  container.bind(TYPES.SaleRepository).toDynamicValue(() => {
    return new SaleRepository(db);
  }).inSingletonScope();

  container.bind(TYPES.SaleItemRepository).toDynamicValue(() => {
    return new SaleItemRepository(db);
  }).inSingletonScope();

  container.bind(TYPES.StockMovementRepository).toDynamicValue(() => {
    return new StockMovementRepository(db);
  }).inSingletonScope();

  container.bind(TYPES.SettingRepository).toDynamicValue(() => {
    return new SettingRepository(db);
  }).inSingletonScope();

  return container;
}

module.exports = {
  TYPES,
  setupContainer
};

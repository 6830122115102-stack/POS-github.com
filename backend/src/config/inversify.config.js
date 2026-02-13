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

// Import services
const AuthService = require('../services/AuthService');
const ProductService = require('../services/ProductService');
const SalesService = require('../services/SalesService');
const CustomerService = require('../services/CustomerService');
const UserService = require('../services/UserService');
const ReportService = require('../services/ReportService');
const SettingService = require('../services/SettingService');
const FileService = require('../services/FileService');

// Import controllers
const AuthController = require('../controllers/authController');
const ProductController = require('../controllers/productsController');
const SalesController = require('../controllers/salesController');
const CustomerController = require('../controllers/customersController');
const UserController = require('../controllers/usersController');
const ReportController = require('../controllers/reportsController');
const SettingController = require('../controllers/settingsController');

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

  // Services
  AuthService: Symbol('AuthService'),
  ProductService: Symbol('ProductService'),
  SalesService: Symbol('SalesService'),
  CustomerService: Symbol('CustomerService'),
  UserService: Symbol('UserService'),
  ReportService: Symbol('ReportService'),
  SettingService: Symbol('SettingService'),
  FileService: Symbol('FileService'),

  // Controllers
  AuthController: Symbol('AuthController'),
  ProductController: Symbol('ProductController'),
  SalesController: Symbol('SalesController'),
  CustomerController: Symbol('CustomerController'),
  UserController: Symbol('UserController'),
  ReportController: Symbol('ReportController'),
  SettingController: Symbol('SettingController')
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

  // Register services
  container.bind(TYPES.FileService).toConstantValue(new FileService());

  container.bind(TYPES.AuthService).toDynamicValue((context) => {
    const userRepository = context.container.get(TYPES.UserRepository);
    return new AuthService(userRepository);
  }).inSingletonScope();

  container.bind(TYPES.ProductService).toDynamicValue((context) => {
    const productRepository = context.container.get(TYPES.ProductRepository);
    const stockMovementRepository = context.container.get(TYPES.StockMovementRepository);
    const fileService = context.container.get(TYPES.FileService);
    return new ProductService(productRepository, stockMovementRepository, fileService);
  }).inSingletonScope();

  container.bind(TYPES.SalesService).toDynamicValue((context) => {
    const saleRepository = context.container.get(TYPES.SaleRepository);
    const saleItemRepository = context.container.get(TYPES.SaleItemRepository);
    const productRepository = context.container.get(TYPES.ProductRepository);
    const customerRepository = context.container.get(TYPES.CustomerRepository);
    const stockMovementRepository = context.container.get(TYPES.StockMovementRepository);
    return new SalesService(saleRepository, saleItemRepository, productRepository, customerRepository, stockMovementRepository);
  }).inSingletonScope();

  container.bind(TYPES.CustomerService).toDynamicValue((context) => {
    const customerRepository = context.container.get(TYPES.CustomerRepository);
    const saleRepository = context.container.get(TYPES.SaleRepository);
    return new CustomerService(customerRepository, saleRepository);
  }).inSingletonScope();

  container.bind(TYPES.UserService).toDynamicValue((context) => {
    const userRepository = context.container.get(TYPES.UserRepository);
    return new UserService(userRepository);
  }).inSingletonScope();

  container.bind(TYPES.ReportService).toDynamicValue((context) => {
    const saleRepository = context.container.get(TYPES.SaleRepository);
    const productRepository = context.container.get(TYPES.ProductRepository);
    const customerRepository = context.container.get(TYPES.CustomerRepository);
    const saleItemRepository = context.container.get(TYPES.SaleItemRepository);
    return new ReportService(saleRepository, productRepository, customerRepository, saleItemRepository);
  }).inSingletonScope();

  container.bind(TYPES.SettingService).toDynamicValue((context) => {
    const settingRepository = context.container.get(TYPES.SettingRepository);
    return new SettingService(settingRepository);
  }).inSingletonScope();

  // Register controllers
  container.bind(TYPES.AuthController).toDynamicValue((context) => {
    const authService = context.container.get(TYPES.AuthService);
    const userRepository = context.container.get(TYPES.UserRepository);
    return new AuthController(authService, userRepository);
  }).inSingletonScope();

  container.bind(TYPES.ProductController).toDynamicValue((context) => {
    const productRepository = context.container.get(TYPES.ProductRepository);
    const stockMovementRepository = context.container.get(TYPES.StockMovementRepository);
    return new ProductController(productRepository, stockMovementRepository);
  }).inSingletonScope();

  container.bind(TYPES.SalesController).toDynamicValue((context) => {
    const saleRepository = context.container.get(TYPES.SaleRepository);
    const saleItemRepository = context.container.get(TYPES.SaleItemRepository);
    const productRepository = context.container.get(TYPES.ProductRepository);
    const customerRepository = context.container.get(TYPES.CustomerRepository);
    const stockMovementRepository = context.container.get(TYPES.StockMovementRepository);
    return new SalesController(saleRepository, saleItemRepository, productRepository, customerRepository, stockMovementRepository);
  }).inSingletonScope();

  container.bind(TYPES.CustomerController).toDynamicValue((context) => {
    const customerRepository = context.container.get(TYPES.CustomerRepository);
    const saleRepository = context.container.get(TYPES.SaleRepository);
    return new CustomerController(customerRepository, saleRepository);
  }).inSingletonScope();

  container.bind(TYPES.UserController).toDynamicValue((context) => {
    const userRepository = context.container.get(TYPES.UserRepository);
    return new UserController(userRepository);
  }).inSingletonScope();

  container.bind(TYPES.ReportController).toDynamicValue((context) => {
    const saleRepository = context.container.get(TYPES.SaleRepository);
    const productRepository = context.container.get(TYPES.ProductRepository);
    const customerRepository = context.container.get(TYPES.CustomerRepository);
    return new ReportController(saleRepository, productRepository, customerRepository);
  }).inSingletonScope();

  container.bind(TYPES.SettingController).toDynamicValue((context) => {
    const settingRepository = context.container.get(TYPES.SettingRepository);
    return new SettingController(settingRepository);
  }).inSingletonScope();

  return container;
}

module.exports = {
  TYPES,
  setupContainer
};

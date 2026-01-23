/**
 * SalesService - Handles sales transactions
 * Complex business logic for sales creation with multi-table updates
 */

class SalesService {
  /**
   * Constructor
   * @param {SaleRepository} saleRepository
   * @param {SaleItemRepository} saleItemRepository
   * @param {ProductRepository} productRepository
   * @param {CustomerRepository} customerRepository
   * @param {StockMovementRepository} stockMovementRepository
   */
  constructor(
    saleRepository,
    saleItemRepository,
    productRepository,
    customerRepository,
    stockMovementRepository
  ) {
    this.saleRepository = saleRepository;
    this.saleItemRepository = saleItemRepository;
    this.productRepository = productRepository;
    this.customerRepository = customerRepository;
    this.stockMovementRepository = stockMovementRepository;
  }

  /**
   * Create a new sale with items
   * Complex transaction: creates sale, items, updates inventory, updates customer stats
   * @param {object} saleData - Sale data
   * @returns {Promise<Sale>}
   */
  async createSale(saleData) {
    // Validate sale data
    this.validateSaleData(saleData);

    try {
      // Validate stock availability for all items
      for (const item of saleData.items) {
        const product = await this.productRepository.findById(item.product_id);
        if (!product) {
          throw new Error(`Product ${item.product_id} not found`);
        }
        if (!product.hasEnoughStock(item.quantity)) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
      }

      // Generate invoice number
      const invoiceNumber = this.generateInvoiceNumber();

      // Create sale
      const sale = await this.saleRepository.create({
        invoice_number: invoiceNumber,
        customer_id: saleData.customer_id || null,
        user_id: saleData.user_id,
        subtotal: saleData.subtotal,
        tax_amount: saleData.tax_amount || 0,
        discount_amount: saleData.discount_amount || 0,
        total_amount: saleData.total_amount,
        payment_method: saleData.payment_method || 'cash',
        status: 'completed'
      });

      // Create sale items and update inventory
      for (const item of saleData.items) {
        // Create sale item
        await this.saleItemRepository.create({
          sale_id: sale.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price
        });

        // Update product stock
        await this.productRepository.updateStock(item.product_id, -item.quantity);

        // Record stock movement
        await this.stockMovementRepository.create({
          product_id: item.product_id,
          quantity_change: -item.quantity,
          movement_type: 'sale',
          reference_id: sale.id,
          created_by: saleData.user_id
        });
      }

      // Update customer statistics
      if (saleData.customer_id) {
        await this.customerRepository.recordPurchase(saleData.customer_id, saleData.total_amount);
      }

      return sale;
    } catch (error) {
      throw new Error(`Failed to create sale: ${error.message}`);
    }
  }

  /**
   * Get all sales
   * @param {object} filters - {startDate, endDate, customerId, limit, offset}
   * @returns {Promise<array>}
   */
  async getAllSales(filters = {}) {
    let sales;

    if (filters.startDate && filters.endDate) {
      sales = await this.saleRepository.findByDateRange(filters.startDate, filters.endDate);
    } else {
      sales = await this.saleRepository.findAll();
    }

    // Filter by customer
    if (filters.customerId) {
      sales = sales.filter(s => s.customer_id === filters.customerId);
    }

    // Apply pagination
    if (filters.limit) {
      const offset = filters.offset || 0;
      sales = sales.slice(offset, offset + filters.limit);
    }

    return sales;
  }

  /**
   * Get sale with items
   * @param {number} id - Sale ID
   * @returns {Promise<Sale>}
   */
  async getSaleWithItems(id) {
    const sale = await this.saleRepository.findById(id);
    if (!sale) {
      throw new Error(`Sale ${id} not found`);
    }

    const items = await this.saleItemRepository.findBySale(id);
    sale.items = items;

    return sale;
  }

  /**
   * Get sales summary for date range
   * @param {object} filters - {startDate, endDate}
   * @returns {Promise<object>}
   */
  async getSalesSummary(filters = {}) {
    const startDate = filters.startDate || new Date().toISOString().split('T')[0];
    const endDate = filters.endDate || new Date().toISOString().split('T')[0];

    const [count, total, taxTotal, avgSale] = await Promise.all([
      this.saleRepository.getSalesCount(startDate, endDate),
      this.saleRepository.getSalesTotal(startDate, endDate),
      this.saleRepository.getTaxTotal(startDate, endDate),
      this.saleRepository.getAverageSale(startDate, endDate)
    ]);

    return {
      total_sales: count,
      total_revenue: total || 0,
      total_tax: taxTotal || 0,
      avg_sale_amount: avgSale || 0,
      date_range: { startDate, endDate }
    };
  }

  /**
   * Generate unique invoice number
   * @returns {string}
   */
  generateInvoiceNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `INV-${timestamp}-${random}`;
  }

  /**
   * Validate sale data
   * @param {object} saleData
   * @throws {Error}
   */
  validateSaleData(saleData) {
    if (!saleData.items || saleData.items.length === 0) {
      throw new Error('Sale must contain at least one item');
    }

    if (!saleData.user_id) {
      throw new Error('User ID is required');
    }

    if (isNaN(saleData.subtotal) || saleData.subtotal < 0) {
      throw new Error('Invalid subtotal');
    }

    if (isNaN(saleData.total_amount) || saleData.total_amount < 0) {
      throw new Error('Invalid total amount');
    }

    // Validate items
    for (const item of saleData.items) {
      if (!item.product_id || !item.product_name || !item.quantity || !item.unit_price) {
        throw new Error('Each item must have product_id, product_name, quantity, and unit_price');
      }

      if (item.quantity <= 0) {
        throw new Error('Item quantity must be greater than 0');
      }

      if (item.unit_price < 0) {
        throw new Error('Item price cannot be negative');
      }
    }
  }

  /**
   * Get today's sales
   * @returns {Promise<array>}
   */
  async getTodaySales() {
    return this.saleRepository.getTodaySales();
  }

  /**
   * Get customer purchase history
   * @param {number} customerId - Customer ID
   * @returns {Promise<array>}
   */
  async getCustomerSales(customerId) {
    return this.saleRepository.findByCustomer(customerId);
  }
}

module.exports = SalesService;

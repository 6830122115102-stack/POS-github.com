/**
 * ReportService - Handles analytics and reporting
 */

class ReportService {
  constructor(saleRepository, productRepository, customerRepository, saleItemRepository) {
    this.saleRepository = saleRepository;
    this.productRepository = productRepository;
    this.customerRepository = customerRepository;
    this.saleItemRepository = saleItemRepository;
  }

  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const monthEndStr = today;

    const [todaySummary, monthSummary, lowStockProducts, totalCustomers] = await Promise.all([
      this.saleRepository.getSalesCount(today, today).then(count => ({
        sales_count: count,
        total_revenue: this.saleRepository.getSalesTotal(today, today)
      })),
      this.saleRepository.getSalesTotal(monthStartStr, monthEndStr),
      this.productRepository.findLowStock(),
      this.customerRepository.getTotalCustomers()
    ]);

    const todayRevenue = await this.saleRepository.getSalesTotal(today, today);

    return {
      today: {
        sales: todaySummary.sales_count,
        revenue: todayRevenue || 0
      },
      month: {
        revenue: monthSummary || 0
      },
      low_stock_count: lowStockProducts.length,
      total_customers: totalCustomers,
      timestamp: new Date().toISOString()
    };
  }

  async getSalesSummary(filters = {}) {
    const startDate = filters.start_date || new Date().toISOString().split('T')[0];
    const endDate = filters.end_date || new Date().toISOString().split('T')[0];

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
      avg_sale_amount: avgSale || 0
    };
  }

  async getTopProducts(filters = {}) {
    const startDate = filters.start_date || new Date().toISOString().split('T')[0];
    const endDate = filters.end_date || new Date().toISOString().split('T')[0];
    const limit = filters.limit || 10;

    // Get sales within date range
    const sales = await this.saleRepository.findByDateRange(startDate, endDate);
    const productStats = {};

    // Aggregate product sales
    for (const sale of sales) {
      const items = await this.saleItemRepository.findBySale(sale.id);
      for (const item of items) {
        if (!productStats[item.product_id]) {
          productStats[item.product_id] = {
            product_id: item.product_id,
            product_name: item.product_name,
            total_quantity: 0,
            total_revenue: 0,
            times_sold: 0
          };
        }
        productStats[item.product_id].total_quantity += item.quantity;
        productStats[item.product_id].total_revenue += item.total_price;
        productStats[item.product_id].times_sold += 1;
      }
    }

    // Sort by revenue and limit
    return Object.values(productStats)
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);
  }

  async getSalesByPeriod(filters = {}) {
    const startDate = filters.start_date;
    const endDate = filters.end_date;

    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

    const sales = await this.saleRepository.findByDateRange(startDate, endDate);
    const byDate = {};

    for (const sale of sales) {
      const date = sale.created_at.split('T')[0];
      if (!byDate[date]) {
        byDate[date] = {
          date,
          count: 0,
          revenue: 0,
          tax: 0
        };
      }
      byDate[date].count += 1;
      byDate[date].revenue += sale.total_amount;
      byDate[date].tax += sale.tax_amount;
    }

    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }

  async exportSalesData(filters = {}) {
    const startDate = filters.start_date;
    const endDate = filters.end_date;

    const sales = await this.saleRepository.findByDateRange(startDate, endDate);
    const data = [];

    for (const sale of sales) {
      const items = await this.saleItemRepository.findBySale(sale.id);
      data.push({
        ...sale.toJSON(),
        items: items.map(i => i.toJSON())
      });
    }

    return data;
  }
}

module.exports = ReportService;

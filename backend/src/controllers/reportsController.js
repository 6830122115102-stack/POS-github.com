const { dbAsync } = require('../models/db');
const PDFDocument = require('pdfkit');

// Get sales summary
exports.getSalesSummary = async (req, res) => {
  try {
    const { start_date, end_date, period } = req.query;
    let sql = `
      SELECT
        COUNT(*) as total_sales,
        SUM(total_amount) as total_revenue,
        SUM(subtotal) as total_subtotal,
        SUM(tax_amount) as total_tax,
        SUM(discount_amount) as total_discount,
        AVG(total_amount) as avg_sale_amount
      FROM sales
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      sql += ' AND date(created_at) >= date(?)';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND date(created_at) <= date(?)';
      params.push(end_date);
    }

    const summary = await dbAsync.get(sql, params);

    res.json(summary);
  } catch (error) {
    console.error('Get sales summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get top selling products
exports.getTopProducts = async (req, res) => {
  try {
    const { start_date, end_date, limit } = req.query;
    let sql = `
      SELECT
        si.product_id,
        si.product_name,
        SUM(si.quantity) as total_quantity,
        SUM(si.total_price) as total_revenue,
        COUNT(DISTINCT si.sale_id) as times_sold
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      sql += ' AND date(s.created_at) >= date(?)';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND date(s.created_at) <= date(?)';
      params.push(end_date);
    }

    sql += `
      GROUP BY si.product_id, si.product_name
      ORDER BY total_quantity DESC
      LIMIT ?
    `;
    params.push(parseInt(limit) || 10);

    const products = await dbAsync.all(sql, params);

    res.json(products);
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get sales by period (daily/monthly)
exports.getSalesByPeriod = async (req, res) => {
  try {
    const { start_date, end_date, period } = req.query;

    let dateFormat;
    if (period === 'monthly') {
      dateFormat = '%Y-%m';
    } else {
      dateFormat = '%Y-%m-%d';
    }

    let sql = `
      SELECT
        strftime('${dateFormat}', created_at) as period,
        COUNT(*) as sales_count,
        SUM(total_amount) as total_revenue
      FROM sales
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      sql += ' AND date(created_at) >= date(?)';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND date(created_at) <= date(?)';
      params.push(end_date);
    }

    sql += ' GROUP BY period ORDER BY period ASC';

    const data = await dbAsync.all(sql, params);

    res.json(data);
  } catch (error) {
    console.error('Get sales by period error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    // Today's sales
    const todaySales = await dbAsync.get(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE date(created_at) = date('now')
    `);

    // This month's sales
    const monthSales = await dbAsync.get(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `);

    // Low stock items (only valid products: active, price > 0, stock > 0)
    const lowStock = await dbAsync.get(`
      SELECT COUNT(*) as count
      FROM products
      WHERE stock_quantity <= low_stock_threshold AND is_active = 1 AND price > 0 AND stock_quantity > 0
    `);

    // Total customers
    const totalCustomers = await dbAsync.get(`
      SELECT COUNT(*) as count FROM customers
    `);

    // Total products (only valid products: active, price > 0, stock > 0)
    const totalProducts = await dbAsync.get(`
      SELECT COUNT(*) as count FROM products WHERE is_active = 1 AND price > 0 AND stock_quantity > 0
    `);

    // Recent sales
    const recentSales = await dbAsync.all(`
      SELECT s.*, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `);

    res.json({
      today: {
        sales_count: todaySales.count,
        revenue: todaySales.total
      },
      month: {
        sales_count: monthSales.count,
        revenue: monthSales.total
      },
      low_stock_count: lowStock.count,
      total_customers: totalCustomers.count,
      total_products: totalProducts.count,
      recent_sales: recentSales
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Export sales to CSV
exports.exportSalesCSV = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let sql = `
      SELECT
        s.invoice_number,
        s.created_at,
        c.name as customer_name,
        u.full_name as cashier,
        s.subtotal,
        s.tax_amount,
        s.discount_amount,
        s.total_amount,
        s.payment_method
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      sql += ' AND date(s.created_at) >= date(?)';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND date(s.created_at) <= date(?)';
      params.push(end_date);
    }

    sql += ' ORDER BY s.created_at DESC';

    const sales = await dbAsync.all(sql, params);

    // Generate CSV
    const headers = [
      'Invoice Number',
      'Date',
      'Customer',
      'Cashier',
      'Subtotal',
      'Tax',
      'Discount',
      'Total',
      'Payment Method'
    ];

    let csv = headers.join(',') + '\n';

    sales.forEach(sale => {
      const row = [
        sale.invoice_number,
        new Date(sale.created_at).toLocaleString(),
        sale.customer_name || 'Walk-in',
        sale.cashier,
        sale.subtotal.toFixed(2),
        sale.tax_amount.toFixed(2),
        sale.discount_amount.toFixed(2),
        sale.total_amount.toFixed(2),
        sale.payment_method
      ];
      csv += row.map(field => `"${field}"`).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Export sales report to PDF
exports.exportSalesPDF = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Get sales summary
    let summarySQL = `
      SELECT
        COUNT(*) as total_sales,
        SUM(total_amount) as total_revenue
      FROM sales
      WHERE 1=1
    `;
    const summaryParams = [];

    if (start_date) {
      summarySQL += ' AND date(created_at) >= date(?)';
      summaryParams.push(start_date);
    }

    if (end_date) {
      summarySQL += ' AND date(created_at) <= date(?)';
      summaryParams.push(end_date);
    }

    const summary = await dbAsync.get(summarySQL, summaryParams);

    // Create PDF with UTF-8 encoding
    const doc = new PDFDocument({ margin: 50, bufferPages: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('SALES REPORT', { align: 'center' });
    doc.moveDown();

    // Date range
    doc.fontSize(10);
    if (start_date || end_date) {
      doc.text(`Period: ${start_date || 'All'} to ${end_date || 'Present'}`);
      doc.moveDown();
    }

    // Summary
    doc.fontSize(12).text('Summary', { underline: true });
    doc.fontSize(10);
    doc.text(`Total Sales: ${summary.total_sales}`);
    doc.text(`Total Revenue: THB ${(summary.total_revenue || 0).toFixed(2)}`);
    doc.moveDown(2);

    // Footer
    doc.fontSize(8).text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

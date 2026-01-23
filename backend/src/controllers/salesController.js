const { dbAsync } = require('../models/db');
const PDFDocument = require('pdfkit');

// Generate unique invoice number
const generateInvoiceNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `INV-${timestamp}-${random}`;
};

// Create new sale
exports.createSale = async (req, res) => {
  try {
    const {
      customer_id,
      items, // Array of { product_id, quantity, unit_price }
      tax_rate,
      discount_amount,
      payment_method
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in the sale' });
    }

    // Calculate totals
    let subtotal = 0;
    items.forEach(item => {
      subtotal += item.quantity * item.unit_price;
    });

    const tax_amount = subtotal * (tax_rate || 0) / 100;
    const total_amount = subtotal + tax_amount - (discount_amount || 0);

    // Generate invoice number
    const invoice_number = generateInvoiceNumber();

    // Create sale
    const saleResult = await dbAsync.run(
      `INSERT INTO sales (invoice_number, customer_id, user_id, subtotal, tax_amount,
       discount_amount, total_amount, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoice_number, customer_id || null, req.user.id, subtotal, tax_amount,
       discount_amount || 0, total_amount, payment_method || 'cash']
    );

    const sale_id = saleResult.id;

    // Insert sale items and update stock
    for (const item of items) {
      // Get product details
      const product = await dbAsync.get(
        'SELECT * FROM products WHERE id = ?',
        [item.product_id]
      );

      if (!product) {
        return res.status(404).json({ error: `Product ${item.product_id} not found` });
      }

      // Check stock
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`
        });
      }

      // Insert sale item
      await dbAsync.run(
        `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sale_id, item.product_id, product.name, item.quantity, item.unit_price,
         item.quantity * item.unit_price]
      );

      // Update product stock
      await dbAsync.run(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );

      // Record stock movement
      await dbAsync.run(
        `INSERT INTO stock_movements (product_id, quantity_change, movement_type, reference_id, created_by)
         VALUES (?, ?, 'sale', ?, ?)`,
        [item.product_id, -item.quantity, sale_id, req.user.id]
      );
    }

    // Update customer stats if customer exists
    if (customer_id) {
      await dbAsync.run(
        `UPDATE customers SET
         total_purchases = total_purchases + ?,
         visit_count = visit_count + 1,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [total_amount, customer_id]
      );
    }

    // Get complete sale with items
    const sale = await dbAsync.get('SELECT * FROM sales WHERE id = ?', [sale_id]);
    const saleItems = await dbAsync.all('SELECT * FROM sale_items WHERE sale_id = ?', [sale_id]);

    res.status(201).json({
      ...sale,
      items: saleItems
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Get all sales
exports.getAllSales = async (req, res) => {
  try {
    const { start_date, end_date, customer_id } = req.query;
    let sql = `
      SELECT s.*, c.name as customer_name, u.full_name as cashier_name
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

    if (customer_id) {
      sql += ' AND s.customer_id = ?';
      params.push(customer_id);
    }

    sql += ' ORDER BY s.created_at DESC';

    const sales = await dbAsync.all(sql, params);
    res.json(sales);
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single sale with items
exports.getSale = async (req, res) => {
  try {
    const sale = await dbAsync.get(
      `SELECT s.*, c.name as customer_name, c.email as customer_email,
       u.full_name as cashier_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const items = await dbAsync.all(
      'SELECT * FROM sale_items WHERE sale_id = ?',
      [req.params.id]
    );

    res.json({
      ...sale,
      items
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Generate invoice PDF
exports.generateInvoice = async (req, res) => {
  try {
    const sale = await dbAsync.get(
      `SELECT s.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
       u.full_name as cashier_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const items = await dbAsync.all(
      'SELECT * FROM sale_items WHERE sale_id = ?',
      [req.params.id]
    );

    // Create PDF with UTF-8 encoding
    const doc = new PDFDocument({ margin: 50, bufferPages: true });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${sale.invoice_number}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();

    // Invoice details
    doc.fontSize(10);
    doc.text(`Invoice Number: ${sale.invoice_number}`);
    doc.text(`Date: ${new Date(sale.created_at).toLocaleDateString()}`);
    doc.text(`Cashier: ${sale.cashier_name}`);
    doc.moveDown();

    // Customer details
    if (sale.customer_name) {
      doc.text(`Customer: ${sale.customer_name}`);
      if (sale.customer_email) doc.text(`Email: ${sale.customer_email}`);
      if (sale.customer_phone) doc.text(`Phone: ${sale.customer_phone}`);
      doc.moveDown();
    }

    // Line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Items table header
    const tableTop = doc.y;
    doc.text('Item', 50, tableTop);
    doc.text('Qty', 300, tableTop);
    doc.text('Price', 370, tableTop);
    doc.text('Total', 450, tableTop);

    doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
    doc.moveDown();

    // Items
    items.forEach((item) => {
      const y = doc.y;
      doc.text(item.product_name, 50, y, { width: 230 });
      doc.text(item.quantity.toString(), 300, y);
      doc.text(`THB ${item.unit_price.toFixed(2)}`, 370, y);
      doc.text(`THB ${item.total_price.toFixed(2)}`, 450, y);
      doc.moveDown();
    });

    // Line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Totals
    doc.text(`Subtotal: THB ${sale.subtotal.toFixed(2)}`, 400);
    doc.text(`Tax: THB ${sale.tax_amount.toFixed(2)}`, 400);
    if (sale.discount_amount > 0) {
      doc.text(`Discount: -THB ${sale.discount_amount.toFixed(2)}`, 400);
    }
    doc.fontSize(12).text(`Total: THB ${sale.total_amount.toFixed(2)}`, 400);

    doc.moveDown(2);
    doc.fontSize(10).text(`Payment Method: ${sale.payment_method}`, 50);

    // Footer
    doc.moveDown(3);
    doc.fontSize(8).text('Thank you for your business!', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

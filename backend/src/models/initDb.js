const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/pos.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database schema
function initializeDatabase() {
  db.serialize(() => {

    // Users table - for authentication and role management
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'cashier')),
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products/Menu items table - inventory management
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        cost REAL DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 10,
        image_path TEXT,
        sku TEXT UNIQUE,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers table - CRM
    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        total_purchases REAL DEFAULT 0,
        visit_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sales/Orders table - transaction records
    db.run(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        customer_id INTEGER,
        user_id INTEGER NOT NULL,
        subtotal REAL NOT NULL,
        tax_amount REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        total_amount REAL NOT NULL,
        payment_method TEXT,
        status TEXT DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Sale items table - individual items in each sale
    db.run(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Stock movements table - track inventory changes
    db.run(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity_change INTEGER NOT NULL,
        movement_type TEXT NOT NULL CHECK(movement_type IN ('purchase', 'sale', 'adjustment', 'return')),
        reference_id INTEGER,
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Settings table - system configuration
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables created successfully');

    // Create default admin user
    createDefaultAdmin();
  });
}

// Create default admin user
function createDefaultAdmin() {
  const defaultAdmin = {
    username: 'admin',
    email: 'admin@pos.com',
    password: 'admin123',
    full_name: 'System Administrator',
    role: 'admin'
  };

  db.get('SELECT id FROM users WHERE username = ?', [defaultAdmin.username], async (err, row) => {
    if (err) {
      console.error('Error checking admin:', err);
      return;
    }

    if (!row) {
      const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);

      db.run(
        `INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)`,
        [defaultAdmin.username, defaultAdmin.email, hashedPassword, defaultAdmin.full_name, defaultAdmin.role],
        (err) => {
          if (err) {
            console.error('Error creating admin:', err);
          } else {
            console.log('Default admin created - Username: admin, Password: admin123');
          }
        }
      );
    }
  });
}

// Create default settings
function createDefaultSettings() {
  const defaultSettings = [
    {
      key: 'tax_rate',
      value: '10',
      description: 'Default tax rate percentage'
    },
    {
      key: 'product_categories',
      value: '["Beverages","Food","Desserts","Snacks"]',
      description: 'Available product categories (JSON array)'
    }
  ];

  defaultSettings.forEach(setting => {
    db.run(
      `INSERT OR IGNORE INTO settings (setting_key, setting_value, description)
       VALUES (?, ?, ?)`,
      [setting.key, setting.value, setting.description],
      (err) => {
        if (err) {
          console.error(`Error creating setting ${setting.key}:`, err);
        } else {
          console.log(`Default setting created: ${setting.key}`);
        }
      }
    );
  });
}

// Seed sample data
function seedSampleData() {
  // Sample products (without hardcoded image paths)
  const sampleProducts = [
    {
      name: 'Espresso',
      category: 'Beverages',
      price: 3.50,
      cost: 1.20,
      stock_quantity: 100,
      low_stock_threshold: 20
    },
    {
      name: 'Cappuccino',
      category: 'Beverages',
      price: 4.50,
      cost: 1.50,
      stock_quantity: 100,
      low_stock_threshold: 20
    },
    {
      name: 'Chocolate Cake',
      category: 'Desserts',
      price: 5.99,
      cost: 2.50,
      stock_quantity: 25,
      low_stock_threshold: 5
    }
  ];

  sampleProducts.forEach(product => {
    db.run(
      `INSERT OR IGNORE INTO products (name, category, price, cost, stock_quantity, low_stock_threshold)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [product.name, product.category, product.price, product.cost,
       product.stock_quantity, product.low_stock_threshold],
      (err) => {
        if (err) {
          console.error(`Error creating product ${product.name}:`, err);
        } else {
          console.log(`Sample product created: ${product.name}`);
        }
      }
    );
  });

  // Sample customers
  const sampleCustomers = [
    { name: 'John Doe', email: 'john@example.com', phone: '555-0101' },
    { name: 'Jane Smith', email: 'jane@example.com', phone: '555-0102' }
  ];

  sampleCustomers.forEach(customer => {
    db.run(
      `INSERT OR IGNORE INTO customers (name, email, phone) VALUES (?, ?, ?)`,
      [customer.name, customer.email, customer.phone],
      (err) => {
        if (err && !err.message.includes('UNIQUE')) {
          console.error(`Error creating customer ${customer.name}:`, err);
        }
      }
    );
  });
}

// Run initialization
initializeDatabase();

// Seed data after a short delay to ensure tables are created
setTimeout(() => {
  createDefaultSettings();
  seedSampleData();
}, 1000);

module.exports = db;

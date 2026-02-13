require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');

// Initialize database
const db = require('./models/initDb');

// Dependency injection
const { setupContainer, TYPES } = require('./config/inversify.config');

const app = express();

// Middleware
// Configure CORS for both development and production
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['https://posfrontend.netlify.app'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // In development, allow all local origins
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    // Allow configured origins for production
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: '*'
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware - log API requests with response time
app.use((req, res, next) => {
  // Only log API requests, not static files
  if (req.path.startsWith('/api')) {
    const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
    const cleanIP = clientIP.replace(/^::ffff:/, ''); // Remove IPv6 prefix
    const timestamp = new Date().toLocaleTimeString();
    const startTime = Date.now();

    // Capture original json and send functions
    const originalJson = res.json;
    const originalSend = res.send;

    res.json = function(data) {
      const duration = Date.now() - startTime;
      const statusColor = res.statusCode >= 400 ? '❌' : res.statusCode >= 300 ? '⚠️' : '✓';
      console.log(`${statusColor} [${timestamp}] ${req.method.padEnd(6)} ${req.path.padEnd(35)} ${res.statusCode} ${duration}ms - IP: ${cleanIP}`);
      return originalJson.call(this, data);
    };

    res.send = function(data) {
      const duration = Date.now() - startTime;
      const statusColor = res.statusCode >= 400 ? '❌' : res.statusCode >= 300 ? '⚠️' : '✓';
      console.log(`${statusColor} [${timestamp}] ${req.method.padEnd(6)} ${req.path.padEnd(35)} ${res.statusCode} ${duration}ms - IP: ${cleanIP}`);
      return originalSend.call(this, data);
    };
  }

  next();
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware to handle missing image files gracefully
app.use('/uploads/products/:filename', async (req, res, next) => {
  const fs = require('fs').promises;
  const filePath = path.join(__dirname, '../uploads/products', req.params.filename);

  try {
    await fs.access(filePath);
    // File exists, it was already served by express.static above
    // This middleware only runs if static middleware didn't find it
  } catch (error) {
    // File doesn't exist, log warning and return 404
    console.warn(`⚠️  Missing product image: ${req.params.filename}`);
    res.status(404).json({
      error: 'Image not found',
      message: 'The requested product image does not exist',
      filename: req.params.filename
    });
  }
});

// Import route factories
const createAuthRoutes = require('./routes/auth');
const createProductRoutes = require('./routes/products');
const createSalesRoutes = require('./routes/sales');
const createCustomerRoutes = require('./routes/customers');
const createUserRoutes = require('./routes/users');
const createReportRoutes = require('./routes/reports');
const createSettingRoutes = require('./routes/settings');

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'POS API is running' });
});

// Start server only after database is initialized
const PORT = process.env.PORT || 5000;

// Wait for database initialization before starting server
if (db.dbInitialized) {
  db.dbInitialized.then(() => {
    // Initialize DI container after database is ready
    const container = setupContainer(db);
    app.set('container', container);
    console.log('✓ DI container initialized');

    // Setup API routes with container
    app.use('/api/auth', createAuthRoutes(container));
    app.use('/api/products', createProductRoutes(container));
    app.use('/api/sales', createSalesRoutes(container));
    app.use('/api/customers', createCustomerRoutes(container));
    app.use('/api/users', createUserRoutes(container));
    app.use('/api/reports', createReportRoutes(container));
    app.use('/api/settings', createSettingRoutes(container));

    // Error handling middleware (must be after routes)
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
      });
    });

    // 404 handler - only return error for API requests (must be last)
    app.use((req, res) => {
      if (req.path.startsWith('/api')) {
        res.status(404).json({ error: 'API Route not found' });
      } else {
        // For non-API routes, don't respond (let frontend handle routing)
        res.status(404).send('Not found');
      }
    });

    app.listen(PORT, () => {
      // Get local IP address
      const interfaces = os.networkInterfaces();
      let localIP = 'localhost';

      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          // Skip internal and non-IPv4 addresses
          if (iface.family === 'IPv4' && !iface.internal) {
            localIP = iface.address;
            break;
          }
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('🚀 POS API SERVER STARTED');
      console.log('='.repeat(60));
      console.log(`Local:        http://localhost:${PORT}`);
      console.log(`Network:      http://${localIP}:${PORT}`);
      console.log(`API Base:     http://localhost:${PORT}/api`);
      console.log(`API Network:  http://${localIP}:${PORT}/api`);
      console.log('='.repeat(60) + '\n');
    });
  }).catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
} else {
  // Fallback if dbInitialized is not available
  app.listen(PORT, () => {
    console.log(`POS API running on port ${PORT}`);
  });
}

module.exports = app;

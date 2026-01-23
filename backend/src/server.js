require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');

// Initialize database
require('./models/initDb');

const app = express();

// Middleware
// Configure CORS for both development and production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3002',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// Import routes
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const customersRoutes = require('./routes/customers');
const usersRoutes = require('./routes/users');
const reportsRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'POS API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler - only return error for API requests
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API Route not found' });
  } else {
    // For non-API routes, don't respond (let frontend handle routing)
    res.status(404).send('Not found');
  }
});

// Start server
const PORT = process.env.PORT || 5000;
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

module.exports = app;

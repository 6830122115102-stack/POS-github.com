# POS (Point of Sale) System

A modern, full-featured Point of Sale web application built with React and Node.js/Express, designed to run locally on Windows.

## 📋 Features

### Core Modules

- **Sales & Billing**
  - Shopping cart with real-time updates
  - Tax and discount calculations
  - Multiple payment methods (Cash, Card, Mobile)
  - Invoice generation and printing (PDF)

- **Inventory Management**
  - Product CRUD operations
  - Stock control and tracking
  - Low stock alerts
  - Product images upload and display
  - Category management

- **Customer Management**
  - Customer database with contact info
  - Purchase history tracking
  - Visit count and total purchases

- **User & Role Management**
  - Three roles: Admin, Manager, Cashier
  - Role-based access control
  - User account management

- **Reports & Analytics**
  - Dashboard with key metrics
  - Daily/Monthly sales reports
  - Top selling products
  - Export to CSV/PDF

## 🛠️ Technical Stack

### Backend
- **Framework:** Node.js with Express.js
- **Database:** SQLite (local file-based)
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer
- **PDF Generation:** PDFKit

### Frontend
- **Framework:** React.js 18 with Hooks
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **HTTP Client:** Axios

## 📁 Project Structure

```
POS/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Business logic
│   │   ├── middleware/        # Auth middleware
│   │   ├── models/           # Database models & init
│   │   ├── routes/           # API routes
│   │   └── server.js         # Entry point
│   ├── database/             # SQLite database file
│   ├── uploads/              # Uploaded product images
│   ├── .env                  # Environment variables
│   └── package.json
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/       # Reusable components
    │   ├── context/          # React Context (Auth)
    │   ├── pages/            # Page components
    │   ├── services/         # API service layer
    │   ├── utils/            # Utility functions
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

### Step 1: Install Backend Dependencies

Open Command Prompt or PowerShell in the project directory:

```bash
cd backend
npm install
```

### Step 2: Initialize Database

This will create the SQLite database with tables and seed data:

```bash
npm run init-db
```

You should see:
- ✅ Database tables created
- ✅ Default admin user created (username: `admin`, password: `admin123`)
- ✅ Sample products created (Espresso, Cappuccino, Chocolate Cake)

### Step 3: Start Backend Server

```bash
npm start
```

The backend will run on `http://localhost:5000`

For development with auto-reload:
```bash
npm run dev
```

### Step 4: Install Frontend Dependencies

Open a **new** Command Prompt/PowerShell window:

```bash
cd frontend
npm install
```

### Step 5: Start Frontend Application

```bash
npm start
```

The app will open automatically at `http://localhost:3000`

## 🔐 Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |

After logging in, you can create additional users from the Users page (Admin only).

## 📝 User Roles & Permissions

### Admin
- Full access to all features
- User management
- All CRUD operations
- Export reports

### Manager
- Product management
- Customer management
- View reports
- Export reports
- Cannot manage users

### Cashier
- Create sales
- View products
- View customers
- View basic reports
- Cannot edit products or customers

## 🎯 How to Use

### Making a Sale (POS)

1. Click **Point of Sale** in the sidebar
2. Search and click products to add to cart
3. Optionally select a customer
4. Adjust quantities using +/- buttons
5. Add discount if needed
6. Select payment method
7. Click **Complete Sale**
8. Print invoice (PDF) when prompted

### Managing Products

1. Go to **Products** page
2. Click **Add Product** button
3. Fill in product details:
   - Name, Category, Price
   - Stock quantity
   - Upload product image (optional)
   - Low stock threshold
4. Click **Create**

### Viewing Reports

1. Go to **Reports** page
2. Select date range
3. View sales summary and top products
4. Export to CSV or PDF as needed

## 🖼️ Product Images

- Product images are stored in `backend/uploads/products/`
- Supported formats: JPG, PNG, GIF
- Maximum size: 5MB
- Images are displayed in the POS and Products pages

## 💾 Database Schema

### Main Tables

- **users** - User accounts and authentication
- **products** - Product inventory
- **customers** - Customer information
- **sales** - Transaction records
- **sale_items** - Individual items in each sale
- **stock_movements** - Inventory tracking

## 🔧 Configuration

### Backend (.env file)

```env
PORT=5000
JWT_SECRET=your-secret-key-change-this-in-production-2024
JWT_EXPIRE=7d
NODE_ENV=development
```

### Frontend

Edit `frontend/src/services/api.js` to change API URL if needed:

```javascript
baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create sale
- `GET /api/sales/:id/invoice` - Generate invoice PDF

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user

### Reports
- `GET /api/reports/dashboard` - Dashboard stats
- `GET /api/reports/sales-summary` - Sales summary
- `GET /api/reports/top-products` - Top products
- `GET /api/reports/export/csv` - Export CSV
- `GET /api/reports/export/pdf` - Export PDF

## 🐛 Troubleshooting

### Backend won't start
- Ensure port 5000 is not in use
- Check Node.js is installed: `node --version`
- Delete `node_modules` and run `npm install` again

### Frontend won't start
- Ensure port 3000 is not in use
- Check backend is running on port 5000
- Clear browser cache

### Database errors
- Delete `backend/database/pos.db` and run `npm run init-db` again

### Images not showing
- Check `backend/uploads/products/` folder exists
- Ensure backend is running when uploading images

## 🔄 Backup & Restore

### Backup Database
Simply copy the file:
```
backend/database/pos.db
```

### Backup Images
Copy the folder:
```
backend/uploads/products/
```

## 🚀 Production Deployment

For production use:

1. Change JWT_SECRET in `.env`
2. Set NODE_ENV=production
3. Build frontend: `cd frontend && npm run build`
4. Serve frontend build folder with backend
5. Use a process manager like PM2

## 📄 License

This project is provided as-is for educational and commercial use.

## 🤝 Support

For issues or questions:
- Check the troubleshooting section
- Review the code comments
- Check browser console for errors

## ✨ Credits

Built with modern web technologies and best practices for a local POS solution.

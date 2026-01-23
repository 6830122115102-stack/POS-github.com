# POS System - Use Case Diagrams

## Overview
This document describes all use cases for the Point of Sale (POS) system, organized by feature with detailed diagrams and descriptions.

---

## 1. Authentication & User Management

### Use Case Diagram: Authentication System

```
                          ┌─────────────────┐
                          │   User System   │
                          └─────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                ┌───▼────┐   ┌────▼───┐   ┌───▼────┐
                │  Admin │   │Manager │   │Cashier │
                └────┬───┘   └───┬────┘   └───┬────┘
                     │           │            │
        ┌────────────┴───────────┴────────────┘
        │
        ├─── Login
        │
        ├─── Logout
        │
        ├─── View Profile
        │
        └─── Manage Session (Tab-specific)


Admin-Specific Use Cases:
├─── Create User
├─── Edit User
├─── Delete User
├─── View All Users
├─── Manage Settings
└─── Access All Features

Manager-Specific Use Cases:
├─── View Users (Read-only)
├─── View Products
├─── View Customers
├─── View Sales Reports
└─── Process Sales

Cashier-Specific Use Cases:
├─── Process Sales
├─── View Products
├─── View Customers
└─── Print Invoices
```

### Use Case Details: Authentication

| Use Case | Actor | Precondition | Main Flow | Postcondition |
|----------|-------|--------------|-----------|---------------|
| **Login** | All Users | User not logged in | 1. Enter username & password<br/>2. System validates credentials<br/>3. System creates session token<br/>4. User redirected to dashboard | User logged in, token stored in sessionStorage |
| **Logout** | All Users | User logged in | 1. User clicks logout<br/>2. System removes session token<br/>3. User redirected to login page | User logged out, sessionStorage cleared |
| **Tab-Specific Session** | All Users | Multiple tabs open | 1. Login in Tab 1<br/>2. Open new Tab 2<br/>3. Tab 2 requires separate login | Each tab has independent session |

---

## 2. User Management

### Use Case Diagram: User Management (Admin Only)

```
                          ┌──────────────────┐
                          │   Admin Portal   │
                          └─────────┬────────┘
                                    │
                          ┌─────────┴──────────┐
                          │  User Management   │
                          └─────────┬──────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                ┌───▼────┐      ┌───▼───┐      ┌──▼───┐
                │ Create │      │ Edit  │      │Delete│
                │ User   │      │ User  │      │User  │
                └────────┘      └───┬───┘      └──────┘
                    │               │
                    └───────┬───────┘
                            │
                        ┌───▼─────┐
                        │View List │
                        └──────────┘
```

### Use Case Details: User Management

| Use Case | Precondition | Main Flow | Postcondition |
|----------|--------------|-----------|---------------|
| **Create User** | Admin logged in, Users page open | 1. Admin clicks "Add New User"<br/>2. Fills form: Full Name, Username, Password, Role<br/>3. Clicks Create<br/>4. System validates & saves to DB | New user created, notification shown |
| **Edit User** | Admin logged in, Users page open | 1. Admin clicks Edit on user row<br/>2. Modal opens with current data<br/>3. Updates fields (except password)<br/>4. Clicks Update | User data updated in DB |
| **Delete User** | Admin logged in, Users page open | 1. Admin clicks Delete on user row<br/>2. Confirmation modal appears<br/>3. Admin confirms deletion<br/>4. System removes user from DB | User deleted, list refreshed |
| **View All Users** | Admin logged in | 1. Navigate to Users page<br/>2. System fetches all users from DB<br/>3. Display in table: Name, Username, Role | User list displayed with actions |

---

## 3. Product Management

### Use Case Diagram: Product Management

```
                          ┌──────────────────┐
                          │ Product Module   │
                          └─────────┬────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                ┌───▼────┐      ┌───▼───┐      ┌──▼───┐
                │ Create │      │ Edit  │      │Delete│
                │Product │      │Product│      │Product
                └────────┘      └───┬───┘      └──────┘
                    │               │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    ┌───▼──┐            ┌───▼────┐        ┌────▼──┐
    │ View │            │Manage  │        │Search │
    │ List │            │ Stock  │        │Filter │
    └──────┘            └────────┘        └───────┘
```

### Use Case Details: Product Management

| Use Case | Precondition | Main Flow | Postcondition |
|----------|--------------|-----------|---------------|
| **Create Product** | Admin logged in, Products page open | 1. Click "Add Product"<br/>2. Fill: Name, Category, Price, Cost, Stock<br/>3. Click Save<br/>4. System validates & saves | Product added to inventory |
| **Edit Product** | Product exists in DB | 1. Click Edit on product row<br/>2. Update fields<br/>3. Click Update<br/>4. System saves changes | Product data updated |
| **Delete Product** | Product exists, not in active sales | 1. Click Delete<br/>2. Confirm deletion<br/>3. System removes product | Product removed from inventory |
| **View Products** | User logged in | 1. Navigate to Products page<br/>2. System loads all products<br/>3. Display: Name, Category, Price, Stock | Product list displayed |
| **Search/Filter Products** | Products page open | 1. Enter search term or select category<br/>2. System filters products<br/>3. Display matching results | Filtered product list shown |
| **Manage Stock** | Product exists | 1. View product details<br/>2. Update stock quantity<br/>3. System tracks movement<br/>4. Save changes | Stock updated, movement logged |

---

## 4. Customer Management

### Use Case Diagram: Customer Management

```
                          ┌──────────────────┐
                          │Customer Module   │
                          └─────────┬────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                ┌───▼────┐      ┌───▼───┐      ┌──▼───┐
                │ Create │      │ Edit  │      │Delete│
                │Customer│      │Customer│     │Customer
                └────────┘      └───┬───┘      └──────┘
                    │               │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    ┌───▼──┐            ┌───▼────┐        ┌────▼──┐
    │ View │            │Search/ │        │View   │
    │ List │            │ Auto   │        │Purchase
    └──────┘            │complete│        │History
                        └────────┘        └───────┘
```

### Use Case Details: Customer Management

| Use Case | Precondition | Main Flow | Postcondition |
|----------|--------------|-----------|---------------|
| **Create Customer** | Customers page open | 1. Click "Add Customer"<br/>2. Fill: Full Name, Phone (optional)<br/>3. Click Save<br/>4. System saves to DB | New customer created |
| **Edit Customer** | Customer exists | 1. Click Edit on customer row<br/>2. Update fields<br/>3. Click Update | Customer info updated |
| **Delete Customer** | Customer exists | 1. Click Delete<br/>2. Confirm deletion<br/>3. System removes customer | Customer deleted |
| **View Customers** | User logged in | 1. Navigate to Customers page<br/>2. System loads all customers<br/>3. Display list with details | Customer list displayed |
| **Search/Autocomplete** | POS page open, customer field active | 1. Start typing customer name<br/>2. System shows matching customers<br/>3. Select customer from list | Customer selected for sale |
| **View Purchase History** | Customer selected | 1. Click on customer<br/>2. View all purchases by customer<br/>3. Display total spent, visit count | Customer history displayed |

---

## 5. Point of Sale (POS)

### Use Case Diagram: Point of Sale System

```
                          ┌──────────────────┐
                          │  POS System      │
                          └─────────┬────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
    ┌───▼──────┐              ┌─────▼──────┐           ┌────────▼───┐
    │ Create   │              │ Manage     │           │ Payment &  │
    │ Sale     │              │ Cart       │           │ Checkout  │
    └────┬─────┘              └─────┬──────┘           └────────┬───┘
         │                          │                          │
         │      ┌───────────────────┼──────────────────┐      │
         │      │                   │                  │      │
    ┌────▼──┐ ┌─▼──┐          ┌─────▼──┐        ┌─────▼─┐  ┌─▼────┐
    │Select │ │Add │          │ Update │        │Remove │  │Apply │
    │Product│ │Item│          │Quantity│        │ Item  │  │Tax   │
    └───────┘ └────┘          └────────┘        └───────┘  └──────┘
                   │
                   │
        ┌──────────▼──────────┐
        │    Print Invoice    │
        └─────────────────────┘
```

### Use Case Details: Point of Sale

| Use Case | Precondition | Main Flow | Postcondition |
|----------|--------------|-----------|---------------|
| **Create Sale** | Cashier logged in, POS page open | 1. Select customer (optional)<br/>2. Add products to cart<br/>3. System calculates subtotal<br/>4. Apply tax<br/>5. Process payment<br/>6. Create invoice | Sale recorded in DB |
| **Add Product to Cart** | Sale started | 1. Search/select product<br/>2. Enter quantity<br/>3. Click Add<br/>4. Product added to cart<br/>5. Subtotal updated | Product in cart |
| **Update Quantity** | Product in cart | 1. Modify quantity value<br/>2. System recalculates total<br/>3. Updates cart display | Cart total updated |
| **Remove Item** | Product in cart | 1. Click Remove on item<br/>2. System removes product<br/>3. Recalculates total | Product removed from cart |
| **Apply Tax** | Products in cart | 1. System reads tax rate from settings<br/>2. Calculates tax amount<br/>3. Displays tax in invoice<br/>4. Adds to total | Tax calculated and added |
| **Process Payment** | Cart has items, tax applied | 1. Display total amount<br/>2. Select payment method<br/>3. Process payment<br/>4. System validates<br/>5. Confirm payment | Payment recorded |
| **Print Invoice** | Sale completed, payment processed | 1. Generate invoice PDF<br/>2. Display print dialog<br/>3. Print invoice<br/>4. Save receipt copy | Invoice printed/saved |

---

## 6. Settings Management

### Use Case Diagram: Settings Management (Admin Only)

```
                          ┌──────────────────┐
                          │ Settings Module  │
                          └─────────┬────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
    ┌───▼──────────┐          ┌─────▼──────┐           ┌────────▼───┐
    │Tax Settings  │          │ Product    │           │ Default    │
    │              │          │ Categories │           │ Settings   │
    └───┬──────────┘          └─────┬──────┘           └────────┬───┘
        │                          │                          │
    ┌───▼─────┐            ┌──────▼────┐           ┌──────────▼───┐
    │ Set Tax │            │ Add/Remove│           │ Configure    │
    │ Rate %  │            │ Category  │           │ System       │
    └─────────┘            └───────────┘           └──────────────┘
```

### Use Case Details: Settings Management

| Use Case | Precondition | Main Flow | Postcondition |
|----------|--------------|-----------|---------------|
| **Set Tax Rate** | Admin logged in, Settings page open | 1. Navigate to Tax Settings<br/>2. Enter tax rate percentage<br/>3. Click Save<br/>4. System validates & stores | Tax rate updated globally |
| **Manage Categories** | Settings page open | 1. View product categories<br/>2. Add new category or remove existing<br/>3. Click Save<br/>4. System updates product filters | Categories updated |
| **View Settings** | Admin logged in | 1. Navigate to Settings page<br/>2. System loads all settings from DB<br/>3. Display current values | Settings displayed |
| **Update Settings** | Settings page open | 1. Modify setting values<br/>2. Click Save<br/>3. System validates & updates DB<br/>4. Notify success | Settings persisted |

---

## 7. Reports & Analytics

### Use Case Diagram: Reporting System

```
                          ┌──────────────────┐
                          │ Reports Module   │
                          └─────────┬────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
    ┌───▼──────┐              ┌─────▼──────┐           ┌────────▼───┐
    │Sales     │              │ Inventory  │           │ Customer   │
    │Report    │              │ Report     │           │ Report     │
    └────┬─────┘              └─────┬──────┘           └────────┬───┘
         │                          │                          │
    ┌────▼──────┐            ┌──────▼─────┐          ┌─────────▼───┐
    │View By    │            │Stock Level │          │Top Customer │
    │Date Range │            │By Product  │          │By Purchase  │
    └───────────┘            └────────────┘          └─────────────┘
```

### Use Case Details: Reports & Analytics

| Use Case | Precondition | Main Flow | Postcondition |
|----------|--------------|-----------|---------------|
| **Sales Report** | Manager/Admin logged in, Reports section | 1. Select date range<br/>2. System queries sales from DB<br/>3. Calculate totals & breakdown<br/>4. Display in table/chart | Sales data displayed |
| **Inventory Report** | Reports section open | 1. View all products<br/>2. Display: Stock levels, low stock items<br/>3. Highlight items below threshold<br/>4. Show value of inventory | Inventory status shown |
| **Customer Report** | Reports section open | 1. Display all customers<br/>2. Show: Total purchases, visit count<br/>3. Sort by purchase value<br/>4. Identify top customers | Customer metrics displayed |

---

## 8. Data Flow Diagrams

### Sale Transaction Flow

```
┌─────────────┐
│   Cashier   │
└──────┬──────┘
       │
       ├─ Selects Customer (optional)
       │
       ├─ Searches Products (autocomplete)
       │
       ├─ Adds to Cart
       │
       ├─ Updates Quantities
       │
       ├─ Reviews Invoice
       │  ├─ Subtotal
       │  ├─ Tax (from Settings)
       │  └─ Total
       │
       ├─ Processes Payment
       │
       ├─ Creates Sale Record (DB)
       │  └─ Updates customer total_purchases
       │  └─ Updates customer visit_count
       │  └─ Updates product stock
       │  └─ Logs stock_movements
       │
       └─ Prints Invoice (PDF)
           └─ Displays/Downloads receipt
```

### User Authentication Flow

```
┌─────────────┐
│ New Session │
└──────┬──────┘
       │
       ├─ User enters Username & Password
       │
       ├─ System validates against users table
       │  ├─ Check if user exists
       │  ├─ Verify password hash (bcryptjs)
       │  └─ Check if user is active
       │
       ├─ If valid:
       │  ├─ Generate authentication token
       │  ├─ Store in sessionStorage (tab-specific)
       │  ├─ Store user data (name, role)
       │  └─ Redirect to Dashboard
       │
       └─ If invalid:
           └─ Show error message
               └─ Remain on login page
```

---

## 9. Actor Definitions

| Actor | Role | Responsibilities |
|-------|------|------------------|
| **Admin** | System Administrator | User management, Settings, Full system access |
| **Manager** | Store Manager | Sales monitoring, Product management (read), Reports |
| **Cashier** | Point of Sale Operator | Process sales, View products & customers, Print invoices |
| **System** | Backend Server | Validate data, Manage database, Calculate taxes, Generate tokens |
| **Database** | SQLite | Persist all data, Handle queries, Maintain relationships |

---

## 10. Key Business Rules

1. **Authentication**
   - Each tab/window requires separate login (sessionStorage)
   - Passwords must be hashed using bcryptjs
   - Token required for all API requests (except login)

2. **Sales Processing**
   - Tax calculation: (Subtotal × Tax Rate) / 100
   - Quantity cannot be negative
   - Stock reduced when sale completes
   - Customer purchase history updated automatically

3. **Product Management**
   - SKU must be unique
   - Price must be greater than cost
   - Low stock threshold alerts when stock < threshold
   - Category must match predefined list from Settings

4. **User Management**
   - Username must be unique
   - Only admin can create/edit/delete users
   - Users must have valid role: admin, manager, or cashier
   - Password required for new users, optional for edits

5. **Settings**
   - Tax rate applies globally to all sales
   - Product categories are predefined in settings
   - Settings changes apply immediately to new transactions

---

## 11. Technology Integration Points

```
Frontend (React)
│
├─ API Calls (Axios)
│  ├─ GET /api/users
│  ├─ POST /api/users
│  ├─ PUT /api/users/:id
│  ├─ DELETE /api/users/:id
│  ├─ GET /api/products
│  ├─ POST /api/products
│  ├─ GET /api/customers
│  ├─ POST /api/sales
│  └─ GET /api/settings
│
├─ Authentication (sessionStorage)
│  └─ Stores token & user data per tab
│
└─ UI Components
   ├─ Forms (Create/Edit)
   ├─ Tables (List views)
   ├─ Modals (Confirmations)
   ├─ Toast Notifications
   └─ PDF Generator (jsPDF)

Backend (Express.js + SQLite)
│
├─ Routes
│  ├─ /auth (login, logout)
│  ├─ /users (CRUD)
│  ├─ /products (CRUD)
│  ├─ /customers (CRUD)
│  ├─ /sales (create, view)
│  └─ /settings (read, update)
│
├─ Controllers
│  └─ Business logic for each route
│
├─ Database (SQLite)
│  ├─ users
│  ├─ products
│  ├─ customers
│  ├─ sales
│  ├─ sale_items
│  ├─ stock_movements
│  └─ settings
│
└─ Middleware
   ├─ Authentication (token validation)
   ├─ CORS
   └─ Body parser
```

---

## 12. Error Handling Use Cases

| Error Scenario | Handling |
|---|---|
| **Invalid Login** | Show error toast, remain on login page |
| **Duplicate Username** | Display validation error in form |
| **Insufficient Stock** | Block quantity input, show warning |
| **Session Expired** | Redirect to login, clear sessionStorage |
| **Network Error** | Show error toast, allow retry |
| **Database Constraint** | Show user-friendly error message |
| **Permission Denied** | Show error message, redirect to dashboard |

---

## 13. System Sequence Diagrams

### Create User Sequence

```
Admin           Frontend        Backend         Database
  │                │              │                │
  ├─ Click Add New─>│              │                │
  │                 │              │                │
  ├─ Fill Form      │              │                │
  │ (Full Name,     │              │                │
  │  Username,      │              │                │
  │  Password,      │              │                │
  │  Role)          │              │                │
  │                 │              │                │
  ├─ Click Create ──>│              │                │
  │                 ├─ POST /api/users────────>│    │
  │                 │                         ├─ Hash Password
  │                 │                         │
  │                 │                         ├─ Validate Unique
  │                 │                         │
  │                 │                         ├─ INSERT into users
  │                 │                         │
  │                 │<──── 201 Created ───────┤
  │                 │                         │
  │<─ Toast Success ├                         │
  │                 │                         │
  └─ Refresh List ──>│
```

### Point of Sale Sequence

```
Cashier          Frontend        Backend         Database
  │                │              │                │
  ├─ Select Customer──>│           │                │
  │                   │           │                │
  ├─ Add Product ────>│           │                │
  │ (multiple)        │           │                │
  │                   │           │                │
  ├─ Review Cart     │           │                │
  │                   │           │                │
  ├─ Click Checkout ─>│           │                │
  │                   ├─ POST /api/sales─────>│    │
  │                   │   (cart data)        ├─ Create sale record
  │                   │                      │
  │                   │                      ├─ Create sale_items
  │                   │                      │
  │                   │                      ├─ Update product stock
  │                   │                      │
  │                   │                      ├─ Log stock_movements
  │                   │                      │
  │                   │                      ├─ Update customer history
  │                   │                      │
  │                   │<─── 200 OK ─────────┤
  │                   │ (invoice data)      │
  │                   │                     │
  │<─ Show Invoice ───┤                     │
  │                   │                     │
  ├─ Click Print ────>│                     │
  │                   ├─ Generate PDF       │
  │<─ PDF Download ───┤                     │
  │                   │                     │
  └─ Print/Save      │                     │
```

---

## 14. Summary

This POS system implements a comprehensive set of use cases covering:

- ✅ **User Authentication** - Tab-specific sessions with role-based access
- ✅ **User Management** - Full CRUD for admin users
- ✅ **Product Management** - Inventory tracking with categories
- ✅ **Customer Management** - CRM features with purchase history
- ✅ **Point of Sale** - Complete transaction processing with tax calculation
- ✅ **Settings** - System configuration (tax rate, categories)
- ✅ **Reports** - Sales, inventory, and customer analytics
- ✅ **Error Handling** - Graceful error management with user feedback

All features are integrated with a SQLite database and follow REST API architectural patterns.

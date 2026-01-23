/**
 * Script to completely reset the POS system
 * - Deletes all data from all tables
 * - Removes all uploaded files
 * - Keeps only the system admin user
 * - Creates fresh database schema
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../database/pos.db');
const uploadsPath = path.join(__dirname, '../../uploads');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
});

const run = (sql) => {
  return new Promise((resolve, reject) => {
    db.run(sql, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

async function resetSystem() {
  try {
    console.log('🔄 Starting system reset...\n');

    // Step 1: Get current counts
    console.log('📊 Current data counts:');
    const users = (await get('SELECT COUNT(*) as count FROM users'))?.count || 0;
    const products = (await get('SELECT COUNT(*) as count FROM products'))?.count || 0;
    const customers = (await get('SELECT COUNT(*) as count FROM customers'))?.count || 0;
    const sales = (await get('SELECT COUNT(*) as count FROM sales'))?.count || 0;
    const saleItems = (await get('SELECT COUNT(*) as count FROM sale_items'))?.count || 0;
    const stockMovements = (await get('SELECT COUNT(*) as count FROM stock_movements'))?.count || 0;

    console.log(`   Users:           ${users}`);
    console.log(`   Products:        ${products}`);
    console.log(`   Customers:       ${customers}`);
    console.log(`   Sales:           ${sales}`);
    console.log(`   Sale Items:      ${saleItems}`);
    console.log(`   Stock Movements: ${stockMovements}`);

    // Step 2: Delete all data (respecting foreign key constraints)
    console.log('\n🗑️  Deleting all data...');

    // Delete in order of dependencies
    await run('DELETE FROM sale_items');
    console.log('   ✅ Deleted sale_items');

    await run('DELETE FROM sales');
    console.log('   ✅ Deleted sales');

    await run('DELETE FROM stock_movements');
    console.log('   ✅ Deleted stock_movements');

    await run('DELETE FROM products');
    console.log('   ✅ Deleted products');

    await run('DELETE FROM customers');
    console.log('   ✅ Deleted customers');

    // Keep only admin user
    await run('DELETE FROM users WHERE role != "admin"');
    console.log('   ✅ Deleted non-admin users');

    // Step 3: Delete uploaded files
    console.log('\n📁 Cleaning up uploaded files...');
    const productsUploadPath = path.join(uploadsPath, 'products');
    if (fs.existsSync(productsUploadPath)) {
      const files = fs.readdirSync(productsUploadPath);
      files.forEach(file => {
        fs.unlinkSync(path.join(productsUploadPath, file));
      });
      console.log(`   ✅ Deleted ${files.length} product images`);
    } else {
      console.log('   ℹ️  Products upload directory does not exist');
    }

    // Step 4: Verify cleanup
    console.log('\n✅ Verification:');
    const finalUsers = (await get('SELECT COUNT(*) as count FROM users'))?.count || 0;
    const finalProducts = (await get('SELECT COUNT(*) as count FROM products'))?.count || 0;
    const finalCustomers = (await get('SELECT COUNT(*) as count FROM customers'))?.count || 0;
    const finalSales = (await get('SELECT COUNT(*) as count FROM sales'))?.count || 0;
    const finalSaleItems = (await get('SELECT COUNT(*) as count FROM sale_items'))?.count || 0;
    const finalStockMovements = (await get('SELECT COUNT(*) as count FROM stock_movements'))?.count || 0;

    console.log(`   Users:           ${finalUsers} (Admin only)`);
    console.log(`   Products:        ${finalProducts}`);
    console.log(`   Customers:       ${finalCustomers}`);
    console.log(`   Sales:           ${finalSales}`);
    console.log(`   Sale Items:      ${finalSaleItems}`);
    console.log(`   Stock Movements: ${finalStockMovements}`);

    // Get admin details
    const admin = await get('SELECT id, username, full_name FROM users LIMIT 1');
    console.log('\n👤 Admin user preserved:');
    console.log(`   Username: ${admin.username}`);
    console.log(`   Full Name: ${admin.full_name}`);

    console.log('\n✨ System reset completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Deleted ${users - 1} user records`);
    console.log(`   - Deleted ${products} product records`);
    console.log(`   - Deleted ${customers} customer records`);
    console.log(`   - Deleted ${sales} sale records`);
    console.log(`   - Deleted uploaded files`);
    console.log(`   - Preserved admin user\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during reset:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

resetSystem();

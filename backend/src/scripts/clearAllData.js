/**
 * Script to clear all data from the POS system
 * Keeps only the system admin user
 * Deletes: Products, Customers, Sales, Users (except admin)
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database/pos.db');

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

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

async function clearAllData() {
  try {
    console.log('🗑️  Starting data cleanup...\n');

    // Get admin user ID (first user - system admin)
    const adminUser = await get('SELECT id FROM users WHERE role = ? ORDER BY id ASC LIMIT 1', ['admin']);

    if (!adminUser) {
      console.error('❌ No admin user found!');
      process.exit(1);
    }

    console.log(`✅ Found admin user with ID: ${adminUser.id}`);

    // Count before deletion
    const countsBefore = {
      users: (await get('SELECT COUNT(*) as count FROM users'))?.count || 0,
      products: (await get('SELECT COUNT(*) as count FROM products'))?.count || 0,
      customers: (await get('SELECT COUNT(*) as count FROM customers'))?.count || 0,
      sales: (await get('SELECT COUNT(*) as count FROM sales'))?.count || 0,
    };

    console.log('\n📊 Data before cleanup:');
    console.log(`   Users:     ${countsBefore.users}`);
    console.log(`   Products:  ${countsBefore.products}`);
    console.log(`   Customers: ${countsBefore.customers}`);
    console.log(`   Sales:     ${countsBefore.sales}`);

    // Delete in order (respect foreign key constraints)
    console.log('\n🔄 Deleting data...');

    // Delete sales
    if (countsBefore.sales > 0) {
      const result = await run('DELETE FROM sales');
      console.log(`   ✅ Deleted ${result.changes} sales records`);
    }

    // Delete sale items
    const result1 = await run('DELETE FROM sale_items');
    console.log(`   ✅ Deleted ${result1.changes} sale items records`);

    // Delete customers
    if (countsBefore.customers > 0) {
      const result = await run('DELETE FROM customers');
      console.log(`   ✅ Deleted ${result.changes} customer records`);
    }

    // Delete products
    if (countsBefore.products > 0) {
      const result = await run('DELETE FROM products');
      console.log(`   ✅ Deleted ${result.changes} product records`);
    }

    // Delete all users except admin
    if (countsBefore.users > 1) {
      const result = await run(`DELETE FROM users WHERE id != ?`, [adminUser.id]);
      console.log(`   ✅ Deleted ${result.changes} user records (kept admin)`);
    }

    // Verify cleanup
    const countsAfter = {
      users: (await get('SELECT COUNT(*) as count FROM users'))?.count || 0,
      products: (await get('SELECT COUNT(*) as count FROM products'))?.count || 0,
      customers: (await get('SELECT COUNT(*) as count FROM customers'))?.count || 0,
      sales: (await get('SELECT COUNT(*) as count FROM sales'))?.count || 0,
    };

    console.log('\n📊 Data after cleanup:');
    console.log(`   Users:     ${countsAfter.users} (${countsAfter.users === 1 ? '✅ only admin' : '⚠️  ' + countsAfter.users})`);
    console.log(`   Products:  ${countsAfter.products} ${countsAfter.products === 0 ? '✅' : ''}`);
    console.log(`   Customers: ${countsAfter.customers} ${countsAfter.customers === 0 ? '✅' : ''}`);
    console.log(`   Sales:     ${countsAfter.sales} ${countsAfter.sales === 0 ? '✅' : ''}`);

    console.log('\n✨ Cleanup completed successfully!');
    console.log(`\n📝 Summary:`);
    console.log(`   - Deleted ${countsBefore.users - 1} users`);
    console.log(`   - Deleted ${countsBefore.products} products`);
    console.log(`   - Deleted ${countsBefore.customers} customers`);
    console.log(`   - Deleted ${countsBefore.sales} sales`);
    console.log(`   - Kept system admin user (ID: ${adminUser.id})`);

    // Verify admin user still exists
    const finalAdmin = await get('SELECT id, username, full_name, role FROM users WHERE id = ?', [adminUser.id]);
    console.log(`\n👤 Admin user preserved:`);
    console.log(`   Username: ${finalAdmin.username}`);
    console.log(`   Full Name: ${finalAdmin.full_name}`);
    console.log(`   Role: ${finalAdmin.role}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

clearAllData();

const { dbAsync } = require('../models/db');

async function fixProductData() {
  try {
    console.log('Starting product data fixes...\n');

    // 1. Fix "Esspresso" (misspelled) to "Espresso"
    console.log('1. Fixing misspelled "Esspresso"...');
    const esspresso = await dbAsync.get('SELECT id FROM products WHERE name = ?', ['Esspresso']);
    if (esspresso) {
      await dbAsync.run('UPDATE products SET name = ? WHERE id = ?', ['Espresso', esspresso.id]);
      console.log('   ✓ Renamed "Esspresso" to "Espresso"\n');
    }

    // 2. Fix "Matcha" pricing from ฿3,000 to realistic ฿45.00
    console.log('2. Fixing Matcha product pricing...');
    const matcha = await dbAsync.get('SELECT id, price FROM products WHERE name = ?', ['Matcha']);
    if (matcha && matcha.price > 1000) {
      await dbAsync.run('UPDATE products SET price = ? WHERE id = ?', [45.00, matcha.id]);
      console.log(`   ✓ Updated Matcha price from ฿${matcha.price} to ฿45.00\n`);
    }

    // 3. Fix inconsistent category naming ("Coffe" -> "Coffee")
    console.log('3. Fixing category naming (Coffe -> Coffee)...');
    const coffeeProducts = await dbAsync.all('SELECT id, name FROM products WHERE category = ?', ['Coffe']);
    if (coffeeProducts.length > 0) {
      await dbAsync.run('UPDATE products SET category = ? WHERE category = ?', ['Coffee', 'Coffe']);
      console.log(`   ✓ Fixed ${coffeeProducts.length} products from "Coffe" to "Coffee"\n`);
      coffeeProducts.forEach(p => console.log(`     - ${p.name}`));
      console.log();
    }

    // 4. Fix "macchiato" capitalization to "Macchiato"
    console.log('4. Fixing product name capitalization...');
    const macchiato = await dbAsync.get('SELECT id FROM products WHERE name = ?', ['macchiato']);
    if (macchiato) {
      await dbAsync.run('UPDATE products SET name = ? WHERE id = ?', ['Macchiato', macchiato.id]);
      console.log('   ✓ Renamed "macchiato" to "Macchiato"\n');
    }

    // 5. Remove duplicate products (keep only one of each)
    console.log('5. Checking for duplicate products...');
    const duplicates = await dbAsync.all(`
      SELECT name, COUNT(*) as count FROM products
      GROUP BY name HAVING count > 1
    `);

    if (duplicates.length > 0) {
      console.log('   Found duplicates:');
      for (const dup of duplicates) {
        console.log(`   - "${dup.name}" (${dup.count} copies)`);
        const products = await dbAsync.all('SELECT id FROM products WHERE name = ? ORDER BY id', [dup.name]);
        // Keep first, delete rest
        for (let i = 1; i < products.length; i++) {
          await dbAsync.run('DELETE FROM products WHERE id = ?', [products[i].id]);
          console.log(`     Deleted duplicate with ID ${products[i].id}`);
        }
      }
      console.log();
    } else {
      console.log('   ✓ No duplicates found\n');
    }

    // Summary
    console.log('6. Final product list:');
    const allProducts = await dbAsync.all('SELECT id, name, category, price FROM products ORDER BY name');
    allProducts.forEach(p => {
      console.log(`   - ${p.name} (${p.category}) - ฿${p.price.toFixed(2)}`);
    });

    console.log('\n✓ Product data fixes completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error fixing product data:', error);
    process.exit(1);
  }
}

fixProductData();

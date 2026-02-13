require('dotenv').config();
const path = require('path');
const fs = require('fs').promises;
const db = require('../src/models/initDb');

/**
 * Utility script to find products with missing image files
 * This helps identify orphaned database references
 */
async function checkMissingImages() {
  try {
    console.log('\n🔍 Checking for products with missing image files...\n');

    // Wait for database initialization
    if (db.dbInitialized) {
      await db.dbInitialized;
    }

    // Get all products with image paths
    const products = await new Promise((resolve, reject) => {
      db.all(
        'SELECT id, name, image_path FROM products WHERE image_path IS NOT NULL',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    console.log(`📊 Found ${products.length} products with image references\n`);

    const missingImages = [];
    const existingImages = [];

    // Check each image file
    for (const product of products) {
      const imagePath = path.join(__dirname, '../', product.image_path);

      try {
        await fs.access(imagePath);
        existingImages.push(product);
        console.log(`✓ ${product.id.toString().padStart(4)} | ${product.name.padEnd(30)} | ${product.image_path}`);
      } catch (error) {
        missingImages.push(product);
        console.log(`❌ ${product.id.toString().padStart(4)} | ${product.name.padEnd(30)} | ${product.image_path}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total products with images:  ${products.length}`);
    console.log(`✓ Existing images:           ${existingImages.length}`);
    console.log(`❌ Missing images:            ${missingImages.length}`);
    console.log('='.repeat(80));

    if (missingImages.length > 0) {
      console.log('\n⚠️  PRODUCTS WITH MISSING IMAGES:\n');
      missingImages.forEach(product => {
        console.log(`   ID: ${product.id}`);
        console.log(`   Name: ${product.name}`);
        console.log(`   Image Path: ${product.image_path}`);
        console.log(`   SQL to fix: UPDATE products SET image_path = NULL WHERE id = ${product.id};`);
        console.log('');
      });

      console.log('💡 RECOMMENDED ACTIONS:');
      console.log('   1. Review the products listed above');
      console.log('   2. Either upload the missing images OR');
      console.log('   3. Run the SQL commands to clear the image references\n');
    } else {
      console.log('\n✅ All product images exist!\n');
    }

    // Close database
    db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the check
checkMissingImages();

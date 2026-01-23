const { dbAsync } = require('../models/db');

async function deleteAllCustomers() {
  try {
    console.log('Starting customer deletion...\n');

    // Get total count before deletion
    const countBefore = await dbAsync.get('SELECT COUNT(*) as count FROM customers');
    console.log(`📊 Total customers before deletion: ${countBefore.count}\n`);

    if (countBefore.count === 0) {
      console.log('✓ No customers to delete.\n');
      process.exit(0);
    }

    // Delete all customers
    await dbAsync.run('DELETE FROM customers');
    console.log('✓ All customers deleted successfully\n');

    // Verify deletion
    const countAfter = await dbAsync.get('SELECT COUNT(*) as count FROM customers');
    console.log(`📊 Total customers after deletion: ${countAfter.count}\n`);

    console.log('✓ Customer deletion completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error deleting customers:', error);
    process.exit(1);
  }
}

deleteAllCustomers();

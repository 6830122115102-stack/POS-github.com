/**
 * CustomerService - Handles customer management
 */

class CustomerService {
  constructor(customerRepository, saleRepository) {
    this.customerRepository = customerRepository;
    this.saleRepository = saleRepository;
  }

  async getAllCustomers(search = null) {
    if (search) {
      return this.customerRepository.search(search);
    }
    return this.customerRepository.findAll();
  }

  async getCustomer(id) {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new Error(`Customer ${id} not found`);
    }
    return customer;
  }

  async createCustomer(data) {
    if (!data.name) {
      throw new Error('Customer name is required');
    }

    return this.customerRepository.create({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null
    });
  }

  async updateCustomer(id, data) {
    await this.getCustomer(id); // Verify exists

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;

    return this.customerRepository.update(id, updateData);
  }

  async deleteCustomer(id) {
    const customer = await this.getCustomer(id);

    // Check if customer has sales
    const sales = await this.saleRepository.findByCustomer(id);
    if (sales.length > 0) {
      throw new Error('Cannot delete customer with existing sales');
    }

    return this.customerRepository.delete(id);
  }

  async getCustomerHistory(id) {
    const customer = await this.getCustomer(id);
    const sales = await this.saleRepository.findByCustomer(id);

    return {
      customer: customer.toJSON(),
      sales: sales.map(s => s.toJSON()),
      total_purchases: customer.total_purchases,
      visit_count: customer.visit_count,
      loyalty_status: customer.getLoyaltyStatus()
    };
  }

  async searchCustomers(query) {
    return this.customerRepository.search(query);
  }

  async getFrequentCustomers() {
    return this.customerRepository.findFrequent();
  }
}

module.exports = CustomerService;

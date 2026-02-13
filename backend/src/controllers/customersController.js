class CustomerController {
  constructor(customerRepository, saleRepository) {
    this.customerRepository = customerRepository;
    this.saleRepository = saleRepository;
  }

  async getAllCustomers(req, res) {
    try {
      const { search } = req.query;
      let sql = 'SELECT * FROM customers WHERE 1=1';
      const params = [];

      if (search) {
        sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      sql += ' ORDER BY name ASC';

      const customers = await this.customerRepository.query(sql, params);
      res.json(customers);
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async getCustomer(req, res) {
    try {
      const customer = await this.customerRepository.findById(req.params.id);

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.json(customer);
    } catch (error) {
      console.error('Get customer error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async createCustomer(req, res) {
    try {
      const { name, email, phone, address } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Customer name is required' });
      }

      const customer = await this.customerRepository.create({
        name,
        email: email || null,
        phone: phone || null,
        address: address || null
      });

      res.status(201).json(customer);
    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  }

  async updateCustomer(req, res) {
    try {
      const { name, email, phone, address } = req.body;

      const customer = await this.customerRepository.findById(req.params.id);

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      await this.customerRepository.update(req.params.id, {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null
      });

      const updatedCustomer = await this.customerRepository.findById(req.params.id);

      res.json(updatedCustomer);
    } catch (error) {
      console.error('Update customer error:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  }

  async deleteCustomer(req, res) {
    try {
      const customer = await this.customerRepository.findById(req.params.id);

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const sales = await this.customerRepository.queryOne(
        'SELECT COUNT(*) as count FROM sales WHERE customer_id = ?',
        [req.params.id]
      );

      if (sales.count > 0) {
        return res.status(400).json({
          error: 'Cannot delete customer with existing sales records'
        });
      }

      await this.customerRepository.delete(req.params.id);

      res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) {
      console.error('Delete customer error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async getCustomerHistory(req, res) {
    try {
      const customer = await this.customerRepository.findById(req.params.id);

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const sales = await this.customerRepository.query(
        `SELECT s.*, u.full_name as cashier_name
         FROM sales s
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.customer_id = ?
         ORDER BY s.created_at DESC`,
        [req.params.id]
      );

      res.json({
        customer,
        sales
      });
    } catch (error) {
      console.error('Get customer history error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = CustomerController;

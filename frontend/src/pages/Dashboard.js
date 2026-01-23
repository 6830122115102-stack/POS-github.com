import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/format';
import { DollarSign, ShoppingBag, Users, Package, AlertTriangle, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await reportsAPI.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-primary-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Today's Sales",
      value: formatCurrency(stats?.today?.revenue || 0),
      subtitle: `${stats?.today?.sales_count || 0} transactions`,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-500',
    },
    {
      title: "Month's Revenue",
      value: formatCurrency(stats?.month?.revenue || 0),
      subtitle: `${stats?.month?.sales_count || 0} transactions`,
      icon: TrendingUp,
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-500',
    },
    {
      title: 'Total Customers',
      value: stats?.total_customers || 0,
      icon: Users,
      gradient: 'from-purple-500 to-pink-600',
      iconBg: 'bg-purple-500',
    },
    {
      title: 'Active Products',
      value: stats?.total_products || 0,
      icon: Package,
      gradient: 'from-orange-500 to-red-600',
      iconBg: 'bg-orange-500',
    },
  ];

  return (
    <div>
      <div className="mb-8 animate-slide-right">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 text-lg font-medium">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card group">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">{stat.title}</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </p>
                  {stat.subtitle && (
                    <p className="text-xs font-medium text-gray-500">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`bg-gradient-to-br ${stat.gradient} p-4 rounded-2xl shadow-lg shadow-${stat.iconBg}/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Low Stock Alert */}
      {stats?.low_stock_count > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 rounded-2xl p-5 mb-8 shadow-soft animate-slide-up">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-xl mr-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-yellow-900">
                Low Stock Alert
              </p>
              <p className="text-sm text-yellow-700 mt-1 font-medium">
                {stats.low_stock_count} product{stats.low_stock_count > 1 ? 's' : ''} running low on stock
              </p>
            </div>
            <Link
              to="/products"
              className="btn btn-secondary text-sm shadow-md hover:shadow-lg"
            >
              View Products
            </Link>
          </div>
        </div>
      )}

      {/* Recent Sales */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
          <Link to="/reports" className="text-sm text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </div>

        {stats?.recent_sales?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="font-medium">{sale.invoice_number}</td>
                    <td>{sale.customer_name || 'Walk-in'}</td>
                    <td>{formatCurrency(sale.total_amount)}</td>
                    <td>{formatDateTime(sale.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No recent sales
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
        <Link
          to="/pos"
          className="group bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 shadow-medium hover:shadow-strong transition-all duration-300 hover:-translate-y-1 cursor-pointer"
        >
          <div className="flex items-center text-white">
            <div className="p-3 bg-white/20 rounded-xl mr-4 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg">New Sale</h3>
              <p className="text-sm text-primary-100">Start a new transaction</p>
            </div>
          </div>
        </Link>

        <Link
          to="/products"
          className="group bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 shadow-medium hover:shadow-strong transition-all duration-300 hover:-translate-y-1 cursor-pointer"
        >
          <div className="flex items-center text-white">
            <div className="p-3 bg-white/20 rounded-xl mr-4 group-hover:scale-110 transition-transform">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Manage Products</h3>
              <p className="text-sm text-indigo-100">View and edit inventory</p>
            </div>
          </div>
        </Link>

        <Link
          to="/customers"
          className="group bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-medium hover:shadow-strong transition-all duration-300 hover:-translate-y-1 cursor-pointer"
        >
          <div className="flex items-center text-white">
            <div className="p-3 bg-white/20 rounded-xl mr-4 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Customers</h3>
              <p className="text-sm text-purple-100">Manage customer data</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;

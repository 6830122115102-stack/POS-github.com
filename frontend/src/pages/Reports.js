import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { formatCurrency, downloadFile } from '../utils/format';
import toast from 'react-hot-toast';
import { Download, FileText, BarChart3 } from 'lucide-react';

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchReports();
  }, [dateRange]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const fetchReports = async () => {
    try {
      const [summaryRes, topProductsRes] = await Promise.all([
        reportsAPI.getSalesSummary(dateRange),
        reportsAPI.getTopProducts({ ...dateRange, limit: 10 }),
      ]);

      setSummary(summaryRes.data);
      setTopProducts(topProductsRes.data);
    } catch (error) {
      toast.error('Error loading reports');
    }
  };

  const validateDateRange = () => {
    if (dateRange.start_date > dateRange.end_date) {
      toast.error('Start date cannot be after end date');
      return false;
    }
    return true;
  };

  const handleExportCSV = async () => {
    if (!validateDateRange()) return;
    try {
      const response = await reportsAPI.exportCSV(dateRange);
      downloadFile(response.data, 'sales-report.csv');
      toast.success('CSV downloaded');
    } catch (error) {
      toast.error('Error exporting CSV');
    }
  };

  const handleExportPDF = async () => {
    if (!validateDateRange()) return;
    try {
      const response = await reportsAPI.exportPDF(dateRange);
      downloadFile(response.data, 'sales-report.pdf');
      toast.success('PDF downloaded');
    } catch (error) {
      toast.error('Error exporting PDF');
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-6 animate-slide-right">
        Reports & Analytics
      </h1>

      {/* Date Range Filter */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              className="input"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              className="input"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="btn btn-secondary">
              <Download className="w-4 h-4 mr-2 inline" />
              Export CSV
            </button>
            <button onClick={handleExportPDF} className="btn btn-secondary">
              <FileText className="w-4 h-4 mr-2 inline" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Sales Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900">{summary?.total_sales || 0}</p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(summary?.total_revenue || 0)}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Average Sale</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(summary?.avg_sale_amount || 0)}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Total Tax</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(summary?.total_tax || 0)}
          </p>
        </div>
      </div>

      {/* Top Products */}
      <div className="card">
        <div className="flex items-center mb-6">
          <BarChart3 className="w-6 h-6 text-primary-600 mr-3" />
          <h2 className="text-lg font-semibold text-gray-900">Top Selling Products</h2>
        </div>

        {topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Product</th>
                  <th>Quantity Sold</th>
                  <th>Revenue</th>
                  <th>Times Sold</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => (
                  <tr key={product.product_id}>
                    <td>
                      <span className="font-bold text-primary-600">#{index + 1}</span>
                    </td>
                    <td className="font-medium">{product.product_name}</td>
                    <td>{product.total_quantity}</td>
                    <td>{formatCurrency(product.total_revenue)}</td>
                    <td>{product.times_sold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No sales data for the selected period
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;

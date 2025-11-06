import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { adminApi } from "../lib/api";
import {
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import AddProductModal from "../components/AddProductModal";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard stats",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchStats();
  }, []);

  const handleProductAdded = (newProduct) => {
    // Refresh stats to include the new product
    fetchStats();
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = "blue" }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600",
      green: "bg-green-50 text-green-600",
      purple: "bg-purple-50 text-purple-600",
      orange: "bg-orange-50 text-orange-600"
    };

    return (
      <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {trend && (
                <div className="flex items-center mt-2">
                  {trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trendValue}
                  </span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-full ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const MonthlySalesChart = ({ monthlySales }) => {
    if (!monthlySales || monthlySales.length === 0) {
      return (
        <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm">
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sales data available</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    const maxSales = Math.max(...monthlySales.map(item => item.totalSales));
    const chartHeight = 200;

    return (
      <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Sales (Last 12 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlySales.slice(-6).map((item, index) => {
              const height = maxSales > 0 ? (item.totalSales / maxSales) * chartHeight : 0;
              const monthName = new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
              });

              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-20 text-sm text-gray-600">{monthName}</div>
                  <div className="flex-1">
                    <div className="relative">
                      <div
                        className="bg-indigo-600 rounded-r h-8 flex items-center px-3 text-white text-sm font-medium"
                        style={{ width: `${maxSales > 0 ? (item.totalSales / maxSales) * 100 : 0}%` }}
                      >
                        ₹{item.totalSales.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm text-gray-600">
                    {item.orderCount} orders
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const RecentOrders = ({ recentOrders }) => (
    <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Recent Orders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentOrders?.slice(0, 5).map((order) => (
            <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">#{order.orderNumber}</div>
                <div className="text-sm text-gray-600">{order.user?.name || 'Unknown'}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">₹{order.total.toLocaleString()}</div>
                <Badge
                  variant={
                    order.status === 'delivered' ? 'default' :
                    order.status === 'processing' ? 'secondary' :
                    order.status === 'shipped' ? 'outline' : 'destructive'
                  }
                  className="text-xs"
                >
                  {order.status}
                </Badge>
              </div>
            </div>
          )) || (
            <div className="text-center text-gray-500 py-4">
              No recent orders
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white lg:ml-64">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          <div className="flex items-center gap-2 text-gray-600">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white ml-64">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your store.</p>
          </div>
          <Button onClick={fetchStats} variant="outline" className="border-gray-300">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm mb-8">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex gap-3">
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setShowAddProductModal(true)}
              >
                <Package className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Total Orders"
            value={stats?.totalOrders || 0}
            icon={ShoppingCart}
            color="blue"
          />
          <StatCard
            title="Total Customers"
            value={stats?.totalUsers || 0}
            icon={Users}
            color="purple"
          />
          <StatCard
            title="Total Products"
            value={stats?.totalProducts || 0}
            icon={Package}
            color="orange"
          />
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlySalesChart monthlySales={stats?.monthlySales} />
          <RecentOrders recentOrders={stats?.recentOrders} />
        </div>

        {/* Order Status Breakdown */}
        <div className="mt-8">
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>Order Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats?.orderStats && Object.entries(stats.orderStats).map(([status, data]) => (
                  <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{data.count}</div>
                    <div className="text-sm text-gray-600 capitalize">{status}</div>
                    <div className="text-sm font-medium text-gray-900">₹{data.value.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        onProductAdded={handleProductAdded}
      />
    </div>
  );
};

export default AdminDashboard;
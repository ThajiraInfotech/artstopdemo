import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { adminApi, ApiError } from "../lib/api";
import { Package, Clock, CheckCircle, Truck, ArrowUpDown, Filter, RefreshCw, Search, ShoppingCart, User, X, CreditCard, RefreshCcw, DollarSign } from "lucide-react";

const statusIcon = (status) => {
  switch (status) {
    case "processing":
      return <Clock className="h-4 w-4" />;
    case "shipped":
      return <Truck className="h-4 w-4" />;
    case "delivered":
      return <CheckCircle className="h-4 w-4" />;
    case "cancelled":
      return <X className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

const statusColor = (status) => {
  switch (status) {
    case "processing":
      return "bg-yellow-100 text-yellow-800";
    case "shipped":
      return "bg-blue-100 text-blue-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const AdminOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState("desc"); // "asc" | "desc"
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getOrders({
        limit: 50,
        sort: 'createdAt',
        order: sortMode
      });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [sortMode]);

  const filteredOrders = useMemo(() => {
    let list = Array.isArray(orders) ? [...orders] : [];
    if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((o) => {
        const idMatch = String(o.orderNumber || o._id).toLowerCase().includes(q);
        const customerMatch = (o.user?.name || "").toLowerCase().includes(q) ||
                             (o.user?.email || "").toLowerCase().includes(q);
        const itemsMatch = (o.items || []).some((it) => it.name?.toLowerCase().includes(q));
        return idMatch || customerMatch || itemsMatch;
      });
    }
    return list;
  }, [orders, statusFilter, search]);

  const stats = useMemo(() => {
    const total = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const byStatus = filteredOrders.reduce(
      (acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      },
      { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 }
    );
    return { count: total, totalRevenue, byStatus };
  }, [filteredOrders]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await adminApi.updateOrderStatus(orderId, { status: newStatus });
      // Refresh orders
      await fetchOrders();
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  const handleRefund = async (orderId, reason, amount = null) => {
    try {
      await adminApi.processRefund(orderId, { reason, amount });
      // Refresh orders
      await fetchOrders();
      toast({
        title: "Success",
        description: "Refund processed successfully",
      });
    } catch (error) {
      console.error('Failed to process refund:', error);
      toast({
        title: "Error",
        description: "Failed to process refund",
        variant: "destructive"
      });
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <X className="h-4 w-4" />;
      case 'refunded':
        return <RefreshCcw className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white lg:ml-64">
      <div className="p-4 lg:p-8 pt-16 lg:pt-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <img
              src="/artstoplogo.png"
              alt="ArtStop"
              className="h-8 w-auto object-contain drop-shadow-sm"
            />
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Orders</h1>
              <p className="text-sm lg:text-base text-gray-600">View and manage all orders</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <input
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
            <Button variant="outline" size="sm" className="border-gray-300" onClick={fetchOrders}>
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Total Orders</div>
              <div className="text-2xl font-semibold text-gray-900">{stats.count}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Processing</div>
              <div className="text-2xl font-semibold text-gray-900">{stats.byStatus.processing || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Shipped</div>
              <div className="text-2xl font-semibold text-gray-900">{stats.byStatus.shipped || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Revenue (₹)</div>
              <div className="text-2xl font-semibold text-gray-900">
                ₹{stats.totalRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm mb-6">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={sortMode === "desc" ? "default" : "outline"}
                className={sortMode === "desc" ? "bg-indigo-600 hover:bg-indigo-700" : "border-gray-300"}
                onClick={() => setSortMode("desc")}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Newest First
              </Button>
              <Button
                variant={sortMode === "asc" ? "default" : "outline"}
                className={sortMode === "asc" ? "bg-indigo-600 hover:bg-indigo-700" : "border-gray-300"}
                onClick={() => setSortMode("asc")}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Oldest First
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 hidden sm:inline">Status</span>
              <div className="relative">
                <Filter className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 border-gray-300 rounded-md"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading orders...
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order._id} className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 lg:p-5">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 p-2 rounded-lg">
                        <Package className="h-4 w-4 lg:h-5 lg:w-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-xs lg:text-sm text-gray-500">Order</div>
                        <div className="text-base lg:text-lg font-semibold text-gray-900">#{order.orderNumber || order._id}</div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 truncate">{order.user?.name || 'Unknown'}</span>
                      </div>
                      <Badge className={`${statusColor(order.status)} flex items-center gap-1 text-xs`}>
                        {statusIcon(order.status)}
                        <span className="capitalize font-medium">{order.status}</span>
                      </Badge>
                      <div className="flex gap-4 text-right">
                        <div>
                          <div className="text-xs text-gray-500">Date</div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Total</div>
                          <div className="text-base lg:text-lg font-bold text-gray-900">
                            ₹{order.total.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Update */}
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-sm text-gray-600">Update Status:</span>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}

                  {/* Items */}
                  <div className="grid gap-3">
                    {(order.items || []).map((item, index) => (
                      <div
                        key={item._id || index}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-14 h-14 rounded overflow-hidden bg-white">
                          <img
                            src={
                              item.product?.media?.find(m => m.type === 'image')?.url ||
                              item.image ||
                              `https://picsum.photos/seed/${encodeURIComponent(item.name)}/100/100`
                            }
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(item.name)}/100/100`;
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Qty: {item.quantity}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment Info */}
                  {order.paymentInfo && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment Information
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Method:</span>
                          <Badge className={`${getPaymentStatusColor(order.paymentInfo.status)} flex items-center gap-1 text-xs`}>
                            {getPaymentStatusIcon(order.paymentInfo.status)}
                            <span className="capitalize">{order.paymentInfo.method}</span>
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Status:</span>
                          <Badge className={`${getPaymentStatusColor(order.paymentInfo.status)} flex items-center gap-1 text-xs`}>
                            {getPaymentStatusIcon(order.paymentInfo.status)}
                            <span className="capitalize">{order.paymentInfo.status}</span>
                          </Badge>
                        </div>
                        {order.paymentInfo.transactionId && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Transaction ID:</span>
                            <span className="text-sm font-mono text-gray-900">{order.paymentInfo.transactionId}</span>
                          </div>
                        )}
                        {order.paymentInfo.paidAt && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Paid At:</span>
                            <span className="text-sm text-gray-900">{new Date(order.paymentInfo.paidAt).toLocaleString()}</span>
                          </div>
                        )}
                        {order.paymentInfo.status === 'completed' && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Actions:</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => {
                                  const reason = prompt('Enter refund reason:');
                                  if (reason) {
                                    handleRefund(order._id, reason, order.total);
                                  }
                                }}
                              >
                                <RefreshCcw className="h-3 w-3 mr-1" />
                                Process Refund
                              </Button>
                            </div>
                          </div>
                        )}
                        {order.paymentInfo.status === 'refunded' && (
                          <div className="mt-2 p-2 bg-blue-50 rounded">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-blue-800">Refunded Amount:</span>
                              <span className="font-medium text-blue-900">₹{order.paymentInfo.refundAmount?.toLocaleString()}</span>
                            </div>
                            {order.paymentInfo.refundedAt && (
                              <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-blue-800">Refunded At:</span>
                                <span className="text-blue-900">{new Date(order.paymentInfo.refundedAt).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Shipping Info */}
                  {order.shippingAddress && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-900 mb-2">Shipping Address</div>
                      <div className="text-sm text-gray-600">
                        {order.shippingAddress.name}<br />
                        {order.shippingAddress.street}<br />
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                        {order.shippingAddress.phone}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {!filteredOrders.length && (
              <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm">
                <CardContent className="p-8 text-center text-gray-600">
                  No orders found with current filters.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
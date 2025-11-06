import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, Truck, Eye } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ordersApi } from '../lib/api';
import { useToast } from '../hooks/use-toast';
import OrderDetailModal from '../components/OrderDetailModal';
import OrderTrackingModal from '../components/OrderTrackingModal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getUserOrders();
      if (response.success) {
        setOrders(response.data.orders || []);
      }
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

  const handleViewDetails = (orderId) => {
    setSelectedOrderId(orderId);
    setIsDetailModalOpen(true);
  };

  const handleTrackOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setIsTrackingModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrderId(null);
  };

  const closeTrackingModal = () => {
    setIsTrackingModalOpen(false);
    setSelectedOrderId(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              Loading orders...
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">No Orders Yet</h1>
            <p className="text-gray-600 mb-8">
              You haven't placed any orders yet. Start shopping to see your order history here.
            </p>
            <Link to="/products">
              <Button className="bg-black text-white hover:bg-gray-800 px-8 py-3 rounded-full">
                Start Shopping
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-gray-700">Home</Link>
            <span>/</span>
            <span className="text-gray-900">My Orders</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
              <p className="text-gray-600">{orders.length} orders found</p>
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {orders.map((order, index) => (
            <motion.div
              key={order._id}
              variants={cardVariants}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  {/* Order Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 pb-4 border-b">
                    <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                      <div className="bg-amber-100 p-3 rounded-lg">
                        <Package className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                        <p className="text-sm text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Badge className={`flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="capitalize font-medium">{order.status}</span>
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-lg font-bold text-gray-900">Rs. {order.total.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-4">
                    {order.items.map((item, itemIndex) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: itemIndex * 0.1 }}
                        className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
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
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                            {item.name}
                          </h4>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                            <span className="text-sm font-medium text-gray-900">
                              Rs. {(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Order Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      className="flex items-center space-x-2"
                      onClick={() => handleViewDetails(order._id)}
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </Button>

                    {order.status === 'delivered' && (
                      <Button variant="outline">
                        Write Review
                      </Button>
                    )}

                    {order.status !== 'delivered' && (
                      <Button
                        variant="outline"
                        onClick={() => handleTrackOrder(order._id)}
                      >
                        Track Order
                      </Button>
                    )}

                    <Button className="bg-black text-white hover:bg-gray-800">
                      Reorder Items
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Continue Shopping */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8 lg:p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Looking for Something New?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Discover our latest collection of authentic Islamic art and home decor pieces.
            </p>
            <Link to="/products">
              <Button className="bg-black text-white hover:bg-gray-800 px-8 py-3 rounded-full text-lg font-medium">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <OrderDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        orderId={selectedOrderId}
      />

      <OrderTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={closeTrackingModal}
        orderId={selectedOrderId}
      />
    </div>
  );
};

export default Orders;
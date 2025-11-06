import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Package, Clock, CheckCircle, Truck, X, CreditCard, MapPin, User, Calendar } from 'lucide-react';
import { ordersApi } from '../lib/api';
import { useToast } from '../hooks/use-toast';

const OrderDetailModal = ({ isOpen, onClose, orderId }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getOrderById(orderId);
      if (response.success) {
        setOrder(response.data.order);
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (!order && !loading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details - #{order?.orderNumber}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            <span className="ml-2">Loading order details...</span>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Order Status */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Order Status</h3>
                  <Badge className={`flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="capitalize font-medium">{order.status}</span>
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Ordered: {new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  {order.estimatedDelivery && (
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-gray-500" />
                      <span>Est. Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}</span>
                    </div>
                  )}
                  {order.deliveredAt && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-gray-500" />
                      <span>Delivered: {new Date(order.deliveredAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={item._id || index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
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
                        {item.variant && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.variant.name}: {item.variant.value}
                            {item.variant.dimensions && ` (${item.variant.dimensions})`}
                          </div>
                        )}
                        {item.color && (
                          <div className="text-xs text-gray-500">
                            Color: {item.color}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rs. {order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>Rs. {order.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>Rs. {order.shipping.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>Rs. {order.total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            {order.paymentInfo && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Payment Information</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Method:</span>
                      <div className="font-medium capitalize">{order.paymentInfo.method}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge className={`${getPaymentStatusColor(order.paymentInfo.status)} mt-1`}>
                        {order.paymentInfo.status}
                      </Badge>
                    </div>
                    {order.paymentInfo.transactionId && (
                      <div>
                        <span className="text-sm text-gray-600">Transaction ID:</span>
                        <div className="font-mono text-sm">{order.paymentInfo.transactionId}</div>
                      </div>
                    )}
                    {order.paymentInfo.paidAt && (
                      <div>
                        <span className="text-sm text-gray-600">Paid At:</span>
                        <div className="text-sm">{new Date(order.paymentInfo.paidAt).toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shipping Address */}
            {order.shippingAddress && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Shipping Address</span>
                  </h3>
                  <div className="text-sm text-gray-600">
                    <div className="font-medium text-gray-900">{order.shippingAddress.name}</div>
                    <div>{order.shippingAddress.street}</div>
                    <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</div>
                    <div>{order.shippingAddress.country}</div>
                    <div className="mt-2">
                      <span className="font-medium">Phone:</span> {order.shippingAddress.phone}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {order.shippingAddress.email}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {order.notes && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Notes</h3>
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailModal;
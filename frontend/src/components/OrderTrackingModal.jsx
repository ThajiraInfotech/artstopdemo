import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Package, Clock, CheckCircle, Truck, X, MapPin } from 'lucide-react';
import { ordersApi } from '../lib/api';
import { useToast } from '../hooks/use-toast';

const OrderTrackingModal = ({ isOpen, onClose, orderId }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && orderId) {
      fetchTrackingData();
    }
  }, [isOpen, orderId]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getOrderTracking(orderId);
      if (response.success) {
        setTrackingData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch tracking data:', error);
      toast({
        title: "Error",
        description: "Failed to load tracking information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5" />;
      case 'processing':
        return <Clock className="h-5 w-5" />;
      case 'shipped':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600';
      case 'processing':
        return 'text-yellow-600';
      case 'shipped':
        return 'text-blue-600';
      case 'delivered':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getCurrentStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 border-green-300';
      case 'processing':
        return 'bg-yellow-100 border-yellow-300';
      case 'shipped':
        return 'bg-blue-100 border-blue-300';
      case 'delivered':
        return 'bg-green-100 border-green-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  if (!trackingData && !loading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Tracking - #{trackingData?.order?.orderNumber}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            <span className="ml-2">Loading tracking information...</span>
          </div>
        ) : trackingData ? (
          <div className="space-y-6">
            {/* Current Status */}
            <Card className={`${getCurrentStatusColor(trackingData.order.status)} border-2`}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${getStatusColor(trackingData.order.status)} bg-white`}>
                    {getStatusIcon(trackingData.order.status)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Current Status</h3>
                    <p className="text-gray-600 capitalize">{trackingData.order.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tracking Timeline */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Tracking Timeline</h3>
              <div className="space-y-4">
                {trackingData.timeline.map((step, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      step.completed
                        ? `${getStatusColor(step.status)} bg-white border-2`
                        : 'bg-gray-200 border-2 border-gray-300'
                    }`}>
                      {getStatusIcon(step.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className={`text-sm font-medium ${
                          step.completed ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.message}
                        </h4>
                        {step.completed && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      {step.date && (
                        <p className={`text-xs mt-1 ${
                          step.completed ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {new Date(step.date).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Order Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Order Number:</span>
                    <div className="font-medium">{trackingData.order.orderNumber}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Status:</span>
                    <Badge className={`mt-1 capitalize ${getStatusColor(trackingData.order.status)}`}>
                      {trackingData.order.status}
                    </Badge>
                  </div>
                  {trackingData.order.trackingNumber && (
                    <div>
                      <span className="text-gray-600">Tracking Number:</span>
                      <div className="font-medium font-mono">{trackingData.order.trackingNumber}</div>
                    </div>
                  )}
                  {trackingData.order.estimatedDelivery && (
                    <div>
                      <span className="text-gray-600">Estimated Delivery:</span>
                      <div className="font-medium">
                        {new Date(trackingData.order.estimatedDelivery).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            {trackingData.order.status === 'delivered' && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-900">Order Delivered Successfully!</h4>
                      <p className="text-sm text-green-700">
                        Your order was delivered on {new Date(trackingData.order.deliveredAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shipping Information */}
            {trackingData.order.status === 'shipped' && trackingData.order.trackingNumber && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Truck className="h-6 w-6 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-blue-900">Order Shipped</h4>
                      <p className="text-sm text-blue-700">
                        Track your package with tracking number: <span className="font-mono font-medium">{trackingData.order.trackingNumber}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default OrderTrackingModal;
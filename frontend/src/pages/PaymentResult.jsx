import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight, Home, Package } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import Footer from '../components/layout/Footer';

const PaymentResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [result, setResult] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    // Get result from location state or URL params
    const state = location.state;
    const searchParams = new URLSearchParams(location.search);

    if (state) {
      setResult({
        success: state.success || false,
        message: state.message || 'Payment completed',
        order: state.order
      });
      if (state.order) {
        setOrderDetails(state.order);
      }
    } else {
      // Check URL params for payment result
      const success = searchParams.get('success');
      const orderId = searchParams.get('order_id');
      const message = searchParams.get('message');

      setResult({
        success: success === 'true',
        message: message || 'Payment completed',
        orderId: orderId
      });
    }
  }, [location]);

  const handleContinueShopping = () => {
    navigate('/products');
  };

  const handleViewOrders = () => {
    navigate('/orders');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing payment result...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="bg-white shadow-lg">
          <CardContent className="p-8">
            {/* Status Icon */}
            <div className="text-center mb-8">
              {result.success ? (
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              ) : (
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              )}

              <h1 className={`text-2xl font-bold mb-2 ${
                result.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {result.success ? 'Payment Successful!' : 'Payment Failed'}
              </h1>

              <p className="text-gray-600">
                {result.message}
              </p>
            </div>

            {/* Order Details */}
            {result.success && orderDetails && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium">{orderDetails.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">Rs. {orderDetails.total?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-green-600">{orderDetails.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-medium">{orderDetails.items?.length || 0} item(s)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Failed Details */}
            {!result.success && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-red-900 mb-4">What happened?</h3>
                <div className="space-y-2 text-red-800">
                  <p>• Your payment could not be processed</p>
                  <p>• This might be due to insufficient funds, card expiry, or network issues</p>
                  <p>• Please try again with a different payment method</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              {result.success ? (
                <>
                  <Button
                    onClick={handleViewOrders}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  >
                    <Package className="h-5 w-5 mr-2" />
                    View My Orders
                  </Button>

                  <Button
                    onClick={handleContinueShopping}
                    variant="outline"
                    className="w-full"
                  >
                    Continue Shopping
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => navigate('/checkout')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  >
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Try Again
                  </Button>

                  <Button
                    onClick={handleGoHome}
                    variant="outline"
                    className="w-full"
                  >
                    <Home className="h-5 w-5 mr-2" />
                    Back to Home
                  </Button>
                </>
              )}
            </div>

            {/* Additional Information */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center text-sm text-gray-600">
                {result.success ? (
                  <p>
                    A confirmation email has been sent to your registered email address.
                    You can track your order status from your account dashboard.
                  </p>
                ) : (
                  <p>
                    If you continue to face issues, please contact our support team
                    or try again later. Your cart items have been saved.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentResult;
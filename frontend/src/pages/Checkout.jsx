import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Truck, Shield, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import paymentService from '../lib/paymentService';
import api from '../lib/api';

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  // Shipping Address Form
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });

  // Order Summary
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0
  });

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        // Check for admin token first, then user token
        const adminToken = localStorage.getItem('artstop_admin_token');
        const userToken = localStorage.getItem('artstop_token') || localStorage.getItem('token');

        if (!adminToken && !userToken) {
          // User not authenticated, redirect to login
          toast({
            title: "Authentication Required",
            description: "Please log in to continue with checkout",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }

        // Get cart items from API
        await fetchCartItems();
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate, toast]);

  const fetchCartItems = async () => {
    try {
      const response = await api.get('/api/cart');
      if (response.success) {
        setCartItems(response.data.cart.items);
        calculateOrderSummary(response.data.cart.items);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      // Only show error toast if it's not an authentication error
      if (error.status !== 401) {
        toast({
          title: "Error",
          description: "Failed to load cart items",
          variant: "destructive",
        });
      }
    }
  };

  const calculateOrderSummary = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18; // 18% GST
    const shipping = subtotal > 5000 ? 0 : 200;
    const total = subtotal + tax + shipping;

    setOrderSummary({
      subtotal,
      tax,
      shipping,
      total
    });
  };

  const handleInputChange = (field, value) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Get cart items to calculate totals
      const cartResponse = await api.get('/api/cart');
      if (!cartResponse.success || !cartResponse.data.cart.items.length) {
        toast({
          title: "Cart Empty",
          description: "Your cart is empty. Please add items before checkout.",
          variant: "destructive",
        });
        navigate('/cart');
        return;
      }

      const cartItems = cartResponse.data.cart.items;
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.18; // 18% GST
      const shipping = subtotal > 5000 ? 0 : 200;
      const total = subtotal + tax + shipping;

      const customerInfo = {
        name: shippingAddress.name || "Customer",
        email: shippingAddress.email || "customer@example.com",
        phone: shippingAddress.phone || "9999999999"
      };

      const orderData = {
        shippingAddress: {
          name: shippingAddress.name || "",
          email: shippingAddress.email || "",
          phone: shippingAddress.phone || "",
          street: shippingAddress.street || "",
          city: shippingAddress.city || "",
          state: shippingAddress.state || "",
          zipCode: shippingAddress.zipCode || ""
        },
        paymentInfo: {
          method: paymentMethod
        }
      };

      const result = await paymentService.processPayment(orderData, customerInfo);

      if (result.success) {
        toast({
          title: "Payment Successful!",
          description: "Your order has been placed successfully.",
        });

        // Navigate to payment result page
        navigate('/payment-result', {
          state: {
            success: true,
            order: result.data.order,
            message: 'Payment completed successfully!'
          }
        });
      } else {
        toast({
          title: "Payment Failed",
          description: result.message,
          variant: "destructive",
        });

        // Navigate to payment result page with failure status
        navigate('/payment-result', {
          state: {
            success: false,
            message: result.message
          }
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "An error occurred during payment processing.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const requiredFields = ['name', 'phone', 'email', 'street', 'city', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field]?.trim());

    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }

    if (shippingAddress.phone.length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">Add some items to your cart before checkout.</p>
          <Button onClick={() => navigate('/products')} className="bg-black text-white hover:bg-gray-800">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <button onClick={() => navigate('/cart')} className="hover:text-gray-700">
            Cart
          </button>
          <span>/</span>
          <span className="text-gray-900">Checkout</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Order Summary */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5" />
                  <span>Order Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-blue-800 mb-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Secure Payment</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    You'll be redirected to Razorpay to complete your payment and enter shipping details.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">What's Next:</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">1</div>
                      <span>Review your order details</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">2</div>
                      <span>Enter shipping information in Razorpay</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">3</div>
                      <span>Complete payment securely</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment Method</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg bg-blue-50 border-blue-200">
                    <input
                      type="radio"
                      id="razorpay"
                      name="paymentMethod"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-blue-600"
                    />
                    <label htmlFor="razorpay" className="flex-1 cursor-pointer">
                      <div className="font-medium text-gray-900">Razorpay</div>
                      <div className="text-sm text-gray-600">Pay securely with UPI, Cards, Net Banking, Wallets</div>
                    </label>
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-8">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity} × Rs. {item.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-sm font-medium">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>Rs. {orderSummary.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (18% GST)</span>
                    <span>Rs. {orderSummary.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>
                      {orderSummary.shipping === 0 ? 'Free' : `Rs. ${orderSummary.shipping.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>Rs. {orderSummary.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-green-800">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Secure Payment</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Your payment information is encrypted and secure
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing Payment...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-5 w-5" />
                        <span>Pay Rs. {orderSummary.total.toLocaleString()}</span>
                      </div>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate('/cart')}
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
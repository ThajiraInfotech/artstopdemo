import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import api from '../lib/api';
import { useToast } from '../hooks/use-toast';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCartItems();

    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCartItems();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const fetchCartItems = async () => {
    // Check if user is authenticated
    const token = localStorage.getItem('artstop_token') || localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view your cart.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    try {
      const response = await api.get('/api/cart');
      if (response.success) {
        setCartItems(response.data.cart.items || []);
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
      setCartItems([]);
    }
  };

  const updateQuantity = async (index, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      const item = cartItems[index];
      const response = await api.put(`/api/cart/${item._id}`, {
        quantity: newQuantity
      });

      if (response.success) {
        // Refresh cart items from backend
        await fetchCartItems();
        toast({
          title: "Cart Updated",
          description: "Item quantity has been updated.",
        });
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive",
      });
    }
  };

  const removeItem = async (index) => {
    try {
      const item = cartItems[index];
      const response = await api.delete(`/api/cart/${item._id}`);

      if (response.success) {
        // Refresh cart items from backend
        await fetchCartItems();
        toast({
          title: "Item Removed",
          description: "Item has been removed from your cart.",
        });
      }
    } catch (error) {
      console.error('Error removing cart item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    }
  };

  const applyPromoCode = () => {
    // Mock promo code functionality
    if (promoCode.toLowerCase() === 'save20') {
      toast({
        title: "Promo Code Applied",
        description: "20% discount has been applied to your order.",
      });
    } else if (promoCode) {
      toast({
        title: "Invalid Promo Code",
        description: "The entered promo code is not valid.",
        variant: "destructive",
      });
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = promoCode.toLowerCase() === 'save20' ? subtotal * 0.2 : 0;
  const deliveryFee = subtotal > 5000 ? 0 : 200;
  const total = subtotal - discount + deliveryFee;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
          <Link to="/products">
            <Button className="bg-black text-white hover:bg-gray-800 px-8 py-3 rounded-full">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <span className="text-gray-900">Cart</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item, index) => (
              <Card key={item._id || `${item.product?._id}-${item.variant?.value || 'no-variant'}-${item.color || 'no-color'}`} className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-6">
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${item.product?._id || item.id}`}>
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                          {item.name}
                        </h3>
                      </Link>
                      
                      <div className="mt-2 space-y-1">
                        {item.variant && (
                          <p className="text-sm text-gray-600">
                            Size: {item.variant.name || item.variant.value}
                            {item.variant.dimensions ? ` — ${item.variant.dimensions}` : ''}
                          </p>
                        )}
                        {item.color && (
                          <p className="text-sm text-gray-600">Color: {item.color}</p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-lg font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Price and Remove */}
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              Rs. {(item.price * item.quantity).toLocaleString()}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-sm text-gray-500">
                                Rs. {item.price.toLocaleString()} each
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-lg sticky top-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount (20%)</span>
                      <span>-Rs. {discount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">
                      {deliveryFee === 0 ? 'Free' : `Rs. ${deliveryFee.toLocaleString()}`}
                    </span>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>Rs. {total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Promo Code */}
                <div className="mb-6">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      onClick={applyPromoCode}
                      className="px-6"
                    >
                      Apply
                    </Button>
                  </div>
                  {subtotal < 5000 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Add Rs. {(5000 - subtotal).toLocaleString()} more for free delivery!
                    </p>
                  )}
                </div>

                {/* Checkout Button */}
                <Button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-black text-white hover:bg-gray-800 py-3 text-lg font-medium rounded-full mb-4"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>

                <Link to="/products">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
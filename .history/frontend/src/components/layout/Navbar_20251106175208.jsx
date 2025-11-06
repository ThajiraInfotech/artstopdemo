import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Menu, X, User, Package, Heart, LogOut, Settings, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import SearchSuggestions from '../SearchSuggestions';
import UserDetailsModal from '../UserDetailsModal';
import EditProfileModal from '../EditProfileModal';
import { getWishlistItems } from '../../data/mock';
import api from '../../lib/api';
import { useToast } from '../../hooks/use-toast';

const Navbar = () => {
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  useEffect(() => {
    // Initial setup
    // Check if user is already logged in and fetch cart count
    const token = localStorage.getItem('artstop_token') || localStorage.getItem('token');
    const userData = localStorage.getItem('artstop_user');
    if (token && userData && userData !== 'undefined' && userData !== 'null') {
      try {
        setUser(JSON.parse(userData));
        setIsLoggedIn(true);
        fetchCartCount(); // Fetch cart count for logged in user
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('artstop_user');
        localStorage.removeItem('artstop_token');
        setUser(null);
        setIsLoggedIn(false);
      }
    } else {
      setUser(null);
      setIsLoggedIn(false);
    }
    setWishlistItems(getWishlistItems());

    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    const handleWishlistUpdate = () => {
      setWishlistItems(getWishlistItems());
    };

    const handleAuthUpdate = () => {
      const userData = localStorage.getItem('artstop_user');
      if (userData && userData !== 'undefined' && userData !== 'null') {
        try {
          setUser(JSON.parse(userData));
          setIsLoggedIn(true);
          // Update cart count when user logs in
          fetchCartCount();
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('artstop_user');
          localStorage.removeItem('artstop_token');
          localStorage.removeItem('artstop_refresh_token');
          setUser(null);
          setIsLoggedIn(false);
          setCartCount(0);
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setCartCount(0);
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    window.addEventListener('authUpdated', handleAuthUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
      window.removeEventListener('authUpdated', handleAuthUpdate);
    };
  }, []);

  const fetchCartCount = async () => {
    console.log('[NAVBAR DEBUG] fetchCartCount called');
    // Check for token directly instead of relying on state
    const token = localStorage.getItem('artstop_token') || localStorage.getItem('token');
    console.log('[NAVBAR DEBUG] fetchCartCount - Token check:', {
      artstopToken: localStorage.getItem('artstop_token') ? 'present' : 'not found',
      legacyToken: localStorage.getItem('token') ? 'present' : 'not found',
      selectedToken: token ? 'present' : 'not found'
    });

    if (!token) {
      console.log('[NAVBAR DEBUG] fetchCartCount - No token found, setting cart count to 0');
      setCartCount(0);
      return;
    }

    try {
      console.log('[NAVBAR DEBUG] fetchCartCount - Making API call to /api/cart/count');
      const response = await api.get('/api/cart/count');
      console.log('[NAVBAR DEBUG] fetchCartCount - API response:', response);
      if (response.success) {
        const count = response.data.count || 0;
        console.log('[NAVBAR DEBUG] fetchCartCount - Setting cart count to:', count);
        setCartCount(count);
      } else {
        console.log('[NAVBAR DEBUG] fetchCartCount - Response not successful, setting cart count to 0');
        // If authentication fails, clear cart count
        setCartCount(0);
      }
    } catch (error) {
      console.log('[NAVBAR DEBUG] fetchCartCount - Error caught:', error.message, 'Status:', error.status);
      // Only log error if it's not an authentication error
      if (error.status !== 401) {
        console.error('Error fetching cart count:', error);
      }
      setCartCount(0);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
        setIsDesktopSearchOpen(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target)) {
        setIsMobileSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsNavbarVisible(false);
      } else {
        setIsNavbarVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchFocused(false);
      setIsMobileSearchOpen(false);
      setIsDesktopSearchOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    navigate(`/products?search=${encodeURIComponent(suggestion)}`);
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    setIsDesktopSearchOpen(false);
  };

  const handleUserAction = (action) => {
    setIsUserMenuOpen(false);
    if (action === 'demo') {
      handleDemoAuth();
    } else if (!isLoggedIn && (action === '/profile' || action === '/orders' || action === '/settings')) {
      navigate('/login');
    } else if (action === '/logout') {
      localStorage.removeItem('artstop_user');
      localStorage.removeItem('artstop_token'); // Also remove the JWT token
      setUser(null);
      setIsLoggedIn(false);
      setIsUserDetailsOpen(false);
      window.dispatchEvent(new CustomEvent('authUpdated'));
      navigate('/');
    } else if (action === '/profile') {
      setIsUserDetailsOpen(true);
    } else {
      navigate(action);
    }
  };

  // Demo authentication for testing
  const handleDemoAuth = async () => {
    try {
      const response = await authApi.demoAuth({
        email: 'demo@artstop.com',
        name: 'Demo User'
      });

      if (response.token && response.user) {
        localStorage.setItem('artstop_token', response.token);
        if (response.refreshToken) {
          localStorage.setItem('artstop_refresh_token', response.refreshToken);
        }
        localStorage.setItem('artstop_user', JSON.stringify(response.user));

        setUser(response.user);
        setIsLoggedIn(true);
        setIsUserMenuOpen(false);

        window.dispatchEvent(new CustomEvent('authUpdated'));

        toast({
          title: 'Demo Login Successful',
          description: 'You are now logged in as a demo user',
        });

        // Refresh cart count
        fetchCartCount();
      }
    } catch (error) {
      console.error('Demo auth error:', error);
      toast({
        title: 'Demo Login Failed',
        description: error.message || 'Failed to login as demo user',
        variant: 'destructive'
      });
    }
  };

  const handleProfileClick = () => {
    // Re-check localStorage in case state is not updated
    const userData = localStorage.getItem('artstop_user');
    const token = localStorage.getItem('artstop_token');
    if (userData && userData !== 'undefined' && userData !== 'null' && token) {
      // Update state if not already set
      if (!isLoggedIn) {
        try {
          setUser(JSON.parse(userData));
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('artstop_user');
          localStorage.removeItem('artstop_token');
          localStorage.removeItem('artstop_refresh_token');
          setUser(null);
          setIsLoggedIn(false);
        }
      }
      setIsUserDetailsOpen(true);
    } else {
      navigate('/login');
    }
  };

  const handleViewOrders = () => {
    setIsUserDetailsOpen(false);
    navigate('/orders');
  };

  const handleEditProfile = () => {
    setIsUserDetailsOpen(false);
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = (updatedUser) => {
    setUser(updatedUser);
  };


  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Categories', path: '/categories' },
    { name: 'Products', path: '/products' },
    { name: 'Customize', path: '/customize' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  const userMenuItems = [
    { name: 'My Profile', icon: User, path: '/profile' },
    { name: 'My Orders', icon: Package, path: '/orders' },
    { name: 'Settings', icon: Settings, path: '/settings' },
    { name: 'Logout', icon: LogOut, path: '/logout' }
  ];

  const authMenuItems = [
    { name: 'Demo Login', icon: User, action: 'demo' },
    { name: 'Login', icon: User, path: '/login' },
    { name: 'Sign Up', icon: User, path: '/signup' }
  ];

  return (
    <div className="w-full fixed top-0 left-0 right-0 z-50">
      {/* Main Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`bg-white/10 backdrop-blur-xl  transition-transform duration-300 ${isNavbarVisible ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Search Bar (Desktop) */}
            <div className="hidden md:flex items-center flex-1" ref={searchRef}>
              {!isDesktopSearchOpen ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsDesktopSearchOpen(true)}
                  className="p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  <Search className="h-5 w-5" />
                </motion.button>
              ) : (
                <form onSubmit={handleSearch} className="w-full max-w-md relative">
                  <Input
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
                    autoFocus
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </form>
              )}

              <AnimatePresence>
                {isSearchFocused && isDesktopSearchOpen && (
                  <SearchSuggestions
                    query={searchQuery}
                    onSuggestionClick={handleSuggestionClick}
                    onClose={() => { setIsSearchFocused(false); setIsDesktopSearchOpen(false); }}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Center: Logo - Now properly centered */}
            <div className="flex justify-center flex-1">
                    <Link to="/">
                      <motion.img
                        whileHover={{ scale: 1.05 }}
                        src="/artstoplogo.png"
                        alt="ArtStop Logo"
                        className="h-36 w-auto object-contain" // 128px big logo
                      />
                    </Link>
                  </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end space-x-4 flex-1">
              {/* Mobile Search Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
              >
                {isMobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </motion.button>

              {/* Country/Currency Selector */}
              <div className="hidden md:flex items-center space-x-1 text-sm text-gray-700">
                <span>India</span>
                <span>|</span>
                <span>INR</span>
                <ChevronDown className="h-4 w-4" />
              </div>

              {/* Wishlist Button */}
              <div className="relative block">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsWishlistOpen(!isWishlistOpen)}
                  className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  <Heart className="h-5 w-5" />
                  <AnimatePresence>
                    {wishlistItems.length > 0 && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
                      >
                        {wishlistItems.length}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                <AnimatePresence>
                  {isWishlistOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-hidden"
                    >
                      <div className="p-4 border-b">
                        <h3 className="font-semibold text-gray-900">My Wishlist</h3>
                        <p className="text-sm text-gray-500">{wishlistItems.length} items</p>
                      </div>
                      
                      {wishlistItems.length === 0 ? (
                        <div className="p-6 text-center">
                          <Heart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500">No items in wishlist</p>
                        </div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto">
                          {wishlistItems.map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                              className="p-3 hover:bg-gray-50 border-b last:border-b-0"
                            >
                              <Link
                                to={`/product/${item.id}`}
                                onClick={() => setIsWishlistOpen(false)}
                                className="flex items-center space-x-3"
                              >
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {item.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Rs. {item.price.toLocaleString()}
                                  </p>
                                </div>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      )}
                      
                      <div className="p-3 border-t bg-gray-50">
                        <Link to="/wishlist" onClick={() => setIsWishlistOpen(false)}>
                          <Button variant="outline" size="sm" className="w-full">
                            View All Wishlist
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleProfileClick}
                  className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  <User className="h-5 w-5" />
                </motion.button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50"
                    >
                      {(isLoggedIn ? userMenuItems : authMenuItems).map((item, index) => (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <button
                            onClick={() => handleUserAction(item.path)}
                            className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 w-full text-left"
                          >
                            <item.icon className="h-4 w-4" />
                            <span className="text-sm font-medium">{item.name}</span>
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart Button */}
              <Link to="/cart">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </Link>


              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <AnimatePresence>
            {isMobileSearchOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden border-t bg-white overflow-hidden"
                ref={mobileSearchRef}
              >
                <div className="px-2 pt-2 pb-3">
                  <form onSubmit={handleSearch} className="mb-4">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full"
                        autoFocus
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </form>
                  
                  <AnimatePresence>
                    {searchQuery && (
                      <SearchSuggestions
                        query={searchQuery}
                        onSuggestionClick={handleSuggestionClick}
                        onClose={() => setIsMobileSearchOpen(false)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center justify-center space-x-8 pb-4">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link
                  to={link.path}
                  className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium relative group"
                >
                  {link.name}
                  <motion.div
                    className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"/>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden border-t bg-white overflow-hidden"
              >
                <div className="px-2 pt-2 pb-3 space-y-1">
                  {/* Mobile Navigation Links */}
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Link
                        to={link.path}
                        className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200 font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.name}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={isUserDetailsOpen}
        onClose={() => setIsUserDetailsOpen(false)}
        user={user}
        onLogout={() => handleUserAction('/logout')}
        onViewOrders={handleViewOrders}
        onEditProfile={handleEditProfile}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={user}
        onSave={handleSaveProfile}
      />
    </div>
  );
};

export default Navbar;
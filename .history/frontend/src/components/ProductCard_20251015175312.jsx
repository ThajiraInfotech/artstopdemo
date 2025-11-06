import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import { getWishlistItems, saveWishlistItems } from '../data/mock';
import api from '../lib/api';
import { useToast } from '../hooks/use-toast';

const ProductCard = ({ product, index = 0 }) => {
  const priceRef = useRef();
  const buttonRef = useRef();

  // Get images from media or fallback to images
  const productImages = product.media ? product.media.filter(m => m.type === 'image').map(m => m.url) : (product.images || []);
  // Get media array or fallback to images
  const productMedia = product.media || product.images || [];
  const firstMedia = productMedia[0];
  // Prioritize showing images, fallback to first media
  const displayMedia = productImages.length > 0 ? { url: productImages[0], type: 'image' } : firstMedia;
  const { toast } = useToast();

  useEffect(() => {
    if (priceRef.current && buttonRef.current) {
      console.log('ProductCard Debug - Price element width:', priceRef.current.offsetWidth);
      console.log('ProductCard Debug - Button element width:', buttonRef.current.offsetWidth);
      console.log('ProductCard Debug - Container width:', priceRef.current.parentElement.offsetWidth);
    }
  });

  const productId = product.id || product._id;
  const isInWishlist = getWishlistItems().some(item => item.id === productId);

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const wishlistItems = getWishlistItems();
    const existingIndex = wishlistItems.findIndex(item => item.id === productId);

    if (existingIndex >= 0) {
      wishlistItems.splice(existingIndex, 1);
      toast({
        title: "Removed from Wishlist",
        description: `${product.name} has been removed from your wishlist.`,
      });
    } else {
      wishlistItems.push({
        id: productId,
        name: product.name,
        price: product.price,
        image: displayMedia?.url
      });
      toast({
        title: "Added to Wishlist",
        description: `${product.name} has been added to your wishlist.`,
      });
    }

    saveWishlistItems(wishlistItems);
  };

  const addToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is authenticated
    const token = localStorage.getItem('artstop_token') || localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add items to your cart.",
        variant: "destructive",
      });
      // Redirect to login page
      window.location.href = '/login';
      return;
    }

    try {
      const response = await api.post('/api/cart', {
        productId: productId,
        quantity: 1,
        variant: '', // Send empty for default
        color: '' // Send empty for default
      });

      if (response.success) {
        toast({
          title: "Added to Cart",
          description: `${product.name} has been added to your cart.`,
        });
        // Trigger cart update event
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        delay: index * 0.1
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Link to={`/product/${productId}`}>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 group-hover:shadow-2xl border border-gray-100 group-hover:border-gray-200">
          {/* Top Section */}
          <div className="relative h-64 overflow-hidden">
            {displayMedia?.type === 'video' ? (
              <motion.video
                src={displayMedia.url}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                whileHover={{ scale: 1.05 }}
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (
              <motion.img
                src={displayMedia?.url}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                whileHover={{ scale: 1.05 }}
              />
            )}
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleWishlist}
              className={`absolute top-4 right-4 p-3 rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm ${
                isInWishlist
                  ? 'bg-red-500 text-white shadow-red-500/25'
                  : 'bg-white/90 text-gray-700 hover:bg-white hover:text-red-500 hover:shadow-xl'
              }`}
            >
              <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
            </motion.button>
          </div>

          {/* Bottom Section */}
          <div className="p-6 bg-gradient-to-b from-white to-gray-50">
            {product.collection && (
              <p className="text-sm text-indigo-600 mb-2 uppercase tracking-wide font-semibold">
                {product.collection}
              </p>
            )}
            <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-indigo-700 transition-colors duration-300">
              {product.name}
            </h3>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium border border-indigo-200 hover:from-indigo-200 hover:to-purple-200 transition-all duration-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p className="text-gray-600 text-sm line-clamp-3 mb-5 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Price and Add to Cart */}
            <div className="flex justify-between items-center gap-4">
              <motion.span
                ref={priceRef}
                className="text-xl font-bold text-gray-900 flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                Rs. {product.price.toLocaleString()}
              </motion.span>
              <Button
                ref={buttonRef}
                onClick={addToCart}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-4 py-2 text-sm"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
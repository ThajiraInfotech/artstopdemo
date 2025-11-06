import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Truck, Shield, RotateCcw, Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { productsApi } from '../lib/api';
import api from '../lib/api';
import { getCartItems, saveCartItems, getWishlistItems, saveWishlistItems, reviews } from '../data/mock';
import { useToast } from '../hooks/use-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [playingVideos, setPlayingVideos] = useState(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

  // Get media (images/videos) from media or fallback to images (only after product is loaded)
  const getProductMedia = (selectedColor) => {
    if (!product) return [];

    // If media exists, normalize to array of {url, type} objects
    if (product.media && product.media.length > 0) {
      let normalizedMedia = product.media.map(item => {
        if (typeof item === 'string') {
          // Old format: string URL, detect type
          const type = item.includes('.mp4') || item.includes('.mov') || item.includes('.avi') || item.includes('.webm') || item.includes('video/upload') ? 'video' : 'image';
          return { url: item, type };
        } else {
          // New format: already {url, type, ...}
          return item;
        }
      });

      // Filter by color if applicable
      if (selectedColor === '') {
        // Show all media when no color is selected
        return normalizedMedia;
      } else {
        // Show color-specific media, fallback to general media if none
        const colorSpecificMedia = normalizedMedia.filter(m => m.color === selectedColor);
        if (colorSpecificMedia.length > 0) {
          return colorSpecificMedia;
        } else {
          // If no color-specific media, show general media (no color)
          return normalizedMedia.filter(m => !m.color);
        }
      }
    }

    // Fallback to old images field (convert to media format)
    return (product.images || []).map(url => ({ url, type: 'image' }));
  };

  const productMedia = getProductMedia(selectedColor);
  const productImages = productMedia.filter(m => m.type === 'image').map(m => m.url);

  // Get image for selected color (for wishlist)
  const getImageForColor = (color) => {
    if (!color || color === '') {
      // Return first image if no color selected
      return productImages[0] || '';
    }

    // Find color-specific image
    const colorMedia = product.media?.find(m => m.color === color && m.type === 'image');
    if (colorMedia) {
      return colorMedia.url;
    }

    // Fallback to first image
    return productImages[0] || '';
  };

  const handleVideoClick = async (videoElement, index) => {
    try {
      if (videoElement.paused) {
        await videoElement.play();
        setPlayingVideos(prev => new Set([...prev, index]));
      } else {
        videoElement.pause();
        setPlayingVideos(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Video play error:', error);
    }
  };

  const openFullscreen = (index) => {
    setFullscreenIndex(index);
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    setZoom(1);
    setZoomOrigin({ x: 50, y: 50 });
    // Stop any playing videos in fullscreen
    setPlayingVideos(prev => {
      const newSet = new Set();
      prev.forEach(key => {
        if (!key.startsWith('fullscreen-')) {
          newSet.add(key);
        }
      });
      return newSet;
    });
  };

  const navigateMain = (direction) => {
    const newIndex = selectedImage + direction;
    if (newIndex >= 0 && newIndex < productMedia.length) {
      setSelectedImage(newIndex);
    }
  };

  const navigateFullscreen = (direction) => {
    const newIndex = fullscreenIndex + direction;
    if (newIndex >= 0 && newIndex < productMedia.length) {
      setFullscreenIndex(newIndex);
      setZoom(1);
      setZoomOrigin({ x: 50, y: 50 });
      // Stop previous video if playing
      setPlayingVideos(prev => {
        const newSet = new Set();
        prev.forEach(key => {
          if (!key.startsWith('fullscreen-')) {
            newSet.add(key);
          }
        });
        return newSet;
      });
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await productsApi.getById(id);
        setProduct(response.data.product || response.data);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Update selected variant and color when product loads
  useEffect(() => {
    if (product) {
      setSelectedVariant(product?.variants?.[0]?.value || '');
      setSelectedColor(''); // Start with all colors shown
    }
  }, [product]);

  // Reset selected image when color changes
  useEffect(() => {
    setSelectedImage(0);
    // Stop all playing videos when color changes
    setPlayingVideos(new Set());
  }, [selectedColor]);

  // Stop playing videos when switching main image
  useEffect(() => {
    setPlayingVideos(prev => {
      const newSet = new Set();
      // Keep only thumbnail and review videos playing
      prev.forEach(key => {
        if (typeof key === 'string' && (key.startsWith('thumb-') || key.startsWith('review-'))) {
          newSet.add(key);
        }
      });
      return newSet;
    });
  }, [selectedImage]);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [reviewMedia, setReviewMedia] = useState([]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block bg-indigo-50 p-3 rounded-2xl mb-6">
            <div className="bg-white p-2 rounded-xl">
              <svg className="w-10 h-10 text-indigo-500 mx-auto animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Product...</h2>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block bg-indigo-50 p-3 rounded-2xl mb-6">
            <div className="bg-white p-2 rounded-xl">
              <svg className="w-10 h-10 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Product Not Found'}</h2>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const selectedVariantData = product.variants?.find(v => v.value === selectedVariant);
  const currentPrice = selectedVariantData?.price || product.price;

  const addToCart = async () => {
    try {
      const productId = product.id || product._id;
      console.log('Frontend addToCart - Product ID:', productId);
      console.log('Frontend addToCart - Quantity:', quantity);
      console.log('Frontend addToCart - Selected Variant:', selectedVariant);
      console.log('Frontend addToCart - Selected Color:', selectedColor);
      console.log('Frontend addToCart - Request body:', {
        productId,
        quantity,
        variant: selectedVariant,
        color: selectedColor
      });
      const response = await api.post('/api/cart', {
        productId,
        quantity,
        variant: selectedVariant,
        color: selectedColor
      });
      console.log('Frontend addToCart - API Response:', response);

      if (response.success) {
        toast({
          title: "Added to Cart",
          description: `${product.name} has been added to your cart.`,
        });
        // Dispatch custom event to update cart count in navbar
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleWishlist = () => {
    const productId = product.id || product._id;
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
        image: getImageForColor(selectedColor)
      });
      toast({
        title: "Added to Wishlist",
        description: `${product.name} has been added to your wishlist.`,
      });
    }

    saveWishlistItems(wishlistItems);
  };

  const isInWishlist = getWishlistItems().some(item => item.id === (product.id || product._id));
  const productReviews = reviews.filter(review => review.productId === (product.id || product._id));

  // Review form handlers
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newMedia = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video'
    }));
    setReviewMedia([...reviewMedia, ...newMedia]);
  };

  const removeMedia = (index) => {
    const newMedia = [...reviewMedia];
    URL.revokeObjectURL(newMedia[index].url);
    newMedia.splice(index, 1);
    setReviewMedia(newMedia);
  };

  const submitReview = () => {
    if (!reviewRating || !reviewTitle.trim() || !reviewContent.trim() || !displayName.trim() || !email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // In a real app, this would send to backend
    const newReview = {
      id: Date.now(),
      productId: product.id || product._id,
      userName: displayName,
      rating: reviewRating,
      comment: reviewContent,
      title: reviewTitle,
      date: new Date().toISOString().split('T')[0],
      verified: false,
      media: reviewMedia
    };

    // Reset form
    setReviewRating(0);
    setReviewTitle('');
    setReviewContent('');
    setDisplayName('');
    setEmail('');
    setReviewMedia([]);
    setShowReviewForm(false);

    toast({
      title: "Review Submitted",
      description: "Thank you for your review! It will be published after moderation.",
    });
  };

  const cancelReview = () => {
    // Clean up object URLs
    reviewMedia.forEach(media => URL.revokeObjectURL(media.url));
    setReviewRating(0);
    setReviewTitle('');
    setReviewContent('');
    setDisplayName('');
    setEmail('');
    setReviewMedia([]);
    setShowReviewForm(false);
  };

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = productReviews.filter(review => review.rating === rating).length;
    const percentage = productReviews.length > 0 ? (count / productReviews.length) * 100 : 0;
    return { rating, count, percentage };
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-gray-700">Products</Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Media */}
          <div className="space-y-4">
            {/* Main Media */}
            <div
              className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
              onClick={() => openFullscreen(selectedImage)}
              onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
              onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
              onTouchEnd={() => {
                if (!touchStart || !touchEnd) return;
                const distance = touchStart - touchEnd;
                const isLeftSwipe = distance > 50;
                const isRightSwipe = distance < -50;
                if (isLeftSwipe && selectedImage < productMedia.length - 1) {
                  navigateMain(1);
                }
                if (isRightSwipe && selectedImage > 0) {
                  navigateMain(-1);
                }
                setTouchStart(null);
                setTouchEnd(null);
              }}
            >
              {/* Navigation Arrows */}
              {productMedia.length > 1 && (
                <>
                  {selectedImage > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateMain(-1);
                      }}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                  )}
                  {selectedImage < productMedia.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateMain(1);
                      }}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  )}
                </>
              )}
              {productMedia[selectedImage]?.type === 'video' ? (
                <div className="relative w-full h-full">
                  <video
                    src={productMedia[selectedImage].url}
                    alt={product.name}
                    className="w-full h-full object-cover transition-opacity duration-500 ease-in-out"
                    muted
                    loop
                    playsInline
                  />
                  {/* Play button overlay - always visible */}
                  {!playingVideos.has(`main-${selectedImage}`) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <button
                        onClick={async () => {
                          const video = document.querySelector(`video[alt="${product.name}"]`);
                          if (video) {
                            try {
                              await video.play();
                              setPlayingVideos(prev => new Set([...prev, `main-${selectedImage}`]));
                            } catch (error) {
                              console.error('Video play error:', error);
                            }
                          }
                        }}
                        className="bg-white bg-opacity-90 rounded-full p-4 shadow-lg hover:bg-opacity-100 transition-all duration-200"
                      >
                        <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <img
                  src={productMedia[selectedImage]?.url || productImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-opacity duration-500 ease-in-out"
                />
              )}
            </div>

            {/* Thumbnail Media */}
            {productMedia.length > 1 && (
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {productMedia.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedImage === index ? 'border-blue-600' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {media.type === 'video' ? (
                      <div className="relative w-full h-full">
                        <video
                          src={media.url}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                        />
                        {/* Play button overlay - always visible */}
                        {!playingVideos.has(`thumb-${index}`) && (
                          <div
                            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the parent button's onClick
                              const videos = document.querySelectorAll(`video[alt*="${product.name}"]`);
                              const video = Array.from(videos).find(v => v.src === media.url);
                              if (video) {
                                video.play().then(() => {
                                  setPlayingVideos(prev => new Set([...prev, `thumb-${index}`]));
                                }).catch(error => {
                                  console.error('Video play error:', error);
                                });
                              }
                            }}
                          >
                            <div className="bg-white bg-opacity-90 rounded-full p-2 shadow-lg hover:bg-opacity-100 transition-all duration-200">
                              <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <img
                        src={media.url}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              {/* Rating */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="text-lg font-medium">{product.rating}</span>
                <span className="text-gray-500">({product.reviewCount} reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-4 mb-3">
                <span className="text-3xl font-bold text-gray-900">
                  Rs. {currentPrice.toLocaleString()}
                </span>
                {product.oldPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    Rs. {product.oldPrice.toLocaleString()}
                  </span>
                )}
                {product.oldPrice && (
                  <Badge variant="destructive" className="text-sm">
                    Save {Math.round(((product.oldPrice - currentPrice) / product.oldPrice) * 100)}%
                  </Badge>
                )}
              </div>
              {/* Selected size display (no price here) */}
              {selectedVariantData && (
                <div className="text-sm text-gray-600 mb-6">
                  Selected size:{" "}
                  <span className="font-medium text-gray-900">{selectedVariantData.name}</span>
                  {selectedVariantData.dimensions ? (
                    <span> — {selectedVariantData.dimensions}</span>
                  ) : null}
                </div>
              )}
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Size</h3>
                <RadioGroup
                  value={selectedVariant}
                  onValueChange={(v) => setSelectedVariant(v)}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  {product.variants.map((variant) => {
                    const id = `size-${variant.value}`;
                    return (
                      <Label
                        key={variant.value}
                        htmlFor={id}
                        className={`flex items-center justify-between border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedVariant === variant.value ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem id={id} value={variant.value} />
                          <div className="font-medium text-gray-900">{variant.name}{variant.dimensions ? `: ${variant.dimensions}` : ''}</div>
                        </div>
                        {selectedVariant === variant.value && (
                          <span className="text-xs text-green-600 font-medium">Selected</span>
                        )}
                      </Label>
                    );
                  })}
                </RadioGroup>
              </div>
            )}

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Color</h3>
                <div className="flex flex-wrap gap-3">
                  {/* All Colors option */}
                  <button
                    onClick={() => setSelectedColor('')}
                    className={`relative px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                      selectedColor === ''
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400 text-gray-700'
                    }`}
                    title="All Colors"
                  >
                    All Colors
                  </button>
                  {product.colors.map((color) => {
                    // Function to get color value from color name
                    const getColorValue = (colorName) => {
                      const colorMap = {
                        'Red': '#dc2626',
                        'Blue': '#2563eb',
                        'Green': '#16a34a',
                        'Yellow': '#eab308',
                        'Purple': '#9333ea',
                        'Pink': '#ec4899',
                        'Black': '#000000',
                        'White': '#ffffff',
                        'Gray': '#6b7280',
                        'Brown': '#92400e',
                        'Orange': '#ea580c',
                        'Navy': '#1e40af',
                        'Maroon': '#7f1d1d',
                        'Gold': '#d4af37',
                        'Silver': '#9ca3af'
                      };
                      return colorMap[colorName] || '#6b7280'; // Default to gray
                    };

                    const colorValue = getColorValue(color);

                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`relative w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                          selectedColor === color
                            ? 'border-blue-600 scale-110'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        title={color}
                        style={{ backgroundColor: colorValue }}
                      >
                        {selectedColor === color && (
                          <div className="absolute inset-0 rounded-full border-2 border-white"></div>
                        )}
                        {colorValue === '#ffffff' && (
                          <div className="absolute inset-0 rounded-full border border-gray-300"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedColor ? (
                  <p className="text-sm text-gray-600">
                    Selected: <span className="font-medium">{selectedColor}</span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Showing all media
                  </p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quantity</h3>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                onClick={addToCart}
                className="flex-1 bg-black text-white hover:bg-gray-800 py-3 text-lg font-medium rounded-full"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                onClick={toggleWishlist}
                className="px-6 py-3 rounded-full"
              >
                <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current text-red-500' : ''}`} />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <Truck className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="text-sm text-gray-600">Free Shipping</p>
              </div>
              <div className="text-center">
                <Shield className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="text-sm text-gray-600">2 Year Warranty</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="text-sm text-gray-600">30 Day Returns</p>
              </div>
            </div>

            {/* Customize CTA */}
            <Card className="bg-gradient-to-r from-blue-50 to-orange-50 border-blue-200">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Want Something Custom?</h3>
                <p className="text-gray-600 mb-4">Let us create a personalized version just for you</p>
                <Link to="/customize">
                  <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                    Customize This Product
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-8">
              <Card>
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-4">Product Description</h3>
                  <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Rating Overview */}
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold mb-2">{product.rating}</div>
                      <div className="flex items-center justify-center mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <p className="text-gray-600">{product.reviewCount} reviews</p>
                    </div>
                    
                    <div className="space-y-3">
                      {ratingDistribution.map(({ rating, count, percentage }) => (
                        <div key={rating} className="flex items-center space-x-3">
                          <span className="text-sm w-3">{rating}</span>
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-400 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Reviews List */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Write a Review Button */}
                  {!showReviewForm && (
                    <Card className="border-dashed border-2">
                      <CardContent className="p-6 text-center">
                        <h3 className="text-lg font-semibold mb-2">Share Your Experience</h3>
                        <p className="text-gray-600 mb-4">Help others by writing a review for this product</p>
                        <Button onClick={() => setShowReviewForm(true)} className="bg-black text-white hover:bg-gray-800">
                          Write a Review
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Review Form */}
                  {showReviewForm && (
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-6">Write a Review</h3>

                        {/* Rating */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`h-8 w-8 ${
                                    star <= reviewRating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300 hover:text-yellow-400'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Review Title */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Review Title *
                          </label>
                          <p className="text-sm text-gray-500 mb-2">Give your review a title</p>
                          <Input
                            value={reviewTitle}
                            onChange={(e) => setReviewTitle(e.target.value)}
                            placeholder="Summarize your experience"
                            maxLength={100}
                          />
                        </div>

                        {/* Review Content */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Review Content *
                          </label>
                          <p className="text-sm text-gray-500 mb-2">Start writing here...</p>
                          <Textarea
                            value={reviewContent}
                            onChange={(e) => setReviewContent(e.target.value)}
                            placeholder="Share details of your experience with this product"
                            rows={6}
                            maxLength={1000}
                          />
                          <div className="text-right text-sm text-gray-500 mt-1">
                            {reviewContent.length}/1000
                          </div>
                        </div>

                        {/* Media Upload */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Picture/Video (optional)
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <input
                              type="file"
                              multiple
                              accept="image/*,video/*"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="media-upload"
                            />
                            <label htmlFor="media-upload" className="cursor-pointer">
                              <div className="text-center">
                                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF, MP4 up to 10MB each</p>
                              </div>
                            </label>
                          </div>

                          {/* Media Preview */}
                          {reviewMedia.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                              {reviewMedia.map((media, index) => (
                                <div key={index} className="relative">
                                  {media.type === 'image' ? (
                                    <img
                                      src={media.url}
                                      alt={`Upload ${index + 1}`}
                                      className="w-full h-24 object-cover rounded-lg"
                                    />
                                  ) : (
                                    <div className="relative w-full h-24 rounded-lg overflow-hidden">
                                      <video
                                        src={media.url}
                                        className="w-full h-full object-cover"
                                        muted
                                        loop
                                        playsInline
                                      />
                                      {/* Play button overlay - always visible */}
                                      {!playingVideos.has(`review-${index}`) && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                          <button
                                            onClick={async () => {
                                              const videos = document.querySelectorAll('video');
                                              const video = Array.from(videos).find(v => v.src === media.url);
                                              if (video) {
                                                try {
                                                  await video.play();
                                                  setPlayingVideos(prev => new Set([...prev, `review-${index}`]));
                                                } catch (error) {
                                                  console.error('Video play error:', error);
                                                }
                                              }
                                            }}
                                            className="bg-white bg-opacity-90 rounded-full p-2 shadow-lg hover:bg-opacity-100 transition-all duration-200"
                                          >
                                            <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                            </svg>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeMedia(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Display Name */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Display Name *
                          </label>
                          <p className="text-sm text-gray-500 mb-2">Displayed publicly like "John Smith"</p>
                          <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your display name"
                          />
                        </div>

                        {/* Email */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <p className="text-sm text-gray-500 mb-2">Your email address</p>
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your.email@example.com"
                          />
                        </div>

                        {/* Terms */}
                        <div className="mb-6">
                          <p className="text-sm text-gray-600">
                            How we use your data: We'll only contact you about the review you left, and only if necessary. By submitting your review, you agree to Judge.me's terms, privacy and content policies.
                          </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex space-x-4">
                          <Button
                            onClick={cancelReview}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel Review
                          </Button>
                          <Button
                            onClick={submitReview}
                            className="flex-1 bg-black text-white hover:bg-gray-800"
                          >
                            Submit Review
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Existing Reviews */}
                  {productReviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">{review.userName}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                              {review.verified && (
                                <Badge variant="secondary" className="text-xs">Verified</Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">{review.date}</span>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="shipping" className="mt-8">
              <Card>
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-6">Shipping Information</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">Free Shipping</h4>
                      <p className="text-gray-700">Free standard shipping on all orders over Rs. 5,000</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Delivery Time</h4>
                      <p className="text-gray-700">Standard: 5-7 business days</p>
                      <p className="text-gray-700">Express: 2-3 business days (additional charges apply)</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Returns</h4>
                      <p className="text-gray-700">30-day return policy. Items must be in original condition.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Fullscreen Media Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black z-50 transition-opacity duration-500 ease-in-out"
          onClick={closeFullscreen}
        >
          <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation Arrows */}
            {fullscreenIndex > 0 && (
              <button
                onClick={() => navigateFullscreen(-1)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 transition-all"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
            )}
            {fullscreenIndex < productMedia.length - 1 && (
              <button
                onClick={() => navigateFullscreen(1)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 transition-all"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            )}

            {/* Media Content */}
            <div
              className="w-full h-full overflow-hidden flex items-center justify-center"
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                const newZoom = Math.max(1, Math.min(5, zoom + delta));
                setZoom(newZoom);
                const rect = e.currentTarget.getBoundingClientRect();
                setZoomOrigin({
                  x: ((e.clientX - rect.left) / rect.width) * 100,
                  y: ((e.clientY - rect.top) / rect.height) * 100,
                });
              }}
              onDoubleClick={() => {
                setZoom(1);
                setZoomOrigin({ x: 50, y: 50 });
              }}
            >
              {productMedia[fullscreenIndex]?.type === 'video' ? (
                <video
                  src={productMedia[fullscreenIndex].url}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={productMedia[fullscreenIndex]?.url}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain cursor-zoom-in"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    transition: zoom === 1 ? 'transform 0.3s ease-out' : 'none',
                  }}
                />
              )}
            </div>

            {/* Media Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {fullscreenIndex + 1} / {productMedia.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
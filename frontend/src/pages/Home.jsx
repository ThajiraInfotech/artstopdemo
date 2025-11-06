import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import ProductCard from '../components/ProductCard';
import { productsApi, categoriesApi } from '../lib/api';
import { categories as mockCategories, products as mockProducts, instagramReels, testimonials, instagramProfileUrl } from '../data/mock';

const Home = () => {
  const { scrollY } = useScroll();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [categories, setCategories] = useState(mockCategories);
  const [loading, setLoading] = useState(true);

  // Parallax effects
  const heroY = useTransform(scrollY, [0, 500], [0, -150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.8]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch categories
        try {
          const categoriesResponse = await categoriesApi.getAll();
          setCategories(categoriesResponse.data?.categories || mockCategories);
        } catch (catError) {
          console.warn('Failed to fetch categories from API, using mock data:', catError);
          setCategories(mockCategories);
        }

        // Fetch latest products
        try {
          const productsResponse = await productsApi.getAll({
            sort: 'newest',
            limit: 6
          });
          setDisplayedProducts(productsResponse.data?.products || mockProducts.slice(0, 6));
        } catch (prodError) {
          console.warn('Failed to fetch products from API, using mock data:', prodError);
          setDisplayedProducts(mockProducts.slice(0, 6));
        }

      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Fallback to mock data
        setCategories(mockCategories);
        setDisplayedProducts(mockProducts.slice(0, 6));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
<motion.section 
  className="relative bg-white py-10 lg:py-16"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.8 }}
>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Grid Layout */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Main Hero Left */}
      <motion.div 
        className="lg:col-span-7 relative rounded-2xl overflow-hidden"
        whileHover={{ scale: 1.01 }}
      >
        <img 
          src="/homepage/mainpic.heic"
          alt="Summer Outfit"
          className="w-full h-[500px] object-cover rounded-2xl"
        />
       <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-8">
  <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-tight drop-shadow-lg">
    Welcome to ArtStop  </h1>
  <p className="text-white/90 mt-3 max-w-xl text-lg">
    Discover stunning collections, creative inspirations & trendy designs — all in one stop!
  </p>
  <Link to="/categories" className="mt-6">
    <Button className="bg-blue-500 hover:bg-blue-600 text-black font-semibold px-8 py-3 rounded-full text-lg shadow-lg transition-transform hover:scale-105">
      ✨ Explore Collections →
    </Button>
  </Link>
</div>

      </motion.div>

      {/* Right Side 2x2 Grid */}
      <div className="lg:col-span-5 grid grid-cols-2 gap-4">
        {[
          { img: "/homepage/islamicart.heic", title: "Islamic Art" },
          { img: "/homepage/homedecor.heic", title: "Home Decor" },
          { img: "/homepage/gifts.heic", title: "Gifts" },
          { img: "/homepage/cutouts.heic", title: "Cutouts & Signage" }
        ].map((card, i) => (
          <motion.div
            key={i}
            className="relative rounded-2xl overflow-hidden group shadow-md ring-1 ring-black/5 aspect-[1/1] hover:shadow-lg transition-shadow"
            whileHover={{ scale: 1.03 }}
          >
            <img
              src={card.img}
              alt={card.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
              <h3 className="text-white text-lg font-semibold drop-shadow-md">{card.title}</h3>
            </div>
          </motion.div>
        ))}
      </div>
    </div>

    {/* Below Section - Inspirations */}
    {/* Below Section - More from ArtStop */}
<div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Customization */}
  <motion.div whileHover={{ y: -5 }} className="relative rounded-2xl overflow-hidden">
    <img 
      src="/homepage/customization.heic"
      className="h-64 w-full object-cover"
      alt="Customization" 
    />
    <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-6">
      <h3 className="text-white text-xl font-bold">Customization</h3>
      <p className="text-white/80 text-sm mt-2">
        Design your own artwork with choice of material, colors & text.
      </p>
    </div>
  </motion.div>

  {/* Workshops */}
  <motion.div whileHover={{ y: -5 }} className="relative rounded-2xl overflow-hidden">
    <img 
      src="/homepage/workshops.PNG"
      className="h-64 w-full object-cover"
      alt="Workshops" 
    />
    <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-6">
      <h3 className="text-white text-xl font-bold">Workshops</h3>
      <p className="text-white/80 text-sm mt-2">
        Learn Resin Art, Themed Classes & Business Setup guidance.
      </p>
    </div>
  </motion.div>

  {/* Customer Creations / Gallery */}
  <motion.div whileHover={{ y: -5 }} className="relative rounded-2xl overflow-hidden">
    <img 
      src="/homepage/customercreation.heic"
      className="h-64 w-full object-cover"
      alt="Customer Creations" 
    />
    <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-6">
      <h3 className="text-white text-xl font-bold">Customer Creations</h3>
      <p className="text-white/80 text-sm mt-2">
        Explore artworks made for our clients — real homes & stories.
      </p>
    </div>
  </motion.div>
</div>

  </div>
</motion.section>



      {/* Categories Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8 }}
        className="py-16 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Browse by Categories
            </h2>
          
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {categories.map((category, index) => (
              <motion.div
                key={category.id || category._id || category.slug || index}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <Link to={`/categories/${category.slug}/collections`}>
                  <Card className="h-80 bg-white border-0 shadow-lg overflow-hidden group hover:shadow-2xl transition-all duration-500">
                    <CardContent className="p-0 h-full relative">
                      <motion.img 
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      />
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                        whileHover={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent, transparent)" }}
                        transition={{ duration: 0.3 }}
                      />
                      <motion.div 
                        className="absolute bottom-6 left-6 text-white"
                        whileHover={{ y: -5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                        <p className="text-sm text-white/80">{category.collections?.length || 0} collections</p>
                      </motion.div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Products */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
        className="py-16 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="flex justify-between items-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Latest Products</h2>
              <p className="text-gray-600 mt-2">Discover our newest additions to the collection</p>
            </div>
            <Link to="/products">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="outline" className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300">
                  <span>View All</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedProducts.map((product, index) => (
              <ProductCard key={product.id || product._id || index} product={product} index={index} />
            ))}
          </div>

          {/* CTA Button */}
          <div className="flex justify-center mt-8">
            <Link to="/products">
              <Button className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-3 rounded-full font-semibold">
                View All Products
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Instagram Reels Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
        className="py-16 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Instagram Reels
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              See our latest creations and customer showcases on Instagram
            </p>
            <div className="mt-4">
              <a href={instagramProfileUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-2 rounded-full font-semibold">
                  Follow us on Instagram
                </Button>
              </a>
            </div>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {instagramReels.map((reel, index) => (
              <motion.div
                key={reel.id}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <a href={reel.url} target="_blank" rel="noopener noreferrer">
                  <Card className="bg-white border-0 shadow-lg overflow-hidden group hover:shadow-2xl transition-all duration-500 cursor-pointer">
                    <CardContent className="p-0 relative">
                      <div className="aspect-[9/16] relative overflow-hidden">
                        <video
                          src={encodeURI(reel.videoSrc)}
                          className="w-full h-full object-cover"
                          muted
                          autoPlay
                          loop
                          playsInline
                          preload="metadata"
                        />
                        <motion.div
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"
                        />
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          <span className="text-white text-sm font-semibold tracking-wide bg-black/60 px-3 py-1 rounded-full">
                            View
                          </span>
                        </motion.div>
                        <span className="sr-only">{reel.title}</span>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
        className="py-16 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied customers who have transformed their spaces with our art
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500">
                  <CardContent className="p-8">
                    <motion.div 
                      className="flex items-center mb-4"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                    >
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: i * 0.1 }}
                        >
                          <Star 
                            className={`h-5 w-5 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                    <motion.p 
                      className="text-gray-700 mb-6 leading-relaxed"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      "{testimonial.comment}"
                    </motion.p>
                    <motion.div 
                      className="flex items-center space-x-4"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      <img 
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                        <p className="text-sm text-gray-500">{testimonial.location}</p>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;
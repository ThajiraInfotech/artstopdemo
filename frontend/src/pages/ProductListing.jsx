import React, { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Grid, List, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import ProductCard from '../components/ProductCard';
import { productsApi, categoriesApi } from '../lib/api';
import { products as mockProducts, categories as mockCategories } from '../data/mock';

const ProductListing = () => {
  const { category, collection } = useParams();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const searchQuery = searchParams.get('search') || '';
  const productsPerPage = 12;

  // Fetch products and categories from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch categories
        try {
          const categoriesResponse = await categoriesApi.getAll();
          setCategories(categoriesResponse.data?.categories || []);
        } catch (catError) {
          console.warn('Failed to fetch categories from API, using mock data:', catError);
          setCategories(mockCategories);
        }

        // Fetch products with current filters
        const params = {
          page: currentPage,
          limit: productsPerPage,
          sort: sortBy,
          search: searchQuery,
          category: selectedCategories.length === 1 ? selectedCategories[0] : category || undefined,
          collection: selectedCollections.length === 1 ? selectedCollections[0] : collection || undefined,
          minPrice: priceRange !== 'all' ? priceRange.split('-')[0] : undefined,
          maxPrice: priceRange !== 'all' && priceRange.split('-')[1] ? priceRange.split('-')[1] : undefined,
        };

        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        const productsResponse = await productsApi.getAll(params);
        setProducts(productsResponse.data?.products || []);
        setTotalProducts(productsResponse.data?.pagination?.totalItems || 0);
        setTotalPages(productsResponse.data?.pagination?.totalPages || 1);

      } catch (err) {
        console.error('Failed to fetch data from API:', err);
        setError('Failed to load products. Please try again.');
        // Fallback to mock data
        setProducts(mockProducts);
        setCategories(mockCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, collection, searchQuery, sortBy, priceRange, currentPage, selectedCategories, selectedCollections]);

  // Since we're fetching filtered products from API, use them directly
  const filteredProducts = products;

  // Since products are already paginated from API, use them directly
  const paginatedProducts = products;

  const categoryInfo = category ? categories.find(cat => cat.slug === category) : null;

  // Get collection name from slug
  const getCollectionName = (collectionSlug) => {
    if (!categoryInfo || !collectionSlug) return null;
    return categoryInfo.collections.find(col =>
      col.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === collectionSlug
    );
  };

  const collectionName = collection ? getCollectionName(collection) : null;

  // Build available collections based on current context
  const availableCollections = useMemo(() => {
    if (category) {
      return categories.find(cat => cat.slug === category)?.collections || [];
    }
    if (selectedCategories.length > 0) {
      const set = new Set();
      selectedCategories.forEach(slug => {
        const cat = categories.find(c => c.slug === slug);
        cat?.collections.forEach(col => set.add(col));
      });
      return Array.from(set);
    }
    const set = new Set();
    categories.forEach(cat => cat.collections.forEach(col => set.add(col)));
    return Array.from(set);
  }, [category, selectedCategories]);

  const countProductsForCollection = (colName) => {
    return products.filter(p => {
      const matchCollection = p.collection === colName;
      const matchCategory = category ? p.category === category : (selectedCategories.length > 0 ? selectedCategories.includes(p.category) : true);
      return matchCollection && matchCategory;
    }).length;
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedCollections([]);
    setPriceRange('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Check if any filters are applied
  const hasActiveFilters = selectedCategories.length > 0 || selectedCollections.length > 0 || priceRange !== 'all' || sortBy !== 'newest';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
            <span>/</span>
            {category ? (
              <>
                <Link to="/categories" className="hover:text-indigo-600 transition-colors">Categories</Link>
                <span>/</span>
                <Link to={`/categories/${category}/collections`} className="hover:text-indigo-600 transition-colors">{categoryInfo?.name}</Link>
                {collection && collectionName ? (
                  <>
                    <span>/</span>
                    <span className="text-gray-900 font-medium">{collectionName}</span>
                  </>
                ) : null}
              </>
            ) : (
              <span className="text-gray-900 font-medium">Products</span>
            )}
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {searchQuery ? `Search Results for "${searchQuery}"` :
                  collectionName ? collectionName :
                  categoryInfo ? categoryInfo.name : 'All Products'}
              </h1>
              <p className="text-gray-600">
                {totalProducts} {totalProducts === 1 ? 'product' : 'products'} found
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="ml-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                  >
                    <X className="h-3 w-3 mr-1" /> Clear filters
                  </button>
                )}
              </p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                className="lg:hidden flex items-center"
                onClick={() => setShowMobileFilters(true)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>

              {/* View Mode Toggle */}
              <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none border-r border-gray-200 h-9 w-9 p-0"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none h-9 w-9 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-white border-gray-200">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block w-64 space-y-6">
            <Card className="bg-white p-6 border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
                <Filter className="h-5 w-5 mr-2 text-indigo-600" />
                Filters
              </h3>
              
              {/* Price Range Filter */}
              <div className="space-y-4 mb-6">
                <h4 className="font-medium text-gray-900">Price Range</h4>
                <div className="space-y-3">
                  {[
                    { value: 'all', label: 'All Prices' },
                    { value: '0-3000', label: 'Under ₹3,000' },
                    { value: '3000-6000', label: '₹3,000 - ₹6,000' },
                    { value: '6000-10000', label: '₹6,000 - ₹10,000' },
                    { value: '10000', label: 'Over ₹10,000' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="radio"
                          name="priceRange"
                          value={option.value}
                          checked={priceRange === option.value}
                          onChange={(e) => setPriceRange(e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                          ${priceRange === option.value ? 'border-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'}`}>
                          {priceRange === option.value && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                        </div>
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition-colors">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Categories Filter */}
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-900">Categories</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {categories.map((cat) => (
                    <label key={cat.id || cat._id || cat.slug} className="flex items-center space-x-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat.slug)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategories([...selectedCategories, cat.slug]);
                            } else {
                              setSelectedCategories(selectedCategories.filter(c => c !== cat.slug));
                            }
                            setCurrentPage(1);
                          }}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                          ${selectedCategories.includes(cat.slug) 
                            ? 'bg-indigo-600 border-indigo-600' 
                            : 'border-gray-300 group-hover:border-indigo-400'}`}>
                          {selectedCategories.includes(cat.slug) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition-colors flex-1">{cat.name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {cat.productCount || 0}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedCategories.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCategories([]);
                      setCurrentPage(1);
                    }}
                    className="w-full mt-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                  >
                    Clear Categories
                  </Button>
                )}
              </div>

              {/* Collections Filter */}
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-900">Collections</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {availableCollections.map((col, index) => (
                    <label key={col || index} className="flex items-center space-x-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedCollections.includes(col)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCollections([...selectedCollections, col]);
                            } else {
                              setSelectedCollections(selectedCollections.filter(c => c !== col));
                            }
                            setCurrentPage(1);
                          }}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                          ${selectedCollections.includes(col)
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'border-gray-300 group-hover:border-indigo-400'}`}>
                          {selectedCollections.includes(col) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition-colors flex-1">{col}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {countProductsForCollection(col)}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedCollections.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCollections([]);
                      setCurrentPage(1);
                    }}
                    className="w-full mt-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                  >
                    Clear Collections
                  </Button>
                )}
              </div>
            </Card>

            {/* Featured Category Banner */}
            <Card className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white border-0">
              <h3 className="font-semibold mb-2">Custom Designs</h3>
              <p className="text-sm text-indigo-100 mb-4">Can't find what you're looking for?</p>
              <Link to="/customize">
                <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-medium">
                  Request Custom Design
                </Button>
              </Link>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {paginatedProducts.length > 0 ? (
              <>
                <motion.div 
                  className={viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
                    : "space-y-6"
                  }
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  {paginatedProducts.map((product, index) => (
                    <ProductCard
                      key={product.id || product._id || index}
                      product={product}
                      index={index}
                      layout={viewMode}
                    />
                  ))}
                </motion.div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-12">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="flex items-center border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {[...Array(totalPages)].map((_, i) => {
                        // Show limited page numbers with ellipsis for many pages
                        if (totalPages <= 7 || 
                            i === 0 || 
                            i === totalPages - 1 || 
                            (i >= currentPage - 2 && i <= currentPage + 2)) {
                          return (
                            <Button
                              key={i + 1}
                              variant={currentPage === i + 1 ? "default" : "outline"}
                              onClick={() => setCurrentPage(i + 1)}
                              className="w-10 h-10 p-0"
                            >
                              {i + 1}
                            </Button>
                          );
                        } else if (i === currentPage - 3 || i === currentPage + 3) {
                          return <span key={i + 1} className="px-2 text-gray-500">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="flex items-center border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">No products found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">Try adjusting your filters or search terms to find what you're looking for.</p>
                <div className="space-x-4">
                  <Button onClick={clearAllFilters} variant="outline" className="border-gray-300">
                    Clear All Filters
                  </Button>
                  <Link to="/categories">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      Browse Categories
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Overlay */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
            />
            <motion.div 
              className="fixed right-0 top-0 h-full w-80 bg-white z-50 shadow-xl lg:hidden overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeInOut' }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowMobileFilters(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Price Range Filter */}
                <div className="space-y-4 mb-6">
                  <h4 className="font-medium text-gray-900">Price Range</h4>
                  <div className="space-y-3">
                    {[
                      { value: 'all', label: 'All Prices' },
                      { value: '0-3000', label: 'Under ₹3,000' },
                      { value: '3000-6000', label: '₹3,000 - ₹6,000' },
                      { value: '6000-10000', label: '₹6,000 - ₹10,000' },
                      { value: '10000', label: 'Over ₹10,000' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="radio"
                            name="priceRangeMobile"
                            value={option.value}
                            checked={priceRange === option.value}
                            onChange={(e) => setPriceRange(e.target.value)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                            ${priceRange === option.value ? 'border-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'}`}>
                            {priceRange === option.value && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                          </div>
                        </div>
                        <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition-colors">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Categories Filter */}
                <div className="space-y-4 border-t border-gray-200 pt-6">
                  <h4 className="font-medium text-gray-900">Categories</h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {categories.map((cat) => (
                      <label key={cat.id || cat._id || cat.slug} className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(cat.slug)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([...selectedCategories, cat.slug]);
                              } else {
                                setSelectedCategories(selectedCategories.filter(c => c !== cat.slug));
                              }
                              setCurrentPage(1);
                            }}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                            ${selectedCategories.includes(cat.slug) 
                              ? 'bg-indigo-600 border-indigo-600' 
                              : 'border-gray-300 group-hover:border-indigo-400'}`}>
                            {selectedCategories.includes(cat.slug) && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition-colors flex-1">{cat.name}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {products.filter(p => p.category === cat.slug).length}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Collections Filter (Mobile) */}
                <div className="space-y-4 border-t border-gray-200 pt-6">
                  <h4 className="font-medium text-gray-900">Collections</h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {availableCollections.map((col, index) => (
                      <label key={col || index} className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={selectedCollections.includes(col)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCollections([...selectedCollections, col]);
                              } else {
                                setSelectedCollections(selectedCollections.filter(c => c !== col));
                              }
                              setCurrentPage(1);
                            }}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                            ${selectedCollections.includes(col)
                              ? 'bg-indigo-600 border-indigo-600'
                              : 'border-gray-300 group-hover:border-indigo-400'}`}>
                            {selectedCollections.includes(col) && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition-colors flex-1">{col}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {countProductsForCollection(col)}
                        </span>
                      </label>
                    ))}
                  </div>
                  {selectedCollections.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCollections([]);
                        setCurrentPage(1);
                      }}
                      className="w-full mt-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                    >
                      Clear Collections
                    </Button>
                  )}
                </div>

                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-gray-300"
                      onClick={() => {
                        setSelectedCategories([]);
                        setSelectedCollections([]);
                        setPriceRange('all');
                      }}
                    >
                      Reset
                    </Button>
                    <Button 
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => setShowMobileFilters(false)}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductListing;
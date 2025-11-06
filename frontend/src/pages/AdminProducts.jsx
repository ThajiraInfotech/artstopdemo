import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { productsApi, categoriesApi, uploadApi, ApiError } from "../lib/api";
import {
  categories as seedCategories,
  products as seedProducts,
  getCategories,
  saveCategories,
  getProducts,
  saveProducts,
  getOrders,
} from "../data/mock";
import { Edit, Trash2, Package, Search, Filter, RefreshCw, Plus, X } from "lucide-react";
import { Link } from "react-router-dom";
import AddProductModal from "../components/AddProductModal";
import EditProductModal from "../components/EditProductModal";

const AdminProducts = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [inStockFilter, setInStockFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getAllAdmin({ limit: 1000 }); // Get all for admin
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleProductAdded = (newProduct) => {
    // Refresh products list to include the new product
    fetchProducts();
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowEditProductModal(true);
  };

  const handleProductUpdated = () => {
    // Refresh products list to show updated product
    fetchProducts();
    setSelectedProduct(null);
  };

  // Handle delete product
  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      return;
    }

    try {
      await productsApi.delete(productId);
      setProducts(prev => prev.filter(p => p._id !== productId));
      toast({
        title: "Success",
        description: `${productName} has been deleted`,
      });
    } catch (error) {
      console.error('Delete product error:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !search ||
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      const matchesInStock = inStockFilter === "all" ||
        (inStockFilter === "in-stock" && product.inStock) ||
        (inStockFilter === "out-of-stock" && !product.inStock);
      const matchesFeatured = featuredFilter === "all" ||
        (featuredFilter === "featured" && product.featured) ||
        (featuredFilter === "not-featured" && !product.featured);

      return matchesSearch && matchesCategory && matchesInStock && matchesFeatured;
    });
  }, [products, search, categoryFilter, inStockFilter, featuredFilter]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))];
    return cats.sort();
  }, [products]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: filteredProducts.length,
      inStock: filteredProducts.filter(p => p.inStock).length,
      featured: filteredProducts.filter(p => p.featured).length,
      totalValue: filteredProducts.reduce((sum, p) => sum + (p.price || 0), 0)
    };
  }, [filteredProducts]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white lg:ml-64">
      <div className="p-4 lg:p-8 pt-16 lg:pt-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <img
              src="/artstoplogo.png"
              alt="ArtStop"
              className="h-8 w-auto object-contain drop-shadow-sm"
            />
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-sm lg:text-base text-gray-600">Manage your product catalog</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-gray-300" onClick={fetchProducts}>
                <RefreshCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowAddProductModal(true)}>
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Product</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Total Products</div>
              <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">In Stock</div>
              <div className="text-2xl font-semibold text-gray-900">{stats.inStock}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Featured</div>
              <div className="text-2xl font-semibold text-gray-900">{stats.featured}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Total Value</div>
              <div className="text-2xl font-semibold text-gray-900">₹{stats.totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Category</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border-gray-300 rounded-md px-3 py-1 text-sm min-w-[120px]"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Stock</span>
                  <select
                    value={inStockFilter}
                    onChange={(e) => setInStockFilter(e.target.value)}
                    className="border-gray-300 rounded-md px-3 py-1 text-sm min-w-[100px]"
                  >
                    <option value="all">All</option>
                    <option value="in-stock">In Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Featured</span>
                  <select
                    value={featuredFilter}
                    onChange={(e) => setFeaturedFilter(e.target.value)}
                    className="border-gray-300 rounded-md px-3 py-1 text-sm min-w-[110px]"
                  >
                    <option value="all">All</option>
                    <option value="featured">Featured</option>
                    <option value="not-featured">Not Featured</option>
                  </select>
                </div>

                {(search || categoryFilter !== "all" || inStockFilter !== "all" || featuredFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setCategoryFilter("all");
                      setInStockFilter("all");
                      setFeaturedFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading products...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {filteredProducts.map((product) => (
              <Card key={product._id} className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3 lg:p-4">
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                    <img
                      src={
                        (() => {
                          // Handle both old (array of strings) and new (array of objects) media formats
                          if (product.media && product.media.length > 0) {
                            if (typeof product.media[0] === 'string') {
                              // Old format: find first non-video URL
                              return product.media.find(url => !url.includes('.mp4') && !url.includes('.mov') && !url.includes('.avi') && !url.includes('.webm') && !url.includes('video/upload')) || product.media[0];
                            } else {
                              // New format: find first image
                              return product.media.find(m => m.type === 'image')?.url;
                            }
                          }
                          // Fallback to images or placeholder
                          return product.images?.[0] || `https://picsum.photos/seed/${encodeURIComponent(product.name)}/300/300`;
                        })()
                      }
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(product.name)}/300/300`;
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 text-sm lg:text-base line-clamp-2">{product.name}</h3>
                    <p className="text-xs lg:text-sm text-gray-600 line-clamp-2">{product.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-base lg:text-lg font-bold text-gray-900">₹{product.price?.toLocaleString()}</span>
                      <div className="flex gap-1 flex-wrap">
                        {product.featured && (
                          <Badge variant="secondary" className="text-xs">Featured</Badge>
                        )}
                        <Badge
                          variant={product.inStock ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {product.inStock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      {product.category} • {product.collection}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 lg:mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-gray-300 text-xs lg:text-sm"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Edit className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-1" />
                      <span className="hidden lg:inline">Edit</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 text-xs lg:text-sm"
                      onClick={() => handleDeleteProduct(product._id, product.name)}
                    >
                      <Trash2 className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-1" />
                      <span className="hidden lg:inline">Delete</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm">
            <CardContent className="p-8 text-center text-gray-600">
              {products.length === 0 ? "No products found." : "No products match your filters."}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        onProductAdded={handleProductAdded}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={showEditProductModal}
        onClose={() => {
          setShowEditProductModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onProductUpdated={handleProductUpdated}
      />
    </div>
  );
};

export default AdminProducts;
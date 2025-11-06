import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { categoriesApi } from "../lib/api";
import { RefreshCw, Plus, Edit, Trash2 } from "lucide-react";
import AddCategoryModal from "../components/AddCategoryModal";
import EditCategoryModal from "../components/EditCategoryModal";

const AdminCategories = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesApi.getAll();
      setCategories(response.data?.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryAdded = (newCategory) => {
    fetchCategories();
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setShowEditCategoryModal(true);
  };

  const handleCategoryUpdated = () => {
    fetchCategories();
    setSelectedCategory(null);
  };

  // Handle delete category
  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete "${categoryName}"? This will also delete all associated products.`)) {
      return;
    }

    try {
      await categoriesApi.delete(categoryId);
      setCategories(prev => prev.filter(c => c._id !== categoryId));
      toast({
        title: "Success",
        description: `${categoryName} has been deleted`,
      });
    } catch (error) {
      console.error('Delete category error:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive"
      });
    }
  };

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
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Categories</h1>
              <p className="text-sm lg:text-base text-gray-600">Manage your product categories</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-gray-300" onClick={fetchCategories}>
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowAddCategoryModal(true)}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Category</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Total Categories</div>
              <div className="text-2xl font-semibold text-gray-900">{categories.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Active Categories</div>
              <div className="text-2xl font-semibold text-gray-900">{categories.filter(c => c.isActive).length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Total Collections</div>
              <div className="text-2xl font-semibold text-gray-900">{categories.reduce((sum, c) => sum + (c.collections?.length || 0), 0)}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Total Products</div>
              <div className="text-2xl font-semibold text-gray-900">{categories.reduce((sum, c) => sum + (c.productCount || 0), 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading categories...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {categories.map((category) => (
              <Card key={category._id} className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3 lg:p-4">
                  {/* Category Image */}
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(category.name)}/300/300`;
                      }}
                    />
                  </div>

                  {/* Category Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 text-sm lg:text-base line-clamp-2">{category.name}</h3>
                    <p className="text-xs lg:text-sm text-gray-600 line-clamp-2">{category.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{category.collections?.length || 0} collections</span>
                      <Badge
                        variant={category.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="text-xs text-gray-500">
                      {category.productCount || 0} products
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 mt-3 lg:mt-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-300 text-xs lg:text-sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-1" />
                        <span className="hidden lg:inline">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-300 text-xs lg:text-sm"
                        onClick={() => window.open(`/categories/${category.slug}/collections`, '_blank')}
                      >
                        <svg className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="hidden lg:inline">View</span>
                      </Button>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full text-xs lg:text-sm"
                      onClick={() => handleDeleteCategory(category._id, category.name)}
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

        {!loading && categories.length === 0 && (
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm">
            <CardContent className="p-8 text-center text-gray-600">
              No categories found.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        onCategoryAdded={handleCategoryAdded}
      />

      {/* Edit Category Modal */}
      <EditCategoryModal
        isOpen={showEditCategoryModal}
        onClose={() => {
          setShowEditCategoryModal(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onCategoryUpdated={handleCategoryUpdated}
      />
    </div>
  );
};

export default AdminCategories;
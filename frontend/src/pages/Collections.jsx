import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { categoriesApi } from '../lib/api';

const Collections = () => {
  const { category } = useParams();
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [collectionsWithCounts, setCollectionsWithCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        const response = await categoriesApi.getBySlug(category);
        const categoryData = response.data.category;

        if (!categoryData) {
          setError('Category not found');
          return;
        }

        setCategoryInfo(categoryData);

        // Calculate product counts for each collection
        const collections = categoryData.collections.map(collection => {
          // For now, we'll need to fetch products for each collection to get counts
          // This could be optimized by having the backend return collection counts
          const image = (categoryData.collectionImages && categoryData.collectionImages[collection])
            ? categoryData.collectionImages[collection]
            : (categoryData.collectionImages && typeof categoryData.collectionImages.get === 'function' && categoryData.collectionImages.get(collection))
            ? categoryData.collectionImages.get(collection)
            : `https://picsum.photos/seed/${encodeURIComponent(collection)}/600/400`;

          console.log('Collection debug:', {
            collection,
            collectionImages: categoryData.collectionImages,
            image,
            hasCustomImage: image !== `https://picsum.photos/seed/${encodeURIComponent(collection)}/600/400`
          });

          return {
            name: collection,
            slug: collection, // Use collection name directly as slug
            productCount: 0, // Will be updated after fetching
            image
          };
        });

        // Fetch product counts for each collection
        const updatedCollections = await Promise.all(
          collections.map(async (collection) => {
            try {
              const productsResponse = await categoriesApi.getCollectionProducts(category, collection.name, { limit: 1 });
              return {
                ...collection,
                productCount: productsResponse.data.pagination?.totalProducts || 0
              };
            } catch (err) {
              console.error(`Error fetching products for collection ${collection.name}:`, err);
              return collection; // Return with 0 count on error
            }
          })
        );

        setCollectionsWithCounts(updatedCollections);
      } catch (err) {
        console.error('Error fetching category:', err);
        setError('Failed to load category data');
      } finally {
        setLoading(false);
      }
    };

    if (category) {
      fetchCategoryData();
    }
  }, [category]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
          <div className="text-center">
            <div className="inline-block bg-indigo-50 p-3 rounded-2xl mb-6">
              <div className="bg-white p-2 rounded-xl">
                <svg className="w-10 h-10 text-indigo-500 mx-auto animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Collections...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error || !categoryInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 text-center">
          <div className="inline-block bg-indigo-50 p-3 rounded-2xl mb-6">
            <div className="bg-white p-2 rounded-xl">
              <svg className="w-10 h-10 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{error || 'Category not found'}</h1>
          <Link to="/categories">
            <Button>Back to Categories</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-indigo-50 p-3 rounded-2xl mb-6">
            <div className="bg-white p-2 rounded-xl">
              <svg className="w-10 h-10 text-indigo-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{categoryInfo.name} Collections</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Explore our curated collections within {categoryInfo.name.toLowerCase()}
          </p>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/categories" className="hover:text-indigo-600 transition-colors">Categories</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{categoryInfo.name}</span>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collectionsWithCounts.map((collection) => (
            <Link
              key={collection.name}
              to={`/categories/${category}/collections/${encodeURIComponent(collection.name)}`}
              className="group block"
            >
              <Card className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl h-[22rem] collection-card">
                <CardContent className="p-0 h-full">
                  {/* Full Image Background */}
                  <img
                    src={collection.image}
                    alt={`${collection.name} preview`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Text Overlay */}
                  <div className="absolute inset-0">
                    {/* Content positioned at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 backdrop-blur-md bg-black/40 rounded-b-xl">
                      <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">
                        {collection.name}
                      </h3>
                      <p className="text-xs text-white/90 mb-2">
                        Discover beautiful {collection.name.toLowerCase()} pieces crafted with care and attention to detail.
                      </p>

                      {/* Bottom Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-xs text-white/90">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <span>{collection.productCount} items</span>
                        </div>
                        <Button className="text-white bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200">
                          Explore Collection
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {collectionsWithCounts.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md mx-auto border border-gray-100">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">No collections found</h3>
              <p className="text-gray-600 mb-8">This category doesn't have any collections yet.</p>
              <Link to="/categories">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Browse Other Categories
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-2xl p-8 lg:p-12 relative overflow-hidden border border-indigo-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-100 rounded-full -translate-x-12 translate-y-12 opacity-50"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full p-3 mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Can't Find What You're Looking For?
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Let us create something unique just for you. Our custom design service brings your vision to life.
              </p>
              <Link to="/customize">
                <Button className="bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-8 py-3 rounded-full text-base font-medium shadow-sm hover:shadow-md transition-all">
                  Request Custom Design
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collections;
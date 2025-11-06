import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
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

function slugify(input) {
  return (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function numberOr(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const nextId = (items) => (items.length ? Math.max(...items.map((i) => i.id || 0)) + 1 : 1);

const Admin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Local catalog (persisted in localStorage via mock helpers)
  const [categoriesData, setCategoriesData] = useState(() => getCategories?.() ?? seedCategories);
  const [productsData, setProductsData] = useState([]);
  const [orders, setOrders] = useState(() => {
    try {
      return getOrders() || [];
    } catch {
      return [];
    }
  });
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('artstop_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
  }, [navigate]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getAll();
        setCategoriesData(response.data?.categories || seedCategories);
      } catch (error) {
        console.warn('Failed to fetch categories from API, using mock data:', error);
        setCategoriesData(seedCategories);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productsApi.getAllAdmin({ limit: 100 }); // Get all products for admin
        setProductsData(response.data.products || []);
      } catch (error) {
        console.warn('Failed to fetch products from API:', error);
        setProductsData([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Refresh from localStorage on catalogUpdated events
  useEffect(() => {
    const handler = () => {
      try {
        setCategoriesData(getCategories());
        setProductsData(getProducts());
        setOrders(getOrders());
      } catch {
        // ignore
      }
    };
    window.addEventListener("catalogUpdated", handler);
    return () => window.removeEventListener("catalogUpdated", handler);
  }, []);

  // Simple Stats
  const stats = useMemo(() => {
    const totalCategories = categoriesData.length;
    const totalCollections = categoriesData.reduce((acc, c) => acc + (c.collections?.length || 0), 0);
    const totalProducts = productsData.length;
    const totalOrders = Array.isArray(orders) ? orders.length : 0;
    return { totalCategories, totalCollections, totalProducts, totalOrders };
  }, [categoriesData, productsData, orders]);

  // Add Product - Simple Form
  const [form, setForm] = useState({
    name: "",
    category: (getCategories?.() ?? seedCategories)?.[0]?.slug || "",
    mode: "existing", // "existing" | "new"
    existingCollection: "",
    newCollectionName: "",
    price: "",
    mediaUrls: [],
    mediaFiles: [], // Array of { file, color }
    inStock: true,
    featured: false,
    hasVariants: false,
    variants: [
      { name: "", dimensions: "", price: "" }
    ],
    colors: [],
    colorInput: "",
  });

  // Optional file upload -> Data URL preview
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const availableCollections = useMemo(() => {
    const cat = categoriesData.find((c) => c.slug === form.category);
    return cat?.collections || [];
  }, [categoriesData, form.category]);

  const resetForm = () => {
    setForm({
      name: "",
      category: (getCategories?.() ?? seedCategories)?.[0]?.slug || "",
      mode: "existing",
      existingCollection: "",
      newCollectionName: "",
      price: "",
      description: "",
      mediaUrls: [], // Array of { url: string, color: string }
      mediaFiles: [], // Array of { file, color: string }
      inStock: true,
      featured: false,
      hasVariants: false,
      variants: [
        { name: "", dimensions: "", price: "" }
      ],
      colors: [],
      colorInput: "",
    });
    setMediaPreviews([]);
    setSelectedFiles([]);
  };

  const onPickFiles = async (files) => {
    if (!files || files.length === 0) {
      return;
    }
    const newFiles = Array.from(files);
    const previews = await Promise.all(newFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(String(e.target?.result || ""));
        reader.readAsDataURL(file);
      });
    }));
    setMediaPreviews([...mediaPreviews, ...previews]);
    setSelectedFiles([...selectedFiles, ...newFiles]);
    // Initialize mediaFiles with empty color values (for general uploads)
    const mediaFiles = newFiles.map(file => ({ file, color: "" }));
    setForm({ ...form, mediaFiles: [...form.mediaFiles, ...mediaFiles] });
  };

  const effectiveCollectionName = useMemo(() => {
    return form.mode === "new" ? form.newCollectionName.trim() : form.existingCollection;
  }, [form.mode, form.newCollectionName, form.existingCollection]);

  const handleCreateProduct = async () => {
    const name = form.name.trim();
    if (!name) {
      toast({ title: "Product name required", description: "Please provide a product name." });
      return;
    }
    if (!form.category) {
      toast({ title: "Category required", description: "Please choose a category." });
      return;
    }

    const collectionName = effectiveCollectionName;
    if (!collectionName) {
      toast({
        title: "Collection required",
        description: form.mode === "new" ? "Enter a new collection name." : "Select an existing collection.",
      });
      
      return;
    
    }

    const hasVariants = !!form.hasVariants;

    // Build variants if enabled
    let variants = [];
    if (hasVariants) {
      variants = (form.variants || [])
        .map((v, idx) => {
          const name = String(v.name || "").trim() || `Variant ${idx + 1}`;
          const value = slugify(`${v.name || "variant"}-${v.dimensions || idx + 1}`);
          const price = numberOr(v.price, NaN);
          const dimensions = String(v.dimensions || "").trim();

          return {
            name,
            value,
            price,
            dimensions,
            label: `${name}${dimensions ? `: ${dimensions}` : ''} - ${price}`
          };
        })
        .filter(v => v.name && v.value && Number.isFinite(v.price) && v.price >= 0);

      if (variants.length === 0) {
        toast({
          title: "Add at least one valid variant",
          description: "Enter name, dimensions and a valid price for variants."
        });
        return;
      }
    }

    // Determine base price: use explicit price if valid; otherwise smallest variant price
    const parsedBasePrice = numberOr(form.price, NaN);
    const basePrice = Number.isFinite(parsedBasePrice) && parsedBasePrice >= 0
      ? parsedBasePrice
      : (hasVariants ? Math.min(...variants.map(v => v.price)) : NaN);

    if (!Number.isFinite(basePrice)) {
      toast({
        title: "Invalid price",
        description: "Enter a valid price or add at least one valid variant."
      });
      return;
    }

    // Handle media upload safely
    let media = [];

    // Add URL-based media
    if (form.mediaUrls && form.mediaUrls.length > 0) {
      const urlMedia = form.mediaUrls.map(mediaItem => {
        const trimmed = (mediaItem.url || "").trim();
        if (trimmed && !trimmed.includes('picsum.photos')) {
          // Determine type based on URL or assume image
          const type = trimmed.includes('.mp4') || trimmed.includes('.mov') || trimmed.includes('.avi') || trimmed.includes('.webm') ? 'video' : 'image';
          return {
            url: trimmed,
            type,
            color: mediaItem.color || undefined
          };
        }
        return null;
      }).filter(Boolean);
      media = [...media, ...urlMedia];
    }

    // Upload files
    if (selectedFiles && selectedFiles.length > 0) {
      try {
        const uploadResponse = await uploadApi.uploadImages(selectedFiles);
        const uploadedMedia = uploadResponse.data.images.map((img, idx) => ({
          url: img.imageUrl,
          type: img.format === 'mp4' || img.format === 'mov' || img.format === 'avi' || img.format === 'webm' ? 'video' : 'image',
          color: form.mediaFiles[idx]?.color || undefined
        }));
        media = [...media, ...uploadedMedia];
      } catch (err) {
        console.warn("Upload failed:", err);
      }
    }

    // Require at least one media
    if (media.length === 0) {
      toast({ title: "Media required", description: "Please upload at least one image or video, or add a valid URL." });
      setLoading(false);
      return;
    }

    // Build product data for API
    const productData = {
      name: String(name),
      category: String(form.category),
      collection: String(collectionName),
      price: Number(basePrice),
      media,
      variants: hasVariants ? variants.map(v => ({
        name: String(v.name),
        value: String(v.value),
        price: Number(v.price),
        dimensions: String(v.dimensions || ''),
        label: String(v.label || '')
      })) : [],
      colors: (form.colors || []).map(c => String(c).trim()).filter(Boolean),
      description: form.description.trim(),
      features: [],
      inStock: Boolean(form.inStock),
      featured: Boolean(form.featured),
    };
 console.log("Payload sending:", productData);
    setLoading(true);
    try {
      const response = await productsApi.create(productData);

      console.log("Create product API response:", response);

      // Safe extraction of product from different response formats
      const product = response.data || response.product || response;

      const newProduct = {
        id: product._id || product.id,
        ...product,
        rating: 4.5,
        reviewCount: 0,
      };

      // ✅ Refetch products from API to ensure consistency
      try {
        const response = await productsApi.getAllAdmin({ limit: 100 });
        setProductsData(response.data.products || []);
      } catch (fetchError) {
        console.warn('Failed to refetch products after creation:', fetchError);
        // Fallback: add to local state
        setProductsData((prev) => [...prev, newProduct]);
      }

      // If new collection, add it to the selected category
      if (form.mode === "new") {
        const cat = categoriesData.find((c) => c.slug === form.category);
        if (cat && !cat.collections.includes(collectionName)) {
          const updatedCategories = categoriesData.map((c) => {
            if (c.slug !== cat.slug) return c;
            const nextCollections = [...(c.collections || []), collectionName];
            const nextImages = {
              ...(c.collectionImages || {}),
              // Use the product's first image as the collection image
              [collectionName]: media.find(m => m.type === 'image')?.url || media[0]?.url,
            };
            return { ...c, collections: nextCollections, collectionImages: nextImages };
          });
          saveCategories(updatedCategories);
          setCategoriesData(updatedCategories);
        }
      }

      // ✅ Success toast
      toast({
        title: "Product added",
        description: `${product.name} has been created successfully.`,
      });

      // ✅ Reset form and close modal after add
      resetForm();
      // setShowModal(false); // Uncomment when modal is implemented

    } catch (error) {
      console.error('Create product error:', error);
      toast({
        title: "Error creating product",
        description: error.message || "Failed to create product. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img
              src="/artstoplogo.png"
              alt="ArtStop"
              className="h-8 w-auto object-contain drop-shadow-sm"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Simple controls to add products and view basic stats.</p>
            </div>
          </div>
          <div className="hidden sm:block">
            <Link to="/">
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                View Storefront
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Collections</div>
              <div className="text-2xl font-semibold text-gray-900">{stats.totalCollections}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Categories</div>
              <div className="text-2xl font-semibold text-gray-900">{stats.totalCategories}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Products</div>
              <div className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Orders</div>
              <div className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Product */}
          <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Product</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">Product Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border-gray-300 rounded-md"
                      placeholder="e.g. Ayatul Kursi Wall Art"
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">Product Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full border-gray-300 rounded-md resize-vertical"
                      placeholder="Describe your product in detail..."
                      rows={3}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          category: e.target.value,
                          existingCollection: "",
                          newCollectionName: "",
                        })
                      }
                      className="w-full border-gray-300 rounded-md"
                    >
                      {categoriesData.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Collection Mode */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Collection</label>
                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name="mode"
                          checked={form.mode === "existing"}
                          onChange={() => setForm({ ...form, mode: "existing" })}
                        />
                        <span className="text-sm text-gray-700">Existing</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name="mode"
                          checked={form.mode === "new"}
                          onChange={() => setForm({ ...form, mode: "new" })}
                        />
                        <span className="text-sm text-gray-700">New</span>
                      </label>
                    </div>
                  </div>

                  {/* Existing Collection */}
                  {form.mode === "existing" && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-gray-700 mb-1">Choose Existing Collection</label>
                      <select
                        value={form.existingCollection}
                        onChange={(e) => setForm({ ...form, existingCollection: e.target.value })}
                        className="w-full border-gray-300 rounded-md"
                      >
                        <option value="">Select collection</option>
                        {availableCollections.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* New Collection */}
                  {form.mode === "new" && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-gray-700 mb-1">New Collection Name</label>
                      <input
                        value={form.newCollectionName}
                        onChange={(e) => setForm({ ...form, newCollectionName: e.target.value })}
                        className="w-full border-gray-300 rounded-md"
                        placeholder="e.g. Limited Edition"
                      />
                    </div>
                  )}

                  {/* Price */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Price (₹){form.hasVariants ? " (used as base if provided)" : ""}</label>
                    <input
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full border-gray-300 rounded-md"
                      placeholder="8000"
                      disabled={false}
                    />
                    <div className="mt-2">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!form.hasVariants}
                          onChange={(e) => setForm({ ...form, hasVariants: e.target.checked })}
                        />
                        <span className="text-sm text-gray-700">Use size/price variants</span>
                      </label>
                    </div>
                  </div>

                  {/* Variants Editor */}
                  {form.hasVariants && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-gray-700 mb-2">Variants (Size • Dimensions • Price)</label>
                      <div className="space-y-3">
                        {form.variants.map((v, idx) => (
                          <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <input
                              value={v.name}
                              onChange={(e) => {
                                const next = [...form.variants];
                                next[idx] = { ...next[idx], name: e.target.value };
                                setForm({ ...form, variants: next });
                              }}
                              className="sm:col-span-3 border-gray-300 rounded-md"
                              placeholder="Small"
                            />
                            <input
                              value={v.dimensions}
                              onChange={(e) => {
                                const next = [...form.variants];
                                next[idx] = { ...next[idx], dimensions: e.target.value };
                                setForm({ ...form, variants: next });
                              }}
                              className="sm:col-span-5 border-gray-300 rounded-md"
                              placeholder="6 inch or 12 x 18 inch"
                            />
                            <input
                              value={v.price}
                              onChange={(e) => {
                                const next = [...form.variants];
                                next[idx] = { ...next[idx], price: e.target.value };
                                setForm({ ...form, variants: next });
                              }}
                              className="sm:col-span-3 border-gray-300 rounded-md"
                              placeholder="2000"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...form.variants];
                                next.splice(idx, 1);
                                setForm({ ...form, variants: next.length ? next : [{ name: "", dimensions: "", price: "" }] });
                              }}
                              className="sm:col-span-1 text-red-600 text-sm hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          onClick={() => setForm({ ...form, variants: [...(form.variants || []), { name: "", dimensions: "", price: "" }] })}
                        >
                          + Add Variant
                        </Button>
                        <div className="text-xs text-gray-500">
                          Example labels: "Small: 6 inch - 2000", "Medium: 18 x 24 inch - 7000"
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Colors */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">Colors</label>
                    <div className="flex gap-2">
                      <input
                        value={form.colorInput}
                        onChange={(e) => setForm({ ...form, colorInput: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const v = (form.colorInput || '').trim();
                            if (!v) return;
                            const next = Array.from(new Set([...(form.colors || []), v]));
                            setForm({ ...form, colors: next, colorInput: "" });
                            e.preventDefault();
                          }
                        }}
                        className="flex-1 border-gray-300 rounded-md"
                        placeholder="e.g. Black, Gold or #000000"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          const v = (form.colorInput || '').trim();
                          if (!v) return;
                          const next = Array.from(new Set([...(form.colors || []), v]));
                          setForm({ ...form, colors: next, colorInput: "" });
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    {form.colors?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {form.colors.map((c, idx) => (
                          <span
                            key={`${c}-${idx}`}
                            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-sm text-gray-800 bg-white"
                          >
                            <span
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: /^#([0-9a-f]{3}){1,2}$/i.test(String(c)) ? c : undefined }}
                              title={c}
                            />
                            {c}
                            <button
                              type="button"
                              className="ml-1 text-red-600 hover:underline"
                              onClick={() => {
                                const next = [...(form.colors || [])];
                                next.splice(idx, 1);
                                setForm({ ...form, colors: next });
                              }}
                            >
                              Remove
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stock / Featured */}
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.inStock}
                        onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                      />
                      <span className="text-sm text-gray-700">In Stock</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.featured}
                        onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                      />
                      <span className="text-sm text-gray-700">Featured</span>
                    </label>
                  </div>

                  {/* Media */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-gray-700 mb-2">Product Media (Images/Videos)</label>

                    {/* Color-centric media management */}
                    {form.colors.length > 0 ? (
                      <div className="space-y-6">
                        {form.colors.map((color) => {
                          // Get media for this color
                          const colorUrls = form.mediaUrls.filter(item => item.color === color);
                          const colorFiles = form.mediaFiles.filter(item => item.color === color);

                          return (
                            <div key={color} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div
                                  className="w-6 h-6 rounded-full border-2 border-gray-300"
                                  style={{
                                    backgroundColor: {
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
                                    }[color] || '#6b7280'
                                  }}
                                ></div>
                                <h4 className="font-medium text-gray-900">{color} Media</h4>
                                <span className="text-sm text-gray-500">
                                  ({colorUrls.length + colorFiles.length} items)
                                </span>
                              </div>

                              {/* URL inputs for this color */}
                              <div className="space-y-2 mb-4">
                                <label className="block text-xs text-gray-600">Media URLs</label>
                                {colorUrls.map((mediaItem, idx) => {
                                  const globalIdx = form.mediaUrls.findIndex(item => item === mediaItem);
                                  return (
                                    <div key={globalIdx} className="flex gap-2">
                                      <input
                                        value={mediaItem.url || ""}
                                        onChange={(e) => {
                                          const next = [...form.mediaUrls];
                                          next[globalIdx] = { ...next[globalIdx], url: e.target.value };
                                          setForm({ ...form, mediaUrls: next });
                                        }}
                                        className="flex-1 border-gray-300 rounded-md text-sm"
                                        placeholder="https://..."
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = [...form.mediaUrls];
                                          next.splice(globalIdx, 1);
                                          setForm({ ...form, mediaUrls: next });
                                        }}
                                        className="text-red-600 text-sm hover:underline px-2"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  );
                                })}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                  onClick={() => setForm({
                                    ...form,
                                    mediaUrls: [...form.mediaUrls, { url: "", color }]
                                  })}
                                >
                                  + Add URL
                                </Button>
                              </div>

                              {/* File uploads for this color */}
                              <div className="mb-4">
                                <label className="block text-xs text-gray-600 mb-1">Upload Files</label>
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  multiple
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files);
                                    const newMediaFiles = files.map(file => ({ file, color }));
                                    setForm({
                                      ...form,
                                      mediaFiles: [...form.mediaFiles, ...newMediaFiles]
                                    });
                                    // Create previews
                                    const previews = files.map(file => URL.createObjectURL(file));
                                    setMediaPreviews([...mediaPreviews, ...previews]);
                                    setSelectedFiles([...selectedFiles, ...files]);
                                  }}
                                  className="w-full text-sm"
                                />
                              </div>

                              {/* Previews for this color */}
                              {(colorUrls.length > 0 || colorFiles.length > 0) && (
                                <div>
                                  <label className="block text-xs text-gray-600 mb-2">Previews</label>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {colorUrls.map((mediaItem, idx) => (
                                      <div key={`url-${idx}`} className="w-full h-16 bg-gray-100 rounded overflow-hidden">
                                        {mediaItem.url.includes('.mp4') || mediaItem.url.includes('.mov') || mediaItem.url.includes('.avi') || mediaItem.url.includes('.webm') ? (
                                          <video
                                            src={mediaItem.url}
                                            className="w-full h-full object-cover"
                                            controls={false}
                                            muted
                                          />
                                        ) : (
                                          <img
                                            src={mediaItem.url}
                                            alt={`${color} media ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.currentTarget.src = "https://picsum.photos/seed/placeholder/80/80";
                                            }}
                                          />
                                        )}
                                      </div>
                                    ))}
                                    {colorFiles.map((mediaItem, idx) => {
                                      const globalIdx = form.mediaFiles.findIndex(item => item === mediaItem);
                                      return (
                                        <div key={`file-${idx}`} className="w-full h-16 bg-gray-100 rounded overflow-hidden relative">
                                          {mediaItem.file.type.startsWith('video/') ? (
                                            <video
                                              src={mediaPreviews[globalIdx]}
                                              className="w-full h-full object-cover"
                                              controls={false}
                                              muted
                                            />
                                          ) : (
                                            <img
                                              src={mediaPreviews[globalIdx]}
                                              alt={`${color} upload ${idx + 1}`}
                                              className="w-full h-full object-cover"
                                            />
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nextFiles = [...form.mediaFiles];
                                              const nextPreviews = [...mediaPreviews];
                                              const nextSelectedFiles = [...selectedFiles];

                                              nextFiles.splice(globalIdx, 1);
                                              nextPreviews.splice(globalIdx, 1);
                                              nextSelectedFiles.splice(globalIdx, 1);

                                              setForm({ ...form, mediaFiles: nextFiles });
                                              setMediaPreviews(nextPreviews);
                                              setSelectedFiles(nextSelectedFiles);
                                            }}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* General media (no specific color) */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">General Media (All Colors)</h4>

                          {/* General URLs */}
                          <div className="space-y-2 mb-4">
                            <label className="block text-xs text-gray-600">Media URLs</label>
                            {form.mediaUrls.filter(item => !item.color).map((mediaItem, idx) => {
                              const globalIdx = form.mediaUrls.findIndex(item => item === mediaItem);
                              return (
                                <div key={globalIdx} className="flex gap-2">
                                  <input
                                    value={mediaItem.url || ""}
                                    onChange={(e) => {
                                      const next = [...form.mediaUrls];
                                      next[globalIdx] = { ...next[idx], url: e.target.value };
                                      setForm({ ...form, mediaUrls: next });
                                    }}
                                    className="flex-1 border-gray-300 rounded-md text-sm"
                                    placeholder="https://..."
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...form.mediaUrls];
                                      next.splice(globalIdx, 1);
                                      setForm({ ...form, mediaUrls: next });
                                    }}
                                    className="text-red-600 text-sm hover:underline px-2"
                                  >
                                    Remove
                                  </button>
                                </div>
                              );
                            })}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                              onClick={() => setForm({
                                ...form,
                                mediaUrls: [...form.mediaUrls, { url: "", color: "" }]
                              })}
                            >
                              + Add General URL
                            </Button>
                          </div>

                          {/* General file uploads */}
                          <div className="mb-4">
                            <label className="block text-xs text-gray-600 mb-1">Upload General Files</label>
                            <input
                              type="file"
                              accept="image/*,video/*"
                              multiple
                              onChange={(e) => onPickFiles(e.target.files)}
                              className="w-full text-sm"
                            />
                          </div>

                          {/* General previews */}
                          {(form.mediaUrls.filter(item => !item.color).length > 0 || form.mediaFiles.filter(item => !item.color).length > 0) && (
                            <div>
                              <label className="block text-xs text-gray-600 mb-2">General Previews</label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {form.mediaUrls.filter(item => !item.color && item.url.trim()).map((mediaItem, idx) => (
                                  <div key={`general-url-${idx}`} className="w-full h-16 bg-gray-100 rounded overflow-hidden">
                                    {mediaItem.url.includes('.mp4') || mediaItem.url.includes('.mov') || mediaItem.url.includes('.avi') || mediaItem.url.includes('.webm') ? (
                                      <video
                                        src={mediaItem.url}
                                        className="w-full h-full object-cover"
                                        controls={false}
                                        muted
                                      />
                                    ) : (
                                      <img
                                        src={mediaItem.url}
                                        alt={`General media ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src = "https://picsum.photos/seed/placeholder/80/80";
                                        }}
                                      />
                                    )}
                                  </div>
                                ))}
                                {form.mediaFiles.filter(item => !item.color).map((mediaItem, idx) => {
                                  const globalIdx = form.mediaFiles.findIndex(item => item === mediaItem);
                                  return (
                                    <div key={`general-file-${idx}`} className="w-full h-16 bg-gray-100 rounded overflow-hidden relative">
                                      {mediaItem.file.type.startsWith('video/') ? (
                                        <video
                                          src={mediaPreviews[globalIdx]}
                                          className="w-full h-full object-cover"
                                          controls={false}
                                          muted
                                        />
                                      ) : (
                                        <img
                                          src={mediaPreviews[globalIdx]}
                                          alt={`General upload ${idx + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextFiles = [...form.mediaFiles];
                                          const nextPreviews = [...mediaPreviews];
                                          const nextSelectedFiles = [...selectedFiles];

                                          nextFiles.splice(globalIdx, 1);
                                          nextPreviews.splice(globalIdx, 1);
                                          nextSelectedFiles.splice(globalIdx, 1);

                                          setForm({ ...form, mediaFiles: nextFiles });
                                          setMediaPreviews(nextPreviews);
                                          setSelectedFiles(nextSelectedFiles);
                                        }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="mb-2">Add colors first to organize media by color</p>
                        <p className="text-sm">Use the "Colors" section above to add product colors</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="sm:col-span-2 flex gap-3 pt-2">
                    <Button
                      className="bg-indigo-600 hover:bg-indigo-700"
                      onClick={handleCreateProduct}
                      disabled={loading}
                    >
                      {loading ? "Adding..." : "Add Product"}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={resetForm}
                      disabled={loading}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Snapshot: Recent Products + Orders */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Products</h3>
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                  {[...productsData].reverse().slice(0, 12).map((p) => (
                    <div key={p.id || p._id || `product-${Math.random()}`} className="border border-gray-200 rounded-md p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                          <img
                            src={
                              p.media?.find(m => m.type === 'image')?.url ||
                              p.media?.[0]?.url ||
                              `https://picsum.photos/seed/${encodeURIComponent(slugify(p.name))}/200/200`
                            }
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(
                                slugify(p.name)
                              )}/200/200`;
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{p.name}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {p.category} • {p.collection}
                          </div>
                          <div className="text-sm text-gray-900">₹{numberOr(p.price).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!productsData.length && <div className="text-sm text-gray-500">No products yet.</div>}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    {stats.totalOrders}
                  </span>
                </div>
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                  {Array.isArray(orders) && orders.length ? (
                    [...orders]
                      .slice(0, 6)
                      .map((o) => (
                        <div key={o.id} className="border border-gray-200 rounded-md p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-900">#{o.id}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(o.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-xs capitalize text-gray-600">{o.status}</div>
                            <div className="text-sm font-semibold text-gray-900">
                              ₹{numberOr(o.total).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-sm text-gray-500">No orders yet.</div>
                  )}
                </div>
                <div className="mt-3">
                  <Link to="/orders">
                    <Button variant="outline" className="w-full border-gray-300">
                      View All Orders
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
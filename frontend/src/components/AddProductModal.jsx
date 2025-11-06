import React, { useEffect, useState, useMemo } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
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

const AddProductModal = ({ isOpen, onClose, onProductAdded }) => {
  const { toast } = useToast();

  // Categories and products data
  const [categoriesData, setCategoriesData] = useState(() => getCategories?.() ?? seedCategories);

  // Add Product Form
  const [form, setForm] = useState({
    name: "",
    category: (getCategories?.() ?? seedCategories)?.[0]?.slug || "",
    mode: "existing", // "existing" | "new"
    existingCollection: "",
    newCollectionName: "",
    price: "",
    description: "",
    colors: [], // Array of color strings
    mediaUrls: [], // Array of { url, color? }
    mediaFiles: [], // Array of { file, color? }
    inStock: true,
    featured: false,
    hasVariants: false,
    variants: [
      { name: "", dimensions: "", price: "" }
    ],
  });

  // Optional file upload -> Data URL preview
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false); // For file processing
  const [newColor, setNewColor] = useState("");
  const [mediaColor, setMediaColor] = useState(""); // For associating media with color

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getAll();
        setCategoriesData(response.data?.categories || seedCategories);
      } catch (error) {
        console.warn('Failed to fetch categories from API, using mock data:', error);
        setCategoriesData(seedCategories);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Form helpers
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
      colors: [], // Array of color strings
      mediaUrls: [], // Array of { url, color? }
      mediaFiles: [], // Array of { file, color? }
      inStock: true,
      featured: false,
      hasVariants: false,
      variants: [
        { name: "", dimensions: "", price: "" }
      ],
    });
    setMediaPreviews([]);
    setSelectedFiles([]);
    setNewColor("");
    setMediaColor("");
  };

  const onPickFiles = async (files) => {
    if (!files || files.length === 0) {
      return;
    }

    setUploadingFiles(true);

    try {
      const newFiles = Array.from(files);

      // Limit to reasonable number of files to prevent memory issues
      const maxFiles = 20;
      if (selectedFiles.length + newFiles.length > maxFiles) {
        toast({
          title: "Too many files",
          description: `Maximum ${maxFiles} files allowed. Please select fewer files.`,
          variant: "destructive"
        });
        return;
      }

      // Process files in batches to avoid blocking the UI
      const batchSize = 5;
      const previews = [];

      for (let i = 0; i < newFiles.length; i += batchSize) {
        const batch = newFiles.slice(i, i + batchSize);
        const batchPreviews = await Promise.all(batch.map(file => {
          return new Promise((resolve, reject) => {
            // Check file size - limit to 50MB per file
            if (file.size > 50 * 1024 * 1024) {
              reject(new Error(`File ${file.name} is too large. Maximum size is 50MB.`));
              return;
            }

            const reader = new FileReader();
            reader.onload = (e) => resolve(String(e.target?.result || ""));
            reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
            reader.readAsDataURL(file);
          });
        }));
        previews.push(...batchPreviews);

        // Allow UI to update between batches
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      setMediaPreviews([...mediaPreviews, ...previews]);
      setSelectedFiles([...selectedFiles, ...newFiles]);
      // Initialize mediaFiles with color
      const mediaFiles = newFiles.map(file => ({ file, color: mediaColor || undefined }));
      setForm({ ...form, mediaFiles: [...form.mediaFiles, ...mediaFiles] });
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: "File processing error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  const addColor = () => {
    if (newColor.trim() && !form.colors.includes(newColor.trim())) {
      setForm({ ...form, colors: [...form.colors, newColor.trim()] });
      setNewColor("");
    }
  };

  const removeColor = (colorToRemove) => {
    setForm({ ...form, colors: form.colors.filter(c => c !== colorToRemove) });
  };

  const addMediaUrl = () => {
    setForm({ ...form, mediaUrls: [...form.mediaUrls, { url: "", color: mediaColor || undefined }] });
  };

  const effectiveCollectionName = useMemo(() => {
    return form.mode === "new" ? form.newCollectionName.trim() : form.existingCollection;
  }, [form.mode, form.newCollectionName, form.existingCollection]);

  const handleCreateProduct = async () => {
    // Set loading immediately when button is clicked
    setLoading(true);

    const name = form.name.trim();
    if (!name) {
      toast({ title: "Product name required", description: "Please provide a product name." });
      setLoading(false);
      return;
    }
    if (!form.category) {
      toast({ title: "Category required", description: "Please choose a category." });
      setLoading(false);
      return;
    }

    const collectionName = effectiveCollectionName;
    if (!collectionName) {
      toast({
        title: "Collection required",
        description: form.mode === "new" ? "Enter a new collection name." : "Select an existing collection.",
      });
      setLoading(false);
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
        const uploadedMedia = uploadResponse.data.images.map((img, index) => ({
          url: img.url,
          type: img.type,
          color: form.mediaFiles[index]?.color || undefined
        }));
        media = [...media, ...uploadedMedia];
      } catch (err) {
        console.warn("Upload failed:", err);
      }
    }

    // Require at least one media
    if (media.length === 0) {
      toast({ title: "Media required", description: "Please upload at least one image or video, or add a valid URL." });
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
      colors: form.colors,
      description: form.description.trim(),
      features: [],
      inStock: Boolean(form.inStock),
      featured: Boolean(form.featured),
    };
    console.log("Payload sending:", productData);
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

      // ✅ Reset form and close modal
      resetForm();
      onClose();

      // Notify parent component
      if (onProductAdded) {
        onProductAdded(newProduct);
      }

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

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.7 : 1 }}>
          {/* Name */}
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Product Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g. Ayatul Kursi Wall Art"
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Product Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border-gray-300 rounded-md px-3 py-2 resize-vertical"
              placeholder="Describe your product in detail..."
              rows={3}
            />
          </div>

          {/* Colors */}
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Colors</label>
            <div className="flex gap-2 mb-2">
              <input
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="flex-1 border-gray-300 rounded-md px-3 py-2"
                placeholder="Add a color"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addColor}
                className="border-gray-300"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.colors.map((color) => (
                <span
                  key={color}
                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                >
                  {color}
                  <button
                    type="button"
                    onClick={() => removeColor(color)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
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
              className="w-full border-gray-300 rounded-md px-3 py-2"
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
                className="w-full border-gray-300 rounded-md px-3 py-2"
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
                className="w-full border-gray-300 rounded-md px-3 py-2"
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
              className="w-full border-gray-300 rounded-md px-3 py-2"
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
                      className="sm:col-span-3 border-gray-300 rounded-md px-3 py-2"
                      placeholder="Small"
                    />
                    <input
                      value={v.dimensions}
                      onChange={(e) => {
                        const next = [...form.variants];
                        next[idx] = { ...next[idx], dimensions: e.target.value };
                        setForm({ ...form, variants: next });
                      }}
                      className="sm:col-span-5 border-gray-300 rounded-md px-3 py-2"
                      placeholder="6 inch or 12 x 18 inch"
                    />
                    <input
                      value={v.price}
                      onChange={(e) => {
                        const next = [...form.variants];
                        next[idx] = { ...next[idx], price: e.target.value };
                        setForm({ ...form, variants: next });
                      }}
                      className="sm:col-span-3 border-gray-300 rounded-md px-3 py-2"
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

            {/* Media URLs */}
            <div className="space-y-2 mb-4">
              <label className="block text-xs text-gray-600">Media URLs</label>
              {form.mediaUrls.map((mediaItem, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <input
                    value={mediaItem.url || ""}
                    onChange={(e) => {
                      const next = [...form.mediaUrls];
                      next[idx] = { ...next[idx], url: e.target.value };
                      setForm({ ...form, mediaUrls: next });
                    }}
                    className="sm:col-span-6 border-gray-300 rounded-md text-sm px-3 py-2"
                    placeholder="https://..."
                  />
                  <select
                    value={mediaItem.color || ""}
                    onChange={(e) => {
                      const next = [...form.mediaUrls];
                      next[idx] = { ...next[idx], color: e.target.value || undefined };
                      setForm({ ...form, mediaUrls: next });
                    }}
                    className="sm:col-span-4 border-gray-300 rounded-md text-sm px-3 py-2"
                  >
                    <option value="">General</option>
                    {form.colors.map((color) => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...form.mediaUrls];
                      next.splice(idx, 1);
                      setForm({ ...form, mediaUrls: next });
                    }}
                    className="sm:col-span-2 text-red-600 text-sm hover:underline px-2 py-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={addMediaUrl}
              >
                + Add URL
              </Button>
            </div>

            {/* Media Color Association */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-1">Associate Media with Color (optional)</label>
              <select
                value={mediaColor}
                onChange={(e) => setMediaColor(e.target.value)}
                className="w-full border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">General (no specific color)</option>
                {form.colors.map((color) => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            {/* File uploads */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-1">Upload Files</label>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => onPickFiles(e.target.files)}
                className="w-full text-sm"
                disabled={uploadingFiles}
              />
              {uploadingFiles && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                  <div className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Processing files...
                </div>
              )}
            </div>

            {/* Previews */}
            {(form.mediaUrls.filter(item => item.url.trim()).length > 0 || form.mediaFiles.length > 0) && (
              <div>
                <label className="block text-xs text-gray-600 mb-2">Previews</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {form.mediaUrls.filter(item => item.url.trim()).map((mediaItem, idx) => (
                    <div key={`url-${idx}`} className="w-full h-16 bg-gray-100 rounded overflow-hidden">
                      {mediaItem.url.includes('.mp4') || mediaItem.url.includes('.mov') || mediaItem.url.includes('.avi') || mediaItem.url.includes('.webm') ? (
                        <video
                          src={mediaItem.url}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={mediaItem.url}
                          alt={`Media ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://picsum.photos/seed/placeholder/80/80";
                          }}
                        />
                      )}
                    </div>
                  ))}
                  {form.mediaFiles.map((mediaItem, idx) => (
                    <div key={`file-${idx}`} className="w-full h-16 bg-gray-100 rounded overflow-hidden relative">
                      {mediaItem.file.type.startsWith('video/') ? (
                        <video
                          src={mediaPreviews[idx]}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={mediaPreviews[idx]}
                          alt={`Upload ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const nextFiles = [...form.mediaFiles];
                          const nextPreviews = [...mediaPreviews];
                          const nextSelectedFiles = [...selectedFiles];

                          nextFiles.splice(idx, 1);
                          nextPreviews.splice(idx, 1);
                          nextSelectedFiles.splice(idx, 1);

                          setForm({ ...form, mediaFiles: nextFiles });
                          setMediaPreviews(nextPreviews);
                          setSelectedFiles(nextSelectedFiles);
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="sm:col-span-2 flex gap-3 pt-2">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleCreateProduct}
              disabled={loading || uploadingFiles}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding Product...
                </div>
              ) : (
                "Add Product"
              )}
            </Button>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
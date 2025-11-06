import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { useToast } from "../hooks/use-toast";
import { categoriesApi } from "../lib/api";

function slugify(input) {
  return (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const EditCategoryModal = ({ isOpen, onClose, category, onCategoryUpdated }) => {
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    image: "",
    description: "",
    collections: [],
    collectionImages: {}
  });

  const [newCollection, setNewCollection] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category && isOpen) {
      setForm({
        name: category.name || "",
        slug: category.slug || "",
        image: category.image || "",
        description: category.description || "",
        collections: category.collections || [],
        collectionImages: category.collectionImages || {}
      });
    }
  }, [category, isOpen]);

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm({
      ...form,
      name,
      slug: slugify(name)
    });
  };

  const handleSlugChange = (e) => {
    setForm({
      ...form,
      slug: slugify(e.target.value)
    });
  };

  const addCollection = () => {
    if (newCollection.trim() && !form.collections.includes(newCollection.trim())) {
      setForm({
        ...form,
        collections: [...form.collections, newCollection.trim()],
        collectionImages: {
          ...form.collectionImages,
          [newCollection.trim()]: ""
        }
      });
      setNewCollection("");
    }
  };

  const removeCollection = (collection) => {
    setForm({
      ...form,
      collections: form.collections.filter(c => c !== collection),
      collectionImages: Object.fromEntries(
        Object.entries(form.collectionImages).filter(([key]) => key !== collection)
      )
    });
  };

  const handleUpdateCategory = async () => {
    const name = form.name.trim();
    if (!name) {
      toast({ title: "Category name required", description: "Please provide a category name." });
      return;
    }

    const slug = form.slug.trim();
    if (!slug) {
      toast({ title: "Category slug required", description: "Please provide a category slug." });
      return;
    }

    const image = form.image.trim();
    if (!image) {
      toast({ title: "Category image required", description: "Please provide a category image URL." });
      return;
    }

    setLoading(true);
    try {
      const categoryData = {
        name,
        slug,
        image,
        description: form.description.trim(),
        collections: form.collections,
        collectionImages: form.collectionImages
      };

      const response = await categoriesApi.update(category._id, categoryData);

      toast({
        title: "Category updated",
        description: `${name} has been updated successfully.`,
      });

      onClose();

      if (onCategoryUpdated) {
        onCategoryUpdated();
      }

    } catch (error) {
      console.error('Update category error:', error);
      toast({
        title: "Error updating category",
        description: error.message || "Failed to update category. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Category Name</label>
            <input
              value={form.name}
              onChange={handleNameChange}
              className="w-full border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g. Islamic Art"
            />
          </div>

          {/* Slug */}
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Category Slug</label>
            <input
              value={form.slug}
              onChange={handleSlugChange}
              className="w-full border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g. islamic-art"
            />
          </div>

          {/* Image URL */}
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Category Image URL</label>
            <input
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              className="w-full border-gray-300 rounded-md px-3 py-2"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border-gray-300 rounded-md px-3 py-2 resize-vertical"
              placeholder="Describe the category..."
              rows={3}
            />
          </div>

          {/* Collections */}
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-700 mb-2">Collections</label>

            {/* Add new collection */}
            <div className="flex gap-2 mb-4">
              <input
                value={newCollection}
                onChange={(e) => setNewCollection(e.target.value)}
                className="flex-1 border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g. Asma-ul-Husna Frames"
                onKeyPress={(e) => e.key === 'Enter' && addCollection()}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addCollection}
                disabled={!newCollection.trim()}
              >
                Add
              </Button>
            </div>

            {/* Collections list */}
            <div className="space-y-3">
              {form.collections.map((collection, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm text-gray-900">{collection}</span>
                    <button
                      type="button"
                      onClick={() => removeCollection(collection)}
                      className="text-red-600 text-sm hover:text-red-800 hover:underline px-2"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-600">Collection Image</label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            try {
                              const formData = new FormData();
                              formData.append('image', file);

                              const response = await fetch('http://localhost:8001/api/upload/image', {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${localStorage.getItem('artstop_token') || localStorage.getItem('token')}`
                                },
                                body: formData
                              });

                              if (response.ok) {
                                const data = await response.json();
                                console.log('Upload successful:', data);
                                setForm({
                                  ...form,
                                  collectionImages: {
                                    ...form.collectionImages,
                                    [collection]: data.data.url
                                  }
                                });
                              } else {
                                const errorText = await response.text();
                                console.error('Upload failed:', response.status, errorText);
                              }
                            } catch (error) {
                              console.error('Upload error:', error);
                            }
                          }
                        }}
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      {form.collectionImages[collection] && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                          <img
                            src={form.collectionImages[collection]}
                            alt="Preview"
                            className="w-8 h-8 object-cover rounded"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                          <span className="text-xs text-gray-600 truncate flex-1">Image uploaded</span>
                          <button
                            type="button"
                            onClick={() => setForm({
                              ...form,
                              collectionImages: {
                                ...form.collectionImages,
                                [collection]: ""
                              }
                            })}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="sm:col-span-2 flex gap-3 pt-2">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleUpdateCategory}
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Category"}
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

export default EditCategoryModal;
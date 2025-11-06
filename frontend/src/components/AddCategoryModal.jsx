import React, { useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { useToast } from "../hooks/use-toast";
import { categoriesApi, uploadApi } from "../lib/api";

function slugify(input) {
  return (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const AddCategoryModal = ({ isOpen, onClose, onCategoryAdded }) => {
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

  const resetForm = () => {
    setForm({
      name: "",
      slug: "",
      image: "",
      description: "",
      collections: [],
      collectionImages: {}
    });
    setNewCollection("");
  };

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

  const handleCreateCategory = async () => {
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

      const response = await categoriesApi.create(categoryData);

      toast({
        title: "Category added",
        description: `${name} has been created successfully.`,
      });

      resetForm();
      onClose();

      if (onCategoryAdded) {
        onCategoryAdded(response.data.category);
      }

    } catch (error) {
      console.error('Create category error:', error);
      toast({
        title: "Error creating category",
        description: error.message || "Failed to create category. Please try again.",
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
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
            <div className="space-y-2">
              {form.collections.map((collection, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="flex-1 text-sm">{collection}</span>
                  <input
                    value={form.collectionImages[collection] || ""}
                    onChange={(e) => setForm({
                      ...form,
                      collectionImages: {
                        ...form.collectionImages,
                        [collection]: e.target.value
                      }
                    })}
                    className="flex-1 border-gray-300 rounded-md px-3 py-1 text-sm"
                    placeholder="Image URL for this collection"
                  />
                  <button
                    type="button"
                    onClick={() => removeCollection(collection)}
                    className="text-red-600 text-sm hover:underline px-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="sm:col-span-2 flex gap-3 pt-2">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleCreateCategory}
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Category"}
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

export default AddCategoryModal;
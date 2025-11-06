import React, { useState } from 'react';
import { Upload, X, CheckCircle, Palette, Package, Clock, Calendar, IndianRupee, Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { useToast } from '../hooks/use-toast';

const Customize = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    contact: '',
    productTypes: [],
    size: '',
    budgetRange: '',
    colorPreferences: '',
    stickersAddons: '',
    specialInstructions: '',
    deliveryTimeline: ''
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const productTypeOptions = [
    { id: 'clock', label: 'Clock', icon: Clock },
    { id: 'nameplate', label: 'Nameplate', icon: Package },
    { id: 'frame', label: 'Frame', icon: Package },
    { id: 'wallart', label: 'Wall Art', icon: Palette },
    { id: 'keychain', label: 'Keychain', icon: Package },
    { id: 'other', label: 'Other', icon: Package }
  ];

  const sampleImages = [
    {
      id: 1,
      title: "Ayatul Kursi Design",
      src: "https://images.unsplash.com/photo-1558114965-eeb97aa84c3b?crop=entropy&cs=srgb&fm=jpg&w=300&h=300&fit=crop"
    },
    {
      id: 2,
      title: "Islamic Geometric Pattern",
      src: "https://images.unsplash.com/photo-1573765727997-e02883182ba7?crop=entropy&cs=srgb&fm=jpg&w=300&h=300&fit=crop"
    },
    {
      id: 3,
      title: "Modern Calligraphy",
      src: "https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?w=300&h=300&fit=crop"
    },
    {
      id: 4,
      title: "Traditional Mandala",
      src: "https://images.unsplash.com/photo-1615874694520-474822394e73?crop=entropy&cs=srgb&fm=jpg&w=300&h=300&fit=crop"
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductTypeChange = (productId, checked) => {
    setFormData(prev => ({
      ...prev,
      productTypes: checked
        ? [...prev.productTypes, productId]
        : prev.productTypes.filter(id => id !== productId)
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedImages(prev => [...prev, {
            id: Date.now() + Math.random(),
            name: file.name,
            src: e.target.result
          }]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeUploadedImage = (id) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.contact) {
      toast({
        title: "Please fill required fields",
        description: "Full name and contact information are required.",
        variant: "destructive",
      });
      return;
    }

    if (formData.productTypes.length === 0) {
      toast({
        title: "Please select product type",
        description: "At least one product type must be selected.",
        variant: "destructive",
      });
      return;
    }

    // Mock submission
    setIsSubmitted(true);
    toast({
      title: "Request Submitted Successfully!",
      description: "We'll get back to you within 24 hours with a quote.",
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <CheckCircle className="h-20 w-20 mx-auto text-green-500 mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Request Submitted Successfully!
            </h1>
            <p className="text-gray-600 mb-8 text-lg">
              Thank you for your custom request. Our design team will review your requirements and get back to you within 24 hours with a detailed quote and timeline.
            </p>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold mb-4 text-gray-800">What happens next?</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  Our design team reviews your request
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  We prepare a detailed quote and timeline
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  You'll receive an email within 24 hours
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  Once approved, we start creating your masterpiece
                </li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                Submit Another Request
              </Button>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                <a href="mailto:info@artstop.com" className="flex items-center">
                  Contact Us
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Customization Request
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            Bring your vision to life with our custom design service. Share your ideas and we'll create something uniquely yours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-gray-800">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold">1</span>
                </div>
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fullName" className="text-gray-700 font-medium">Full Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contact" className="text-gray-700 font-medium">Contact (Email / WhatsApp) *</Label>
                  <Input
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    placeholder="email@example.com or +91 XXXXX XXXXX"
                    className="mt-2"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Type */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-gray-800">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold">2</span>
                </div>
                Product Type
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {productTypeOptions.map((product) => {
                  const IconComponent = product.icon;
                  return (
                    <div
                      key={product.id}
                      className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                        formData.productTypes.includes(product.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                      onClick={() => handleProductTypeChange(product.id, !formData.productTypes.includes(product.id))}
                    >
                      <div className="flex flex-col items-center text-center">
                        <IconComponent className={`h-8 w-8 mb-2 ${
                          formData.productTypes.includes(product.id) ? 'text-purple-600' : 'text-gray-500'
                        }`} />
                        <span className={`font-medium ${
                          formData.productTypes.includes(product.id) ? 'text-purple-600' : 'text-gray-700'
                        }`}>
                          {product.label}
                        </span>
                        {formData.productTypes.includes(product.id) && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-gray-800">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label htmlFor="size" className="text-gray-700 font-medium">Size (in inches/feet)</Label>
                  <Input
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    placeholder="e.g., 12x18 inches, 2x3 feet"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="budgetRange" className="text-gray-700 font-medium flex items-center">
                    Budget Range (₹) <IndianRupee className="h-4 w-4 ml-1" />
                  </Label>
                  <Input
                    id="budgetRange"
                    name="budgetRange"
                    value={formData.budgetRange}
                    onChange={handleInputChange}
                    placeholder="e.g., 5000-10000"
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-gray-800">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white font-bold text-sm">4</span>
                  </div>
                  Design Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label htmlFor="colorPreferences" className="text-gray-700 font-medium flex items-center">
                    Color Preferences / Theme <Palette className="h-4 w-4 ml-1" />
                  </Label>
                  <Input
                    id="colorPreferences"
                    name="colorPreferences"
                    value={formData.colorPreferences}
                    onChange={handleInputChange}
                    placeholder="e.g., Gold and black, Pastel colors, Monochrome"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="deliveryTimeline" className="text-gray-700 font-medium flex items-center">
                    Delivery Timeline <Calendar className="h-4 w-4 ml-1" />
                  </Label>
                  <Input
                    id="deliveryTimeline"
                    name="deliveryTimeline"
                    value={formData.deliveryTimeline}
                    onChange={handleInputChange}
                    placeholder="e.g., Within 2 weeks, By Diwali, Urgent (3-5 days)"
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Details */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-gray-800">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">5</span>
                </div>
                Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label htmlFor="stickersAddons" className="text-gray-700 font-medium">
                  Stickers / Add-ons (stones, gold, photos, names, etc.)
                </Label>
                <Textarea
                  id="stickersAddons"
                  name="stickersAddons"
                  value={formData.stickersAddons}
                  onChange={handleInputChange}
                  placeholder="Mention any specific add-ons like stones, gold plating, photos, names, etc."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="specialInstructions" className="text-gray-700 font-medium">
                  Special Instructions / Inspiration Idea
                </Label>
                <Textarea
                  id="specialInstructions"
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleInputChange}
                  placeholder="Describe your vision, inspiration, or any special requirements..."
                  rows={4}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-gray-800">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">6</span>
                </div>
                Inspiration Images
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-600 mb-6">
                Upload any reference images, sketches, or inspiration photos to help us understand your vision better.
              </p>

              <div className="border-2 border-dashed border-purple-200 rounded-xl p-8 text-center mb-6 bg-purple-50/50">
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <ImageIcon className="h-16 w-16 mx-auto text-purple-400 mb-4" />
                  <p className="text-xl font-medium text-gray-900 mb-2">Click to upload inspiration images</p>
                  <p className="text-gray-600">PNG, JPG, GIF up to 10MB each</p>
                </label>
              </div>

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div>
                  <h3 className="font-medium mb-4 text-gray-800">Uploaded Images:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.src}
                          alt={image.name}
                          className="w-full h-32 object-cover rounded-lg shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(image.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <p className="text-xs text-gray-600 mt-2 truncate">{image.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="text-center pt-8">
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-16 py-4 text-xl font-medium rounded-full shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Submit Customization Request
            </Button>
            <p className="text-gray-600 mt-4 text-sm">
              We'll review your request and get back to you within 24 hours with a quote.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Customize;
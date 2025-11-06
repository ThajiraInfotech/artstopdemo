const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/artstop');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Seed data
const seedData = async () => {
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Create admin user
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin123', 12);
    const admin = await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@artstop.com',
      password: adminPassword,
      role: 'admin'
    });
    console.log(`Admin created: ${admin.email}`);

    // Create sample user
    const userPassword = await bcrypt.hash('User123', 12);
    const user = await User.create({
      name: 'John Doe',
      email: 'user@example.com',
      password: userPassword,
      role: 'user'
    });
    console.log(`Sample user created: ${user.email} (password: User123)`);

    // Create categories
    console.log('Creating categories...');
    const categories = [
      {
        name: "Islamic Art",
        slug: "islamic-art",
        image: "/homepage/islamicart.heic",
        description: "Beautiful Islamic calligraphy and art pieces",
        collections: [
          "Asma-ul-Husna Frames",
          "Ayatul Kursi Wall Art",
          "4 Quls Calligraphy",
          "Bismillah Nameplates",
          "Dua Frames",
          "Quran Stands & Tasbih"
        ],
        collectionImages: new Map([
          ["Asma-ul-Husna Frames", "https://picsum.photos/300/200?random=1"],
          ["Ayatul Kursi Wall Art", "https://picsum.photos/300/200?random=2"],
          ["4 Quls Calligraphy", "https://picsum.photos/300/200?random=3"],
          ["Bismillah Nameplates", "https://picsum.photos/300/200?random=4"],
          ["Dua Frames", "https://picsum.photos/300/200?random=5"],
          ["Quran Stands & Tasbih", "https://picsum.photos/300/200?random=6"]
        ])
      },
      {
        name: "Home Decor",
        slug: "home-decor",
        image: "/homepage/homedecor.heic",
        description: "Modern home decoration items and wall art",
        collections: [
          "Resin Nameplates",
          "Geode Wall Art",
          "Clocks",
          "Memory Frames (Wedding, Baby, Family)",
          "Quote Wall Art"
        ],
        collectionImages: new Map([
          ["Resin Nameplates", "https://picsum.photos/300/200?random=7"],
          ["Geode Wall Art", "https://picsum.photos/300/200?random=8"],
          ["Clocks", "https://picsum.photos/300/200?random=9"],
          ["Memory Frames (Wedding, Baby, Family)", "https://picsum.photos/300/200?random=10"],
          ["Quote Wall Art", "https://picsum.photos/300/200?random=11"]
        ])
      },
      {
        name: "Gifts",
        slug: "gifts",
        image: "/homepage/gifts.heic",
        description: "Perfect gifts for all occasions",
        collections: [
          "Wedding Gifts",
          "Housewarming Gifts",
          "Corporate Gifts",
          "Budget Mini Items (Keychains, Bookmarks, Coasters)"
        ],
        collectionImages: new Map([
          ["Wedding Gifts", "https://picsum.photos/300/200?random=12"],
          ["Housewarming Gifts", "https://picsum.photos/300/200?random=13"],
          ["Corporate Gifts", "https://picsum.photos/300/200?random=14"],
          ["Budget Mini Items (Keychains, Bookmarks, Coasters)", "https://picsum.photos/300/200?random=15"]
        ])
      },
      {
        name: "Cutouts & Signage",
        slug: "cutouts-signage",
        image: "/homepage/cutouts.heic",
        description: "Custom cutouts and signage solutions",
        collections: [
          "Acrylic Cutouts",
          "Metal & Steel Artwork",
          "Vinyl Stickers",
          "Custom Shapes for Homes, Offices, Masjids"
        ],
        collectionImages: new Map([
          ["Acrylic Cutouts", "https://picsum.photos/300/200?random=16"],
          ["Metal & Steel Artwork", "https://picsum.photos/300/200?random=17"],
          ["Vinyl Stickers", "https://picsum.photos/300/200?random=18"],
          ["Custom Shapes for Homes, Offices, Masjids", "https://picsum.photos/300/200?random=19"]
        ])
      }
    ];

    const createdCategories = await Category.insertMany(categories);
    console.log(`Created ${createdCategories.length} categories`);

    // Helper function to generate slug
    const generateSlug = (str) => {
      return str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .trim() || 'product';
    };

    // Create sample products
    console.log('Creating sample products...');
    const products = [
      {
        name: "17 Ayatul Kursi Stainless Steel Islamic Wall Art",
        slug: generateSlug("17 Ayatul Kursi Stainless Steel Islamic Wall Art"),
        category: "islamic-art",
        collection: "Ayatul Kursi Wall Art",
        price: 8000,
        oldPrice: 9400,
        rating: 4.8,
        reviewCount: 124,
        images: [
          "https://picsum.photos/800/600?random=21",
          "https://picsum.photos/800/600?random=22"
        ],
        variants: [
          { name: "Small", value: "small", price: 6000, dimensions: "12 x 18 inch", label: "Small: 12 x 18 inch - 6000" },
          { name: "Medium", value: "medium", price: 8000, dimensions: "18 x 24 inch", label: "Medium: 18 x 24 inch - 8000" },
          { name: "Large", value: "large", price: 12000, dimensions: "24 x 36 inch", label: "Large: 24 x 36 inch - 12000" }
        ],
        colors: ["Gold", "Silver", "Black"],
        description: "Beautiful Ayatul Kursi Islamic wall art made from premium stainless steel with laser cut precision.",
        features: ["Premium stainless steel", "Laser cut design", "Easy mounting", "Weather resistant"],
        inStock: true,
        featured: true,
        tags: ["islamic", "wall-art", "ayatul-kursi", "steel"],
        material: "Stainless Steel"
      },
      {
        name: "99 Asma ul Husna Acrylic Islamic Wall Art",
        slug: generateSlug("99 Asma ul Husna Acrylic Islamic Wall Art"),
        category: "islamic-art",
        collection: "Asma-ul-Husna Frames",
        price: 7000,
        oldPrice: 8200,
        rating: 4.7,
        reviewCount: 89,
        images: [
          "https://picsum.photos/800/600?random=23",
          "https://picsum.photos/800/600?random=24"
        ],
        variants: [
          { name: "Small", value: "small", price: 5000, dimensions: "12 x 18 inch", label: "Small: 12 x 18 inch - 5000" },
          { name: "Medium", value: "medium", price: 7000, dimensions: "18 x 24 inch", label: "Medium: 18 x 24 inch - 7000" },
          { name: "Large", value: "large", price: 10000, dimensions: "24 x 36 inch", label: "Large: 24 x 36 inch - 10000" }
        ],
        colors: ["Blue", "Gold", "White"],
        description: "Elegant 99 Names of Allah wall art in premium acrylic material with modern design.",
        features: ["Premium acrylic", "Modern design", "Easy installation", "UV resistant"],
        inStock: true,
        featured: true,
        tags: ["islamic", "asma-ul-husna", "acrylic", "wall-art"],
        material: "Acrylic"
      },
      {
        name: "Resin Nameplate with Gold Finish",
        slug: generateSlug("Resin Nameplate with Gold Finish"),
        category: "home-decor",
        collection: "Resin Nameplates",
        price: 2800,
        oldPrice: 3500,
        rating: 4.6,
        reviewCount: 50,
        images: [
          "https://picsum.photos/800/600?random=33",
          "https://picsum.photos/800/600?random=34"
        ],
        variants: [
          { name: "Small", value: "small", price: 2200, dimensions: "6 x 8 inch", label: "Small: 6 x 8 inch - 2200" },
          { name: "Medium", value: "medium", price: 2800, dimensions: "8 x 10 inch", label: "Medium: 8 x 10 inch - 2800" },
          { name: "Large", value: "large", price: 3500, dimensions: "10 x 12 inch", label: "Large: 10 x 12 inch - 3500" }
        ],
        colors: ["Blue", "Gold"],
        description: "Durable resin nameplate with gold accents, perfect for home or office.",
        features: ["Weatherproof", "UV resistant", "Customizable"],
        inStock: true,
        featured: false,
        tags: ["resin", "nameplate", "home-decor", "customizable"],
        material: "Resin"
      },
      {
        name: "Modern Geode Wall Art",
        slug: generateSlug("Modern Geode Wall Art"),
        category: "home-decor",
        collection: "Geode Wall Art",
        price: 6000,
        oldPrice: 7500,
        rating: 4.8,
        reviewCount: 91,
        images: [
          "https://picsum.photos/800/600?random=35",
          "https://picsum.photos/800/600?random=36"
        ],
        variants: [
          { name: "Small", value: "small", price: 4500, dimensions: "12 x 16 inch", label: "Small: 12 x 16 inch - 4500" },
          { name: "Medium", value: "medium", price: 6000, dimensions: "16 x 20 inch", label: "Medium: 16 x 20 inch - 6000" },
          { name: "Large", value: "large", price: 8500, dimensions: "20 x 24 inch", label: "Large: 20 x 24 inch - 8500" }
        ],
        colors: ["Purple", "Blue", "Black"],
        description: "Stunning geode-inspired wall art for modern homes with crystal finish.",
        features: ["Resin art", "Shiny crystals", "Durable finish"],
        inStock: true,
        featured: true,
        tags: ["geode", "wall-art", "modern", "crystals"],
        material: "Resin with Crystals"
      },
      {
        name: "Elegant Wedding Gift Set",
        slug: generateSlug("Elegant Wedding Gift Set"),
        category: "gifts",
        collection: "Wedding Gifts",
        price: 4200,
        oldPrice: 5000,
        rating: 4.7,
        reviewCount: 82,
        images: [
          "https://picsum.photos/800/600?random=43",
          "https://picsum.photos/800/600?random=44"
        ],
        variants: [
          { name: "Small", value: "small", price: 3500, dimensions: "8 x 6 x 4 inch", label: "Small: 8 x 6 x 4 inch - 3500" },
          { name: "Medium", value: "medium", price: 4200, dimensions: "10 x 8 x 5 inch", label: "Medium: 10 x 8 x 5 inch - 4200" },
          { name: "Large", value: "large", price: 5500, dimensions: "12 x 10 x 6 inch", label: "Large: 12 x 10 x 6 inch - 5500" }
        ],
        colors: ["White", "Gold"],
        description: "Perfect wedding gift with elegant packaging and premium items.",
        features: ["Gift-ready", "Premium quality", "Customizable"],
        inStock: true,
        featured: false,
        tags: ["wedding", "gift", "elegant", "premium"],
        material: "Mixed Materials"
      },
      {
        name: "Acrylic Wall Cutout",
        slug: generateSlug("Acrylic Wall Cutout"),
        category: "cutouts-signage",
        collection: "Acrylic Cutouts",
        price: 2700,
        oldPrice: 3500,
        rating: 4.5,
        reviewCount: 51,
        images: [
          "https://picsum.photos/800/600?random=51",
          "https://picsum.photos/800/600?random=52"
        ],
        variants: [
          { name: "Small", value: "small", price: 2000, dimensions: "12 x 12 inch", label: "Small: 12 x 12 inch - 2000" },
          { name: "Medium", value: "medium", price: 2700, dimensions: "18 x 18 inch", label: "Medium: 18 x 18 inch - 2700" },
          { name: "Large", value: "large", price: 3800, dimensions: "24 x 24 inch", label: "Large: 24 x 24 inch - 3800" }
        ],
        colors: ["Transparent", "Black"],
        description: "Durable acrylic wall cutout design with precision laser cutting.",
        features: ["Laser cut", "Durable material", "Smooth finish"],
        inStock: true,
        featured: false,
        tags: ["acrylic", "cutout", "laser-cut", "signage"],
        material: "Acrylic"
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`Created ${createdProducts.length} products`);

    // Update category product counts
    console.log('Updating category product counts...');
    for (const category of createdCategories) {
      await category.updateProductCount();
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Created:');
    console.log(`- Admin user: ${admin.email} (password: ${process.env.ADMIN_PASSWORD || 'admin123'})`);
    console.log(`- Sample user: ${user.email} (password: User123)`);
    console.log(`- ${createdCategories.length} categories`);
    console.log(`- ${createdProducts.length} products`);
    
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

// Run seed
const runSeed = async () => {
  await connectDB();
  await seedData();
  mongoose.connection.close();
};

// Run if called directly
if (require.main === module) {
  runSeed();
}

module.exports = { seedData, connectDB };
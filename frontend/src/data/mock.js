// Mock data for ArtStop e-commerce
export const categories = [
  {
    id: 1,
    name: "Islamic Art",
    slug: "islamic-art",
    image:"/homepage/islamicart.heic",
   productCount: 45,
    collections: [
      "Asma-ul-Husna Frames",
      "Ayatul Kursi Wall Art",
      "4 Quls Calligraphy",
      "Bismillah Nameplates",
      "Dua Frames",
      "Quran Stands & Tasbih",
    ],
    collectionImages: {
      "Asma-ul-Husna Frames": "https://picsum.photos/300/200?random=1",
      "Ayatul Kursi Wall Art": "https://picsum.photos/300/200?random=2",
      "4 Quls Calligraphy": "https://picsum.photos/300/200?random=3",
      "Bismillah Nameplates": "https://picsum.photos/300/200?random=4",
      "Dua Frames": "https://picsum.photos/300/200?random=5",
      "Quran Stands & Tasbih": "https://picsum.photos/300/200?random=6",
    },
  },
  {
    id: 2,
    name: "Home Decor",
    slug: "home-decor",
    image:"/homepage/homedecor.heic",
    productCount: 32,
    collections: [
      "Resin Nameplates",
      "Geode Wall Art",
      "Clocks",
      "Memory Frames (Wedding, Baby, Family)",
      "Quote Wall Art",
    ],
    collectionImages: {
      "Resin Nameplates": "https://picsum.photos/300/200?random=7",
      "Geode Wall Art": "https://picsum.photos/300/200?random=8",
      "Clocks": "https://picsum.photos/300/200?random=9",
      "Memory Frames (Wedding, Baby, Family)": "https://picsum.photos/300/200?random=10",
      "Quote Wall Art": "https://picsum.photos/300/200?random=11",
    },
  },
  {
    id: 3,
    name: "Gifts",
    slug: "gifts",
    image: "/homepage/gifts.heic",
    productCount: 28,
    collections: [
      "Wedding Gifts",
      "Housewarming Gifts",
      "Corporate Gifts",
      "Budget Mini Items (Keychains, Bookmarks, Coasters)",
    ],
    collectionImages: {
      "Wedding Gifts": "https://picsum.photos/300/200?random=12",
      "Housewarming Gifts": "https://picsum.photos/300/200?random=13",
      "Corporate Gifts": "https://picsum.photos/300/200?random=14",
      "Budget Mini Items (Keychains, Bookmarks, Coasters)":
        "https://picsum.photos/300/200?random=15",
    },
  },
  {
    id: 4,
    name: "Cutouts & Signage",
    slug: "cutouts-signage",
    image:
      "/homepage/cutouts.heic",
    productCount: 18,
    collections: [
      "Acrylic Cutouts",
      "Metal & Steel Artwork",
      "Vinyl Stickers",
      "Custom Shapes for Homes, Offices, Masjids",
    ],
    collectionImages: {
      "Acrylic Cutouts": "https://picsum.photos/300/200?random=16",
      "Metal & Steel Artwork": "https://picsum.photos/300/200?random=17",
      "Vinyl Stickers": "https://picsum.photos/300/200?random=18",
      "Custom Shapes for Homes, Offices, Masjids":
        "https://picsum.photos/300/200?random=19",
    },
  },
];

export const products = [];


// Reviews (empty for production - will be populated with real reviews)
export const reviews = [];

export const instagramReels = [
  {
    id: 1,
    title: "Artstop Resin School — Episode 1",
    url: "https://www.instagram.com/reel/DLUpidKze2C/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
    videoSrc: "/reeslsection/get.mp4"
  },
  {
    id: 2,
    title: "Art Stop Resin School — Episode 2",
    url: "https://www.instagram.com/reel/DNu1wfA3g-M/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
    videoSrc: "/reeslsection/🎨 Art Stop Resin School — Episode 2 😅The mistake that cost♦️♦️♦️SAVE IT ♦️ ♦️ ♦️ 🚫 What I did.mp4"
  },
  {
    id: 3,
    title: "This isn’t just art—it’s a part of me",
    url: "https://www.instagram.com/reel/DNfP7sjzyFp/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
    videoSrc: "/reeslsection/“This isn’t just art—it’s a part of me. A piece of my dream, poured in layers.”I’ve always belie.mp4"
  },
  {
    id: 4,
    title: "Resin School — Pricing your art",
    url: "https://www.instagram.com/reel/DI5vgi0zEDJ/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
    videoSrc: "/reeslsection/🎨Artstop Resin School - Episode 3“How much should you REALLY charge for resin art”💡 Want me to.mp4"
  }
];

export const instagramProfileUrl = "https://www.instagram.com/artstop.affaa?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";

// Testimonials (empty for production - will be populated with real customer testimonials)
export const testimonials = [];

// Mock Orders Data (empty for production)
export const mockOrders = [];

// Cart mock data (will be stored in localStorage)
export const getCartItems = () => {
  const stored = localStorage.getItem('artstop_cart');
  return stored ? JSON.parse(stored) : [];
};

export const saveCartItems = (items) => {
  localStorage.setItem('artstop_cart', JSON.stringify(items));
  // Trigger a custom event to update cart count immediately
  window.dispatchEvent(new CustomEvent('cartUpdated'));
};

// Wishlist mock data (will be stored in localStorage)
export const getWishlistItems = () => {
  const stored = localStorage.getItem('artstop_wishlist');
  return stored ? JSON.parse(stored) : [];
};

export const saveWishlistItems = (items) => {
  localStorage.setItem('artstop_wishlist', JSON.stringify(items));
  // Trigger a custom event to update wishlist count
  window.dispatchEvent(new CustomEvent('wishlistUpdated'));
};

// Orders mock data (will be stored in localStorage)
export const getOrders = () => {
  const stored = localStorage.getItem('artstop_orders');
  return stored ? JSON.parse(stored) : mockOrders;
};

export const saveOrders = (orders) => {
  localStorage.setItem('artstop_orders', JSON.stringify(orders));
};

// Catalog data persistence (Categories & Products)
export const getCategories = () => {
  try {
    const stored = localStorage.getItem('artstop_categories');
    return stored ? JSON.parse(stored) : categories;
  } catch {
    return categories;
  }
};

export const saveCategories = (items) => {
  localStorage.setItem('artstop_categories', JSON.stringify(items));
  // Trigger a custom event so listeners can react (optional)
  window.dispatchEvent(new CustomEvent('catalogUpdated', { detail: { type: 'categories' } }));
};

export const getProducts = () => {
  try {
    const stored = localStorage.getItem('artstop_products');
    return stored ? JSON.parse(stored) : products;
  } catch {
    return products;
  }
};

export const saveProducts = (items) => {
  localStorage.setItem('artstop_products', JSON.stringify(items));
  // Trigger a custom event so listeners can react (optional)
  window.dispatchEvent(new CustomEvent('catalogUpdated', { detail: { type: 'products' } }));
};


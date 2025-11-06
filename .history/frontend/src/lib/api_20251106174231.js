const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available - check for admin token first, then user token
  const adminToken = localStorage.getItem('artstop_admin_token');
  const userToken = localStorage.getItem('artstop_token') || localStorage.getItem('token');

  // Use admin token if available, otherwise use user token
  const token = adminToken || userToken;
  console.log(`[API DEBUG] ${options.method || 'GET'} ${endpoint} - Token check:`, {
    adminToken: adminToken ? 'present' : 'not found',
    userToken: userToken ? 'present' : 'not found',
    selectedToken: token ? 'present' : 'not found'
  });

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`[API DEBUG] ${options.method || 'GET'} ${endpoint} - Authorization header set`);
  } else {
    console.log(`[API DEBUG] ${options.method || 'GET'} ${endpoint} - No token found, request will be unauthenticated`);
  }

  try {
    console.log(`[API DEBUG] ${options.method || 'GET'} ${endpoint} - Making request to:`, url);
    const response = await fetch(url, config);
    const data = await response.json();

    console.log(`[API DEBUG] ${options.method || 'GET'} ${endpoint} - Response status:`, response.status);
    console.log(`[API DEBUG] ${options.method || 'GET'} ${endpoint} - Response data:`, data);

    if (!response.ok) {
      console.error(`[API DEBUG] API Request Error for ${endpoint}:`, data || response.statusText);
      throw new ApiError(data?.message || data?.error || "API Error", response.status);
    }

    return data; // ✅ always return backend JSON
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`[API DEBUG] ApiError for ${endpoint}:`, error.message, 'Status:', error.status);
      throw error;
    }
    console.error(`[API DEBUG] Network error for ${endpoint}:`, error.message);
    throw new ApiError(error.message || "Network error", 0);
  }
};

const apiRequestWithFormData = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
  };

  // Add auth token if available - check for admin token first, then user token
  const adminToken = localStorage.getItem('artstop_admin_token');
  const userToken = localStorage.getItem('artstop_token') || localStorage.getItem('token') || localStorage.getItem('artstop_user_token');

  // Use admin token if available, otherwise use user token
  const token = adminToken || userToken;
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || 'API request failed', response.status);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0);
  }
};

// Upload API
export const uploadApi = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);

    return apiRequestWithFormData('/api/upload/image', {
      method: 'POST',
      body: formData,
    });
  },

  uploadImages: (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    return apiRequestWithFormData('/api/upload/images', {
      method: 'POST',
      body: formData,
    });
  },
};

// Products API
export const productsApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/products?${queryString}`);
  },

  getAllAdmin: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/products?${queryString}`);
  },

  getFeatured: () => apiRequest('/api/products/featured/list'),

  getById: (id) => apiRequest(`/api/products/${id}`),

  create: (productData) => apiRequest('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  }),

  update: (id, productData) => apiRequest(`/api/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  }),

  delete: (id) => apiRequest(`/api/admin/products/${id}`, {
    method: 'DELETE',
  }),
};

// Orders API
export const ordersApi = {
  getUserOrders: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/orders?${queryString}`);
  },

  getOrderById: (id) => apiRequest(`/api/orders/${id}`),

  createOrder: (orderData) => apiRequest('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  }),

  cancelOrder: (id) => apiRequest(`/api/orders/${id}/cancel`, {
    method: 'PUT',
  }),

  getOrderTracking: (id) => apiRequest(`/api/orders/${id}/tracking`),
};

// Categories API
export const categoriesApi = {
  getAll: () => apiRequest('/api/categories'),

  getBySlug: (slug) => apiRequest(`/api/categories/${slug}`),

  getCollectionProducts: (category, collection, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/categories/${category}/collections/${collection}?${queryString}`);
  },

  create: (categoryData) => apiRequest('/api/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  }),

  update: (id, categoryData) => apiRequest(`/api/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(categoryData),
  }),

  delete: (id) => apiRequest(`/api/categories/${id}`, {
    method: 'DELETE',
  }),
};

// Auth API
export const authApi = {
  sendOTP: (data) => apiRequest('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  verifyOTP: (data) => apiRequest('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  resendOTP: (data) => apiRequest('/api/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Demo authentication for testing
  demoAuth: (data) => apiRequest('/api/auth/demo', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Legacy methods for backward compatibility
  login: (credentials) => apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  register: (userData) => apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
};

export { ApiError };

// Admin API
export const adminApi = {
  getStats: () => apiRequest('/api/admin/stats'),
  getOrders: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/orders?${queryString}`);
  },
  getCustomers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/customers?${queryString}`);
  },
  updateOrderStatus: (orderId, data) => apiRequest(`/api/admin/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  processRefund: (orderId, data) => apiRequest('/api/payments/refund', {
    method: 'POST',
    body: JSON.stringify({ orderId, ...data }),
  }),
};

// Default export for backward compatibility
const api = {
  get: (endpoint) => apiRequest(endpoint),
  post: (endpoint, data) => apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (endpoint, data) => apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (endpoint) => apiRequest(endpoint, {
    method: 'DELETE',
  }),
  upload: (endpoint, formData) => apiRequestWithFormData(endpoint, {
    method: 'POST',
    body: formData,
  }),
};

export default api;
// src/api/api.js

// Sử dụng Proxy '/api' khi chạy local (DEV) để tránh lỗi CORS.
// Khi build production, sử dụng URL thật.
// Cập nhật: Sử dụng '/api' cho cả Production (thông qua Vercel Rewrites) để tránh lỗi CORS.
const API_BASE_URL = '/api';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `Lỗi ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      // Bỏ qua nếu không thể parse JSON
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export const loginUser = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(response);

    // Ánh xạ dữ liệu User từ API (camelCase & nested) sang format của App (snake_case & flat)
    if (data && data.user) {
      const apiUser = data.user;
      const mappedUser = {
        user_id: apiUser.userId,
        username: apiUser.username,
        full_name: apiUser.fullName,
        role_id: apiUser.role ? apiUser.role.roleId : null,
        store_id: apiUser.store ? apiUser.store.storeId : null,
      };
      return { ...data, user: mappedUser };
    }
    return data;
  } catch (error) {
    console.error("Lỗi kết nối khi đăng nhập:", error);
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
  }
};

export const fetchOrders = async () => {
  const response = await fetch(`${API_BASE_URL}/orders`);
  return await handleResponse(response);
};

export const createOrder = async (orderData) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });
  return await handleResponse(response);
};

export const updateOrderStatus = async (orderId, status) => {
  // Swagger: PATCH /orders/update-status?orderId=...&status=...
  const params = new URLSearchParams();
  params.append('orderId', orderId);
  params.append('status', status);

  const response = await fetch(`${API_BASE_URL}/orders/update-status?${params.toString()}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return await handleResponse(response);
};

export const getOrdersByStore = async (storeId) => {
  const response = await fetch(`${API_BASE_URL}/orders/get-by-store/${storeId}`);
  return await handleResponse(response);
};

// --- Product API ---

export const getProducts = async () => {
  const response = await fetch(`${API_BASE_URL}/products`);
  return await handleResponse(response);
};

export const getProductsByType = async (productType) => {
  const response = await fetch(`${API_BASE_URL}/products/get-by-type/${productType}`);
  return await handleResponse(response);
};

export const createProduct = async (productData) => {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  });
  return await handleResponse(response);
};

export const updateProduct = async (productId, productData) => {
  const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  });
  return await handleResponse(response);
};

// --- Delivery API ---

export const createDelivery = async (deliveryData) => {
  // Giả định body gửi lên gồm shipperId, deliveryDate và danh sách orderIds
  // Ví dụ: { shipperId: 7, deliveryDate: "2023-11-20", orderIds: [3, 4] }
  const response = await fetch(`${API_BASE_URL}/deliveries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(deliveryData),
  });
  return await handleResponse(response);
};
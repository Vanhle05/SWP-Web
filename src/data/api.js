// src/data/api.js
// API client theo OpenAPI spec: https://kitchencontrolbe.onrender.com/swagger-ui/index.html
// Base URL qua Vercel rewrites: /api -> backend

const API_BASE_URL = '/api';
import { ROLE_ID } from './constants';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `Lỗi ${response.status}: ${response.statusText}`;
    const status = response.status;
    try {
      const errorData = await response.json();
      const msg =
        (errorData && (errorData.message ?? errorData.error ?? errorData.errorDescription ?? errorData.msg)) ||
        '';
      if (msg && String(msg).trim()) {
        errorMessage = String(msg).trim();
      } else {
        const defaults = {
          400: 'Yêu cầu không hợp lệ. Kiểm tra lại thông tin gửi lên.',
          401: 'Tên đăng nhập hoặc mật khẩu không đúng.',
          404: 'Không tìm thấy.',
          500: 'Lỗi máy chủ. Vui lòng thử lại sau.',
        };
        errorMessage = defaults[status] || errorMessage;
      }
    } catch (e) {
      const defaults = {
        400: 'Yêu cầu không hợp lệ. Kiểm tra lại thông tin gửi lên.',
        401: 'Tên đăng nhập hoặc mật khẩu không đúng.',
      };
      errorMessage = defaults[status] || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

// --- Mappers: API camelCase -> app snake_case (để component dùng thống nhất) ---
function mapProduct(p) {
  if (!p) return null;
  return {
    product_id: p.productId,
    product_name: p.productName,
    product_type: p.productType,
    unit: p.unit,
    shelf_life_days: p.shelfLifeDays,
    image: p.img || '📦',
    price: p.price ?? 0,
  };
}

function mapOrderDetail(od) {
  if (!od) return null;
  return {
    order_detail_id: od.orderDetailId,
    order_id: od.orderId,
    product_id: od.productId,
    product_name: od.productName,
    quantity: od.quantity,
  };
}

function mapOrder(o) {
  if (!o) return null;
  return {
    order_id: o.orderId,
    delivery_id: o.deliveryId,
    store_id: o.storeId,
    store_name: o.storeName,
    order_date: o.orderDate,
    status: o.status,
    img: o.img,
    comment: o.comment,
    order_details: Array.isArray(o.orderDetails) ? o.orderDetails.map(mapOrderDetail) : [],
    feedback_id: o.feedbackId,
    feedback_rating: o.feedbackRating,
    feedback_comment: o.feedbackComment,
  };
}

function mapDelivery(d) {
  if (!d) return null;
  return {
    delivery_id: d.deliveryId,
    delivery_date: d.deliveryDate,
    created_at: d.createdAt,
    shipper_id: d.shipperId,
    shipper_name: d.shipperName,
    orders: Array.isArray(d.orders) ? d.orders.map(mapOrder) : [],
  };
}

function mapInventory(inv) {
  if (!inv) return null;
  return {
    inventory_id: inv.inventoryId,
    product_id: inv.productId ?? inv.product_id,
    product_name: inv.product_name,
    batch: inv.batch,
    quantity: inv.quantity,
    expiry_date: inv.expiryDate,
  };
}

const ROLE_NAME_TO_ID = {
  Admin: ROLE_ID.ADMIN,
  Manager: ROLE_ID.MANAGER,
  'Store Staff': ROLE_ID.STORE_STAFF,
  'Kitchen Manager': ROLE_ID.KITCHEN_MANAGER,
  'Supply Coordinator': ROLE_ID.SUPPLY_COORDINATOR,
  Shipper: ROLE_ID.SHIPPER
};

function mapUserResponse(u) {
  if (!u) return null;
  const roleId = u.roleId ?? (u.roleName && ROLE_NAME_TO_ID[u.roleName]);
  return {
    user_id: u.userId,
    username: u.username,
    full_name: u.fullName,
    role_name: u.roleName,
    role_id: roleId,
    store_id: u.storeId,
    store_name: u.storeName,
  };
}

function mapStoreResponse(s) {
  if (!s) return null;
  return {
    store_id: s.storeId,
    store_name: s.storeName,
    address: s.address,
    phone: s.phone,
  };
}

function mapFeedback(f) {
  if (!f) return null;
  return {
    feedback_id: f.feedbackId,
    order_id: f.orderId,
    store_id: f.storeId,
    store_name: f.storeName,
    rating: f.rating,
    comment: f.comment,
    created_at: f.createdAt,
  };
}

// --- Authentication (OpenAPI: /auth/login) ---

const LOGIN_ERROR_MSG = 'Tên đăng nhập hoặc mật khẩu không đúng.';

export const loginUser = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    // API trả 400 (Invalid) hoặc 401 (Unauthorized) khi sai tên/mật khẩu
    if (response.status === 400 || response.status === 401) {
      throw new Error(LOGIN_ERROR_MSG);
    }
    const data = await handleResponse(response);

    // API có thể trả về { user } hoặc chính user. Chuẩn hóa sang { user } với snake_case + role/store
    const apiUser = data?.user ?? data;
    if (apiUser && (apiUser.userId != null || apiUser.user_id != null)) {
      const uid = apiUser.userId ?? apiUser.user_id;
      
      // Fix: Ưu tiên lấy roleId từ object role, nếu không có thì lấy trực tiếp từ user
      const rawRoleId = apiUser.role?.roleId ?? apiUser.role?.role_id ?? apiUser.roleId ?? apiUser.role_id;
      const rawRoleName = apiUser.role?.roleName ?? apiUser.role?.role_name ?? apiUser.roleName;

      const role = apiUser.role
        ? { role_id: rawRoleId, role_name: rawRoleName }
        : (rawRoleId ? { role_id: rawRoleId, role_name: rawRoleName } : null);

      const store = apiUser.store
        ? {
            store_id: apiUser.store.storeId ?? apiUser.store.store_id,
            store_name: apiUser.store.storeName ?? apiUser.store.store_name,
            address: apiUser.store.address,
            phone: apiUser.store.phone,
          }
        : null;
      const mappedUser = {
        user_id: uid,
        username: apiUser.username,
        full_name: apiUser.fullName ?? apiUser.full_name,
        role_id: rawRoleId ?? null,
        store_id: store?.store_id ?? null,
        role,
        store,
        token: data?.token,
      };
      return { user: mappedUser, token: data?.token };
    }
    return data;
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    // Giữ nguyên thông báo từ API (400/401: sai tên hoặc mật khẩu)
    if (error instanceof Error && error.message && !error.message.startsWith('Failed to fetch') && !error.message.includes('NetworkError')) {
      throw error;
    }
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
  }
};

// --- Orders API (trả về snake_case) ---

export const fetchOrders = async () => {
  const data = await handleResponse(await fetch(`${API_BASE_URL}/orders`));
  return Array.isArray(data) ? data.map(mapOrder) : data;
};

/** @param {{ storeId?: number, store_id?: number, comment?: string, orderDetails?: Array<{ productId?: number, product_id?: number, quantity: number }> }} orderData */
export const createOrder = async (orderData) => {
  const storeId = orderData.storeId ?? orderData.store_id;
  const comment = orderData.comment ?? '';
  const orderDetails = (orderData.orderDetails ?? []).map((od) => ({
    productId: od.productId ?? od.product_id,
    quantity: Number(od.quantity),
  }));
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeId, comment, orderDetails }),
  });
  const data = await handleResponse(response);
  return data ? mapOrder(data) : data;
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
  const data = await handleResponse(await fetch(`${API_BASE_URL}/orders/get-by-store/${storeId}`));
  return Array.isArray(data) ? data.map(mapOrder) : data;
};

// --- Product API (trả về snake_case) ---

export const getProducts = async () => {
  const data = await handleResponse(await fetch(`${API_BASE_URL}/products`));
  return Array.isArray(data) ? data.map(mapProduct) : data;
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

// --- User API (trả về snake_case) ---

export const getAllUsers = async () => {
  const data = await handleResponse(await fetch(`${API_BASE_URL}/users`));
  return Array.isArray(data) ? data.map(mapUserResponse) : data;
};

export const getUserById = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`);
  return await handleResponse(response);
};

export const createUser = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return await handleResponse(response);
};

export const updateUser = async (userId, userData) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return await handleResponse(response);
};

export const deleteUser = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'DELETE',
  });
  return await handleResponse(response);
};

// --- Stores API (trả về snake_case) ---

export const getAllStores = async () => {
  const data = await handleResponse(await fetch(`${API_BASE_URL}/stores`));
  return Array.isArray(data) ? data.map(mapStoreResponse) : data;
};

export const getStoreById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/stores/${id}`);
  return await handleResponse(response);
};

export const createStore = async (storeData) => {
  const response = await fetch(`${API_BASE_URL}/stores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(storeData),
  });
  return await handleResponse(response);
};

export const updateStore = async (id, storeData) => {
  const response = await fetch(`${API_BASE_URL}/stores/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(storeData),
  });
  return await handleResponse(response);
};

export const deleteStore = async (id) => {
  const response = await fetch(`${API_BASE_URL}/stores/${id}`, {
    method: 'DELETE',
  });
  return await handleResponse(response);
};

// --- Delivery API (trả về snake_case) ---

export const getDeliveries = async () => {
  const data = await handleResponse(await fetch(`${API_BASE_URL}/deliveries`));
  return Array.isArray(data) ? data.map(mapDelivery) : data;
};

export const getDeliveriesByShipperId = async (shipperId) => {
  const data = await handleResponse(await fetch(`${API_BASE_URL}/deliveries/get-by-shipper/${shipperId}`));
  return Array.isArray(data) ? data.map(mapDelivery) : data;
};

export const assignShipperToDelivery = async (deliveryId, shipperId) => {
  const response = await fetch(
    `${API_BASE_URL}/deliveries/${deliveryId}/assign-shipper/${shipperId}`,
    { method: 'PATCH', headers: { 'Content-Type': 'application/json' } }
  );
  return await handleResponse(response);
};

export const createDelivery = async (deliveryData) => {
  // Lưu ý: OpenAPI spec không có POST /deliveries; giữ lại nếu backend hỗ trợ.
  const response = await fetch(`${API_BASE_URL}/deliveries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deliveryData),
  });
  return await handleResponse(response);
};

// --- Inventory Transactions API ---

export const getAllTransactions = async () => {
  const response = await fetch(`${API_BASE_URL}/inventory-transactions`);
  return await handleResponse(response);
};

export const createTransaction = async (data) => {
  const response = await fetch(`${API_BASE_URL}/inventory-transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await handleResponse(response);
};

export const getTransactionsByProductId = async (productId) => {
  const response = await fetch(`${API_BASE_URL}/inventory-transactions/product/${productId}`);
  return await handleResponse(response);
};

export const getTransactionsByBatchId = async (batchId) => {
  const response = await fetch(`${API_BASE_URL}/inventory-transactions/batch/${batchId}`);
  return await handleResponse(response);
};

// --- Inventories API (trả về snake_case, InventoryResponse có product_name) ---

export const getInventories = async () => {
  const data = await handleResponse(await fetch(`${API_BASE_URL}/inventories`));
  return Array.isArray(data) ? data.map(mapInventory) : data;
};

export const getInventoryById = async (inventoryId) => {
  const response = await fetch(`${API_BASE_URL}/inventories/get-by-id/${inventoryId}`);
  return await handleResponse(response);
};

// --- Quality Feedback API (trả về snake_case) ---

export const getAllFeedbacks = async () => {
  const data = await handleResponse(await fetch(`${API_BASE_URL}/feedbacks`));
  return Array.isArray(data) ? data.map(mapFeedback) : data;
};

export const createFeedback = async (data) => {
  const response = await fetch(`${API_BASE_URL}/feedbacks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await handleResponse(response);
};

// --- Recipes API ---

export const getRecipes = async () => {
  const response = await fetch(`${API_BASE_URL}/recipes`);
  return await handleResponse(response);
};

export const searchRecipes = async (keyword) => {
  const response = await fetch(`${API_BASE_URL}/recipes/search/${encodeURIComponent(keyword)}`);
  return await handleResponse(response);
};
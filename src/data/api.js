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
      const text = await response.text();
      const errorData = text ? JSON.parse(text) : {};
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
  // Fix lỗi "Unexpected end of JSON input" khi body rỗng
  const text = await response.text();
  return text ? JSON.parse(text) : null;
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
    product_id: od.productId ?? od.product?.productId,
    product_name: od.productName ?? od.product?.productName,
    quantity: od.quantity,
  };
}

function mapOrder(o) {
  if (!o) return null;
  return {
    order_id: o.orderId,
    delivery_id: o.deliveryId,
    store_id: o.storeId ?? o.store?.storeId,
    store_name: o.storeName ?? o.store?.storeName,
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
    shipper_id: d.shipperId ?? d.shipper?.userId,
    shipper_name: d.shipperName ?? d.shipper?.fullName,
    orders: Array.isArray(d.orders) ? d.orders.map(mapOrder) : [],
  };
}

function mapInventory(inv) {
  if (!inv) return null;
  return {
    inventory_id: inv.inventoryId,
    product_id: inv.productId ?? inv.product?.productId ?? inv.product?.product_id,
    product_name: inv.productName ?? inv.product?.productName ?? inv.product?.product_name,
    batch: inv.batch,
    batch_id: inv.batch?.batchId ?? inv.batchId, // Lấy ID số của lô để dùng cho transaction
    quantity: inv.quantity,
    expiry_date: inv.expiryDate ?? inv.expiry_date,
  };
}

const ROLE_NAME_TO_ID = {
  'admin': ROLE_ID.ADMIN,
  'manager': ROLE_ID.MANAGER,
  'store staff': ROLE_ID.STORE_STAFF,
  'kitchen manager': ROLE_ID.KITCHEN_MANAGER,
  'supply coordinator': ROLE_ID.SUPPLY_COORDINATOR,
  'shipper': ROLE_ID.SHIPPER,
  'warehouse': 7 // Mapping role Warehouse từ backend
};

function mapUserResponse(u) {
  if (!u) return null;
  
  let roleId = u.roleId ?? u.role?.roleId;
  const roleName = u.roleName ?? u.role?.roleName;
  
  if (!roleId && roleName) {
    const key = Object.keys(ROLE_NAME_TO_ID).find(k => k.toLowerCase() === roleName.toLowerCase());
    if (key) roleId = ROLE_NAME_TO_ID[key];
  }

  return {
    user_id: u.userId,
    username: u.username,
    full_name: u.fullName,
    role_name: roleName,
    role_id: roleId,
    store_id: u.storeId ?? u.store?.storeId,
    store_name: u.storeName ?? u.store?.storeName,
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

// Helper: Giải mã JWT để lấy thông tin Role nếu Body không có
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

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
    console.log("API Login Response Raw:", data); // Debug log để xem cấu trúc thật

    // API có thể trả về { data: { user } }, { user }, hoặc chính user. Chuẩn hóa!
    const responseData = data?.data ?? data;
    const apiUser = responseData?.user ?? responseData;
    // Token có thể nằm ở root hoặc trong object
    const token = data?.token ?? responseData?.token ?? apiUser?.token; 

    // --- BƯỚC 2: GỌI API LẤY CHI TIẾT USER ĐỂ CÓ ROLE CHÍNH XÁC ---
    if (apiUser && (apiUser.userId != null || apiUser.user_id != null)) {
      const uid = apiUser.userId ?? apiUser.user_id;
      let finalUserDetail = apiUser;
      let rawRoleName = apiUser.roleName ?? apiUser.role_name;
      let rawRoleId = apiUser.roleId ?? apiUser.role_id;
      let rawStoreId = apiUser.storeId ?? apiUser.store_id;
      let rawStoreName = apiUser.storeName ?? apiUser.store_name;

      // Nếu login response thiếu Role (trường hợp bạn đang gặp), gọi API /users/{id}
      // API này trả về UserResponse có roleName (theo OpenAPI)
      if (!rawRoleName && !rawRoleId) {
        try {
          console.log(`[Login Fix] Fetching details for User ID: ${uid}`);
          const detailResponse = await fetch(`${API_BASE_URL}/users/${uid}`, {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json',
              // Nếu backend yêu cầu token, gửi kèm (dù vừa login xong có thể chưa cần)
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          });
          
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            // OpenAPI: /users/{id} trả về UserResponse { roleName, storeId, ... }
            const userResp = detailData?.data ?? detailData; // Handle wrapper if any
            
            console.log("[Login Fix] User Detail Response:", userResp);
            
            if (userResp) {
              finalUserDetail = { ...apiUser, ...userResp }; // Merge data
              rawRoleName = userResp.roleName;
              rawStoreId = userResp.storeId;
              rawStoreName = userResp.storeName;
            }
          }
        } catch (err) {
          console.error("[Login Fix] Failed to fetch user details:", err);
        }
      }

      // --- BƯỚC 3: MAP ROLE NAME SANG ID ---
      if (!rawRoleId && rawRoleName) {
        const cleanName = String(rawRoleName).trim().toLowerCase();
        
        // 1. Thử tìm kiếm chính xác trước (an toàn nhất)
        const mappedKey = Object.keys(ROLE_NAME_TO_ID).find(k => k === cleanName);
        if (mappedKey) {
          rawRoleId = ROLE_NAME_TO_ID[mappedKey];
        } else {
          // 2. Nếu không khớp, thử tìm kiếm "mờ" theo từ khóa (linh hoạt hơn)
          console.warn(`[Login Fix] Role name '${cleanName}' không khớp chính xác. Đang thử tìm kiếm mờ...`);
          if (cleanName.includes('kitchen')) {
            rawRoleId = ROLE_ID.KITCHEN_MANAGER;
          } else if (cleanName.includes('coord')) {
            rawRoleId = ROLE_ID.SUPPLY_COORDINATOR;
          } else if (cleanName.includes('store')) {
            rawRoleId = ROLE_ID.STORE_STAFF;
          } else if (cleanName.includes('ship')) {
            rawRoleId = ROLE_ID.SHIPPER;
          } else if (cleanName.includes('admin')) {
            rawRoleId = ROLE_ID.ADMIN;
          } else if (cleanName.includes('manager')) { // Để cuối cùng vì nó chung chung
            rawRoleId = ROLE_ID.MANAGER;
          } else if (cleanName.includes('warehouse')) {
            rawRoleId = 7; // ID cho Warehouse
          }
        }
      }
      
      const role = { role_id: rawRoleId, role_name: rawRoleName || 'Unknown' };
      const store = {
        store_id: rawStoreId,
        store_name: rawStoreName
      };
      
      const mappedUser = {
        user_id: uid,
        username: finalUserDetail.username,
        full_name: finalUserDetail.fullName ?? finalUserDetail.full_name,
        role_id: rawRoleId ?? null,
        store_id: rawStoreId ?? null,
        role,
        store,
        token: token,
      };
      
      console.log("Final Mapped User:", mappedUser);
      return { user: mappedUser, token: token };
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
  // Fix: Backend quy định enum là "CANCLED" (thiếu chữ L), cần map đúng để không bị lỗi 400
  params.append('status', status === 'CANCELLED' ? 'CANCLED' : status);

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
  const data = await handleResponse(response);
  return Array.isArray(data) ? data.map(mapProduct) : data;
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
  // OpenAPI Spec hiện tại KHÔNG có endpoint POST /deliveries.
  // Để tránh lỗi 405 Method Not Allowed, ta chặn ngay tại đây.
  throw new Error("Chức năng tạo chuyến xe chưa được Lưu và Đanh hỗ trợ (Missing POST /deliveries).");
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

// --- Log Batches API (cho Flow 3: Procurement) ---

export const createPurchaseBatch = async (batchData) => {
  // OpenAPI Spec không có endpoint /log-batches
  throw new Error("Chức năng nhập lô hàng chưa được Lưu và Đanh hỗ trợ (Missing API).");
};

// API tạo lô sản xuất (Production Batch)
export const createBatch = async (batchData) => {
  // OpenAPI Spec không có endpoint /log-batches
  throw new Error("Chức năng tạo lô sản xuất chưa được Lưu và Đanh hỗ trợ (Missing API).");
};

// API lấy kế hoạch sản xuất
// --- Production Plans API ---
export const getProductionPlans = async () => {
  const response = await fetch(`${API_BASE_URL}/production-plans`);
  return await handleResponse(response);
};

export const createProductionPlan = async (planData) => {
  const response = await fetch(`${API_BASE_URL}/production-plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(planData),
  });
  return await handleResponse(response);
};

export const getProductionPlanById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/production-plans/${id}`);
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
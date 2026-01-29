// Mock Data for Franchise Central Kitchen Management System
import React from 'react';

export const roles = [
  { role_id: 1, role_name: 'Admin' },
  { role_id: 2, role_name: 'Supply Coordinator' },
  { role_id: 3, role_name: 'Kitchen Manager' },
  { role_id: 4, role_name: 'Store Manager' },
  { role_id: 5, role_name: 'Shipper' },
];

export const stores = [
  { store_id: 1, store_name: 'Bakery South', address: '789 Nguyen Trai, District 5', phone: '0903333333' },
  { store_id: 2, store_name: 'Bakery East', address: '101 Vo Van Ngan, Thu Duc City', phone: '0904444444' },
  { store_id: 3, store_name: 'Bakery West', address: 'Store West Name, Thu Duc City', phone: '123456789' },
  { store_id: 4, store_name: 'Bakery North', address: 'Store North Name, Thu Duc City', phone: '987654321' },
  { store_id: 5, store_name: 'Bakery 1', address: 'Store 1 Name, Thu Duc City', phone: '080811111111' },
];

export const users = [
  { user_id: 1, username: 'admin', password: 'pass123', full_name: 'System Administrator', role_id: 1, store_id: null, is_active: true },
  { user_id: 2, username: 'supply_coor', password: 'pass123', full_name: 'Tran Van Supply', role_id: 2, store_id: null, is_active: true },
  { user_id: 3, username: 'kitchen_mgr', password: 'pass123', full_name: 'Nguyen Chef Manager', role_id: 3, store_id: 1, is_active: true },
  { user_id: 4, username: 'mgr_south', password: 'pass123', full_name: 'Manager South', role_id: 4, store_id: 1, is_active: true },
  { user_id: 5, username: 'mgr_east', password: 'pass123', full_name: 'Manager East', role_id: 4, store_id: 2, is_active: true },
  { user_id: 6, username: 'mgr_west', password: 'pass123', full_name: 'Manager West', role_id: 4, store_id: 3, is_active: true },
  { user_id: 7, username: 'mgr_north', password: 'pass123', full_name: 'Manager North', role_id: 4, store_id: 4, is_active: true },
  { user_id: 8, username: 'mgr_one', password: 'pass123', full_name: 'Manager One', role_id: 4, store_id: 5, is_active: true },
  { user_id: 9, username: 'shipper1', password: 'pass123', full_name: 'Shipper Nguyen', role_id: 5, store_id: null, is_active: true },
];

export const products = [
  { product_id: 1, product_name: 'Bột mì (Flour)', product_type: 'RAW_MATERIAL', unit: 'kg', shelf_life_days: 180, image: '🌾' },
  { product_id: 2, product_name: 'Đường (Sugar)', product_type: 'RAW_MATERIAL', unit: 'kg', shelf_life_days: 365, image: '🍬' },
  { product_id: 3, product_name: 'Trứng gà (Eggs)', product_type: 'RAW_MATERIAL', unit: 'quả', shelf_life_days: 10, image: '🥚' },
  { product_id: 4, product_name: 'Sữa tươi (Milk)', product_type: 'RAW_MATERIAL', unit: 'lít', shelf_life_days: 7, image: '🥛' },
  { product_id: 5, product_name: 'Socola (Chocolate)', product_type: 'RAW_MATERIAL', unit: 'kg', shelf_life_days: 180, image: '🍫' },
  { product_id: 6, product_name: 'Bột bánh ngọt (Dough)', product_type: 'SEMI_FINISHED', unit: 'kg', shelf_life_days: 2, image: '🫓' },
  { product_id: 7, product_name: 'Kem trứng (Custard)', product_type: 'SEMI_FINISHED', unit: 'lít', shelf_life_days: 3, image: '🍮' },
  { product_id: 8, product_name: 'Bánh Croissant', product_type: 'FINISHED_PRODUCT', unit: 'cái', shelf_life_days: 1, image: '🥐', price: 25000 },
  { product_id: 9, product_name: 'Bánh Mousse', product_type: 'FINISHED_PRODUCT', unit: 'cái', shelf_life_days: 3, image: '🍰', price: 45000 },
  { product_id: 10, product_name: 'Bánh Donut', product_type: 'FINISHED_PRODUCT', unit: 'cái', shelf_life_days: 2, image: '🍩', price: 20000 },
];

export const recipes = [
  { recipe_id: 1, product_id: 6, recipe_name: 'Công thức Bột cơ bản', yield_quantity: 10, description: 'Trộn nguyên liệu' },
  { recipe_id: 2, product_id: 8, recipe_name: 'Croissant Socola', yield_quantity: 50, description: 'Nướng 180 độ' },
];

export const recipeDetails = [
  { recipe_detail_id: 1, recipe_id: 1, raw_material_id: 1, quantity: 5 },
  { recipe_detail_id: 2, recipe_id: 1, raw_material_id: 2, quantity: 2 },
  { recipe_detail_id: 3, recipe_id: 1, raw_material_id: 3, quantity: 20 },
  { recipe_detail_id: 4, recipe_id: 1, raw_material_id: 4, quantity: 2 },
  { recipe_detail_id: 5, recipe_id: 2, raw_material_id: 6, quantity: 8 },
  { recipe_detail_id: 6, recipe_id: 2, raw_material_id: 5, quantity: 2 },
];

export const productionPlans = [
  { plan_id: 1, kitchen_id: 1, created_by: 3, plan_date: '2023-10-01', start_date: '2023-10-01', end_date: '2023-10-03', status: 'DONE', note: 'Plan tuần 1 tháng 10' },
  { plan_id: 2, kitchen_id: 1, created_by: 3, plan_date: new Date().toISOString().split('T')[0], start_date: new Date().toISOString().split('T')[0], end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'PROCESSING', note: 'Plan tuần này' },
];

export const productionPlanDetails = [
  { plan_detail_id: 1, plan_id: 1, product_id: 8, quantity: 200, note: 'Croissant cho tuần 1' },
  { plan_detail_id: 2, plan_id: 2, product_id: 10, quantity: 150, note: 'Donut cho tuần này' },
  { plan_detail_id: 3, plan_id: 2, product_id: 8, quantity: 100, note: 'Croissant cho tuần này' },
];

export const logBatches = [
  { batch_id: 1, plan_id: null, product_id: 1, quantity: 500, production_date: '2023-10-01', expiry_date: '2024-04-01', status: 'DONE', type: 'PURCHASE', created_at: '2023-10-01' },
  { batch_id: 2, plan_id: null, product_id: 5, quantity: 200, production_date: '2023-10-01', expiry_date: '2024-04-01', status: 'DONE', type: 'PURCHASE', created_at: '2023-10-01' },
  { batch_id: 3, plan_id: 1, product_id: 8, quantity: 200, production_date: '2023-10-03', expiry_date: '2023-10-04', status: 'DONE', type: 'PRODUCTION', created_at: '2023-10-03' },
  { batch_id: 4, plan_id: 2, product_id: 10, quantity: 100, production_date: new Date().toISOString().split('T')[0], expiry_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'PROCESSING', type: 'PRODUCTION', created_at: new Date().toISOString() },
];

export const inventories = [
  { inventory_id: 1, product_id: 1, batch_id: 1, quantity: 400, expiry_date: '2024-04-01' },
  { inventory_id: 2, product_id: 8, batch_id: 3, quantity: 50, expiry_date: '2024-01-30' },
  { inventory_id: 3, product_id: 10, batch_id: 4, quantity: 80, expiry_date: '2024-01-28' },
  { inventory_id: 4, product_id: 9, batch_id: null, quantity: 30, expiry_date: '2024-01-29' },
];

export const inventoryTransactions = [
  { transaction_id: 1, product_id: 1, created_by: 2, batch_id: 1, type: 'IMPORT', quantity: 500, created_at: '2023-10-01', note: 'Nhập kho bột mì' },
  { transaction_id: 2, product_id: 1, created_by: 3, batch_id: 1, type: 'EXPORT', quantity: 100, created_at: '2023-10-02', note: 'Xuất bột mì làm bánh' },
];

export const deliveries = [
  { delivery_id: 1, delivery_date: '2023-10-04', status: 'DONE', shipper_id: 9, created_at: '2023-10-04' },
  { delivery_id: 2, delivery_date: new Date().toISOString().split('T')[0], status: 'PROCESSING', shipper_id: 9, created_at: new Date().toISOString() },
  { delivery_id: 3, delivery_date: new Date().toISOString().split('T')[0], status: 'WAITTING', shipper_id: null, created_at: new Date().toISOString() },
];

export const orders = [
  { order_id: 1, delivery_id: 1, store_id: 2, plan_id: 1, order_date: '2023-10-04T00:00:00', status: 'DONE' },
  { order_id: 2, delivery_id: 2, store_id: 3, plan_id: 1, order_date: new Date().toISOString(), status: 'PROCESSING' },
  { order_id: 3, delivery_id: null, store_id: 5, plan_id: 2, order_date: new Date().toISOString(), status: 'WAITTING' },
  { order_id: 4, delivery_id: null, store_id: 4, plan_id: null, order_date: new Date().toISOString(), status: 'WAITTING' },
  { order_id: 5, delivery_id: 3, store_id: 2, plan_id: null, order_date: new Date().toISOString(), status: 'WAITTING' },
];

export const orderDetails = [
  { order_detail_id: 1, order_id: 1, product_id: 8, quantity: 100 },
  { order_detail_id: 2, order_id: 2, product_id: 8, quantity: 50 },
  { order_detail_id: 3, order_id: 3, product_id: 10, quantity: 20 },
  { order_detail_id: 4, order_id: 4, product_id: 9, quantity: 15 },
  { order_detail_id: 5, order_id: 4, product_id: 8, quantity: 25 },
  { order_detail_id: 6, order_id: 5, product_id: 10, quantity: 30 },
];

export const qualityFeedbacks = [
  { feedback_id: 1, order_id: 1, store_id: 2, rating: 5, comment: 'Hàng về đúng giờ, bánh ngon', created_at: new Date().toISOString() },
];

export const notifications = [
  { id: 1, user_id: 4, title: 'Đơn hàng #1 đang được giao', time: '5 phút trước', read: false, type: 'order' },
  { id: 2, user_id: 3, title: 'Cảnh báo nguyên liệu Bột mì sắp hết', time: '1 giờ trước', read: false, type: 'inventory' },
  { id: 3, user_id: 9, title: 'Bạn vừa được gán chuyến xe mới #2', time: '10 phút trước', read: true, type: 'delivery' },
  { id: 4, user_id: 2, title: 'Yêu cầu nhập kho mới từ Bếp', time: '30 phút trước', read: false, type: 'inventory' },
  { id: 5, user_id: 4, title: 'Đơn hàng #5 đã được xác nhận', time: '2 giờ trước', read: true, type: 'order' },
];

export const reports = [];

// --- API ---
export const fetchOrders = async () => {
  try {
    const response = await fetch('https://kitchencontrolbe.onrender.com/orders');
    if (!response.ok) throw new Error('Failed to fetch orders');
    const data = await response.json();
    
    if (Array.isArray(data)) {
      // Update orders array in-place to maintain references
      orders.length = 0;
      orders.push(...data);
      notifyListeners();
    }
  } catch (error) {
    console.error('Error fetching orders from API:', error);
  }
};

export const loginUser = async (username, password) => {
  try {
    const response = await fetch('https://kitchencontrolbe.onrender.com/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Đăng nhập thất bại');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// --- Reactivity System for Mock Data ---
// This is a simple pub/sub system to make components re-render when mock data changes.
let listeners = [];

export const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const subscribe = (listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

export const useMockDataWatcher = () => {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => subscribe(forceUpdate), []);
};
// -----------------------------------------

// Helper functions
export const getProductById = (id) => products.find(p => p.product_id === id);
export const getStoreById = (id) => stores.find(s => s.store_id === id);
export const getUserById = (id) => users.find(u => u.user_id === id);
export const getRoleById = (id) => roles.find(r => r.role_id === id);

export const getFinishedProducts = () => products.filter(p => p.product_type === 'FINISHED_PRODUCT');
export const getRawMaterials = () => products.filter(p => p.product_type === 'RAW_MATERIAL');
export const getSemiFinished = () => products.filter(p => p.product_type === 'SEMI_FINISHED');

export const getOrdersByStoreId = (storeId) => orders.filter(o => o.store_id === storeId);
export const getOrderDetailsById = (orderId) => orderDetails.filter(od => od.order_id === orderId);

export const getAvailableStock = (productId) => {
  const totalInventory = inventories
    .filter(inv => inv.product_id === productId)
    .reduce((sum, inv) => sum + inv.quantity, 0);
  
  const reservedQuantity = orders
    .filter(o => o.status === 'WAITTING' || o.status === 'PROCESSING')
    .flatMap(o => orderDetails.filter(od => od.order_id === o.order_id && od.product_id === productId))
    .reduce((sum, od) => sum + od.quantity, 0);
  
  return totalInventory - reservedQuantity;
};

export const getOrdersWithDetails = () => {
  return orders.map(order => ({
    ...order,
    store: getStoreById(order.store_id),
    details: orderDetails
      .filter(od => od.order_id === order.order_id)
      .map(od => ({
        ...od,
        product: getProductById(od.product_id)
      }))
  }));
};

export const getDeliveriesWithOrders = () => {
  return deliveries.map(delivery => ({
    ...delivery,
    shipper: getUserById(delivery.shipper_id),
    orders: orders
      .filter(o => o.delivery_id === delivery.delivery_id)
      .map(o => ({
        ...o,
        store: getStoreById(o.store_id),
        details: orderDetails
          .filter(od => od.order_id === o.order_id)
          .map(od => ({
            ...od,
            product: getProductById(od.product_id)
          }))
      }))
  }));
};

export const getProductionPlansWithDetails = () => {
  return productionPlans.map(plan => ({
    ...plan,
    createdBy: getUserById(plan.created_by),
    details: productionPlanDetails
      .filter(pd => pd.plan_id === plan.plan_id)
      .map(pd => ({
        ...pd,
        product: getProductById(pd.product_id)
      })),
    batches: logBatches
      .filter(b => b.plan_id === plan.plan_id)
      .map(b => ({
        ...b,
        product: getProductById(b.product_id)
      }))
  }));
};

export const getInventoryWithProducts = () => {
  return inventories.map(inv => ({
    ...inv,
    product: getProductById(inv.product_id),
    batch: logBatches.find(b => b.batch_id === inv.batch_id)
  }));
};

// Order status labels
export const ORDER_STATUS = {
  WAITTING: { label: 'Chờ xử lý', color: 'warning', class: 'status-waiting' },
  PROCESSING: { label: 'Đang xử lý', color: 'info', class: 'status-processing' },
  DELIVERING: { label: 'Đang giao', color: 'purple', class: 'status-delivering' },
  DONE: { label: 'Hoàn thành', color: 'success', class: 'status-done' },
  DAMAGED: { label: 'Hư hỏng', color: 'destructive', class: 'status-damaged' },
  CANCLED: { label: 'Đã hủy', color: 'muted', class: 'status-cancelled' },
};

export const DELIVERY_STATUS = {
  WAITTING: { label: 'Chờ giao', color: 'warning', class: 'status-waiting' },
  PROCESSING: { label: 'Đang giao', color: 'info', class: 'status-processing' },
  DONE: { label: 'Hoàn thành', color: 'success', class: 'status-done' },
};

export const BATCH_STATUS = {
  PROCESSING: { label: 'Đang sản xuất', color: 'info', class: 'status-processing' },
  DONE: { label: 'Hoàn thành', color: 'success', class: 'status-done' },
  EXPIRED: { label: 'Hết hạn', color: 'destructive', class: 'status-damaged' },
  DAMAGED: { label: 'Hư hỏng', color: 'destructive', class: 'status-damaged' },
};

export const PRODUCT_TYPE = {
  RAW_MATERIAL: { label: 'Nguyên liệu', color: 'blue' },
  SEMI_FINISHED: { label: 'Bán thành phẩm', color: 'orange' },
  FINISHED_PRODUCT: { label: 'Thành phẩm', color: 'green' },
};

import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { MainLayout } from "./components/layout/MainLayout";
import { ROLE_ID } from "./data/constants";

// Pages
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Store pages
import Marketplace from "./pages/store/Marketplace";
import Cart from "./pages/store/Cart";
import OrderHistory from "./pages/store/OrderHistory";
import Feedback from "./pages/store/Feedback";

// Coordinator pages
import CoordinatorDashboard from "./pages/coordinator/Dashboard";
import OrderAggregation from "./pages/coordinator/OrderAggregation";
import Deliveries from "./pages/coordinator/Deliveries";

// Manager pages
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ProductionPlanning from "./pages/manager/ProductionPlanning";

// Kitchen pages
import KitchenDashboard from "./pages/kitchen/Dashboard";
import Inventory from "./pages/kitchen/Inventory";
import Production from "./pages/kitchen/Production";

// Shipper pages
import MyTrips from "./pages/shipper/MyTrips";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Users from "./pages/admin/Users";

const queryClient = new QueryClient();

// Placeholder component for pages not yet implemented
const ComingSoon = ({ title }) => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground">Tính năng đang được phát triển</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes */}
              <Route element={<MainLayout />}>
                {/* Store routes */}
                <Route element={<ProtectedRoute allowedRoles={[ROLE_ID.STORE_STAFF]}><Outlet /></ProtectedRoute>}>
                  <Route path="/store" element={<Marketplace />} />
                  <Route path="/store/cart" element={<Cart />} />
                  <Route path="/store/orders" element={<OrderHistory />} />
                  <Route path="/store/feedback" element={<Feedback />} />
                </Route>

                {/* Coordinator routes */}
                <Route element={<ProtectedRoute allowedRoles={[ROLE_ID.SUPPLY_COORDINATOR]}><Outlet /></ProtectedRoute>}>
                  <Route path="/coordinator" element={<CoordinatorDashboard />} />
                  <Route path="/coordinator/orders" element={<OrderAggregation />} />
                  <Route path="/coordinator/deliveries" element={<Deliveries />} />
                </Route>

                {/* Manager routes */}
                <Route element={<ProtectedRoute allowedRoles={[ROLE_ID.MANAGER, ROLE_ID.ADMIN]}><Outlet /></ProtectedRoute>}>
                  <Route path="/manager" element={<ManagerDashboard />} />
                  <Route path="/manager/planning" element={<ProductionPlanning />} />
                </Route>

                {/* Kitchen routes */}
                <Route element={<ProtectedRoute allowedRoles={[ROLE_ID.KITCHEN_MANAGER]}><Outlet /></ProtectedRoute>}>
                  <Route path="/kitchen" element={<KitchenDashboard />} />
                  <Route path="/kitchen/outbound" element={<ComingSoon title="Xuất kho giao hàng" />} />
                  <Route path="/kitchen/production" element={<Production />} />
                  <Route path="/kitchen/procurement" element={<ComingSoon title="Nhập nguyên liệu" />} />
                  <Route path="/kitchen/waste" element={<ComingSoon title="Quản lý hủy hàng" />} />
                  <Route path="/kitchen/inventory" element={<Inventory />} />
                </Route>

                {/* Shipper routes */}
                <Route element={<ProtectedRoute allowedRoles={[ROLE_ID.SHIPPER]}><Outlet /></ProtectedRoute>}>
                  <Route path="/shipper" element={<MyTrips />} />
                  <Route path="/shipper/map" element={<ComingSoon title="Bản đồ giao hàng" />} />
                </Route>

                {/* Admin routes */}
                <Route element={<ProtectedRoute allowedRoles={[ROLE_ID.ADMIN, ROLE_ID.MANAGER]}><Outlet /></ProtectedRoute>}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/recipes" element={<ComingSoon title="Quản lý công thức" />} />
                  <Route path="/admin/plans" element={<ComingSoon title="Kế hoạch sản xuất" />} />
                  <Route path="/admin/products" element={<Products />} />
                  <Route path="/admin/users" element={<Users />} />
                  <Route path="/admin/reports" element={<ComingSoon title="Báo cáo" />} />
                  <Route path="/admin/settings" element={<ComingSoon title="Cài đặt" />} />
                </Route>
              </Route>

              {/* Redirects */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

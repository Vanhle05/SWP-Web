import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchOrders,
  getDeliveries,
  getInventories,
  getAllUsers,
  getAllStores,
  getProducts,
} from '../../data/api';
import { StatsCard } from '../../components/common/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  ShoppingCart,
  Truck,
  Factory,
  Package,
  Users,
  Store,
  ArrowRight,
  BarChart3,
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchOrders().catch(() => []),
      getDeliveries().catch(() => []),
      getInventories().catch(() => []),
      getAllUsers().catch(() => []),
      getAllStores().catch(() => []),
      getProducts().catch(() => []),
    ])
      .then(([o, d, inv, u, s, p]) => {
        setOrders(Array.isArray(o) ? o : []);
        setDeliveries(Array.isArray(d) ? d : []);
        setInventories(Array.isArray(inv) ? inv : []);
        setUsers(Array.isArray(u) ? u : []);
        setStores(Array.isArray(s) ? s : []);
        setProducts(Array.isArray(p) ? p : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === 'DONE').length;
  const activeDeliveries = deliveries.filter((d) => d.status === 'PROCESSING').length;
  const activePlans = 0;
  const totalInventory = inventories.reduce((sum, inv) => sum + (inv.quantity ?? 0), 0);
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
  const ordersByStatus = {
    WAITTING: orders.filter((o) => o.status === 'WAITTING').length,
    PROCESSING: orders.filter((o) => o.status === 'PROCESSING').length,
    DELIVERING: orders.filter((o) => o.status === 'DELIVERING').length,
    DONE: completedOrders,
  };
  const statusLabels = {
    WAITTING: { label: 'Chờ xử lý', color: 'bg-warning' },
    PROCESSING: { label: 'Đang xử lý', color: 'bg-info' },
    DELIVERING: { label: 'Đang giao', color: 'bg-purple-500' },
    DONE: { label: 'Hoàn thành', color: 'bg-success' },
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bảng điều khiển</h1>
        <p className="text-muted-foreground">Tổng quan hoạt động hệ thống</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Tổng đơn hàng"
          value={totalOrders}
          icon={ShoppingCart}
          description={`${completionRate}% hoàn thành`}
        />
        <StatsCard
          title="Đang giao hàng"
          value={activeDeliveries}
          icon={Truck}
          description="Chuyến xe đang chạy"
        />
        <StatsCard
          title="Kế hoạch sản xuất"
          value={activePlans}
          icon={Factory}
          description="Đang thực hiện"
        />
        <StatsCard
          title="Tổng tồn kho"
          value={totalInventory.toLocaleString()}
          icon={Package}
          description="Đơn vị sản phẩm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Người dùng</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stores.length}</p>
                <p className="text-sm text-muted-foreground">Cửa hàng</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-sm text-muted-foreground">Sản phẩm</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trạng thái đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(ordersByStatus).map(([status, count]) => {
                const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
                const config = statusLabels[status];
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{config?.label}</span>
                      <span className="font-medium">{count} ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${config?.color || 'bg-muted'} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Truy cập nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/admin/recipes')}>
                <Factory className="h-6 w-6" />
                <span>Công thức</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/admin/plans')}>
                <BarChart3 className="h-6 w-6" />
                <span>Kế hoạch SX</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/admin/products')}>
                <Package className="h-6 w-6" />
                <span>Sản phẩm</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/admin/users')}>
                <Users className="h-6 w-6" />
                <span>Người dùng</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

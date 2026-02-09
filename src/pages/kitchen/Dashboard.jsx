import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInventories, getDeliveries, fetchOrders, getProducts } from '../../data/api';
import { StatsCard } from '../../components/common/StatsCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Package,
  Factory,
  AlertTriangle,
  Truck,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function KitchenDashboard() {
  const navigate = useNavigate();
  const [inventories, setInventories] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getInventories().catch(() => []),
      getDeliveries().catch(() => []),
      fetchOrders().catch(() => []),
      getProducts().catch(() => []),
    ]).then(([inv, del, ord, prod]) => {
      setInventories(Array.isArray(inv) ? inv : []);
      setDeliveries(Array.isArray(del) ? del : []);
      setOrders(Array.isArray(ord) ? ord : []);
      setProducts(Array.isArray(prod) ? prod : []);
    }).finally(() => setLoading(false));
  }, []);

  const totalInventory = inventories.reduce((sum, inv) => sum + (inv.quantity ?? 0), 0);
  const activePlans = 0;
  const processingBatches = 0;
  const pendingDeliveries = deliveries.filter((d) => d.status === 'WAITTING').length;

  const getProductById = (id) => products.find((p) => p.product_id === id);

  const lowStockItems = inventories
    .filter((inv) => (inv.quantity ?? 0) < 20)
    .map((inv) => ({ ...inv, product: getProductById(inv.product_id) }));

  const today = new Date();
  const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  const expiringItems = inventories
    .filter((inv) => {
      const expiry = new Date(inv.expiry_date || 0);
      return expiry <= threeDaysLater && expiry > today;
    })
    .map((inv) => ({ ...inv, product: getProductById(inv.product_id) }));

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
        <p className="text-muted-foreground">Tổng quan hoạt động bếp trung tâm</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Tổng tồn kho"
          value={totalInventory.toLocaleString()}
          icon={Package}
          description="Đơn vị sản phẩm"
        />
        <StatsCard
          title="Kế hoạch sản xuất"
          value={activePlans}
          icon={Factory}
          description="Đang thực hiện"
        />
        <StatsCard
          title="Lô đang sản xuất"
          value={processingBatches}
          icon={Clock}
          description="Chờ hoàn thành"
        />
        <StatsCard
          title="Chờ xuất kho"
          value={pendingDeliveries}
          icon={Truck}
          description="Chuyến cần soạn"
        />
      </div>

      {(lowStockItems.length > 0 || expiringItems.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {lowStockItems.length > 0 && (
            <Card className="border-warning">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  Sắp hết hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <div
                      key={item.inventory_id}
                      className="flex items-center justify-between p-2 rounded bg-muted/50"
                    >
                      <span className="flex items-center gap-2">
                        <span>{item.product?.image}</span>
                        {item.product?.product_name ?? item.product_name}
                      </span>
                      <Badge variant="outline" className="status-warning">
                        Còn {item.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {expiringItems.length > 0 && (
            <Card className="border-destructive">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Sắp hết hạn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiringItems.slice(0, 3).map((item) => (
                    <div
                      key={item.inventory_id}
                      className="flex items-center justify-between p-2 rounded bg-muted/50"
                    >
                      <span className="flex items-center gap-2">
                        <span>{item.product?.image}</span>
                        {item.product?.product_name ?? item.product_name}
                      </span>
                      <Badge variant="outline" className="status-damaged">
                        {new Date(item.expiry_date).toLocaleDateString('vi-VN')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Tiến độ sản xuất</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/kitchen/production')}>
              Chi tiết
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Không có kế hoạch sản xuất đang thực hiện (API chưa có kế hoạch)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Chờ xuất kho</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/kitchen/outbound')}>
              Xem tất cả
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {pendingDeliveries === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Không có chuyến xe chờ soạn hàng
              </div>
            ) : (
              <div className="space-y-3">
                {deliveries
                  .filter((d) => d.status === 'WAITTING')
                  .slice(0, 3)
                  .map((delivery) => (
                    <div
                      key={delivery.delivery_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                          <Truck className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                          <p className="font-medium">Chuyến #{delivery.delivery_id}</p>
                          <p className="text-sm text-muted-foreground">
                            {(delivery.orders || []).length} đơn hàng
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={delivery.status} type="delivery" />
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

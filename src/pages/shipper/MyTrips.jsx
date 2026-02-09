import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDeliveriesByShipperId, updateOrderStatus } from '../../data/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Truck,
  MapPin,
  Phone,
  Package,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MyTrips() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user?.user_id) {
      setLoading(false);
      return;
    }
    getDeliveriesByShipperId(user.user_id)
      .then((data) => setDeliveries(Array.isArray(data) ? data : []))
      .catch(() => setDeliveries([]))
      .finally(() => setLoading(false));
  }, [user?.user_id]);

  const myDeliveries = deliveries;
  const activeDeliveries = myDeliveries.filter((d) => d.status === 'PROCESSING');
  const waitingDeliveries = myDeliveries.filter((d) => d.status === 'WAITTING');
  const completedDeliveries = myDeliveries.filter((d) => d.status === 'DONE');

  const handleStartDelivery = async (delivery) => {
    setIsUpdating(true);
    try {
      await updateOrderStatus(delivery.orders?.[0]?.order_id, 'DELIVERING');
      setDeliveries((prev) =>
        prev.map((d) =>
          d.delivery_id === delivery.delivery_id
            ? { ...d, status: 'PROCESSING', orders: (d.orders || []).map((o) => ({ ...o, status: 'DELIVERING' })) }
            : d
        )
      );
      toast.success('Đã bắt đầu chuyến giao hàng');
    } catch (e) {
      toast.error(e.message || 'Cập nhật thất bại');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteOrder = async (status) => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    try {
      await updateOrderStatus(selectedOrder.order_id, status);
      setDeliveries((prev) =>
        prev.map((d) => ({
          ...d,
          orders: (d.orders || []).map((o) =>
            o.order_id === selectedOrder.order_id ? { ...o, status } : o
          ),
        }))
      );
      if (status === 'DONE') {
        toast.success(`Đã giao thành công đơn hàng #${selectedOrder.order_id}`);
      } else {
        toast.warning(`Đã báo cáo đơn hàng #${selectedOrder.order_id} bị hư hỏng`);
      }
      setShowCompleteDialog(false);
      setSelectedOrder(null);
    } catch (e) {
      toast.error(e.message || 'Cập nhật thất bại');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const DeliveryCard = ({ delivery, showActions = true }) => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Chuyến #{delivery.delivery_id}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatDate(delivery.delivery_date)} • {(delivery.orders || []).length} điểm giao
              </p>
            </div>
          </div>
          <StatusBadge status={delivery.status} type="delivery" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {(delivery.orders || []).map((order, index) => (
            <div key={order.order_id} className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{order.store_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {order.store_id}
                    </p>
                  </div>
                </div>
                {showActions && delivery.status === 'PROCESSING' && order.status === 'DELIVERING' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowCompleteDialog(true);
                    }}
                  >
                    Hoàn thành
                  </Button>
                )}
                {(order.status === 'DONE' || order.status === 'DAMAGED') && (
                  <StatusBadge status={order.status} type="order" />
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(order.order_details || []).map((detail) => (
                  <span
                    key={detail.order_detail_id || detail.product_id}
                    className="inline-flex items-center gap-1 text-xs bg-background px-2 py-1 rounded"
                  >
                    {detail.product_name || `SP #${detail.product_id}`} x{detail.quantity}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        {showActions && delivery.status === 'WAITTING' && (
          <Button
            className="w-full"
            onClick={() => handleStartDelivery(delivery)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="mr-2 h-4 w-4" />
            )}
            Bắt đầu giao hàng
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  if (myDeliveries.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Truck}
          title="Chưa có chuyến giao hàng"
          description="Bạn chưa được phân công chuyến giao hàng nào"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chuyến hàng của tôi</h1>
        <p className="text-muted-foreground">Quản lý và theo dõi các chuyến giao hàng</p>
      </div>

      {activeDeliveries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Navigation className="h-5 w-5 text-info" />
            Đang giao hàng
          </h2>
          {activeDeliveries.map((d) => (
            <DeliveryCard key={d.delivery_id} delivery={d} />
          ))}
        </div>
      )}

      {waitingDeliveries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-warning" />
            Chờ nhận hàng
          </h2>
          {waitingDeliveries.map((d) => (
            <DeliveryCard key={d.delivery_id} delivery={d} />
          ))}
        </div>
      )}

      {completedDeliveries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Đã hoàn thành
          </h2>
          {completedDeliveries.map((d) => (
            <DeliveryCard key={d.delivery_id} delivery={d} showActions={false} />
          ))}
        </div>
      )}

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành giao hàng</DialogTitle>
            <DialogDescription>
              Xác nhận trạng thái đơn hàng #{selectedOrder?.order_id} - {selectedOrder?.store_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2 border-success hover:bg-success/10"
              onClick={() => handleCompleteOrder('DONE')}
              disabled={isUpdating}
            >
              <CheckCircle2 className="h-8 w-8 text-success" />
              <span>Giao thành công</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2 border-destructive hover:bg-destructive/10"
              onClick={() => handleCompleteOrder('DAMAGED')}
              disabled={isUpdating}
            >
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <span>Hàng hư hỏng</span>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCompleteDialog(false)}>
              Hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

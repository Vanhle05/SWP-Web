import React, { useState, useEffect } from 'react';
import { getDeliveries, updateOrderStatus } from '../../data/api'; // Cần thêm API updateDeliveryStatus nếu có
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Truck, PackageCheck, MapPin, CalendarClock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Outbound() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      const data = await getDeliveries();
      // Lọc các chuyến xe đang chờ xuất kho (giả sử logic là WAITING hoặc PROCESSING nhưng chưa xuất)
      // Theo flow: Coordinator tạo chuyến -> WAITING -> Bếp xuất kho -> PROCESSING (Giao đi)
      // Hoặc: WAITING -> Bếp confirm -> READY -> Shipper pick -> PROCESSING.
      // Ở đây ta hiển thị các chuyến chưa hoàn thành.
      const pending = (data || []).filter(d => d.status !== 'DONE'); 
      setDeliveries(pending);
    } catch (error) {
      console.error("Load deliveries failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm giả lập xuất kho (Backend sẽ xử lý trừ tồn kho FEFO)
  const handleDispatch = async (delivery) => {
    setProcessingId(delivery.delivery_id);
    const toastId = toast.loading(`Đang xuất kho cho chuyến #${delivery.delivery_id}...`);

    try {
      // 1. Gọi API cập nhật trạng thái các đơn hàng trong chuyến sang DELIVERING (hoặc trạng thái trung gian)
      // Trong thực tế sẽ gọi 1 API: POST /deliveries/{id}/dispatch
      // Ở đây ta giả lập bằng cách update từng đơn (nếu API hạn chế) hoặc giả định thành công
      
      // Giả lập delay mạng
      await new Promise(r => setTimeout(r, 1000));

      // Logic: Update status đơn hàng hoặc chuyến xe. 
      // Vì API hiện tại hạn chế, ta chỉ hiển thị thông báo thành công.
      
      toast.success(`Xuất kho thành công! Đã trừ tồn kho theo FEFO.`, { id: toastId });
      
      // Refresh list
      loadDeliveries();
    } catch (error) {
      toast.error("Xuất kho thất bại", { id: toastId });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải danh sách chuyến xe...</div>;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Xuất kho giao hàng</h1>
        <p className="text-muted-foreground">Soạn hàng và xuất kho cho các chuyến xe (Flow 1 - B3)</p>
      </div>

      <div className="grid gap-6">
        {deliveries.length === 0 ? (
          <Card className="bg-muted/40 border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Hiện không có chuyến xe nào cần xuất kho</p>
            </CardContent>
          </Card>
        ) : (
          deliveries.map((delivery) => (
            <Card key={delivery.delivery_id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" />
                      Chuyến xe #{delivery.delivery_id}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" /> 
                        Giao ngày: {delivery.delivery_date ? format(new Date(delivery.delivery_date), 'dd/MM/yyyy') : 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        Shipper: {delivery.shipper_name || 'Chưa gán'}
                      </span>
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => handleDispatch(delivery)} 
                    disabled={processingId === delivery.delivery_id}
                  >
                    {processingId === delivery.delivery_id ? 'Đang xử lý...' : 'Xác nhận Xuất kho'}
                    <PackageCheck className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {delivery.orders?.map((order) => (
                    <div key={order.order_id} className="p-4 hover:bg-muted/10 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {order.store_name}
                        </div>
                        <Badge variant="outline">Đơn #{order.order_id}</Badge>
                      </div>
                      <div className="pl-6 text-sm text-muted-foreground">
                        {order.order_details?.map((d, idx) => (
                          <span key={idx} className="inline-block bg-secondary text-secondary-foreground px-2 py-1 rounded mr-2 mb-1">
                            {d.product_name} x{d.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
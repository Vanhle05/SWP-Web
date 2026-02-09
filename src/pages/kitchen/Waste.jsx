import React, { useState, useEffect } from 'react';
import { getInventories, createTransaction } from '../../data/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Waste() {
  const [expiredItems, setExpiredItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getInventories();
      // Lọc các lô hàng đã hết hạn hoặc sắp hết hạn (Logic FEFO/Waste)
      const today = new Date();
      const expired = (data || []).filter(item => {
        if (!item.expiry_date) return false;
        return new Date(item.expiry_date) < today;
      });
      setExpiredItems(expired);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDispose = async (item) => {
    if (!window.confirm(`Xác nhận tiêu hủy lô hàng ${item.batch}? Hành động này không thể hoàn tác.`)) return;

    const toastId = toast.loading('Đang xử lý tiêu hủy...');
    try {
      // Tạo giao dịch xuất hủy (EXPORT)
      await createTransaction({
        inventoryId: item.inventory_id,
        productId: item.product_id,
        quantity: item.quantity,
        type: 'EXPORT',
        reason: 'WASTE_EXPIRED', // Lý do hủy
        batchId: item.batch
      });
      
      toast.success('Đã tiêu hủy thành công', { id: toastId });
      loadData(); // Reload lại danh sách
    } catch (error) {
      toast.error('Lỗi khi tiêu hủy hàng', { id: toastId });
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-destructive flex items-center gap-2">
          <AlertTriangle className="h-8 w-8" />
          Quản lý Hủy hàng
        </h1>
        <p className="text-muted-foreground">Xử lý các lô hàng hết hạn hoặc hư hỏng (Flow 4)</p>
      </div>

      <div className="grid gap-4">
        {expiredItems.length === 0 ? (
          <Card className="bg-muted/20 border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground">
              <p>Không có hàng hết hạn cần xử lý.</p>
            </CardContent>
          </Card>
        ) : (
          expiredItems.map((item) => (
            <Card key={item.inventory_id} className="border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{item.product_name}</CardTitle>
                    <CardDescription>Batch: {item.batch}</CardDescription>
                  </div>
                  <Badge variant="destructive">Đã hết hạn</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm space-y-1">
                    <p>Số lượng tồn: <span className="font-bold">{item.quantity}</span></p>
                    <p className="text-destructive">
                      Hết hạn ngày: {format(new Date(item.expiry_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDispose(item)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Tiêu hủy ngay
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
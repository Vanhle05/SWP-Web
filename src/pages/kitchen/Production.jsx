import React, { useState, useEffect } from 'react';
import { getProductionPlans, createBatch } from '../../data/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../../components/ui/dialog';
import { Loader2, ChefHat, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function Production() {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [batchForm, setBatchForm] = useState({ quantity: '', expiryDate: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const data = await getProductionPlans();
      setPlans(data || []);
    } catch (error) {
      // Vì API không tồn tại, ta không hiển thị lỗi đỏ gây hoang mang, mà set danh sách rỗng
      console.warn('Production Plans API missing:', error.message);
      setPlans([]); 
      // Có thể hiện toast thông báo nhẹ
      // toast.info('Chức năng Kế hoạch sản xuất đang được bảo trì.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreateBatch = async () => {
    if (!batchForm.quantity || !batchForm.expiryDate) {
      toast.error('Vui lòng nhập đủ thông tin');
      return;
    }

    setIsSubmitting(true);
    try {
      await createBatch({
        planId: selectedDetail.planId, // Cần backend hỗ trợ link với plan
        productId: selectedDetail.product.productId,
        batchId: `BATCH-${Date.now()}`, // Auto gen batch ID
        quantity: Number(batchForm.quantity),
        expiryDate: new Date(batchForm.expiryDate).toISOString(),
        type: 'PRODUCTION',
        status: 'DONE'
      });
      toast.success('Đã hoàn thành lô sản xuất!');
      setBatchForm({ quantity: '', expiryDate: '' });
      setSelectedDetail(null); // Close dialog
    } catch (error) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
        <ChefHat className="h-8 w-8" /> Thực thi Sản xuất
      </h1>

      <div className="grid gap-6">
        {plans.map(plan => (
          <Card key={plan.planId}>
            <CardHeader>
              <CardTitle>Kế hoạch ngày {new Date(plan.planDate).toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plan.productionPlanDetails?.map(detail => (
                  <div key={detail.planDetailId} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                    <div>
                      <p className="font-bold text-lg">{detail.product.productName}</p>
                      <p className="text-sm text-muted-foreground">Mục tiêu: {detail.quantity} {detail.product.unit}</p>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button onClick={() => setSelectedDetail({...detail, planId: plan.planId})}>
                          <CheckSquare className="mr-2 h-4 w-4" /> Hoàn thành Lô
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ghi nhận sản lượng: {detail.product.productName}</DialogTitle>
                          <DialogDescription>Nhập số lượng thực tế và hạn sử dụng cho lô hàng này.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Số lượng thực tế</label>
                            <Input type="number" value={batchForm.quantity} onChange={e => setBatchForm({...batchForm, quantity: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Ngày hết hạn (HSD)</label>
                            <Input type="date" value={batchForm.expiryDate} onChange={e => setBatchForm({...batchForm, expiryDate: e.target.value})} />
                          </div>
                          <Button onClick={handleCreateBatch} disabled={isSubmitting} className="w-full">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Xác nhận'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {plans.length === 0 && <p className="text-center text-muted-foreground">Không có kế hoạch sản xuất nào.</p>}
      </div>
    </div>
  );
}
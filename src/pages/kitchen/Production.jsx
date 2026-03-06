import React, { useState, useEffect } from 'react';
import { getProductionPlans, createBatch } from '../../data/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Loader2, ChefHat, CheckSquare, RefreshCw, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Production() {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({ quantity: '', productionDate: '', expiryDate: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const data = await getProductionPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Production Plans API error:', error.message);
      toast.error('Không thể tải kế hoạch sản xuất: ' + error.message);
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openDialog = (detail, planId) => {
    setSelectedDetail({ ...detail, planId });
    setBatchForm({ quantity: '', productionDate: today, expiryDate: '' });
    setDialogOpen(true);
  };

  const handleCreateBatch = async () => {
    if (!batchForm.quantity || !batchForm.productionDate || !batchForm.expiryDate) {
      toast.error('Vui lòng nhập đủ thông tin');
      return;
    }
    if (Number(batchForm.quantity) <= 0) {
      toast.error('Số lượng phải lớn hơn 0');
      return;
    }
    const expiry = new Date(batchForm.expiryDate);
    const production = new Date(batchForm.productionDate);
    if (expiry <= production) {
      toast.error('Ngày hết hạn phải sau ngày sản xuất');
      return;
    }

    setIsSubmitting(true);
    try {
      // POST /log-batches với body theo LogBatch schema
      await createBatch({
        planId: selectedDetail.planId,
        productId: selectedDetail.productId,
        quantity: Number(batchForm.quantity),
        productionDate: batchForm.productionDate,
        expiryDate: batchForm.expiryDate,
        status: 'PROCESSING',
        type: 'PRODUCTION',
      });
      toast.success(`Đã tạo lô sản xuất cho: ${selectedDetail.productName}`);
      setBatchForm({ quantity: '', productionDate: today, expiryDate: '' });
      setDialogOpen(false);
      setSelectedDetail(null);
    } catch (error) {
      toast.error('Lỗi tạo lô: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-orange-500" /> Thực thi Sản xuất
          </h1>
          <p className="text-muted-foreground">Theo dõi kế hoạch và tạo lô sản phẩm</p>
        </div>
        <Button variant="outline" onClick={fetchPlans}>
          <RefreshCw className="mr-2 h-4 w-4" /> Làm mới
        </Button>
      </div>

      <div className="grid gap-6">
        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-dashed text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">Không có kế hoạch sản xuất</p>
            <p className="text-sm mt-1">Khi Manager tạo kế hoạch, chúng sẽ hiển thị tại đây</p>
          </div>
        ) : (
          plans.map(plan => (
            <Card key={plan.planId} className="border-l-4 border-l-orange-400">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">
                      Kế hoạch #{plan.planId}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Từ: {plan.startDate ? new Date(plan.startDate).toLocaleDateString('vi-VN') : 'N/A'}
                      </span>
                      <span>→</span>
                      <span>{plan.endDate ? new Date(plan.endDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                    </div>
                    {plan.note && <p className="text-sm text-muted-foreground mt-1">{plan.note}</p>}
                  </div>
                  <Badge className={getStatusColor(plan.status)}>
                    {plan.status || 'N/A'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Danh sách sản phẩm cần sản xuất:
                  </h4>
                  {(plan.details || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Không có chi tiết</p>
                  ) : (
                    (plan.details || []).map(detail => (
                      <div key={detail.planDetailId} className="flex items-center justify-between p-4 border rounded-lg bg-orange-50/50 hover:bg-orange-50 transition-colors">
                        <div>
                          <p className="font-bold text-base">{detail.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            Mục tiêu: <span className="font-semibold text-orange-600">{detail.quantity}</span> đơn vị
                          </p>
                          {detail.note && <p className="text-xs text-muted-foreground mt-1">{detail.note}</p>}
                        </div>
                        <Button 
                          onClick={() => openDialog(detail, plan.planId)}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          <CheckSquare className="mr-2 h-4 w-4" /> Tạo Lô
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog tạo lô sản xuất */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo lô sản xuất</DialogTitle>
            <DialogDescription>
              Sản phẩm: <strong>{selectedDetail?.productName}</strong> | Mục tiêu: {selectedDetail?.quantity} đơn vị
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Số lượng thực tế sản xuất được *</Label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="Nhập số lượng..."
                value={batchForm.quantity}
                onChange={e => setBatchForm({ ...batchForm, quantity: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày sản xuất *</Label>
                <Input
                  type="date"
                  value={batchForm.productionDate}
                  onChange={e => setBatchForm({ ...batchForm, productionDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ngày hết hạn (HSD) *</Label>
                <Input
                  type="date"
                  value={batchForm.expiryDate}
                  min={batchForm.productionDate || today}
                  onChange={e => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                />
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm text-orange-800">
              <strong>Lưu ý:</strong> Lô sẽ được tạo với trạng thái <strong>PROCESSING</strong>. 
              Khi Kho xác nhận nhập, trạng thái sẽ chuyển thành DONE và tồn kho sẽ được cập nhật.
            </div>
            <Button onClick={handleCreateBatch} disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckSquare className="mr-2 h-4 w-4" />}
              Xác nhận tạo lô
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
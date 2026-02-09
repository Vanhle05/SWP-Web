import React, { useState, useEffect } from 'react';
import { getProductsByType, createPurchaseBatch } from '../../data/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Loader2, ShoppingCart, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function Procurement() {
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    batchId: '',
    quantity: '',
    expiryDate: ''
  });

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const data = await getProductsByType('RAW_MATERIAL');
        setMaterials(data || []);
      } catch (error) {
        toast.error('Lỗi tải danh sách nguyên liệu: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.batchId || !formData.quantity || !formData.expiryDate) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    // BR-022: Cảnh báo hạn sử dụng
    const expiry = new Date(formData.expiryDate);
    const now = new Date();
    const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
    if (diffDays < 3) {
      if (!confirm('Cảnh báo: Nguyên liệu này sắp hết hạn (dưới 3 ngày). Bạn có chắc chắn muốn nhập?')) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await createPurchaseBatch({
        productId: Number(formData.productId),
        batchId: formData.batchId, // Backend có thể cần map sang 'batch' hoặc giữ nguyên tùy model
        batch: formData.batchId,   // Gửi cả 2 field để an toàn
        quantity: Number(formData.quantity),
        expiryDate: new Date(formData.expiryDate).toISOString(),
        type: 'PURCHASE',
        status: 'DONE'
      });
      toast.success('Nhập kho thành công!');
      setFormData({ productId: '', batchId: '', quantity: '', expiryDate: '' });
    } catch (error) {
      toast.error('Lỗi nhập kho: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ShoppingCart className="h-6 w-6 text-primary" /> Nhập mua Nguyên liệu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5" />
            <span>Chức năng này đang chờ Backend bổ sung API (Log Batches).</span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Chọn Nguyên liệu</Label>
              <Select onValueChange={(val) => setFormData({...formData, productId: val})} value={formData.productId}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Chọn nguyên liệu --" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map(m => (
                    <SelectItem key={m.product_id} value={String(m.product_id)}>
                      {m.product_name} ({m.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã Lô (Batch ID)</Label>
                <Input placeholder="VD: BATCH-001" value={formData.batchId} onChange={e => setFormData({...formData, batchId: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Số lượng</Label>
                <Input type="number" min="0" step="0.1" placeholder="0.0" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hạn sử dụng</Label>
              <div className="relative">
                <Input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
                <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={true}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Xác nhận Nhập kho'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
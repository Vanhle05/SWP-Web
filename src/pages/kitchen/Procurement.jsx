import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Calendar } from '../../components/ui/calendar';
import { Calendar as CalendarIcon, PackagePlus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { getProducts, createPurchaseBatch } from '../../data/api';
import { toast } from 'sonner';

export default function Procurement() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [batchId, setBatchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load raw materials cho dropdown
    getProducts().then(allProducts => {
      const rawMaterials = allProducts.filter(p => p.product_type === 'RAW_MATERIAL');
      setProducts(rawMaterials);
    });
  }, []);

  const handleResetForm = () => {
    setSelectedProduct('');
    setBatchId('');
    setQuantity('');
    setExpiryDate(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !batchId || !quantity || !expiryDate) {
      toast.error('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    // BR-022: Cảnh báo nếu Hạn sử dụng nhập vào quá gần
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Chuẩn hóa về đầu ngày
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    if (expiryDate < threeDaysFromNow) {
      const confirmed = window.confirm(
        'Cảnh báo: Hạn sử dụng của lô hàng này quá gần. Bạn có chắc chắn muốn nhập kho?'
      );
      if (!confirmed) {
        return;
      }
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Đang nhập kho lô hàng mới...');

    try {
      await createPurchaseBatch({
        productId: Number(selectedProduct),
        batch: batchId,
        quantity: Number(quantity),
        expiryDate: format(expiryDate, 'yyyy-MM-dd'),
      });
      toast.success('Nhập kho thành công!', { id: toastId });
      handleResetForm();
    } catch (error) {
      toast.error(error.message || 'Nhập kho thất bại.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nhập Mua Nguyên Liệu</h1>
        <p className="text-muted-foreground">
          Ghi nhận lô hàng nguyên liệu mua từ nhà cung cấp (Flow 3).
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackagePlus className="h-6 w-6" />
            Tạo Lô Hàng Mới
          </CardTitle>
          <CardDescription>
            Thông tin sẽ được ghi nhận vào kho trung tâm và sẵn sàng cho sản xuất.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="product">Nguyên liệu</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Chọn một nguyên liệu..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.product_id} value={String(p.product_id)}>
                      {p.product_name} (Đơn vị: {p.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batchId">Mã lô (Batch ID)</Label>
                <Input
                  id="batchId"
                  placeholder="Ví dụ: B240208-VFOOD"
                  value={batchId}
                  onChange={e => setBatchId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Số lượng</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Ví dụ: 100"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hạn sử dụng</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn('w-full justify-start text-left font-normal', !expiryDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, 'dd/MM/yyyy') : <span>Chọn ngày</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={expiryDate} onSelect={setExpiryDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={handleResetForm}>
                Làm mới
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Nhập kho'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
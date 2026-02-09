import React, { useState, useEffect } from 'react';
import { getProducts } from '../../data/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductionPlanning() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const finishedProducts = products.filter((p) => p.product_type === 'FINISHED_PRODUCT');

  const handleCreatePlan = () => {
    toast.info('Tạo kế hoạch sản xuất cần backend bổ sung API Production Plans.');
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kế hoạch sản xuất</h1>
          <p className="text-muted-foreground">Lập kế hoạch cho bếp trung tâm (Flow 2)</p>
        </div>
        <Button onClick={handleCreatePlan}>
          <Calendar className="mr-2 h-4 w-4" />
          Tạo kế hoạch mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Danh sách kế hoạch</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Chưa có kế hoạch.
          </p>
          {finishedProducts.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Hiện có {finishedProducts.length} thành phẩm có thể đưa vào kế hoạch khi API sẵn sàng.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

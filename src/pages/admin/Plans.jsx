
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { CalendarDays, Loader2 } from 'lucide-react';
import { getProductionPlans } from '../../data/api';

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      try {
        const data = await getProductionPlans();
        setPlans(data?.details ? [data] : Array.isArray(data) ? data : []);
      } catch (error) {
        setPlans([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Kế hoạch Sản xuất</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {plans.length > 0 ? plans.map((plan) => (
          <Card key={plan.planId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" /> Kế hoạch ngày {plan.planDate ? new Date(plan.planDate).toLocaleDateString() : 'N/A'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plan.details?.map((detail) => (
                  <div key={detail.planDetailId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{detail.productName}</p>
                      <p className="text-sm text-muted-foreground">Số lượng: {detail.quantity}</p>
                      <p className="text-sm text-muted-foreground">Ghi chú: {detail.note}</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      Đang thực hiện
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Không có kế hoạch sản xuất nào.
          </div>
        )}
        {/* Placeholder cho form tạo plan */}
        <div className="flex items-center justify-center border-2 border-dashed rounded-lg h-64 text-muted-foreground">
          Chọn ngày trên lịch để tạo kế hoạch mới
        </div>
      </div>
    </div>
  );
}
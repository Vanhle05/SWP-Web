import React from 'react';
import { Card, CardContent } from '../../components/ui/card';

export default function Production() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý sản xuất</h1>
        <p className="text-muted-foreground">
          Theo dõi và quản lý kế hoạch sản xuất (API kế hoạch / lô chưa có trên backend)
        </p>
      </div>
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Chưa có kế hoạch sản xuất. Backend cần bổ sung API Production Plans / Batches.
        </CardContent>
      </Card>
    </div>
  );
}

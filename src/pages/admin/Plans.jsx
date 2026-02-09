import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { CalendarDays, AlertTriangle } from 'lucide-react';

export default function Plans() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Kế hoạch Sản xuất</h1>

      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        <span>Chức năng này đang chờ Backend bổ sung API (Production Plans). Vui lòng quay lại sau.</span>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" /> Lịch sản xuất tuần này
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Kế hoạch #{202400 + i}</p>
                    <p className="text-sm text-muted-foreground">Ngày: {new Date().toLocaleDateString()}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    Đang thực hiện
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Placeholder cho form tạo plan */}
        <div className="flex items-center justify-center border-2 border-dashed rounded-lg h-64 text-muted-foreground">
          Chọn ngày trên lịch để tạo kế hoạch mới
        </div>
      </div>
    </div>
  );
}
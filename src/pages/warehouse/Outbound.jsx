import React, { useState, useEffect, useCallback } from 'react';
import { fetchOrders, getOrdersByStatus, getOrderDetailFillsByOrderDetailId, getReceiptsByOrderId, createReceipt, confirmReceipt, getAllLogBatches, getReceiptsByStatus } from '../../data/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Loader2, Truck, CheckCircle2, AlertCircle, ClipboardList, PackageCheck, Eye, ChevronDown, ChevronUp, History, XCircle, Package, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';

/**
 * Warehouse Outbound — Soạn hàng & Xuất kho
 * Business Flow (Step 3.2 & 3.3):
 * 1. Xem các đơn PROCESSING & DELIVERING (để đảm bảo không bị mất dấu đơn)
 * 2. Mở đơn → xem danh sách order_detail_fills (FEFO allocation từ backend)
 * 3. Group hàng theo Lô (Batch) để shipper dễ nhặt hàng.
 * 4. "Tạo Phiếu Xuất" → POST /receipts/order/{orderId} → DRAFT
 * 5. "Hoàn tất Xuất kho" → PATCH /receipts/{receiptId}/confirm → COMPLETED (Trừ kho thực tế)
 */
export default function WarehouseOutbound() {
  const [processingOrders, setProcessingOrders] = useState([]);
  const [receipts, setReceipts] = useState({ DRAFT: [], COMPLETED: [], CANCELLED: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('draft');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderFills, setOrderFills] = useState({}); // orderDetailId -> fills[]
  const [orderReceipts, setOrderReceipts] = useState({}); // orderId -> receipt[]
  const [loadingFills, setLoadingFills] = useState({});
  const [processingOrderId, setProcessingOrderId] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pOrders, dOrders, rDraft, rComp, rCanc] = await Promise.all([
        getOrdersByStatus('PROCESSING').catch(() => []),
        getOrdersByStatus('DELIVERING').catch(() => []),
        getReceiptsByStatus('DRAFT').catch(() => []),
        getReceiptsByStatus('COMPLETED').catch(() => []),
        getReceiptsByStatus('CANCELLED').catch(() => []),
      ]);

      const allRelevantOrders = [...pOrders, ...dOrders];
      const uniqueOrders = Array.from(new Set(allRelevantOrders.map(o => o.order_id)))
        .map(id => allRelevantOrders.find(o => o.order_id === id))
        .sort((a, b) => b.order_id - a.order_id);

      setProcessingOrders(uniqueOrders);
      setReceipts({
        DRAFT: rDraft || [],
        COMPLETED: rComp || [],
        CANCELLED: rCanc || []
      });
    } catch (error) {
      toast.error('Lỗi tải dữ liệu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleOrderDetails = async (order) => {
    if (expandedOrder === order.order_id) {
      setExpandedOrder(null);
      return;
    }
    setExpandedOrder(order.order_id);

    // Tải fills cho order này (nếu chưa tải)
    const orderDetailIds = (order.order_details || []).map(d => d.order_detail_id).filter(Boolean);
    const newFills = { ...orderFills };
    const loading = { ...loadingFills };

    for (const detailId of orderDetailIds) {
      if (!newFills[detailId]) {
        loading[detailId] = true;
        setLoadingFills({ ...loading });
        try {
          const fills = await getOrderDetailFillsByOrderDetailId(detailId);
          newFills[detailId] = Array.isArray(fills) ? fills : [];
        } catch (e) {
          newFills[detailId] = [];
        }
        loading[detailId] = false;
      }
    }
    setOrderFills(newFills);
    setLoadingFills(loading);

    // Tải receipts cho order này
    if (!orderReceipts[order.order_id]) {
      try {
        const receipts = await getReceiptsByOrderId(order.order_id);
        setOrderReceipts(prev => ({ ...prev, [order.order_id]: Array.isArray(receipts) ? receipts : [] }));
      } catch (e) {
        setOrderReceipts(prev => ({ ...prev, [order.order_id]: [] }));
      }
    }
  };

  const handleCreateReceipt = async (order) => {
    if (!confirm(`Tạo Phiếu Xuất Kho cho đơn hàng #${order.order_id}?`)) return;
    setProcessingOrderId(order.order_id);
    try {
      const receipt = await createReceipt(order.order_id, `Phiếu xuất cho đơn #${order.order_id}`);
      toast.success(`Đã tạo Phiếu Xuất #${receipt?.receipt_id || ''} (DRAFT)`);
      setOrderReceipts(prev => ({
        ...prev,
        [order.order_id]: [...(prev[order.order_id] || []), receipt]
      }));
    } catch (error) {
      toast.error('Lỗi tạo phiếu xuất: ' + error.message);
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleConfirmReceipt = async (order, receipt) => {
    if (!confirm(`Xác nhận Hoàn tất Xuất kho cho Phiếu #${receipt.receipt_id}?\nHành động này sẽ trừ kho thực tế.`)) return;
    setProcessingOrderId(order.order_id);
    try {
      await confirmReceipt(receipt.receipt_id);
      toast.success('Xuất kho hoàn tất! Tồn kho đã được cập nhật.');
      await fetchData();
      setExpandedOrder(null);
      setOrderReceipts(prev => {
        const next = { ...prev };
        delete next[order.order_id];
        return next;
      });
    } catch (error) {
      toast.error('Lỗi xác nhận xuất kho: ' + error.message);
    } finally {
      setProcessingOrderId(null);
    }
  };

  const renderOrdersList = () => {
    if (processingOrders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-dashed text-muted-foreground">
          <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">Không có đơn hàng cần xử lý</p>
        </div>
      );
    }

    const batchSummary = {};
    processingOrders.forEach(order => {
      (order.order_details || []).forEach(detail => {
        const fills = orderFills[detail.order_detail_id] || [];
        fills.forEach(fill => {
          if (!batchSummary[fill.batch_id]) {
            batchSummary[fill.batch_id] = {
              batch_id: fill.batch_id,
              product_name: detail.product_name,
              total_quantity: 0,
              orders: []
            };
          }
          batchSummary[fill.batch_id].total_quantity += fill.quantity;
          batchSummary[fill.batch_id].orders.push(order.order_id);
        });
      });
    });

    return (
      <div className="space-y-6">
        <Card className="bg-purple-50/30 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Tổng hợp soạn hàng (Gom theo Lô)
            </CardTitle>
            <CardDescription>Tiết kiệm thời gian nhặt hàng bằng cách lấy theo lô cho nhiều đơn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.values(batchSummary).length === 0 ? (
                <p className="text-sm text-muted-foreground italic col-span-full">Đang tính toán hoặc chưa có phân bổ lô...</p>
              ) : (
                Object.values(batchSummary).map(batch => (
                  <div key={batch.batch_id} className="p-3 bg-white border rounded-lg shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm">{batch.product_name}</p>
                      <p className="text-xs text-muted-foreground">Lô #{batch.batch_id}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-purple-600 font-bold">{batch.total_quantity} đơn vị</Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Set(batch.orders).size} đơn</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Chi tiết từng Đơn hàng
          </h3>
          {processingOrders.map(order => {
            const isExpanded = expandedOrder === order.order_id;
            const orderRecs = orderReceipts[order.order_id] || [];
            const draftReceipt = orderRecs.find(r => r.status === 'DRAFT');
            const completedReceipt = orderRecs.find(r => r.status === 'COMPLETED');
            const isProcessing = processingOrderId === order.order_id;

            return (
              <Card key={order.order_id} className={`border-l-4 ${completedReceipt ? 'border-l-green-400' : draftReceipt ? 'border-l-yellow-400' : 'border-l-purple-400'}`}>
                <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleOrderDetails(order)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Đơn hàng #{order.order_id}
                        {order.status === 'DELIVERING' && <Badge variant="outline" className="text-blue-600 border-blue-200">ĐANG GIAO</Badge>}
                        {completedReceipt && <Badge className="bg-green-100 text-green-800 text-xs ml-2">✓ Đã xong</Badge>}
                        {draftReceipt && !completedReceipt && <Badge className="bg-yellow-100 text-yellow-800 text-xs ml-2">📋 Có phiếu nháp</Badge>}
                      </CardTitle>
                      <CardDescription>Cửa hàng: {order.store_name} &bull; Trạng thái: {order.status}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4 animate-in fade-in slide-in-from-top-1">
                    <div className="space-y-3">
                      {(order.order_details || []).map(detail => {
                        const fills = orderFills[detail.order_detail_id] || [];
                        const isLoadingDetail = loadingFills[detail.order_detail_id];
                        return (
                          <div key={detail.order_detail_id} className="p-3 rounded-lg border bg-gray-50/50">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-sm">{detail.product_name}</span>
                              <Badge variant="secondary" className="text-xs">S.L: {detail.quantity}</Badge>
                            </div>
                            {isLoadingDetail ? (
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" /> Đang tải...
                              </div>
                            ) : fills.length > 0 ? (
                              <div className="space-y-1">
                                {fills.map(fill => (
                                  <div key={fill.fill_id} className="flex justify-between text-[10px] bg-white border border-dashed rounded px-2 py-1">
                                    <span>Lô #{fill.batch_id}</span>
                                    <span className="font-bold text-purple-700">{fill.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            ) : <p className="text-[10px] text-muted-foreground italic">Chưa có phân bổ</p>}
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t pt-4">
                      {!draftReceipt && !completedReceipt ? (
                        <Button onClick={() => handleCreateReceipt(order)} disabled={isProcessing} className="w-full bg-purple-600">
                          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardList className="mr-2 h-4 w-4" />}
                          Tạo Phiếu Xuất
                        </Button>
                      ) : draftReceipt && !completedReceipt ? (
                        <Button onClick={() => handleConfirmReceipt(order, draftReceipt)} disabled={isProcessing} className="w-full bg-green-600">
                          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-4 w-4" />}
                          Hoàn tất Xuất kho
                        </Button>
                      ) : (
                        <div className="w-full p-2 bg-green-50 text-green-700 text-xs text-center rounded border border-green-200 flex items-center justify-center gap-2">
                          <CheckCircle2 className="h-4 w-4" /> Đã hoàn tất xuất kho
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderReceiptsList = (status) => {
    const list = receipts[status] || [];
    if (list.length === 0) return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-dashed text-muted-foreground">
        <History className="h-10 w-10 mb-2 opacity-20" />
        <p>Không có phiếu nào</p>
      </div>
    );

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map(r => (
          <Card key={r.receipt_id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base text-purple-700">#{r.receipt_code || r.receipt_id}</CardTitle>
                <Badge variant="outline">{status}</Badge>
              </div>
              <CardDescription>Đơn #{r.order_id}</CardDescription>
            </CardHeader>
            <CardContent className="text-xs">
              <p className="text-muted-foreground mb-2 italic">"{r.note || 'No note'}"</p>
              {r.export_date && <p className="flex items-center gap-1 opacity-70"><Calendar className="h-3 w-3" /> {new Date(r.export_date).toLocaleString('vi-VN')}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (isLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Xuất kho</h1>
          <p className="text-muted-foreground">Soạn hàng và theo dõi phiếu xuất</p>
        </div>
        <Button variant="outline" onClick={fetchData}><RefreshCw className="mr-2 h-4 w-4" /> Làm mới</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mb-6">
          <TabsTrigger value="draft">Soạn hàng</TabsTrigger>
          <TabsTrigger value="receipts-draft">Phiếu Nháp</TabsTrigger>
          <TabsTrigger value="receipts-completed">Đã Xuất</TabsTrigger>
          <TabsTrigger value="receipts-cancelled">Đã Hủy</TabsTrigger>
        </TabsList>
        <TabsContent value="draft">{renderOrdersList()}</TabsContent>
        <TabsContent value="receipts-draft">{renderReceiptsList('DRAFT')}</TabsContent>
        <TabsContent value="receipts-completed">{renderReceiptsList('COMPLETED')}</TabsContent>
        <TabsContent value="receipts-cancelled">{renderReceiptsList('CANCELLED')}</TabsContent>
      </Tabs>
    </div>
  );
}
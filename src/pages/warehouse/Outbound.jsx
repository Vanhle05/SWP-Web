import React, { useState, useEffect, useCallback } from 'react';
import { fetchOrders, getOrdersByStatus, getOrderDetailFillsByOrderDetailId, getReceiptsByOrderId, createReceipt, confirmReceipt, getAllLogBatches } from '../../data/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Loader2, Truck, CheckCircle2, AlertCircle, ClipboardList, PackageCheck, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';

/**
 * Warehouse Outbound — Soạn hàng & Xuất kho
 * Business Flow (Step 3.2 & 3.3):
 * 1. Xem các đơn PROCESSING (đã được điều phối bởi Coordinator)
 * 2. Mở đơn → xem danh sách order_detail_fills (FEFO allocation từ backend)
 * 3. "Tạo Phiếu Xuất" → POST /receipts/order/{orderId} → DRAFT
 * 4. "Hoàn tất Xuất kho" → PATCH /receipts/{receiptId}/confirm → COMPLETED
 */
export default function WarehouseOutbound() {
  const [processingOrders, setProcessingOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderFills, setOrderFills] = useState({}); // orderDetailId -> fills[]
  const [orderReceipts, setOrderReceipts] = useState({}); // orderId -> receipt[]
  const [loadingFills, setLoadingFills] = useState({});
  const [processingOrderId, setProcessingOrderId] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Lấy tất cả đơn PROCESSING (đã được gom vào chuyến)
      const orders = await getOrdersByStatus('PROCESSING');
      setProcessingOrders(Array.isArray(orders) ? orders : []);
    } catch (error) {
      // Fallback: lấy tất cả rồi filter
      try {
        const all = await fetchOrders();
        setProcessingOrders((Array.isArray(all) ? all : []).filter(o => o.status === 'PROCESSING'));
      } catch (e) {
        toast.error('Lỗi tải đơn hàng: ' + e.message);
        setProcessingOrders([]);
      }
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
      // Cập nhật receipts trong state
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
    if (!confirm(`Xác nhận Hoàn tất Xuất kho cho Phiếu #${receipt.receipt_id || receipt.receipt_code}?\nHành động này sẽ trừ kho và không thể hoàn tác.`)) return;
    setProcessingOrderId(order.order_id);
    try {
      await confirmReceipt(receipt.receipt_id);
      toast.success('Xuất kho hoàn tất! Tồn kho đã được cập nhật.');
      // Reload data
      await fetchData();
      setExpandedOrder(null);
      // Clear cached receipts for this order
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
            <Truck className="h-8 w-8 text-purple-600" /> Soạn hàng & Xuất kho
          </h1>
          <p className="text-muted-foreground">Các đơn hàng đang PROCESSING cần chuẩn bị xuất kho</p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <CheckCircle2 className="mr-2 h-4 w-4" /> Làm mới
        </Button>
      </div>

      {processingOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-dashed text-muted-foreground">
          <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">Không có đơn hàng cần xuất kho</p>
          <p className="text-sm mt-1">Đơn hàng ở trạng thái PROCESSING sẽ hiển thị tại đây</p>
        </div>
      ) : (
        <div className="space-y-4">
          {processingOrders.map(order => {
            const isExpanded = expandedOrder === order.order_id;
            const receipts = orderReceipts[order.order_id] || [];
            const draftReceipt = receipts.find(r => r.status === 'DRAFT');
            const completedReceipt = receipts.find(r => r.status === 'COMPLETED');
            const isProcessing = processingOrderId === order.order_id;

            return (
              <Card key={order.order_id} className={`border-l-4 ${completedReceipt ? 'border-l-green-400' : draftReceipt ? 'border-l-yellow-400' : 'border-l-purple-400'}`}>
                <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleOrderDetails(order)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Đơn hàng #{order.order_id}
                        {completedReceipt && <Badge className="bg-green-100 text-green-800 text-xs">✓ Đã xuất kho</Badge>}
                        {draftReceipt && !completedReceipt && <Badge className="bg-yellow-100 text-yellow-800 text-xs">📋 Phiếu DRAFT</Badge>}
                      </CardTitle>
                      <CardDescription>
                        Cửa hàng: {order.store_name} &bull;
                        Ngày đặt: {order.order_date ? new Date(order.order_date).toLocaleDateString('vi-VN') : 'N/A'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">PROCESSING</Badge>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4">
                    {/* Chi tiết đơn hàng + allocation fills */}
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1">
                        <ClipboardList className="h-4 w-4" /> Danh sách hàng cần soạn (FEFO Allocation)
                      </h4>
                      <div className="space-y-3">
                        {(order.order_details || []).map(detail => {
                          const fills = orderFills[detail.order_detail_id] || [];
                          const isLoadingDetail = loadingFills[detail.order_detail_id];
                          return (
                            <div key={detail.order_detail_id} className="p-3 rounded-lg border bg-gray-50">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{detail.product_name}</span>
                                <Badge variant="secondary">Cần: {detail.quantity}</Badge>
                              </div>
                              {isLoadingDetail ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Loader2 className="h-3 w-3 animate-spin" /> Đang tải phân bổ...
                                </div>
                              ) : fills.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">Chưa có phân bổ lô (FEFO chưa chạy)</p>
                              ) : (
                                <div className="space-y-1">
                                  {fills.map(fill => (
                                    <div key={fill.fill_id} className="flex justify-between text-xs bg-white border rounded px-2 py-1">
                                      <span className="text-muted-foreground">Lô #{fill.batch_id}</span>
                                      <span className="font-medium text-purple-700">Lấy: {fill.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Hành động */}
                    <div className="border-t pt-4 flex flex-col sm:flex-row gap-3">
                      {!draftReceipt && !completedReceipt ? (
                        <Button
                          onClick={() => handleCreateReceipt(order)}
                          disabled={isProcessing}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardList className="mr-2 h-4 w-4" />}
                          📋 Tạo Phiếu Xuất Kho
                        </Button>
                      ) : draftReceipt && !completedReceipt ? (
                        <>
                          <div className="flex-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                            <p className="font-medium">📋 Phiếu Xuất #{draftReceipt.receipt_id} (DRAFT)</p>
                            <p className="text-xs mt-1">Kiểm tra hàng theo phân bổ, sau đó xác nhận hoàn tất.</p>
                          </div>
                          <Button
                            onClick={() => handleConfirmReceipt(order, draftReceipt)}
                            disabled={isProcessing}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-4 w-4" />}
                            ✅ Hoàn tất Xuất kho
                          </Button>
                        </>
                      ) : (
                        <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                          <p className="font-medium">✅ Đã xuất kho hoàn tất</p>
                          <p className="text-xs mt-1">Phiếu #{completedReceipt.receipt_id} — Tồn kho đã được cập nhật.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
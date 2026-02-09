import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getProducts, getInventories, getOrdersByStore, createOrder } from '../../data/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { ShoppingCart, Plus, Minus, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export default function Marketplace() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({}); // { productId: quantity }
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, inventoriesRes, ordersRes] = await Promise.all([
          getProducts(),
          getInventories(),
          getOrdersByStore(user?.store_id) // Lấy đơn của store để tính reserved stock (nếu cần logic phức tạp hơn thì lấy all orders)
        ]);

        // Chỉ lấy sản phẩm thành phẩm để bán
        setProducts(productsRes.filter(p => p.product_type === 'FINISHED_PRODUCT'));
        setInventories(inventoriesRes || []);
        
        // Lọc các đơn hàng đang chờ xử lý (WAITING/PROCESSING) để trừ tồn kho ảo
        // Lưu ý: Ở môi trường thật, API nên trả về available_stock sẵn. Ở đây ta tính client-side theo BR-005.
        const active = (ordersRes || []).filter(o => ['WAITTING', 'PROCESSING'].includes(o.status));
        setActiveOrders(active);
      } catch (error) {
        console.error("Error loading marketplace:", error);
        toast.error("Không thể tải dữ liệu sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    if (user?.store_id) fetchData();
  }, [user?.store_id]);

  // BR-005: Tính Available Stock
  const getAvailableStock = (productId) => {
    // 1. Tổng tồn kho vật lý
    const totalInventory = inventories
      .filter(inv => inv.product_id === productId)
      .reduce((sum, inv) => sum + Number(inv.quantity), 0);

    // 2. Tổng hàng đang giữ chỗ (Reserved) trong các đơn WAITING/PROCESSING
    // Lưu ý: Logic này chỉ tính đơn của Store hiện tại nếu API getOrdersByStore chỉ trả về store hiện tại.
    // Để chính xác tuyệt đối cần API trả về Global Reserved Stock. 
    // Ở đây giả định mock data hoặc logic đơn giản.
    const reservedStock = activeOrders.reduce((sum, order) => {
      const detail = order.order_details?.find(d => d.product_id === productId);
      return sum + (detail ? Number(detail.quantity) : 0);
    }, 0);

    return Math.max(0, totalInventory - reservedStock);
  };

  const handleQuantityChange = (productId, delta) => {
    setCart(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      
      // BR-006: Check tồn kho
      const available = getAvailableStock(productId);
      if (newQty > available) {
        toast.warning(`Chỉ còn ${available} sản phẩm khả dụng`);
        return prev;
      }

      if (newQty === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: newQty };
    });
  };

  const handleCheckout = async () => {
    const orderDetails = Object.entries(cart).map(([productId, quantity]) => ({
      product_id: Number(productId),
      quantity
    }));

    if (orderDetails.length === 0) {
      toast.error("Giỏ hàng đang trống");
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrder({
        store_id: user.store_id,
        comment: "Đặt hàng từ Marketplace",
        orderDetails
      });
      toast.success("Đặt hàng thành công!");
      setCart({});
      // Reload data để cập nhật tồn kho
      window.location.reload(); 
    } catch (error) {
      toast.error(error.message || "Đặt hàng thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải sản phẩm...</div>;

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 space-y-6 animate-fade-in pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đặt hàng</h1>
          <p className="text-muted-foreground">Chọn sản phẩm và thêm vào giỏ hàng</p>
        </div>
        {totalItems > 0 && (
          <Button onClick={handleCheckout} disabled={isSubmitting} className="gap-2 shadow-lg">
            <ShoppingCart className="h-4 w-4" />
            Đặt ngay ({totalItems})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(product => {
          const available = getAvailableStock(product.product_id);
          const inCart = cart[product.product_id] || 0;
          const isOutOfStock = available === 0;

          return (
            <Card key={product.product_id} className={cn("flex flex-col", isOutOfStock && "opacity-70 bg-muted")}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant={isOutOfStock ? "destructive" : "outline"} className="mb-2">
                    {isOutOfStock ? "Hết hàng" : product.unit}
                  </Badge>
                  {inCart > 0 && <Badge variant="secondary">Đã chọn: {inCart}</Badge>}
                </div>
                <CardTitle className="text-lg">{product.product_name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center justify-center h-32 bg-muted/20 rounded-md mb-4 text-4xl">
                  {product.image || '📦'}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Tồn kho khả dụng: <span className="font-bold text-foreground">{available}</span></span>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex items-center justify-between w-full gap-2">
                  <Button 
                    variant="outline" size="icon" 
                    onClick={() => handleQuantityChange(product.product_id, -1)}
                    disabled={inCart === 0 || isSubmitting}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input 
                    className="text-center font-bold" 
                    value={inCart} 
                    readOnly 
                  />
                  <Button 
                    variant="default" size="icon"
                    onClick={() => handleQuantityChange(product.product_id, 1)}
                    disabled={inCart >= available || isSubmitting || isOutOfStock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
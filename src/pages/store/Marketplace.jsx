import React, { useState, useEffect } from 'react';
import { getProducts, getInventories, fetchOrders } from '../../data/api';
import { useCart } from '../../contexts/CartContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Loader2, ShoppingCart, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const { addToCart } = useCart();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // 1. Lấy TẤT CẢ sản phẩm, sau đó lọc ở frontend.
        // Cách này đáng tin cậy hơn phòng trường hợp API /get-by-type có lỗi.
        const allProductsData = await getProducts();
        const productsData = (allProductsData || []).filter(p => p.product_type === 'FINISHED_PRODUCT');
        
        // 2. Lấy tồn kho và đơn hàng để tính Available Stock (BR-005)
        // Lưu ý: Nếu user Store không có quyền gọi getInventories, backend sẽ trả lỗi.
        // Ở đây giả định hệ thống cho phép Store xem số lượng tồn kho tổng.
        const [invData, ordersData] = await Promise.all([
          getInventories().catch(() => []), 
          fetchOrders().catch(() => [])
        ]);

        setProducts(productsData || []);
        setInventories(invData || []);
        // Lọc các đơn hàng đang giữ chỗ (WAITING, PROCESSING)
        setActiveOrders((ordersData || []).filter(o => ['WAITING', 'PROCESSING'].includes(o.status)));
      } catch (error) {
        toast.error('Lỗi tải dữ liệu: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Tính tồn kho khả dụng cho từng sản phẩm
  const getAvailableStock = (productId) => {
    // Tổng tồn kho vật lý
    const totalStock = inventories
      .filter(inv => inv.product_id === productId)
      .reduce((sum, inv) => sum + (inv.quantity || 0), 0);

    // Tổng hàng đang được giữ trong các đơn chưa hoàn thành
    const reservedStock = activeOrders.reduce((sum, order) => {
      const detail = order.order_details?.find(d => d.product_id === productId);
      return sum + (detail ? detail.quantity : 0);
    }, 0);

    return Math.max(0, totalStock - reservedStock);
  };

  const handleQuantityChange = (productId, delta) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const newValue = Math.max(1, current + delta);
      return { ...prev, [productId]: newValue };
    });
  };

  const handleAddToCart = (product) => {
    const quantity = quantities[product.product_id] || 1;
    const available = getAvailableStock(product.product_id);

    if (quantity > available) {
      toast.error(`Chỉ còn ${available} ${product.unit} khả dụng.`);
      return;
    }

    addToCart(product, quantity);
    toast.success(`Đã thêm ${quantity} ${product.product_name} vào giỏ`);
    setQuantities(prev => ({ ...prev, [product.product_id]: 1 })); // Reset quantity
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Đặt hàng</h1>
        <Badge variant="outline" className="text-sm">
          {products.length} sản phẩm
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map(product => {
          const available = getAvailableStock(product.product_id);
          const quantity = quantities[product.product_id] || 1;

          return (
            <Card key={product.product_id} className="flex flex-col h-full hover:shadow-md transition-shadow">
              <CardHeader className="p-0">
                <div className="aspect-video w-full bg-muted flex items-center justify-center text-4xl rounded-t-lg">
                  {product.image || '📦'}
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{product.product_name}</CardTitle>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Đơn vị: {product.unit}</span>
                  <span className={`font-medium ${available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Sẵn có: {available}
                  </span>
                </div>
                <div className="font-semibold text-primary">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price || 0)}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 gap-2">
                <div className="flex items-center border rounded-md">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => handleQuantityChange(product.product_id, -1)} disabled={quantity <= 1}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input 
                    type="number" 
                    className="h-8 w-12 border-0 text-center focus-visible:ring-0 p-0" 
                    value={quantity} 
                    onChange={(e) => setQuantities({...quantities, [product.product_id]: Number(e.target.value)})}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => handleQuantityChange(product.product_id, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <Button className="flex-1" onClick={() => handleAddToCart(product)}>
                  <ShoppingCart className="mr-2 h-4 w-4" /> Thêm
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      {products.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Không tìm thấy sản phẩm nào (FINISHED_PRODUCT). Vui lòng kiểm tra lại dữ liệu đầu vào.
        </div>
      )}
    </div>
  );
}
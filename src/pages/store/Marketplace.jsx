import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { getProducts, getInventories } from '../../data/api';
import { ProductCard } from '../../components/common/ProductCard';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { ShoppingCart, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function getAvailableStock(inventories, productId) {
  if (!Array.isArray(inventories)) return 0;
  return inventories
    .filter((inv) => inv.product_id === productId)
    .reduce((sum, inv) => sum + (inv.quantity ?? 0), 0);
}

export default function Marketplace() {
  const { user } = useAuth();
  const { addItem, getTotalItems } = useCart();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [productsRes, inventoriesRes] = await Promise.all([
          getProducts(),
          getInventories().catch(() => []),
        ]);
        if (!cancelled) {
          setProducts(Array.isArray(productsRes) ? productsRes : []);
          setInventories(Array.isArray(inventoriesRes) ? inventoriesRes : []);
        }
      } catch (e) {
        if (!cancelled) toast.error('Không tải được danh sách sản phẩm');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const finishedProducts = products.filter((p) => p.product_type === 'FINISHED_PRODUCT');
  const filteredProducts = finishedProducts.filter((p) =>
    (p.product_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToCart = (product, quantity) => {
    const availableStock = getAvailableStock(inventories, product.product_id);
    if (quantity > availableStock) {
      toast.error('Số lượng đặt vượt quá tồn kho khả dụng');
      return;
    }
    addItem(product, quantity);
    toast.success(`Đã thêm ${quantity} ${product.product_name} vào giỏ hàng`);
  };

  const totalItems = getTotalItems();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đặt hàng</h1>
          <p className="text-muted-foreground">
            Xin chào, <span className="font-medium">{user?.full_name}</span> - {user?.store?.store_name}
          </p>
        </div>
        <Button onClick={() => navigate('/store/cart')} className="relative" size="lg">
          <ShoppingCart className="h-5 w-5 mr-2" />
          Giỏ hàng
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-destructive text-destructive-foreground">
              {totalItems}
            </Badge>
          )}
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.product_id}
            product={product}
            availableStock={getAvailableStock(inventories, product.product_id)}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không tìm thấy sản phẩm nào</p>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { getInventories, getProducts } from '../../data/api';
import { PRODUCT_TYPE } from '../../data/constants';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Search, Package, AlertTriangle, Calendar } from 'lucide-react';

export default function Inventory() {
  const [inventories, setInventories] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getInventories().catch(() => []), getProducts().catch(() => [])]).then(
      ([invRes, prodRes]) => {
        setInventories(Array.isArray(invRes) ? invRes : []);
        setProducts(Array.isArray(prodRes) ? prodRes : []);
      }
    ).finally(() => setLoading(false));
  }, []);

  const getProductById = (id) => products.find((p) => p.product_id === id);

  const enrichedInventory = inventories.map((inv) => {
    const product = getProductById(inv.product_id);
    const today = new Date();
    const expiry = new Date(inv.expiry_date || 0);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return {
      ...inv,
      product,
      daysUntilExpiry,
      isExpiringSoon: daysUntilExpiry <= 3 && daysUntilExpiry > 0,
      isExpired: daysUntilExpiry <= 0,
      isLowStock: (inv.quantity ?? 0) < 20,
    };
  });

  const filteredInventory = enrichedInventory.filter((inv) =>
    (inv.product?.product_name || inv.product_name || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const rawMaterials = filteredInventory.filter(
    (inv) => inv.product?.product_type === 'RAW_MATERIAL'
  );
  const semiFinished = filteredInventory.filter(
    (inv) => inv.product?.product_type === 'SEMI_FINISHED'
  );
  const finishedProducts = filteredInventory.filter(
    (inv) => inv.product?.product_type === 'FINISHED_PRODUCT'
  );

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('vi-VN');

  const InventoryTable = ({ items, title }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Không có sản phẩm nào</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Lô</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
                <TableHead>Hạn sử dụng</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((inv) => (
                <TableRow key={inv.inventory_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{inv.product?.image}</span>
                      <div>
                        <p className="font-medium">{inv.product?.product_name ?? inv.product_name}</p>
                        <p className="text-xs text-muted-foreground">{inv.product?.unit}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {inv.batch ? (
                      <Badge variant="outline">#{inv.batch.batchId ?? inv.batch.batch_id}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={inv.isLowStock ? 'text-warning font-medium' : ''}>
                      {inv.quantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span
                        className={
                          inv.isExpired ? 'text-destructive' : inv.isExpiringSoon ? 'text-warning' : ''
                        }
                      >
                        {formatDate(inv.expiry_date)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {inv.isExpired && <Badge variant="destructive">Hết hạn</Badge>}
                      {inv.isExpiringSoon && !inv.isExpired && (
                        <Badge className="status-warning">Sắp hết hạn</Badge>
                      )}
                      {inv.isLowStock && (
                        <Badge className="status-warning">Sắp hết</Badge>
                      )}
                      {!inv.isExpired && !inv.isExpiringSoon && !inv.isLowStock && (
                        <Badge className="status-done">Bình thường</Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const totalItems = enrichedInventory.length;
  const lowStockCount = enrichedInventory.filter((i) => i.isLowStock).length;
  const expiringSoonCount = enrichedInventory.filter((i) => i.isExpiringSoon).length;
  const expiredCount = enrichedInventory.filter((i) => i.isExpired).length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý tồn kho</h1>
        <p className="text-muted-foreground">Theo dõi và quản lý hàng tồn kho</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalItems}</p>
                <p className="text-xs text-muted-foreground">Tổng mặt hàng</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">{lowStockCount}</p>
                <p className="text-xs text-muted-foreground">Sắp hết hàng</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">{expiringSoonCount}</p>
                <p className="text-xs text-muted-foreground">Sắp hết hạn</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{expiredCount}</p>
                <p className="text-xs text-muted-foreground">Đã hết hạn</p>
              </div>
            </div>
          </CardContent>
        </Card>
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

      <Tabs defaultValue="finished" className="w-full">
        <TabsList>
          <TabsTrigger value="finished">Thành phẩm ({finishedProducts.length})</TabsTrigger>
          <TabsTrigger value="semi">Bán thành phẩm ({semiFinished.length})</TabsTrigger>
          <TabsTrigger value="raw">Nguyên liệu ({rawMaterials.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="finished" className="mt-6">
          <InventoryTable items={finishedProducts} title="Thành phẩm" />
        </TabsContent>
        <TabsContent value="semi" className="mt-6">
          <InventoryTable items={semiFinished} title="Bán thành phẩm" />
        </TabsContent>
        <TabsContent value="raw" className="mt-6">
          <InventoryTable items={rawMaterials} title="Nguyên liệu" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

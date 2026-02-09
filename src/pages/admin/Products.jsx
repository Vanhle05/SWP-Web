import React, { useState, useEffect } from 'react';
import { getProducts } from '../../data/api';
import { PRODUCT_TYPE } from '../../data/constants';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Search, Plus, Edit, Package, Leaf, Cookie } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter((p) =>
    (p.product_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const rawMaterials = filteredProducts.filter((p) => p.product_type === 'RAW_MATERIAL');
  const semiFinished = filteredProducts.filter((p) => p.product_type === 'SEMI_FINISHED');
  const finishedProducts = filteredProducts.filter((p) => p.product_type === 'FINISHED_PRODUCT');

  const ProductTable = ({ items }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sản phẩm</TableHead>
          <TableHead>Đơn vị</TableHead>
          <TableHead>Hạn sử dụng</TableHead>
          <TableHead>Giá bán</TableHead>
          <TableHead className="text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((product) => (
          <TableRow key={product.product_id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{product.image || '📦'}</span>
                <div>
                  <p className="font-medium">{product.product_name}</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {PRODUCT_TYPE[product.product_type]?.label}
                  </Badge>
                </div>
              </div>
            </TableCell>
            <TableCell>{product.unit}</TableCell>
            <TableCell>{product.shelf_life_days} ngày</TableCell>
            <TableCell>{product.price ? `${product.price.toLocaleString('vi-VN')}đ` : '-'}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý sản phẩm</h1>
          <p className="text-muted-foreground">Quản lý danh sách sản phẩm trong hệ thống</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Thêm sản phẩm
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

      <Tabs defaultValue="finished" className="w-full">
        <TabsList>
          <TabsTrigger value="finished" className="flex items-center gap-2">
            <Cookie className="h-4 w-4" />
            Thành phẩm ({finishedProducts.length})
          </TabsTrigger>
          <TabsTrigger value="semi" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Bán thành phẩm ({semiFinished.length})
          </TabsTrigger>
          <TabsTrigger value="raw" className="flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            Nguyên liệu ({rawMaterials.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="finished" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <ProductTable items={finishedProducts} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="semi" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <ProductTable items={semiFinished} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="raw" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <ProductTable items={rawMaterials} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

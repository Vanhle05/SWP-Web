import React, { useState, useEffect } from 'react';
import { getAllUsers, getAllStores } from '../../data/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Search, Plus, Edit, Store } from 'lucide-react';

const ROLES = [
  { role_id: 1, role_name: 'Admin' },
  { role_id: 2, role_name: 'Manager' },
  { role_id: 3, role_name: 'Store Staff' },
  { role_id: 4, role_name: 'Kitchen Manager' },
  { role_id: 5, role_name: 'Supply Coordinator' },
  { role_id: 6, role_name: 'Shipper' },
];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllUsers().catch(() => []), getAllStores().catch(() => [])]).then(
      ([usersRes, storesRes]) => {
        setUsers(Array.isArray(usersRes) ? usersRes : []);
        setStores(Array.isArray(storesRes) ? storesRes : []);
      }
    ).finally(() => setLoading(false));
  }, []);

  const enrichedUsers = users.map((user) => ({
    ...user,
    role: ROLES.find((r) => r.role_id === user.role_id),
    store: stores.find((s) => s.store_id === user.store_id),
  }));
  const filteredUsers = enrichedUsers.filter(
    (u) =>
      (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeVariant = (roleId) => {
    switch (roleId) {
      case 1: return 'destructive';
      case 2: return 'default';
      case 3: return 'secondary';
      default: return 'outline';
    }
  };

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
          <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
          <p className="text-muted-foreground">Quản lý tài khoản và phân quyền người dùng</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Thêm người dùng
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {ROLES.map((role) => {
          const count = users.filter((u) => u.role_id === role.role_id).length;
          return (
            <Card key={role.role_id}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm text-muted-foreground">{role.role_name}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm người dùng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>Tên đăng nhập</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Cửa hàng</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(user.full_name || 'U').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{user.username}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role_id)}>
                      {user.role?.role_name ?? user.role_name ?? '-'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.store ? (
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        <span>{user.store.store_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">{user.store_name ?? '-'}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

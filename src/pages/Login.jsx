import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { loginUser } from '../data/api';
import localUsers from '../data/users.json';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ChefHat, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      let userData;
      
      // 1. Thử gọi API trước
      try {
        userData = await loginUser(username, password);
      } catch (apiErr) {
        console.warn("API Login failed, trying local data...", apiErr);
        toast.warning("Không thể kết nối máy chủ. Đang thử đăng nhập offline.", {
          description: apiErr.message,
        });
      }
      // Tạm thời vô hiệu hóa gọi API để chạy hoàn toàn Offline
      // try {
      //   userData = await loginUser(username, password);
      // } catch (apiErr) {
      //   console.warn("API Login failed, trying local data...", apiErr);
      // }

      // 2. Nếu API lỗi hoặc không trả về dữ liệu, kiểm tra file users.json cục bộ
      if (!userData || !userData.user) {
        const localUser = localUsers.find(
          u => u.username === username && u.password === password
        );
        
        if (localUser) {
          // Giả lập hành vi bảo mật của Backend:
          // Tìm thấy user (đúng pass) -> Trả về thông tin user nhưng LOẠI BỎ password
          const { password, ...userWithoutPassword } = localUser;
          userData = {
            user: userWithoutPassword,
            token: 'mock-local-token'
          };
          // Không cần toast.info ở đây vì đã có toast.warning ở trên, cung cấp đủ thông tin
        }
      }

      if (userData && userData.user) {
        login(userData);
        toast.success('Đăng nhập thành công!');

        const roleHome = {
          1: '/admin',
          2: '/manager',
          3: '/store',
          4: '/kitchen',
          5: '/coordinator',
          6: '/shipper',
        };
        // Lưu ý: role_id trong users.json của bạn cần khớp với roleHome ở đây
        const path = roleHome[userData.user.role_id] || '/';
        navigate(path, { replace: true });
      } else {
        toast.error('Tên đăng nhập hoặc mật khẩu không đúng.');
      }
    } catch (error) {
      toast.error('Đã có lỗi xảy ra khi đăng nhập.');
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <ChefHat className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Kitchen Control</h1>
          <p className="text-muted-foreground">Hệ thống quản lý bếp trung tâm</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Đăng nhập</CardTitle>
            <CardDescription>
              Nhập thông tin đăng nhập để truy cập hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

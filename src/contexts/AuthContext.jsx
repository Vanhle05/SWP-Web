import React, { createContext, useContext, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Khởi tạo isLoading là true để chặn render MainLayout cho đến khi check xong localStorage
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = sessionStorage.getItem('kitchen_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Kiểm tra đơn giản xem user có hợp lệ không (có id và role)
          if (parsedUser && parsedUser.user_id && parsedUser.role_id) {
            setUser(parsedUser);
          } else {
            // Nếu dữ liệu rác, xóa ngay
            sessionStorage.removeItem('kitchen_user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Failed to parse user from local storage:", error);
        sessionStorage.removeItem('kitchen_user');
        setUser(null);
      } finally {
        // Luôn tắt loading sau khi đã kiểm tra xong
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData) => {
    if (userData && userData.user) {
      const fullUserData = {
        ...userData.user,
        token: userData.token,
      };
      setUser(fullUserData);
      sessionStorage.setItem('kitchen_user', JSON.stringify(fullUserData));
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('kitchen_user');
    // Có thể thêm điều hướng về login tại đây hoặc để MainLayout tự xử lý
    window.location.href = '/login'; 
  };

  // --- Tự động Logout sau 5 phút không tương tác ---
  useEffect(() => {
    // Nếu chưa đăng nhập thì không cần chạy logic này
    if (!user) return;

    const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 phút (tính bằng mili giây)
    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log("Hết phiên làm việc do không tương tác. Đang đăng xuất...");
        logout();
      }, INACTIVITY_LIMIT);
    };

    // Các sự kiện được coi là "có tương tác"
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    // Lắng nghe sự kiện để reset timer
    events.forEach(event => document.addEventListener(event, resetTimer));

    // Khởi động timer lần đầu
    resetTimer();

    // Dọn dẹp khi component unmount hoặc user logout
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [user]); // Chạy lại khi trạng thái user thay đổi (đăng nhập/đăng xuất)

  // Xác định xem trang hiện tại có phải là trang công khai (Login) không
  const isPublicPage = window.location.pathname === '/login';

  // --- Bảo vệ Route ngay tại Context (Chặn truy cập trực tiếp qua URL) ---
  useEffect(() => {
    // Nếu đã tải xong mà không có user, và đang không ở trang login
    if (!isLoading && !user && !isPublicPage) {
      window.location.href = '/login';
    }
  }, [isLoading, user, isPublicPage]);

  const getRolePath = () => {
    if (!user) return '/login';
    
    switch (user.role_id) {
      case 1: return '/admin';
      case 2: return '/manager'; 
      case 3: return '/store';
      case 4: return '/kitchen';
      case 5: return '/coordinator';
      case 6: return '/shipper';
      default: return '/login';
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    getRolePath,
    isAuthenticated: !!user,
  };

  // Hiển thị màn hình chờ trong khi đang kiểm tra đăng nhập
  // Điều này ngăn chặn việc lộ nội dung trang Admin trước khi bị đá về Login
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Luôn render children để Login có thể navigate - MainLayout sẽ redirect nếu !user
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

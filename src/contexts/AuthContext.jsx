import React, { createContext, useContext, useState, useEffect } from 'react';
import { users, stores, roles } from '../data/mockData';

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
        const storedUser = localStorage.getItem('kitchen_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Kiểm tra đơn giản xem user có hợp lệ không (có id và role)
          if (parsedUser && parsedUser.user_id && parsedUser.role_id) {
            setUser(parsedUser);
          } else {
            // Nếu dữ liệu rác, xóa ngay
            localStorage.removeItem('kitchen_user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Failed to parse user from local storage:", error);
        localStorage.removeItem('kitchen_user');
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
      const apiUser = userData.user;
      // Tìm role và store tương ứng từ mockData để làm giàu dữ liệu user
      const role = roles.find(r => r.role_id === apiUser.role_id);
      const store = apiUser.store_id
        ? stores.find(s => s.store_id === apiUser.store_id)
        : null;

      const fullUserData = {
        ...apiUser,
        role: role,
        store: store,
        token: userData.token,
      };

      setUser(fullUserData);
      localStorage.setItem('kitchen_user', JSON.stringify(fullUserData));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kitchen_user');
    // Có thể thêm điều hướng về login tại đây hoặc để MainLayout tự xử lý
    window.location.href = '/login'; 
  };

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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

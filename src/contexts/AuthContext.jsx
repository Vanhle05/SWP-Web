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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('kitchen_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (userData) => {
    if (userData && userData.user) {
      const apiUser = userData.user;
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
  };

  const getRolePath = () => {
    if (!user) return '/login';
    
    switch (user.role_id) {
      case 1: return '/admin';
      case 2: return '/coordinator';
      case 3: return '/kitchen';
      case 4: return '/store';
      case 5: return '/shipper';
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

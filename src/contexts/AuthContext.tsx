import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getUserInfo } from '../services/getUserInfo'; // Assuming this file exists
import { login as loginService, logout as logoutService } from '../services/AuthService'; // Import login/logout services
import { User } from '../types/types'; // Assuming types exist

interface AuthContextProps {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userInfo = await getUserInfo();
      if (userInfo) setUser(userInfo);
    };

    fetchUser();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      await loginService(email, password);
      const userInfo = await getUserInfo();
      setUser(userInfo);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    await logoutService();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { api } from '../api/client.js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  demoAccounts: any[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string }> = {
  MALL_OWNER: { email: 'owner@mall.com', pass: 'MallAdmin123!' },
  MALL_MANAGER: { email: 'manager@mall.com', pass: 'MallAdmin123!' },
  ACCOUNTANT: { email: 'accountant@mall.com', pass: 'MallAdmin123!' },
  MAINTENANCE: { email: 'maintenance@mall.com', pass: 'MallAdmin123!' },
  TENANT: { email: 'tenant@fashionhub.com', pass: 'Tenant123!' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);

  useEffect(() => {
    async function initAuth() {
      try {
        const token = api.getToken();
        if (token) {
          const profile = await api.getCurrentUser();
          setUser(profile);
        } else {
          // Default to Owner for initial seamless demonstration
          await login(DEMO_CREDENTIALS.MALL_OWNER.email, DEMO_CREDENTIALS.MALL_OWNER.pass);
        }
      } catch (err) {
        console.warn('Initial session check failed, resetting:', err);
        api.setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }

      try {
        const { accounts } = await api.getDemoAccounts();
        setDemoAccounts(accounts);
      } catch (e) {
        // Fallback
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user } = await api.login({ email, password });
      setUser(user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
  };

  const switchDemoRole = async (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchDemoRole, demoAccounts }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

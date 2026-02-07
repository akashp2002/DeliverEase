import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { mockUsers } from '@/data/mockData';

export type UserRole = 'admin' | 'agent';

export interface User {
  email: string;
  name: string;
  role: UserRole;
  agentId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Check localStorage for existing session
    const stored = localStorage.getItem('delivery_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check admin credentials
    if (email === mockUsers.admin.email && password === mockUsers.admin.password) {
      const userData: User = {
        email: mockUsers.admin.email,
        name: mockUsers.admin.name,
        role: mockUsers.admin.role,
      };
      setUser(userData);
      localStorage.setItem('delivery_user', JSON.stringify(userData));
      return { success: true };
    }

    // Check agent credentials
    if (email === mockUsers.agent.email && password === mockUsers.agent.password) {
      const userData: User = {
        email: mockUsers.agent.email,
        name: mockUsers.agent.name,
        role: mockUsers.agent.role,
        agentId: mockUsers.agent.agentId,
      };
      setUser(userData);
      localStorage.setItem('delivery_user', JSON.stringify(userData));
      return { success: true };
    }

    return { success: false, error: 'Invalid email or password' };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('delivery_user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import api from '@/lib/api';

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

/**
 * Validate user object has all required properties
 */
function isValidUser(obj: any): obj is User {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.email === 'string' &&
    typeof obj.name === 'string' &&
    (obj.role === 'admin' || obj.role === 'agent')
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Check localStorage for existing session
    const stored = localStorage.getItem('delivery_user');
    if (!stored) return null;
    
    try {
      const parsed = JSON.parse(stored);
      // Validate the parsed user object
      if (isValidUser(parsed)) {
        return parsed;
      } else {
        // Clear invalid user data
        localStorage.removeItem('delivery_user');
        localStorage.removeItem('token');
        console.warn('Invalid user data in localStorage. Cleared session.');
        return null;
      }
    } catch (error) {
      console.error('Failed to parse stored user data:', error);
      localStorage.removeItem('delivery_user');
      localStorage.removeItem('token');
      return null;
    }
  });

const login = useCallback(async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { email, password });

    const data = response.data;

    if (!data.success) {
      return { success: false, error: data.message };
    }

    // Validate user object from server
    if (!isValidUser(data.user)) {
      return { success: false, error: 'Invalid user data received from server' };
    }

    // Save user + token
    setUser(data.user);
    localStorage.setItem("delivery_user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);

    return { success: true };

  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || "Server not reachable" };
  }
}, []);


  const logout = useCallback(() => {
  setUser(null);
  localStorage.removeItem('delivery_user');
  localStorage.removeItem('token');
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

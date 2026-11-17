'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';
import { INITIAL_ADMIN_USER, INITIAL_SAMPLE_CUSTOMER } from './seedData';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  sendOTP: (target: string, type?: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET') => Promise<{ success: boolean; message: string; devCode?: string }>;
  verifyOTPAndLogin: (target: string, code: string, type?: 'REGISTRATION' | 'LOGIN', extraData?: { name?: string; phone?: string }) => Promise<{ success: boolean; message: string; user?: User }>;
  loginAsAdmin: () => void;
  loginAsCustomer: () => void;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('loop_and_love_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        // Do not auto-login as anyone; guest by default
        setUser(null);
      }
    } catch (e) {
      console.warn('Error loading auth user:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginAsAdmin = () => {
    setUser(INITIAL_ADMIN_USER);
    localStorage.setItem('loop_and_love_user', JSON.stringify(INITIAL_ADMIN_USER));
  };

  const loginAsCustomer = () => {
    setUser(INITIAL_SAMPLE_CUSTOMER);
    localStorage.setItem('loop_and_love_user', JSON.stringify(INITIAL_SAMPLE_CUSTOMER));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('loop_and_love_user');
  };

  const sendOTP = async (
    target: string,
    type: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET' = 'LOGIN'
  ) => {
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, type }),
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, message: 'Failed to dispatch OTP.' };
    }
  };

  const verifyOTPAndLogin = async (
    target: string,
    code: string,
    type: 'REGISTRATION' | 'LOGIN' = 'LOGIN',
    extraData?: { name?: string; phone?: string }
  ) => {
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, code, type, ...extraData }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('loop_and_love_user', JSON.stringify(data.user));
        return { success: true, message: data.message, user: data.user };
      }
      return { success: false, message: data.message || 'Verification failed.' };
    } catch {
      return { success: false, message: 'Authentication service error.' };
    }
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('loop_and_love_user', JSON.stringify(updated));
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        sendOTP,
        verifyOTPAndLogin,
        loginAsAdmin,
        loginAsCustomer,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

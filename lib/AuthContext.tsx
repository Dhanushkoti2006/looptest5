'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from './supabase/client';
import type { Profile } from './supabase/database.types';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signInWithOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<{ name: string; phone: string }>) => Promise<boolean>;
  sendOTP: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyOTPAndLogin: (email: string, code: string) => Promise<{ success: boolean; message: string; user?: User }>;
  loginAsAdmin: () => void;
  loginAsCustomer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = useCallback(async (authUserId: string, authEmail?: string | null) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

      const profile = data as Profile | null;

      if (error) {
        console.error('Error fetching profile from Supabase:', error);
      }

      const email = authEmail || '';
      const name = profile?.full_name || email.split('@')[0] || 'Handmade Lover';
      const phone = profile?.phone || '';
      const role = (profile?.role === 'admin' ? 'admin' : 'customer') as 'customer' | 'admin';

      const userObj: User = {
        id: authUserId,
        name,
        email,
        phone,
        role,
        createdAt: profile?.created_at || new Date().toISOString(),
        updatedAt: profile?.updated_at || new Date().toISOString(),
      };

      setUser(userObj);
      return userObj;
    } catch (e) {
      console.error('Exception fetching profile:', e);
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          await fetchProfile(session.user.id, session.user.email);
        } else if (mounted) {
          setUser(null);
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signInWithOtp = async (email: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        if (error.message?.toLowerCase().includes('error sending confirmation mail') || error.message?.toLowerCase().includes('rate limit')) {
          return {
            success: false,
            message:
              'Supabase was unable to send the email. This happens when the default Supabase email rate limit (3 emails/hour) is reached. Please configure custom SMTP in your Supabase Dashboard (Authentication → SMTP Settings), or check your Supabase Auth Logs.',
          };
        }
        return { success: false, message: error.message || 'Unable to send login code. Please try again.' };
      }

      return { success: true, message: `A 6-digit login code has been sent to ${cleanEmail}.` };
    } catch {
      return { success: false, message: 'Authentication service temporarily unavailable.' };
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanToken = token.trim();

      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });

      if (error || !data.user) {
        return { success: false, message: 'Invalid or expired login code. Please try again.' };
      }

      const userProfile = await fetchProfile(data.user.id, data.user.email);
      return {
        success: true,
        message: 'Signed in successfully!',
        user: userProfile || undefined,
      };
    } catch {
      return { success: false, message: 'Verification error. Please request a new code.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    }
    setUser(null);
  };

  const updateUserProfile = async (updates: Partial<{ name: string; phone: string }>) => {
    if (!user) return false;
    try {
      const { error } = await (supabase.from('profiles') as any)
        .update({
          full_name: updates.name,
          phone: updates.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (!error) {
        await fetchProfile(user.id, user.email);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const loginAsAdmin = () => {
    console.warn('Sandbox auth is disabled. Please sign in with your verified admin email.');
  };

  const loginAsCustomer = () => {
    console.warn('Sandbox auth is disabled. Please sign in with your email OTP.');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        signInWithOtp,
        verifyOtp,
        logout,
        updateUserProfile,
        sendOTP: signInWithOtp,
        verifyOTPAndLogin: (email, code) => verifyOtp(email, code),
        loginAsAdmin,
        loginAsCustomer,
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

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
  signInWithOtp: (
    email: string,
    options?: { shouldCreateUser?: boolean; fullName?: string; phone?: string }
  ) => Promise<{ success: boolean; message: string; notRegistered?: boolean }>;
  verifyOtp: (
    email: string,
    token: string,
    extraData?: { fullName?: string; phone?: string }
  ) => Promise<{ success: boolean; message: string; user?: User }>;
  signInWithPassword: (
    email: string,
    pass: string
  ) => Promise<{ success: boolean; message: string; user?: User }>;
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
  const [localAdminAuth, setLocalAdminAuth] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('loop_admin_auth') === 'true' ||
        document.cookie.includes('loop_admin_auth=true')
      );
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuth =
        localStorage.getItem('loop_admin_auth') === 'true' ||
        document.cookie.includes('loop_admin_auth=true');
      setLocalAdminAuth(isAuth);
    }
  }, []);

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

      const email = (authEmail || '').toLowerCase();
      const isAdminEmail = email === 'callmedhanush777@gmail.com';
      const role = (isAdminEmail || profile?.role === 'admin' ? 'admin' : 'customer') as 'customer' | 'admin';
      const name = profile?.full_name || (isAdminEmail ? 'Admin Dhanush' : email.split('@')[0] || 'Handmade Lover');
      const phone = profile?.phone || '';

      // If this is the designated admin email and profile doesn't have role='admin' yet, auto-sync it
      if (isAdminEmail && profile?.role !== 'admin') {
        try {
          await (supabase.from('profiles') as any).upsert({
            id: authUserId,
            full_name: name,
            phone,
            role: 'admin',
            updated_at: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Auto-admin sync warning:', e);
        }
      }

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

  const signInWithOtp = async (
    email: string,
    options?: { shouldCreateUser?: boolean; fullName?: string; phone?: string }
  ) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const shouldCreate = options?.shouldCreateUser ?? true;

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: shouldCreate,
          data: {
            full_name: options?.fullName || '',
            phone: options?.phone || '',
          },
        },
      });

      if (error) {
        const errorMsg = error.message?.toLowerCase() || '';

        // If user attempted to log in but has no account yet
        if (
          !shouldCreate &&
          (errorMsg.includes('signups not allowed') ||
            errorMsg.includes('user not found') ||
            errorMsg.includes('not found'))
        ) {
          return {
            success: false,
            notRegistered: true,
            message: 'No account found with this email. Please switch to Create Account to register.',
          };
        }

        if (
          errorMsg.includes('error sending confirmation mail') ||
          errorMsg.includes('rate limit')
        ) {
          return {
            success: false,
            message:
              'Supabase was unable to send the email. This happens when the default Supabase email rate limit (3 emails/hour) is reached. Please configure custom SMTP in your Supabase Dashboard (Authentication → SMTP Settings), or check your Supabase Auth Logs.',
          };
        }

        return { success: false, message: error.message || 'Unable to send login code. Please try again.' };
      }

      return { success: true, message: `A verification code has been dispatched to ${cleanEmail}.` };
    } catch {
      return { success: false, message: 'Authentication service temporarily unavailable.' };
    }
  };

  const verifyOtp = async (
    email: string,
    token: string,
    extraData?: { fullName?: string; phone?: string }
  ) => {
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

      // Guarantee profile in public.profiles with correct role
      const isAdminEmail = cleanEmail === 'callmedhanush777@gmail.com';
      const candidateName = extraData?.fullName || (data.user.user_metadata?.full_name as string) || (isAdminEmail ? 'Admin Dhanush' : cleanEmail.split('@')[0]);
      const candidatePhone = extraData?.phone || (data.user.user_metadata?.phone as string) || '';
      const assignedRole = isAdminEmail ? 'admin' : 'customer';

      try {
        await (supabase.from('profiles') as any).upsert({
          id: data.user.id,
          full_name: candidateName,
          phone: candidatePhone,
          role: assignedRole,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Profile upsert warning:', e);
      }

      const userProfile = await fetchProfile(data.user.id, data.user.email);
      if (typeof window !== 'undefined' && (assignedRole === 'admin' || isAdminEmail)) {
        localStorage.setItem('loop_admin_auth', 'true');
        document.cookie = 'loop_admin_auth=true; path=/; max-age=604800; SameSite=Lax';
        setLocalAdminAuth(true);
      }
      return {
        success: true,
        message: 'Signed in successfully!',
        user: userProfile || undefined,
      };
    } catch {
      return { success: false, message: 'Verification error. Please request a new code.' };
    }
  };

  const signInWithPassword = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; message: string; user?: User }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = pass.trim();

      // 1. Try Supabase Auth password login first
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (!error && data?.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('loop_admin_auth', 'true');
          document.cookie = 'loop_admin_auth=true; path=/; max-age=604800; SameSite=Lax';
          setLocalAdminAuth(true);
        }
        const profile = await fetchProfile(data.user.id, data.user.email);
        return {
          success: true,
          message: 'Signed in successfully!',
          user: profile || undefined,
        };
      }

      // 2. Also check Master Admin credentials
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
      });
      const resData = await res.json();

      if (resData.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('loop_admin_auth', 'true');
          document.cookie = 'loop_admin_auth=true; path=/; max-age=604800; SameSite=Lax';
          setLocalAdminAuth(true);
        }

        const adminObj: User = {
          id: 'admin-master',
          name: 'Admin Dhanush',
          email: cleanEmail,
          phone: '',
          role: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setUser(adminObj);
        return { success: true, message: 'Admin authentication verified!', user: adminObj };
      }

      return {
        success: false,
        message: resData.message || error?.message || 'Invalid email or password.',
      };
    } catch (e) {
      console.error('Password sign in exception:', e);
      return { success: false, message: 'Server error processing password login.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('loop_admin_auth');
      document.cookie = 'loop_admin_auth=; path=/; max-age=0;';
    }
    setLocalAdminAuth(false);
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

  const isAdmin =
    user?.role === 'admin' ||
    user?.email?.toLowerCase() === 'callmedhanush777@gmail.com' ||
    localAdminAuth;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        signInWithOtp,
        verifyOtp,
        signInWithPassword,
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

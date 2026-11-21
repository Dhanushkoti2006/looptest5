'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import {
  Shield,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export default function AdminLoginPage() {
  const { user, isAdmin, isLoading, signInWithPassword, signInWithOtp, verifyOtp } = useAuth();

  // Mode: 'PASSWORD' | 'OTP'
  const [authMode, setAuthMode] = useState<'PASSWORD' | 'OTP'>('PASSWORD');

  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [otpStep, setOtpStep] = useState<'EMAIL' | 'OTP'>('EMAIL');

  // Status
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // If already authenticated, redirect straight to /admin
  useEffect(() => {
    if (!isLoading) {
      const isAuth =
        isAdmin ||
        (typeof window !== 'undefined' &&
          (localStorage.getItem('loop_admin_auth') === 'true' ||
            document.cookie.includes('loop_admin_auth=true')));

      if (isAuth) {
        window.location.href = '/admin';
      }
    }
  }, [isAdmin, isLoading]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // 1. Password Login Handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setMessage({ text: 'Please enter both your admin email and password.', isError: true });
      return;
    }

    setLoading(true);
    setMessage(null);

    const res = await signInWithPassword(cleanEmail, cleanPass);
    setLoading(false);

    if (res.success) {
      setMessage({ text: 'Admin authorization verified! Opening Admin Console...', isError: false });
      if (typeof window !== 'undefined') {
        localStorage.setItem('loop_admin_auth', 'true');
        document.cookie = 'loop_admin_auth=true; path=/; max-age=604800; SameSite=Lax';
      }
      setTimeout(() => {
        window.location.href = '/admin';
      }, 400);
    } else {
      setMessage({ text: res.message, isError: true });
    }
  };

  // 2. OTP Send Handler
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setMessage({ text: 'Please enter your administrator email.', isError: true });
      return;
    }

    setLoading(true);
    setMessage(null);

    const res = await signInWithOtp(cleanEmail, { shouldCreateUser: true, fullName: 'Admin Dhanush' });
    setLoading(false);

    if (res.success) {
      setOtpStep('OTP');
      setCooldown(60);
      setMessage({ text: res.message, isError: false });
    } else {
      setMessage({ text: res.message, isError: true });
    }
  };

  // 3. OTP Verify Handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = otpToken.trim();
    if (!cleanToken || cleanToken.length < 6) {
      setMessage({ text: 'Please enter the 6-digit or 8-digit verification code.', isError: true });
      return;
    }

    setLoading(true);
    setMessage(null);

    const res = await verifyOtp(email.trim(), cleanToken, { fullName: 'Admin Dhanush' });
    setLoading(false);

    if (res.success) {
      if (res.user?.role === 'admin' || email.trim().toLowerCase() === 'callmedhanush777@gmail.com') {
        setMessage({ text: 'Admin authorization verified! Opening Admin Console...', isError: false });
        if (typeof window !== 'undefined') {
          localStorage.setItem('loop_admin_auth', 'true');
          document.cookie = 'loop_admin_auth=true; path=/; max-age=604800; SameSite=Lax';
        }
        setTimeout(() => {
          window.location.href = '/admin';
        }, 400);
      } else {
        setMessage({
          text: `Signed in as ${res.user?.email}, but this account does not have the 'admin' role in public.profiles.`,
          isError: true,
        });
      }
    } else {
      setMessage({ text: res.message, isError: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20 space-y-6">
        {/* LOGO & TITLE */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-purple-100 text-purple-700 mb-1">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
            Admin Portal
          </h1>
          <p className="text-xs text-slate-500">
            Secure management console for Loop &amp; Love Boutique
          </p>
        </div>

        {/* AUTH METHOD SELECTOR */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('PASSWORD');
              setMessage(null);
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'PASSWORD'
                ? 'bg-white text-purple-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" /> Password Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('OTP');
              setMessage(null);
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'OTP'
                ? 'bg-white text-purple-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> Email OTP Code
          </button>
        </div>

        {/* FEEDBACK ALERT */}
        {message && (
          <div
            className={`p-4 rounded-xl flex items-start gap-2 text-xs leading-relaxed ${
              message.isError
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {message.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* MODE 1: PASSWORD LOGIN */}
        {authMode === 'PASSWORD' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@loopandlove.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-xl text-sm transition-colors shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to Admin Portal <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* MODE 2: EMAIL OTP LOGIN */}
        {authMode === 'OTP' && (
          <>
            {otpStep === 'EMAIL' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Admin Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@loopandlove.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-xl text-sm transition-colors shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Send Admin Login Code <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Security Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpStep('EMAIL')}
                      className="text-xs text-purple-700 hover:underline"
                    >
                      Change Email
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={8}
                      inputMode="numeric"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit code"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm tracking-widest font-mono text-center focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !otpToken.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-xl text-sm transition-colors shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Verify &amp; Sign In <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  {cooldown > 0 ? (
                    <span className="text-xs text-slate-400">Resend code in {cooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="text-xs text-purple-700 hover:underline font-semibold"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </form>
            )}
          </>
        )}

        {/* FOOTER */}
        <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-100 flex items-center justify-between">
          <Link href="/" className="hover:text-purple-700 transition-colors">
            &larr; Return to Store
          </Link>
          <span className="text-[11px] text-slate-400">Loop &amp; Love Admin</span>
        </div>
      </div>
    </div>
  );
}

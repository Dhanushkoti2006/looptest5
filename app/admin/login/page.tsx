'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ArrowLeft,
} from 'lucide-react';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading, signInWithPassword, signInWithOtp, verifyOtp } = useAuth();

  // Mode: 'PASSWORD' | 'OTP'
  const [authMode, setAuthMode] = useState<'PASSWORD' | 'OTP'>('PASSWORD');

  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [otpStep, setOtpStep] = useState<'EMAIL' | 'OTP'>('EMAIL');

  // Security & Rate Limiting
  const [attempts, setAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Status
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // If already logged in as admin, redirect to /admin
  useEffect(() => {
    if (!isLoading && user && isAdmin) {
      router.replace('/admin');
    }
  }, [user, isAdmin, isLoading, router]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          setAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // OTP resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const recordFailedAttempt = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (nextAttempts >= MAX_ATTEMPTS) {
      setLockoutTimer(LOCKOUT_SECONDS);
      setMessage({
        text: `Too many failed attempts. Login locked for ${LOCKOUT_SECONDS} seconds for security.`,
        isError: true,
      });
    } else {
      setMessage({
        text: 'Invalid credentials or unauthorized account.',
        isError: true,
      });
    }
  };

  // 1. Password Login Handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setMessage({ text: 'Please enter both your administrator email and password.', isError: true });
      return;
    }

    setLoading(true);
    setMessage(null);

    const res = await signInWithPassword(cleanEmail, cleanPass);
    setLoading(false);

    if (res.success && res.user?.role === 'admin') {
      setMessage({ text: 'Administrator credentials verified. Opening console...', isError: false });
      setTimeout(() => {
        window.location.href = '/admin';
      }, 400);
    } else {
      recordFailedAttempt();
    }
  };

  // 2. OTP Send Handler
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setMessage({ text: 'Please enter your administrator email.', isError: true });
      return;
    }

    setLoading(true);
    setMessage(null);

    const res = await signInWithOtp(cleanEmail, { shouldCreateUser: false });
    setLoading(false);

    if (res.success) {
      setOtpStep('OTP');
      setCooldown(60);
      setMessage({ text: 'Verification code sent to your administrator email.', isError: false });
    } else {
      recordFailedAttempt();
    }
  };

  // 3. OTP Verify Handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    const cleanToken = otpToken.trim();
    if (!cleanToken || cleanToken.length < 6) {
      setMessage({ text: 'Please enter the verification code.', isError: true });
      return;
    }

    setLoading(true);
    setMessage(null);

    const res = await verifyOtp(email.trim(), cleanToken);
    setLoading(false);

    if (res.success && res.user?.role === 'admin') {
      setMessage({ text: 'Administrator verified. Opening console...', isError: false });
      setTimeout(() => {
        window.location.href = '/admin';
      }, 400);
    } else {
      recordFailedAttempt();
    }
  };

  const isLocked = lockoutTimer > 0;

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
            <KeyRound className="w-3.5 h-3.5" /> Password
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
            <Mail className="w-3.5 h-3.5" /> Email OTP
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
                  disabled={isLocked}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@loopandlove.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLocked}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all disabled:opacity-50"
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
              disabled={loading || isLocked}
              className="w-full py-3 px-4 bg-purple-700 hover:bg-purple-800 disabled:bg-purple-300 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                'Authenticating...'
              ) : isLocked ? (
                `Locked (${lockoutTimer}s)`
              ) : (
                <>
                  Sign In to Admin Console <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* MODE 2: OTP LOGIN */}
        {authMode === 'OTP' && (
          <div>
            {otpStep === 'EMAIL' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      disabled={isLocked}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@loopandlove.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || cooldown > 0 || isLocked}
                  className="w-full py-3 px-4 bg-purple-700 hover:bg-purple-800 disabled:bg-purple-300 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {loading
                    ? 'Sending Code...'
                    : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : isLocked
                    ? `Locked (${lockoutTimer}s)`
                    : 'Send Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Enter Security Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpStep('EMAIL')}
                      className="text-[11px] text-purple-700 hover:underline"
                    >
                      Change Email
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value)}
                    placeholder="123456"
                    maxLength={8}
                    className="w-full py-3 text-center tracking-widest font-mono text-lg font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all disabled:opacity-50"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 text-center">
                    Check your inbox for the code sent to {email}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || isLocked}
                  className="w-full py-3 px-4 bg-purple-700 hover:bg-purple-800 disabled:bg-purple-300 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {loading
                    ? 'Verifying Code...'
                    : isLocked
                    ? `Locked (${lockoutTimer}s)`
                    : 'Verify & Open Console'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    disabled={cooldown > 0 || isLocked}
                    onClick={handleSendOtp}
                    className="text-xs text-slate-500 hover:text-purple-700 disabled:opacity-50"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="pt-2 text-center border-t border-slate-100">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-purple-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Customer Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}

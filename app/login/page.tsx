'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import Turnstile from '@/components/Turnstile';
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/account';

  const { user, isAdmin, isLoading, signInWithOtp, verifyOtp } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');

  // Form fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean; canSwitch?: boolean } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // If already authenticated, redirect
  useEffect(() => {
    if (!isLoading && user) {
      if (isAdmin && redirectPath.startsWith('/admin')) {
        router.replace(redirectPath);
      } else {
        router.replace(redirectPath);
      }
    }
  }, [user, isAdmin, isLoading, router, redirectPath]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setMessage({ text: 'Please enter a valid email address.', isError: true });
      return;
    }

    if (mode === 'REGISTER') {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setMessage({ text: 'Please enter your full name (at least 2 characters).', isError: true });
        return;
      }
      if (!phone.trim() || phone.trim().replace(/\D/g, '').length < 10) {
        setMessage({ text: 'Please enter a valid 10-digit mobile number.', isError: true });
        return;
      }
    }

    setLoading(true);
    setMessage(null);

    const res = await signInWithOtp(cleanEmail, {
      shouldCreateUser: mode === 'REGISTER',
      fullName: fullName.trim(),
      phone: phone.trim(),
    });
    setLoading(false);

    if (res.success) {
      setStep('OTP');
      setCooldown(60);
      setMessage({ text: res.message, isError: false });
    } else {
      setMessage({
        text: res.message,
        isError: true,
        canSwitch: res.notRegistered,
      });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = otpToken.trim();
    if (!cleanToken || cleanToken.length < 6) {
      setMessage({ text: 'Please enter the complete verification code.', isError: true });
      return;
    }

    setLoading(true);
    setMessage(null);

    const res = await verifyOtp(email.trim(), cleanToken, {
      fullName: fullName.trim(),
      phone: phone.trim(),
    });
    setLoading(false);

    if (res.success) {
      setMessage({ text: 'Verification successful! Redirecting...', isError: false });
      setTimeout(() => {
        if (res.user?.role === 'admin' && redirectPath.startsWith('/admin')) {
          router.push(redirectPath);
        } else {
          router.push(redirectPath);
        }
      }, 500);
    } else {
      setMessage({ text: res.message, isError: true });
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setMessage(null);

    const res = await signInWithOtp(email.trim(), {
      shouldCreateUser: mode === 'REGISTER',
      fullName: fullName.trim(),
      phone: phone.trim(),
    });
    setLoading(false);

    if (res.success) {
      setCooldown(60);
      setMessage({ text: 'A fresh verification code has been dispatched.', isError: false });
    } else {
      setMessage({ text: res.message, isError: true });
    }
  };

  return (
    <div className="min-h-screen bg-canvas-warm py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-md w-full">
        {/* LOGO & HEADING */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <span className="font-serif text-3xl font-bold tracking-tight text-brand-900">
              Loop & Love
            </span>
          </Link>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            {step === 'FORM'
              ? mode === 'LOGIN'
                ? 'Welcome Back'
                : 'Create Customer Account'
              : 'Enter Verification Code'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {step === 'FORM'
              ? mode === 'LOGIN'
                ? 'Sign in to access your orders, saved addresses, and wishlist.'
                : 'Register your details to order and track handmade crochet.'
              : `We sent a verification code to ${email}`}
          </p>
        </div>

        {/* AUTH CARD */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-cozy border border-canvas-border">
          {/* TAB SELECTOR (Only in FORM step) */}
          {step === 'FORM' && (
            <div className="flex p-1 bg-canvas-warm rounded-2xl mb-6 border border-canvas-border">
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  mode === 'LOGIN'
                    ? 'bg-white text-brand-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('REGISTER');
                  setMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  mode === 'REGISTER'
                    ? 'bg-white text-brand-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {message && (
            <div
              className={`mb-6 p-4 rounded-2xl flex flex-col gap-2 text-sm ${
                message.isError
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {message.isError ? (
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                )}
                <span className="leading-snug">{message.text}</span>
              </div>
              {message.canSwitch && mode === 'LOGIN' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('REGISTER');
                    setMessage(null);
                  }}
                  className="mt-1 text-xs font-bold text-brand-800 hover:underline text-left"
                >
                  👉 Switch to Create Account now
                </button>
              )}
            </div>
          )}

          {step === 'FORM' ? (
            <form onSubmit={handleSubmitForm} className="space-y-4">
              {mode === 'REGISTER' && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Dhanush Koti"
                        className="w-full pl-10 pr-4 py-2.5 bg-canvas-warm/50 border border-canvas-border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2.5 bg-canvas-warm/50 border border-canvas-border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address
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
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-canvas-warm/50 border border-canvas-border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* CLOUDFLARE TURNSTILE WIDGET */}
              <Turnstile
                onVerify={(token) => setTurnstileToken(token)}
                onError={() => setMessage({ text: 'Human verification failed. Please refresh.', isError: true })}
              />

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-800 hover:bg-brand-900 text-white font-medium rounded-xl text-sm transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'LOGIN' ? 'Send Login Code' : 'Send Registration Code'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Verification Code (OTP)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter code"
                    className="w-full pl-11 pr-4 py-3 text-center tracking-widest font-mono text-lg bg-canvas-warm/50 border border-canvas-border rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpToken.length < 6}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-brand-800 hover:bg-brand-900 text-white font-medium rounded-xl text-sm transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Verify & Continue
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('FORM');
                    setOtpToken('');
                    setMessage(null);
                  }}
                  className="text-slate-500 hover:text-slate-800 underline transition-colors"
                >
                  Change Details
                </button>

                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={handleResend}
                  className="text-brand-800 font-semibold hover:text-brand-900 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-canvas-border/80 text-center">
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Secured passwordless authentication via Supabase
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas-warm flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-800 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

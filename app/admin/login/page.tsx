'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Shield, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading, signInWithOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // If already authenticated as admin, go straight to /admin
  useEffect(() => {
    if (!isLoading && user) {
      if (isAdmin) {
        router.replace('/admin');
      } else {
        setMessage({
          text: `Signed in as ${user.email}, but this account does not have administrator privileges. Please assign role = 'admin' in Supabase SQL editor.`,
          isError: true,
        });
      }
    }
  }, [user, isAdmin, isLoading, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setMessage({ text: 'Please enter your administrator email.', isError: true });
      return;
    }

    setLoading(true);
    setMessage(null);

    const res = await signInWithOtp(cleanEmail);
    setLoading(false);

    if (res.success) {
      setStep('OTP');
      setCooldown(60);
      setMessage({ text: res.message, isError: false });
    } else {
      setMessage({ text: res.message, isError: true });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = otpToken.trim();
    if (!cleanToken || cleanToken.length < 6) {
      setMessage({ text: 'Please enter the 6-digit verification code.', isError: true });
      return;
    }

    setLoading(true);
    setMessage(null);

    const res = await verifyOtp(email.trim(), cleanToken);
    setLoading(false);

    if (res.success) {
      if (res.user?.role === 'admin') {
        setMessage({ text: 'Admin authorization verified! Redirecting...', isError: false });
        setTimeout(() => {
          router.push('/admin');
        }, 500);
      } else {
        setMessage({
          text: `Signed in successfully as ${res.user?.email}, but this account does not have the 'admin' role in public.profiles.`,
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
            Secure management console authenticated via Supabase Email OTP
          </p>
        </div>

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

        {step === 'EMAIL' ? (
          <form onSubmit={handleSendEmail} className="space-y-4">
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Verification Security Code
              </label>
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
                  placeholder="Enter code"
                  className="w-full pl-10 pr-4 py-2.5 font-mono text-center tracking-widest text-lg bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpToken.length < 6}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-xl text-sm transition-colors shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Verify Admin Access <Shield className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('EMAIL');
                  setOtpToken('');
                  setMessage(null);
                }}
                className="text-slate-500 hover:text-slate-800 underline"
              >
                Change Email
              </button>
              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={handleSendEmail}
                className="text-purple-700 font-semibold disabled:text-slate-400 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        <div className="pt-4 border-t border-slate-200 text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
            ← Return to Loop & Love Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}

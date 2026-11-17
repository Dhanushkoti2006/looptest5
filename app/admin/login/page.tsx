'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAsAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Verify admin credentials
    if (
      (email.trim().toLowerCase() === 'admin@loopandlove.com' || email.trim().toLowerCase() === 'admin') &&
      password === 'admin123'
    ) {
      setSuccess(true);
      loginAsAdmin();
      setTimeout(() => {
        router.push('/admin');
      }, 700);
    } else {
      setError('Invalid admin credentials. Please use admin@loopandlove.com / admin123');
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    loginAsAdmin();
    router.push('/admin');
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
            Secure management console for Loop & Love Storefront
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Authenticated! Redirecting to dashboard...</span>
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Admin Email / Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@loopandlove.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 focus:bg-white transition-all text-xs"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 focus:bg-white transition-all text-xs"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Default password: <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700 font-bold">admin123</code>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* DEMO BYPASS */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-3">
          <button
            onClick={handleQuickDemo}
            type="button"
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            ⚡ Quick 1-Click Demo Login
          </button>

          <div>
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-purple-700 transition-colors"
            >
              ← Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

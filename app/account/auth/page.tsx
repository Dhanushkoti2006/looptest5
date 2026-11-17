'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import {
  Sparkles,
  ShieldCheck,
  Send,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  User,
  RotateCcw,
} from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const { sendOTP, verifyOTPAndLogin, loginAsCustomer, loginAsAdmin } = useAuth();

  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTRATION'>('LOGIN');
  const [step, setStep] = useState<'ENTER_TARGET' | 'ENTER_OTP'>('ENTER_TARGET');

  const [target, setTarget] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(30);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;

    setLoading(true);
    setMessage(null);

    const res = await sendOTP(target.trim(), authMode);
    setLoading(false);

    if (res.success) {
      setStep('ENTER_OTP');
      setMessage({ text: res.message, isError: false });
      if (res.devCode) setDevCode(res.devCode);
      startCooldown();
    } else {
      setMessage({ text: res.message, isError: true });
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;

    setLoading(true);
    setMessage(null);

    const res = await verifyOTPAndLogin(target.trim(), otpCode.trim(), authMode, {
      name: name.trim() || undefined,
      phone: phone.trim() || undefined,
    });

    setLoading(false);

    if (res.success) {
      router.push('/account');
    } else {
      setMessage({ text: res.message, isError: true });
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
      <div className="bg-white rounded-3xl border border-canvas-border p-6 sm:p-10 shadow-cozy space-y-6">
        {/* LOGO & HEADING */}
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-brand-200 shadow-sm">
            <Image
              src="/images/loop-and-love-logo.jpg"
              alt="Loop & Love Logo"
              fill
              className="object-cover"
            />
          </div>
          <h1 className="font-serif text-2xl font-bold text-brand-900">
            {authMode === 'LOGIN' ? 'Welcome Back!' : 'Join Loop & Love'}
          </h1>
          <p className="text-xs text-gray-500">
            {authMode === 'LOGIN'
              ? 'Enter your mobile or email for instant OTP verification'
              : 'Create your handmade customer account'}
          </p>
        </div>

        {/* TAB TOGGLE: LOGIN / REGISTER */}
        {step === 'ENTER_TARGET' && (
          <div className="grid grid-cols-2 gap-1 bg-canvas-subtle p-1 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('LOGIN');
                setMessage(null);
              }}
              className={`py-2 rounded-xl transition-all ${
                authMode === 'LOGIN' ? 'bg-white text-brand-900 shadow-2xs' : 'text-gray-500'
              }`}
            >
              Sign In with OTP
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('REGISTRATION');
                setMessage(null);
              }}
              className={`py-2 rounded-xl transition-all ${
                authMode === 'REGISTRATION' ? 'bg-white text-brand-900 shadow-2xs' : 'text-gray-500'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {message && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
              message.isError
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}
          >
            {message.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* STEP 1: ENTER TARGET (EMAIL / MOBILE) */}
        {step === 'ENTER_TARGET' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            {authMode === 'REGISTRATION' && (
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Full Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Email Address or 10-Digit Mobile Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. priya@example.com or 9876543210"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-2xl shadow-cozy transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Dispatching OTP...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Get Verification OTP
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: ENTER OTP */
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="p-3 bg-brand-50 rounded-2xl border border-brand-100 text-xs text-brand-900 flex justify-between items-center">
              <span>Sent to: <strong>{target}</strong></span>
              <button
                type="button"
                onClick={() => setStep('ENTER_TARGET')}
                className="text-brand-600 font-semibold underline text-[11px]"
              >
                Change
              </button>
            </div>

            {devCode && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                <span>🔑 Simulated Sandbox OTP: <strong>{devCode}</strong></span>
                <button
                  type="button"
                  onClick={() => setOtpCode(devCode)}
                  className="text-amber-800 underline font-bold"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Enter 6-Digit Verification Code *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500 font-bold"
              />
              <span className="text-[10px] text-gray-400 mt-1 block text-center">
                Universal master code: <code>123456</code> is also accepted in demo mode.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-2xl shadow-cozy transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Verify & Access Account
                </>
              )}
            </button>

            {/* Resend Cooldown */}
            <div className="text-center pt-2">
              {cooldown > 0 ? (
                <span className="text-xs text-gray-400">
                  Resend OTP in <strong>{cooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-900"
                >
                  Resend OTP Now
                </button>
              )}
            </div>
          </form>
        )}

        {/* SECURE STOREFRONT FOOTNOTE */}
        <div className="pt-4 border-t border-canvas-border text-center">
          <p className="text-[11px] text-gray-400">
            Secure OTP Verification powered by Loop & Love Auth Engine.
          </p>
        </div>
      </div>
    </div>
  );
}

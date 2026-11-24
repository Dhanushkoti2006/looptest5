'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wand2,
  Users,
  Download,
  Calendar,
  ChevronRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'all'>('all');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = (p: string) => {
    setLoading(true);
    fetch(`/api/analytics?period=${p}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.metrics) setMetrics(data.metrics);
      })
      .catch((err) => console.error('Metrics fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMetrics(period);
    // Auto-refresh analytics every 20 seconds for live store overview
    const interval = setInterval(() => {
      fetch(`/api/analytics?period=${period}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data.metrics) setMetrics(data.metrics);
        })
        .catch(() => {});
    }, 20000);
    return () => clearInterval(interval);
  }, [period]);

  return (
    <div className="space-y-8">
      {/* TITLE & PERIOD FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
            Business Analytics & Store Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time sales, order fulfillment queue, inventory health, and custom crochet requests.
          </p>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchMetrics(period)}
            disabled={loading}
            className="p-2 bg-white rounded-2xl border border-slate-200 text-slate-600 hover:text-purple-700 hover:border-purple-300 shadow-2xs transition-all disabled:opacity-50"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-700' : ''}`} />
          </button>

          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs text-xs font-semibold">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              period === 'today' ? 'bg-purple-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('7days')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              period === '7days' ? 'bg-purple-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setPeriod('30days')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              period === '30days' ? 'bg-purple-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              period === 'all' ? 'bg-purple-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Time
          </button>
        </div>
      </div>
    </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Total Sales Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif">
            ₹{metrics ? metrics.totalRevenue.toLocaleString('en-IN') : '...'}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Verified Razorpay Transactions
          </span>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Total Orders Placed</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif">
            {metrics ? metrics.totalOrders : '...'}
          </div>
          <span className="text-[11px] text-slate-500">
            Avg Order Value: <strong>₹{metrics ? metrics.averageOrderValue.toLocaleString('en-IN') : 0}</strong>
          </span>
        </div>

        {/* Active Production Queue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">In Production / Pending</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif">
            {metrics ? metrics.pendingOrders : '...'}
          </div>
          <span className="text-[11px] text-amber-700 font-medium">
            Requires artisan hand-hooking
          </span>
        </div>

        {/* Custom Order Requests */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Custom Crochet Requests</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Wand2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif">
            {metrics ? metrics.pendingCustomOrders : '...'}
          </div>
          <Link href="/admin/custom-orders" className="text-[11px] text-purple-700 font-bold hover:underline">
            Review & Send Quotes →
          </Link>
        </div>
      </div>

      {/* REVENUE GRAPH & BESTSELLERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 7-Day Revenue Trend (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900">7-Day Revenue Trend</h3>
              <p className="text-xs text-slate-500">Daily verified checkout volume</p>
            </div>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
              Live Store Data
            </span>
          </div>

          {/* Bar Chart Visual */}
          <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100">
            {metrics?.revenueTrend?.map((item: any, idx: number) => {
              const maxRev = Math.max(...metrics.revenueTrend.map((d: any) => d.revenue), 2500);
              const heightPercent = Math.max(10, Math.round((item.revenue / maxRev) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{item.revenue}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[42px] bg-gradient-to-t from-purple-700 to-purple-500 rounded-t-xl group-hover:from-purple-800 group-hover:to-purple-600 transition-all shadow-xs"
                  />
                  <span className="text-[10px] text-slate-500 font-medium truncate w-full text-center">
                    {item.date.split(',')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Calculated from live database payments</span>
            <span className="text-emerald-700 font-semibold">100% Signature Verified</span>
          </div>
        </div>

        {/* Best Selling Products (1 col) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-serif font-bold text-base text-slate-900 pb-2 border-b border-slate-100">
            Top Performing Creations
          </h3>

          <div className="space-y-3">
            {metrics?.bestSellers?.slice(0, 4).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50">
                <div className="truncate pr-2">
                  <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                  <p className="text-[11px] text-slate-400">{item.count} pieces sold</p>
                </div>
                <span className="font-bold text-purple-700 shrink-0">
                  ₹{item.revenue.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/admin/products"
            className="block text-center text-xs font-semibold text-purple-700 hover:text-purple-900 pt-2 border-t border-slate-100"
          >
            Manage All Catalog Items →
          </Link>
        </div>
      </div>

      {/* RECENT ORDERS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900">Recent Customer Orders</h3>
            <p className="text-xs text-slate-500">Live order queue with fulfillment actions</p>
          </div>
          <Link
            href="/admin/orders"
            className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition-colors"
          >
            View All Orders ({metrics ? metrics.totalOrders : 0}) →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-6">Order ID</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Items</th>
                <th className="py-3 px-6">Total</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics?.recentOrders?.map((ord: any) => (
                <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900">#{ord.orderNumber}</td>
                  <td className="py-4 px-6">
                    <p className="font-semibold text-slate-900">{ord.customerName}</p>
                    <p className="text-[11px] text-slate-400">{ord.customerPhone}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="line-clamp-1">{ord.items?.[0]?.productName}</p>
                    {ord.items?.length > 1 && (
                      <span className="text-[10px] text-slate-400">+{ord.items.length - 1} more items</span>
                    )}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900">
                    ₹{ord.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                      {ord.orderStatus}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <Link
                      href={`/admin/orders?id=${ord.id}`}
                      className="text-purple-700 hover:underline font-semibold"
                    >
                      Update Status →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

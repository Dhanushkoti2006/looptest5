'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle2,
  Truck,
  FileSpreadsheet,
  Edit2,
  X,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  User,
  Package,
  Calendar,
  AlertCircle,
  RefreshCw,
  Eye,
  FileText,
  ChevronRight,
  Sparkles,
  XCircle,
  Radio,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  imageUrl?: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  order_number?: string;
  userId?: string;
  createdAt: string;
  created_at?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: {
    name?: string;
    phone?: string;
    street: string;
    apartment?: string;
    line1?: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  total?: number;
  paymentStatus: string;
  payment_status?: string;
  orderStatus: string;
  status?: string;
  customerNote?: string;
  deliveryMethod?: string;
  courierPartner?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  cancelReason?: string;
  cancel_reason?: string;
  cancelledAt?: string;
  cancelled_at?: string;
}

const ALL_STATUSES = [
  'ALL',
  'Order Confirmed',
  'Making Your Crochet Product',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Status update modal state
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [newStatus, setNewStatus] = useState<string>('Making Your Crochet Product');
  const [statusNote, setStatusNote] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierPartner, setCourierPartner] = useState('BlueDart Express');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [deliveryPersonName, setDeliveryPersonName] = useState('');
  const [deliveryPersonPhone, setDeliveryPersonPhone] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = (silent = false) => {
    if (!silent) setLoading(true);
    fetch('/api/orders', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.orders && Array.isArray(data.orders)) {
          setOrders(data.orders);
          setLastSynced(new Date());
        }
      })
      .catch((err) => console.error('Orders fetch error:', err))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    // Initial fetch
    fetchOrders(false);

    // Setup Supabase Realtime Subscription on public.orders
    let channel: any = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel('admin-orders-realtime-feed')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            console.log('⚡ Supabase realtime orders change event:', payload);
            fetchOrders(true);
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription fallback to polling:', e);
    }

    // Background poller every 10 seconds for real-time guarantee
    const pollInterval = setInterval(() => {
      fetchOrders(true);
    }, 10000);

    return () => {
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch (_) {}
      }
      clearInterval(pollInterval);
    };
  }, []);

  const openStatusModal = (ord: OrderRecord) => {
    setActiveOrder(ord);
    setNewStatus(ord.orderStatus || ord.status || 'Making Your Crochet Product');
    setStatusNote('');
    setTrackingNumber(ord.trackingNumber || '');
    setCourierPartner(ord.courierPartner || 'BlueDart Express');
    setTrackingUrl(ord.trackingUrl || '');
    setDeliveryPersonName(ord.deliveryPersonName || '');
    setDeliveryPersonPhone(ord.deliveryPersonPhone || '');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.id,
          status: newStatus,
          note: statusNote || undefined,
          trackingNumber: trackingNumber || undefined,
          courierPartner: courierPartner || undefined,
          trackingUrl: trackingUrl || undefined,
          deliveryPersonName: deliveryPersonName || undefined,
          deliveryPersonPhone: deliveryPersonPhone || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveOrder(null);
        fetchOrders(true);
      } else {
        alert(data.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Network error while updating status');
    } finally {
      setUpdating(false);
    }
  };

  // Helper to format date and time cleanly
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return { date: '-', time: '' };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { date: dateStr, time: '' };
      return {
        date: d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        time: d.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      };
    } catch {
      return { date: dateStr, time: '' };
    }
  };

  // Filter logic
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      // 1. Text search
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (o.orderNumber || '').toLowerCase().includes(q) ||
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.customerPhone || '').includes(q) ||
        (o.customerEmail || '').toLowerCase().includes(q) ||
        (o.shippingAddress?.pincode || '').includes(q) ||
        (o.shippingAddress?.city || '').toLowerCase().includes(q) ||
        (o.shippingAddress?.street || '').toLowerCase().includes(q) ||
        (o.shippingAddress?.line1 || '').toLowerCase().includes(q);

      // 2. Status filter
      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        const curStatus = (o.orderStatus || o.status || '').toLowerCase();
        const target = statusFilter.toLowerCase();
        matchesStatus = curStatus.includes(target) || target.includes(curStatus);
      }

      // 3. Date filter
      let matchesDate = true;
      if (dateFilter !== 'ALL') {
        const orderDate = new Date(o.createdAt || o.created_at || Date.now());
        const now = new Date();

        if (dateFilter === 'TODAY') {
          matchesDate = orderDate.toDateString() === now.toDateString();
        } else if (dateFilter === '7DAYS') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          matchesDate = orderDate >= sevenDaysAgo;
        } else if (dateFilter === '30DAYS') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          matchesDate = orderDate >= thirtyDaysAgo;
        } else if (dateFilter === 'CUSTOM') {
          if (customStartDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            if (orderDate < start) matchesDate = false;
          }
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (orderDate > end) matchesDate = false;
          }
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, search, statusFilter, dateFilter, customStartDate, customEndDate]);

  // CSV Export
  const exportToCSV = () => {
    if (filtered.length === 0) {
      alert('No orders to export matching your filter criteria.');
      return;
    }

    const headers = [
      'Order Number',
      'Order Date',
      'Order Time',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Delivery Address Line 1',
      'Delivery Address Line 2 / Apartment',
      'City',
      'State',
      'Pincode',
      'Items Purchased',
      'Subtotal (INR)',
      'Delivery Fee (INR)',
      'Total Amount (INR)',
      'Payment Status',
      'Order Milestone Status',
      'Is Cancelled',
      'Cancellation Reason',
      'Cancelled At',
      'Delivery Method',
      'Courier Partner',
      'Tracking Number',
      'Customer Note',
    ];

    const rows = filtered.map((o) => {
      const itemsStr = (o.items || [])
        .map((i) => `${i.quantity}x ${i.productName} (₹${i.unitPrice})`)
        .join('; ');

      const fullLine1 = o.shippingAddress?.line1 || o.shippingAddress?.street || '';
      const fullLine2 = o.shippingAddress?.line2 || o.shippingAddress?.apartment || '';
      const dt = formatDateTime(o.createdAt || o.created_at);
      const isCancelled = ['cancelled', 'Cancelled'].includes(o.orderStatus || o.status || '');
      const cancelReason = o.cancelReason || o.cancel_reason || '';
      const cancelledAt = o.cancelledAt || o.cancelled_at ? new Date(o.cancelledAt || o.cancelled_at!).toLocaleString('en-IN') : '';

      return [
        o.orderNumber || o.order_number,
        dt.date,
        dt.time,
        o.customerName || '',
        o.customerPhone || '',
        o.customerEmail || '',
        fullLine1,
        fullLine2,
        o.shippingAddress?.city || '',
        o.shippingAddress?.state || '',
        o.shippingAddress?.pincode || '',
        itemsStr,
        o.subtotal || 0,
        o.deliveryFee || 0,
        o.totalAmount || o.total || 0,
        o.paymentStatus || o.payment_status || '',
        o.orderStatus || o.status || '',
        isCancelled ? 'YES' : 'NO',
        cancelReason,
        cancelledAt,
        o.deliveryMethod || 'local_own',
        o.courierPartner || '',
        o.trackingNumber || '',
        (o.customerNote || '').replace(/"/g, '""'),
      ];
    });

    const csvContent = [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `LoopAndLove-Orders-Export-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics summary
  const totalRevenue = orders
    .filter((o) => !['Cancelled', 'cancelled'].includes(o.orderStatus || o.status || ''))
    .reduce((sum, o) => sum + (Number(o.totalAmount || o.total) || 0), 0);

  const activeOrdersCount = orders.filter(
    (o) => !['Delivered', 'Cancelled', 'delivered', 'cancelled'].includes(o.orderStatus || o.status || '')
  ).length;

  const deliveredCount = orders.filter(
    (o) => ['Delivered', 'delivered'].includes(o.orderStatus || o.status || '')
  ).length;

  const cancelledCount = orders.filter(
    (o) => ['Cancelled', 'cancelled'].includes(o.orderStatus || o.status || '')
  ).length;

  return (
    <div className="space-y-6">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
              <ShoppingBag className="w-7 h-7 text-purple-700" /> Customer Orders &amp; Fulfillment
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Real-Time</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time customer order stream, complete delivery addresses, cancellation reasons, and dispatch milestones.
            <span className="text-slate-400 ml-2">Synced: {lastSynced.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => fetchOrders(false)}
            className="p-2.5 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-2xs transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh Orders Now"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* 5-CARD METRIC STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-purple-50/60 border-purple-300 ring-2 ring-purple-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Orders</p>
          <p className="text-2xl font-serif font-bold text-slate-900 mt-1">{orders.length}</p>
        </div>

        <div
          onClick={() => setStatusFilter('Making Your Crochet Product')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Making Your Crochet Product'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">In Production / Queue</p>
          <p className="text-2xl font-serif font-bold text-amber-600 mt-1">{activeOrdersCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter('Delivered')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Delivered'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Delivered Safely</p>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-1">{deliveredCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter('Cancelled')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Cancelled'
              ? 'bg-rose-100/70 border-rose-400 ring-2 ring-rose-600/30'
              : 'bg-rose-50/50 border-rose-200 hover:border-rose-300 shadow-2xs'
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 flex items-center justify-between">
            <span>Cancelled Orders</span>
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
          </p>
          <p className="text-2xl font-serif font-bold text-rose-700 mt-1">{cancelledCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Net Order Volume</p>
          <p className="text-2xl font-serif font-bold text-purple-900 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* FILTERS & SEARCH CONTROL BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Order ID (#LL-...), Customer, Phone, Street, City, Pincode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
            />
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <span className="text-slate-400 text-[11px] mr-1">Date:</span>
            {(['ALL', 'TODAY', '7DAYS', '30DAYS', 'CUSTOM'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setDateFilter(mode)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  dateFilter === mode
                    ? 'bg-purple-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mode === 'ALL'
                  ? 'All Time'
                  : mode === 'TODAY'
                  ? 'Today'
                  : mode === '7DAYS'
                  ? 'Last 7 Days'
                  : mode === '30DAYS'
                  ? 'Last 30 Days'
                  : 'Custom Range'}
              </button>
            ))}
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st === 'ALL'
                    ? `All Orders (${orders.length})`
                    : st === 'Cancelled'
                    ? `Cancelled (${cancelledCount})`
                    : st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-slate-400 text-[10px] uppercase font-bold shrink-0">Filter:</span>
          {ALL_STATUSES.map((st) => {
            const count =
              st === 'ALL'
                ? orders.length
                : orders.filter((o) => (o.orderStatus || o.status || '').toLowerCase().includes(st.toLowerCase())).length;

            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors ${
                  statusFilter === st
                    ? st === 'Cancelled'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-purple-700 text-white shadow-2xs'
                    : st === 'Cancelled'
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>

        {/* Custom date range picker (if CUSTOM selected) */}
        {dateFilter === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-xs text-purple-700 hover:underline"
              >
                Clear Range
              </button>
            )}
          </div>
        )}
      </div>

      {/* ORDERS LIST TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
            <span>Loading orders stream from Supabase...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs space-y-2">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-sm text-slate-700">No matching orders found</p>
            <p className="text-slate-400">Try adjusting your search query, status, or date range.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-5">Order ID, Date &amp; Time</th>
                  <th className="py-3.5 px-5">Customer &amp; Contact</th>
                  <th className="py-3.5 px-5">Full Delivery Address</th>
                  <th className="py-3.5 px-5">Ordered Products</th>
                  <th className="py-3.5 px-5">Amount &amp; Payment</th>
                  <th className="py-3.5 px-5">Delivery Method</th>
                  <th className="py-3.5 px-5">Milestone Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((ord) => {
                  const items = ord.items || [];
                  const address = ord.shippingAddress || ({} as any);
                  const orderIdDisplay = ord.orderNumber || ord.order_number || ord.id.slice(0, 8);
                  const isPaid =
                    (ord.paymentStatus || ord.payment_status) === 'SUCCESS' ||
                    (ord.paymentStatus || ord.payment_status) === 'paid';
                  const isCancelled =
                    (ord.orderStatus || ord.status || '').toLowerCase() === 'cancelled';
                  const dt = formatDateTime(ord.createdAt || ord.created_at);
                  const cancelReason = ord.cancelReason || ord.cancel_reason;
                  const cancelledDt = formatDateTime(ord.cancelledAt || ord.cancelled_at);

                  return (
                    <tr
                      key={ord.id}
                      className={`transition-colors ${
                        isCancelled
                          ? 'bg-rose-50/50 hover:bg-rose-100/50 border-l-4 border-l-rose-500'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* 1. Order ID, Date & Time */}
                      <td className="py-4 px-5">
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 group text-sm"
                        >
                          <span>#{orderIdDisplay}</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-[11px] mt-1.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{dt.date}</span>
                        </div>
                        {dt.time && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{dt.time}</span>
                          </div>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            <XCircle className="w-2.5 h-2.5" /> Cancelled Order
                          </span>
                        )}
                      </td>

                      {/* 2. Customer & Contact */}
                      <td className="py-4 px-5">
                        <p className="font-bold text-slate-900 text-xs flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{ord.customerName || 'Customer'}</span>
                        </p>
                        {ord.customerPhone && (
                          <a
                            href={`tel:${ord.customerPhone}`}
                            className="text-[11px] text-slate-600 hover:text-purple-700 flex items-center gap-1 mt-1 font-mono font-medium"
                          >
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{ord.customerPhone}</span>
                          </a>
                        )}
                        {ord.customerEmail && (
                          <a
                            href={`mailto:${ord.customerEmail}`}
                            className="text-[11px] text-slate-400 hover:text-purple-700 flex items-center gap-1 mt-0.5 truncate max-w-[160px]"
                            title={ord.customerEmail}
                          >
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{ord.customerEmail}</span>
                          </a>
                        )}
                      </td>

                      {/* 3. Full Delivery Address */}
                      <td className="py-4 px-5 max-w-[240px]">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-700 shrink-0 mt-0.5" />
                          <div className="text-[11px] leading-relaxed text-slate-700 space-y-0.5">
                            <p className="font-semibold text-slate-900">
                              {address.name || ord.customerName}
                            </p>
                            <p className="text-slate-600">
                              {address.line1 || address.street || 'Address Line 1'}
                            </p>
                            {(address.line2 || address.apartment) && (
                              <p className="text-slate-500">
                                {address.line2 || address.apartment}
                              </p>
                            )}
                            <p className="font-bold text-slate-800">
                              {address.city}, {address.state} -{' '}
                              <span className="font-mono text-purple-700 font-bold">{address.pincode}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 4. Ordered Products */}
                      <td className="py-4 px-5 max-w-[220px]">
                        <div className="space-y-1.5">
                          {items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                  <Package className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <p className="line-clamp-1 text-[11px] text-slate-800">
                                <span className="font-bold text-purple-700 mr-1">{item.quantity}x</span>
                                {item.productName}
                              </p>
                            </div>
                          ))}
                          {items.length > 2 && (
                            <p className="text-[10px] text-slate-400 font-semibold pl-10">
                              +{items.length - 2} more item{items.length - 2 > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        {ord.customerNote && (
                          <div
                            className="mt-1.5 p-1.5 bg-amber-50 rounded-lg text-[10px] text-amber-800 border border-amber-200 line-clamp-1"
                            title={ord.customerNote}
                          >
                            <strong>Note:</strong> {ord.customerNote}
                          </div>
                        )}
                      </td>

                      {/* 5. Amount & Payment */}
                      <td className="py-4 px-5">
                        <p className="font-bold text-slate-900 text-sm">
                          ₹{(ord.totalAmount || ord.total || 0).toLocaleString('en-IN')}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {isPaid ? 'PAID' : 'PENDING'}
                        </span>
                      </td>

                      {/* 6. Delivery Details */}
                      <td className="py-4 px-5 text-[11px]">
                        <p className="font-medium text-slate-800">
                          {ord.deliveryMethod === 'local_own' ? 'Local Own Fleet' : 'Courier Partner'}
                        </p>
                        {ord.courierPartner && (
                          <p className="text-slate-500 text-[10px]">{ord.courierPartner}</p>
                        )}
                        {ord.trackingNumber ? (
                          ord.trackingUrl ? (
                            <a
                              href={ord.trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-purple-700 hover:underline flex items-center gap-1 text-[10px] mt-0.5"
                            >
                              <span>{ord.trackingNumber}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className="font-mono text-slate-600 text-[10px] block mt-0.5">
                              {ord.trackingNumber}
                            </span>
                          )
                        ) : ord.deliveryPersonName ? (
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Rider: {ord.deliveryPersonName} ({ord.deliveryPersonPhone})
                          </p>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Pending assignment</span>
                        )}
                      </td>

                      {/* 7. Milestone Status & Cancellation Info */}
                      <td className="py-4 px-5">
                        {isCancelled ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold">
                              <XCircle className="w-3 h-3 text-rose-600" /> Cancelled
                            </span>
                            {cancelReason && (
                              <p
                                className="text-[10px] text-rose-700 bg-rose-50 p-1.5 rounded-lg border border-rose-200 line-clamp-2 max-w-[180px]"
                                title={cancelReason}
                              >
                                <strong>Reason:</strong> {cancelReason}
                              </p>
                            )}
                            {cancelledDt.date !== '-' && (
                              <p className="text-[9px] text-rose-500">
                                {cancelledDt.date} {cancelledDt.time}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                            {ord.orderStatus || ord.status || 'Order Confirmed'}
                          </span>
                        )}
                      </td>

                      {/* 8. Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openStatusModal(ord)}
                            className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1 transition-colors"
                            title="Update Status & Tracking"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Update</span>
                          </button>
                          <Link
                            href={`/admin/orders/${ord.id}`}
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                            title="View Full Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <a
                            href={`/api/orders/${ord.id}/invoice`}
                            download
                            title="Download Tax Invoice PDF"
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPDATE STATUS MODAL */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  Update Order #{activeOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Customer: <strong>{activeOrder.customerName}</strong> ({activeOrder.customerPhone})
                </p>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Select Order Milestone *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-semibold text-slate-800"
                >
                  <option value="paid">Order Confirmed</option>
                  <option value="making">Making Your Crochet Product</option>
                  <option value="packed">Packed &amp; Ready</option>
                  <option value="shipped">Shipped</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered to Customer</option>
                  <option value="cancelled">Cancelled (Restock Items)</option>
                </select>
              </div>

              {/* Courier & Tracking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Courier Partner</label>
                  <input
                    type="text"
                    value={courierPartner}
                    onChange={(e) => setCourierPartner(e.target.value)}
                    placeholder="e.g. BlueDart, DTDC, India Post"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. BLU-987654321"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tracking Link URL</label>
                <input
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://track.bluedart.com/..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* Delivery Person (Local Fleet) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Delivery Person Name</label>
                  <input
                    type="text"
                    value={deliveryPersonName}
                    onChange={(e) => setDeliveryPersonName(e.target.value)}
                    placeholder="Rider / Partner Name"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Delivery Person Phone</label>
                  <input
                    type="tel"
                    value={deliveryPersonPhone}
                    onChange={(e) => setDeliveryPersonPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Status Note / Log Entry
                </label>
                <textarea
                  rows={2}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Optional log entry for order history..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {newStatus === 'cancelled' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    Cancelling this order will restock items to inventory and record this milestone in the audit log.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveOrder(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-xs transition-colors flex items-center gap-2"
                >
                  {updating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating...
                    </>
                  ) : (
                    'Save & Update Milestone'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

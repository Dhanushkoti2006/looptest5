'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  ShieldCheck,
  CheckCircle,
  Download,
  ExternalLink,
  RefreshCw,
  Clock,
  UserCheck,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  ChevronRight,
} from 'lucide-react';

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  createdAt: string;
  updatedAt?: string;
  orderCount: number;
  totalSpend: number;
  lastOrderDate: string | null;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'customer' | 'admin'>('ALL');
  const [sortBy, setSortBy] = useState<'orders' | 'spend' | 'date' | 'name'>('orders');

  const fetchCustomerData = () => {
    setLoading(true);
    fetch('/api/customers', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.customers && Array.isArray(data.customers)) {
          setCustomers(data.customers);
        }
      })
      .catch((err) => console.error('Error fetching customer CRM directory:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  // Filter & Sort
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = customers.filter((c) => {
      const matchesSearch =
        !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q);

      const matchesRole = roleFilter === 'ALL' || c.role === roleFilter;

      return matchesSearch && matchesRole;
    });

    return result.sort((a, b) => {
      if (sortBy === 'orders') return (b.orderCount || 0) - (a.orderCount || 0);
      if (sortBy === 'spend') return (b.totalSpend || 0) - (a.totalSpend || 0);
      if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [customers, search, roleFilter, sortBy]);

  // CSV Export
  const exportCustomersCSV = () => {
    if (filtered.length === 0) {
      alert('No customer records to export.');
      return;
    }

    const headers = [
      'Customer ID',
      'Full Name',
      'Email',
      'Phone',
      'Role',
      'Registered Date',
      'Total Orders Placed',
      'Total Lifetime Spend (INR)',
      'Last Order Date',
    ];

    const rows = filtered.map((c) => [
      c.id,
      c.name,
      c.email,
      c.phone,
      c.role,
      new Date(c.createdAt).toLocaleDateString('en-IN'),
      c.orderCount,
      c.totalSpend,
      c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-IN') : 'None',
    ]);

    const csvContent = [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LoopAndLove-Customers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics
  const totalCustomers = customers.length;
  const activeShoppers = customers.filter((c) => c.orderCount > 0).length;
  const totalCustomerSpend = customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
  const repeatBuyers = customers.filter((c) => c.orderCount > 1).length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-purple-700" /> Customer Profiles &amp; Order Volume
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered customer accounts in Supabase with calculated order frequency and lifetime customer value.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchCustomerData}
            className="p-2.5 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-2xs transition-colors"
            title="Refresh Directory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={exportCustomersCSV}
            className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Customers CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Registered</p>
          <p className="text-2xl font-serif font-bold text-slate-900 mt-1">{totalCustomers}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Active Buyers</p>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-1">{activeShoppers}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Repeat Customers</p>
          <p className="text-2xl font-serif font-bold text-purple-800 mt-1">{repeatBuyers}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Total Customer Spend</p>
          <p className="text-2xl font-serif font-bold text-slate-900 mt-1">
            ₹{totalCustomerSpend.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* FILTER & SORT BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="ALL">All Roles ({customers.length})</option>
              <option value="customer">Customers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="orders">Most Orders</option>
              <option value="spend">Highest Spend</option>
              <option value="date">Recently Joined</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* CUSTOMERS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
            <span>Loading customer profiles from Supabase...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-sm text-slate-700">No matching customers found</p>
            <p className="text-slate-400">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Customer Profile</th>
                  <th className="py-3 px-6">Contact Info</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6 text-center">Orders Count</th>
                  <th className="py-3 px-6 text-right">Lifetime Spend</th>
                  <th className="py-3 px-6">Joined Date</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Customer Profile */}
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0">
                        {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{c.name || 'Customer'}</p>
                        <p className="font-mono text-[10px] text-slate-400">ID: {c.id.slice(0, 8)}...</p>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-4 px-6">
                      {c.phone && (
                        <a
                          href={`tel:${c.phone}`}
                          className="flex items-center gap-1.5 text-slate-600 hover:text-purple-700 font-medium"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </a>
                      )}
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="flex items-center gap-1.5 text-slate-400 hover:text-purple-700 text-[11px] mt-0.5 truncate max-w-[180px]"
                          title={c.email}
                        >
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </a>
                      )}
                    </td>

                    {/* Role */}
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.role === 'admin' ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-purple-700" /> Admin
                          </>
                        ) : (
                          'Customer'
                        )}
                      </span>
                    </td>

                    {/* Order Count */}
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold ${
                          c.orderCount > 0
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        {c.orderCount} {c.orderCount === 1 ? 'order' : 'orders'}
                      </span>
                    </td>

                    {/* Lifetime Spend */}
                    <td className="py-4 px-6 text-right font-bold text-slate-900 font-mono">
                      ₹{c.totalSpend.toLocaleString('en-IN')}
                    </td>

                    {/* Joined Date */}
                    <td className="py-4 px-6 text-slate-500 text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      {c.orderCount > 0 ? (
                        <Link
                          href={`/admin/orders?search=${encodeURIComponent(c.name || c.phone)}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-colors"
                        >
                          <span>Orders</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-300 italic">No orders</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

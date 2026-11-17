'use client';

import React, { useState, useEffect } from 'react';
import { User, Order } from '@/lib/types';
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
} from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);

  const fetchCustomerData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/analytics?table=users').then((r) => r.json()),
      fetch('/api/orders').then((r) => r.json()),
    ])
      .then(([usersData, ordersData]) => {
        if (usersData.records) {
          setCustomers(usersData.records);
        }
        if (ordersData.orders) {
          setOrders(ordersData.orders);
        }
      })
      .catch((err) => console.error('Error fetching customer CRM data:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  });

  const getCustomerOrders = (userId: string) => {
    return orders.filter((o) => o.userId === userId);
  };

  const getCustomerTotalSpend = (userId: string) => {
    return getCustomerOrders(userId)
      .filter((o) => o.paymentStatus === 'SUCCESS')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  };

  const exportCustomersJSON = () => {
    const blob = new Blob([JSON.stringify(customers, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LoopAndLove-Customers-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-purple-700" /> Customer Relationship Management (CRM)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time customer directory, verified contacts, account activity, and lifetime order history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCustomerData}
            className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-2xs"
            title="Refresh Directory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={exportCustomersJSON}
            className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" /> Export Customers JSON
          </button>
        </div>
      </div>

      {/* METRICS SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Registered Profiles</span>
          <p className="text-2xl font-serif font-bold text-slate-900 mt-1">{customers.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Shopper Accounts</span>
          <p className="text-2xl font-serif font-bold text-purple-700 mt-1">
            {customers.filter((c) => c.role === 'CUSTOMER').length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Admin Accounts</span>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-1">
            {customers.filter((c) => c.role !== 'CUSTOMER').length}
          </p>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search customer by name, email, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* CUSTOMER DIRECTORY TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Contact Details</th>
                <th className="py-3 px-6">Account Role</th>
                <th className="py-3 px-6">Total Orders</th>
                <th className="py-3 px-6">Lifetime Spend</th>
                <th className="py-3 px-6">Registered Date</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => {
                const userOrders = getCustomerOrders(cust.id);
                const spend = getCustomerTotalSpend(cust.id);

                return (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0">
                          {cust.name.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{cust.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">ID: {cust.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{cust.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{cust.phone}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          cust.role === 'SUPER_ADMIN' || cust.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {cust.role}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-bold text-slate-900">
                      {userOrders.length} orders
                    </td>

                    <td className="py-4 px-6 font-bold text-slate-900">
                      ₹{spend.toLocaleString('en-IN')}
                    </td>

                    <td className="py-4 px-6 text-slate-500">
                      {new Date(cust.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-purple-700 font-semibold text-xs transition-colors"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER DETAIL MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-700 text-white font-bold flex items-center justify-center">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedCustomer.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Phone Number</span>
                <span className="font-bold text-slate-800">{selectedCustomer.phone}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Account Role</span>
                <span className="font-bold text-slate-800">{selectedCustomer.role}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Verified Email</span>
                <span className="font-bold text-emerald-600">
                  {selectedCustomer.isEmailVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Verified Phone</span>
                <span className="font-bold text-emerald-600">
                  {selectedCustomer.isPhoneVerified ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs text-slate-900">Order History ({getCustomerOrders(selectedCustomer.id).length})</h4>
              {getCustomerOrders(selectedCustomer.id).length === 0 ? (
                <p className="text-xs text-slate-400">No orders placed yet by this customer.</p>
              ) : (
                <div className="space-y-2">
                  {getCustomerOrders(selectedCustomer.id).map((ord) => (
                    <div key={ord.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">Order #{ord.orderNumber}</p>
                        <p className="text-[11px] text-slate-400">{new Date(ord.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">₹{ord.totalAmount}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          {ord.orderStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2.5 rounded-xl bg-purple-700 text-white font-bold text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

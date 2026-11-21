'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/lib/types';
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
} from 'lucide-react';

const ALL_STATUSES: OrderStatus[] = [
  'Order Placed',
  'Payment Verified',
  'Order Confirmed',
  'Processing',
  'Making Your Crochet Product',
  'Quality Check',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Status update modal
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('Making Your Crochet Product');
  const [statusNote, setStatusNote] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierPartner, setCourierPartner] = useState('BlueDart Express');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [deliveryPersonName, setDeliveryPersonName] = useState('');
  const [deliveryPersonPhone, setDeliveryPersonPhone] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = () => {
    setLoading(true);
    fetch('/api/orders', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openStatusModal = (ord: any) => {
    setActiveOrder(ord);
    setNewStatus(ord.orderStatus || ord.status || 'Making Your Crochet Product');
    setStatusNote('');
    setTrackingNumber(ord.trackingNumber || ord.tracking_number || '');
    setCourierPartner(ord.courierPartner || ord.courier_name || 'BlueDart Express');
    setTrackingUrl(ord.trackingUrl || ord.tracking_url || '');
    setDeliveryPersonName(ord.deliveryPersonName || ord.delivery_person_name || '');
    setDeliveryPersonPhone(ord.deliveryPersonPhone || ord.delivery_person_phone || '');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    setUpdating(true);
    await fetch('/api/orders', {
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
    setUpdating(false);
    setActiveOrder(null);
    fetchOrders();
  };

  const exportToCSV = () => {
    if (orders.length === 0) return;
    const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'Email', 'Items', 'Total Amount', 'Payment Status', 'Order Status', 'Tracking Number'];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString('en-IN'),
      o.customerName,
      o.customerPhone,
      o.customerEmail,
      o.items.map((i) => `${i.quantity}x ${i.productName}`).join('; '),
      o.totalAmount,
      o.paymentStatus,
      o.orderStatus,
      o.trackingNumber || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LoopAndLove-Orders-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q);
    const matchesStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* HEADER & CSV EXPORT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
            Order Fulfillment & Tracking Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Update crafting stages, add shipping tracking numbers, and issue invoices.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" /> Export Orders to CSV
        </button>
      </div>

      {/* SEARCH & STATUS FILTER */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by Order ID, Customer Name, or Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Statuses ({orders.length})</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ORDERS LIST TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-6">Order ID & Date</th>
                <th className="py-3 px-6">Customer & Phone</th>
                <th className="py-3 px-6">Products</th>
                <th className="py-3 px-6">Total Paid</th>
                <th className="py-3 px-6">Milestone Status</th>
                <th className="py-3 px-6">Tracking Number</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-900">#{ord.orderNumber}</p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </td>

                  <td className="py-4 px-6">
                    <p className="font-semibold text-slate-900">{ord.customerName}</p>
                    <p className="text-[11px] text-slate-400">{ord.customerPhone}</p>
                  </td>

                  <td className="py-4 px-6">
                    <div className="space-y-0.5">
                      {ord.items.map((i) => (
                        <p key={i.id} className="line-clamp-1">
                          {i.quantity}x {i.productName} ({i.color})
                        </p>
                      ))}
                    </div>
                  </td>

                  <td className="py-4 px-6 font-bold text-slate-900">
                    ₹{ord.totalAmount.toLocaleString('en-IN')}
                    <span className="text-[10px] text-emerald-700 block font-normal">
                      {ord.paymentStatus}
                    </span>
                  </td>

                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                      {ord.orderStatus}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-[11px] font-mono text-slate-600">
                    {ord.trackingNumber || <span className="text-slate-300">Not assigned</span>}
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openStatusModal(ord)}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs"
                      >
                        Update
                      </button>
                      <a
                        href={`/api/orders/invoice?id=${ord.id}`}
                        download
                        title="Download Tax Invoice"
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPDATE STATUS MODAL */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  Update Order #{activeOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500">Customer: {activeOrder.customerName}</p>
              </div>
              <button onClick={() => setActiveOrder(null)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Order Milestone *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 font-semibold"
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Milestone Progress Note</label>
                <input
                  type="text"
                  placeholder="e.g. Petals are assembled; packed in gift box with ribbon"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Courier Partner</label>
                  <input
                    type="text"
                    value={courierPartner}
                    onChange={(e) => setCourierPartner(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tracking Number</label>
                  <input
                    type="text"
                    placeholder="e.g. BD9871234IN"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tracking URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* LOCAL DELIVERY PERSON DETAILS (FOR LOCAL HAND DELIVERY) */}
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                <span className="font-bold text-purple-900 block text-[11px]">
                  🛵 Local Delivery Personnel (For Local Hand Delivery)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Delivery Person Name"
                    value={deliveryPersonName}
                    onChange={(e) => setDeliveryPersonName(e.target.value)}
                    className="w-full p-2 bg-white border border-purple-200 rounded-xl text-xs focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Delivery Person Phone"
                    value={deliveryPersonPhone}
                    onChange={(e) => setDeliveryPersonPhone(e.target.value)}
                    className="w-full p-2 bg-white border border-purple-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              {newStatus === 'Cancelled' && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-xl">
                  ⚠️ Note: Marking this order as Cancelled will automatically restock all items back into product inventory.
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveOrder(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold"
                >
                  {updating ? 'Saving...' : 'Save & Notify Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

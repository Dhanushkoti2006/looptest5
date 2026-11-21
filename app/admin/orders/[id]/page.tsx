'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ShoppingBag,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Phone,
  Mail,
  User,
  Package,
  Download,
  ExternalLink,
  Edit2,
  AlertCircle,
  RefreshCw,
  X,
  ShieldCheck,
  CreditCard,
  History,
} from 'lucide-react';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [courierPartner, setCourierPartner] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [deliveryPersonName, setDeliveryPersonName] = useState('');
  const [deliveryPersonPhone, setDeliveryPersonPhone] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrderDetail = () => {
    if (!orderId) return;
    setLoading(true);
    fetch(`/api/orders/${orderId}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.order) {
          setOrder(data.order);
          setNewStatus(data.order.status || 'paid');
          setCourierPartner(data.order.courier_name || data.order.courierPartner || '');
          setTrackingNumber(data.order.tracking_number || data.order.trackingNumber || '');
          setTrackingUrl(data.order.tracking_url || data.order.trackingUrl || '');
          setDeliveryPersonName(data.order.delivery_person_name || data.order.deliveryPersonName || '');
          setDeliveryPersonPhone(data.order.delivery_person_phone || data.order.deliveryPersonPhone || '');
        } else {
          setError(data.message || 'Order not found');
        }
      })
      .catch((err) => {
        console.error('Error fetching order detail:', err);
        setError('Network error loading order.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
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
        setShowStatusModal(false);
        fetchOrderDetail();
      } else {
        alert(data.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order:', err);
      alert('Network error while updating order');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
        <span className="text-xs">Loading order record from Supabase...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold font-serif text-slate-900">Order Record Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'Unable to locate order in Supabase.'}</p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Orders List
        </Link>
      </div>
    );
  }

  const items = order.order_items || order.items || [];
  const statusHistory = order.order_status_history || [];
  const isPaid = order.payment_status === 'paid' || order.paymentStatus === 'SUCCESS';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* TOP NAV BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-slate-900">
                Order #{order.order_number || order.orderNumber || order.id.slice(0, 8)}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
                {order.status || order.orderStatus || 'Confirmed'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Placed on {new Date(order.created_at || order.createdAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStatusModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" /> Update Status &amp; Tracking
          </button>
          <a
            href={`/api/orders/${order.id}/invoice`}
            download
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Tax Invoice PDF
          </a>
        </div>
      </div>

      {/* GRID CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: CUSTOMER & DELIVERY */}
        <div className="space-y-6 lg:col-span-1">
          {/* CUSTOMER CARD */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-700" /> Customer Information
            </h3>
            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-900 text-sm">
                {order.shipping_full_name || order.customerName || 'Customer'}
              </p>
              {(order.shipping_phone || order.customerPhone) && (
                <a
                  href={`tel:${order.shipping_phone || order.customerPhone}`}
                  className="flex items-center gap-2 text-slate-600 hover:text-purple-700"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.shipping_phone || order.customerPhone}</span>
                </a>
              )}
              {(order.customer_email || order.customerEmail) && (
                <a
                  href={`mailto:${order.customer_email || order.customerEmail}`}
                  className="flex items-center gap-2 text-slate-600 hover:text-purple-700"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.customer_email || order.customerEmail}</span>
                </a>
              )}
            </div>
          </div>

          {/* SHIPPING ADDRESS CARD */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-purple-700" /> Delivery Address Snapshot
            </h3>
            <div className="text-xs text-slate-700 leading-relaxed space-y-1">
              <p className="font-semibold text-slate-900">
                {order.shipping_line1 || order.shipping_street_address}
              </p>
              {(order.shipping_line2 || order.shipping_apartment) && (
                <p className="text-slate-600">{order.shipping_line2 || order.shipping_apartment}</p>
              )}
              <p className="font-medium text-slate-800">
                {order.shipping_city}, {order.shipping_state} -{' '}
                <span className="font-bold font-mono text-purple-700">{order.shipping_pincode}</span>
              </p>
            </div>
          </div>

          {/* DISPATCH & LOGISTICS CARD */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-purple-700" /> Logistics &amp; Delivery
            </h3>
            <div className="text-xs space-y-2.5">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Fulfillment Method</span>
                <span className="font-semibold text-slate-800">
                  {order.delivery_method === 'local_own' ? 'Local Own Fleet / Rider' : 'Courier Manual Dispatch'}
                </span>
              </div>
              {(order.courier_name || order.courierPartner) && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Courier Partner</span>
                  <span className="font-medium text-slate-800">{order.courier_name || order.courierPartner}</span>
                </div>
              )}
              {(order.tracking_number || order.trackingNumber) && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tracking Number</span>
                  {(order.tracking_url || order.trackingUrl) ? (
                    <a
                      href={order.tracking_url || order.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-purple-700 hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>{order.tracking_number || order.trackingNumber}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="font-mono text-slate-800 font-bold">
                      {order.tracking_number || order.trackingNumber}
                    </span>
                  )}
                </div>
              )}
              {(order.delivery_person_name || order.deliveryPersonName) && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Delivery Rider</span>
                  <span className="font-medium text-slate-800">
                    {order.delivery_person_name || order.deliveryPersonName} (
                    {order.delivery_person_phone || order.deliveryPersonPhone})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* CUSTOMER NOTE (IF PRESENT) */}
          {order.customer_note && (
            <div className="bg-amber-50 rounded-3xl p-5 border border-amber-200 text-xs text-amber-900 space-y-1">
              <h4 className="font-bold text-[10px] uppercase tracking-wider text-amber-700">Customer Note</h4>
              <p className="leading-relaxed">{order.customer_note}</p>
            </div>
          )}

          {/* CANCELLATION DETAILS (IF CANCELLED) */}
          {order.cancel_reason && (
            <div className="bg-rose-50 rounded-3xl p-5 border border-rose-200 text-xs text-rose-900 space-y-1">
              <h4 className="font-bold text-[10px] uppercase tracking-wider text-rose-700">Cancellation Record</h4>
              <p className="leading-relaxed">
                <strong>Reason:</strong> {order.cancel_reason}
              </p>
              {order.cancelled_at && (
                <p className="text-[10px] text-rose-600 mt-1">
                  Cancelled at: {new Date(order.cancelled_at).toLocaleString('en-IN')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ITEMS, AUDIT TRAIL, AND PAYMENT */}
        <div className="space-y-6 lg:col-span-2">
          {/* ITEMS CARD */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-base text-slate-900">
              Purchased Items ({items.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="pb-3">Product</th>
                    <th className="pb-3 text-center">Unit Price</th>
                    <th className="pb-3 text-center">Qty</th>
                    <th className="pb-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item: any, idx: number) => {
                    const price = Number(item.unit_price || item.unitPrice || 0);
                    const qty = Number(item.quantity || 1);
                    const lineTotal = price * qty;
                    const img = item.image_url || item.imageUrl;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 flex items-center gap-3">
                          {img ? (
                            <img
                              src={img}
                              alt={item.product_name || item.productName}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{item.product_name || item.productName}</p>
                            {item.color && <p className="text-[10px] text-slate-400">Color: {item.color}</p>}
                          </div>
                        </td>
                        <td className="py-3 text-center font-mono">₹{price.toLocaleString('en-IN')}</td>
                        <td className="py-3 text-center font-bold text-purple-700">{qty}</td>
                        <td className="py-3 text-right font-bold font-mono text-slate-900">
                          ₹{lineTotal.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* FINANCIAL SUMMARY */}
            <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono">₹{(Number(order.subtotal) || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery Charges</span>
                <span className="font-mono">
                  {Number(order.delivery_fee || order.deliveryFee) === 0
                    ? 'FREE'
                    : `₹${(Number(order.delivery_fee || order.deliveryFee) || 0).toLocaleString('en-IN')}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Amount Paid</span>
                <span className="font-serif text-base text-purple-700">
                  ₹{(Number(order.total || order.totalAmount) || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* PAYMENT DETAILS */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-purple-700" /> Payment &amp; Gateway Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Status</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold mt-1 ${
                    isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" /> {isPaid ? 'PAID & VERIFIED' : 'PENDING'}
                </span>
              </div>
              {order.razorpay_order_id && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Razorpay Order ID</span>
                  <span className="font-mono text-slate-700 font-semibold">{order.razorpay_order_id}</span>
                </div>
              )}
              {order.razorpay_payment_id && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Razorpay Payment ID</span>
                  <span className="font-mono text-slate-700 font-semibold">{order.razorpay_payment_id}</span>
                </div>
              )}
              {order.razorpay_refund_id && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold text-rose-600">Refund ID</span>
                  <span className="font-mono text-rose-700 font-bold">{order.razorpay_refund_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* STATUS HISTORY TIMELINE AUDIT TRAIL */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-purple-700" /> Milestone Audit Trail &amp; History
            </h3>
            {statusHistory.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No milestone transitions logged yet.</p>
            ) : (
              <div className="space-y-4 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {statusHistory.map((hist: any, index: number) => (
                  <div key={index} className="relative text-xs">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-purple-600 border-2 border-white ring-2 ring-purple-100" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 capitalize">
                        {hist.status?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(hist.created_at).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    {hist.notes && <p className="text-slate-500 mt-0.5 text-[11px]">{hist.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* UPDATE STATUS MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  Update Order #{order.order_number || order.orderNumber}
                </h3>
                <p className="text-xs text-slate-500">Advance crafting stage or dispatch status</p>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
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
                    placeholder="e.g. BlueDart, DTDC"
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
                  Status Change Audit Note
                </label>
                <textarea
                  rows={2}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Reason for change, internal memo, etc."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
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
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Milestone'
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

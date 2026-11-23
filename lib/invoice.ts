import { Order } from './types';
import jsPDF from 'jspdf';
import { siteConfig } from '@/src/config/site';

export function generateInvoicePDF(order: Order): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Colors
  const primaryPlum = '#2E1D36';
  const lilac = '#9D7BB0';
  const grayText = '#666666';

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryPlum);
  doc.text('LOOP & LOVE', 20, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(lilac);
  doc.text('HANDMADE WITH LOVE • ARTISANAL CROCHET BOUTIQUE', 20, 31);

  doc.setFontSize(8);
  doc.setTextColor(grayText);
  doc.text(`${siteConfig.contactEmail} | www.loopandlove.com`, 20, 36);

  // Invoice Title & Meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryPlum);
  doc.text('TAX INVOICE', 140, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayText);
  doc.text(`Invoice No: INV-${order.orderNumber.replace('LL-', '')}`, 140, 31);
  doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 140, 36);
  doc.text(`Order ID: #${order.orderNumber}`, 140, 41);

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(20, 47, 190, 47);

  // Billing & Shipping To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryPlum);
  doc.text('BILLED & DELIVERED TO:', 20, 56);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayText);
  doc.text(order.customerName, 20, 62);
  doc.text(order.customerPhone, 20, 67);
  doc.text(order.customerEmail, 20, 72);
  doc.text(`${order.shippingAddress.street}, ${order.shippingAddress.city}`, 20, 77);
  doc.text(`${order.shippingAddress.state} - ${order.shippingAddress.pincode}`, 20, 82);

  // Payment Meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryPlum);
  doc.text('PAYMENT DETAILS:', 120, 56);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayText);
  doc.text(`Method: ${order.paymentMethod || 'Razorpay Online'}`, 120, 62);
  doc.text(`Payment Status: ${order.paymentStatus}`, 120, 67);
  doc.text(`Transaction Ref: ${order.razorpayPaymentId || 'VERIFIED-ONLINE'}`, 120, 72);

  // Table Header
  const tableY = 92;
  doc.setFillColor(245, 240, 248);
  doc.rect(20, tableY, 170, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryPlum);
  doc.text('Item Description', 24, tableY + 5.5);
  doc.text('Qty', 120, tableY + 5.5);
  doc.text('Unit Price', 140, tableY + 5.5);
  doc.text('Total', 170, tableY + 5.5);

  let currentY = tableY + 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(grayText);

  order.items.forEach((item) => {
    doc.text(`${item.productName} (${item.color || 'Standard'}, ${item.size || 'Standard'})`, 24, currentY);
    doc.text(`${item.quantity}`, 122, currentY);
    doc.text(`Rs. ${item.unitPrice.toFixed(2)}`, 140, currentY);
    doc.text(`Rs. ${(item.quantity * item.unitPrice).toFixed(2)}`, 170, currentY);
    currentY += 8;
  });

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(20, currentY + 2, 190, currentY + 2);
  currentY += 8;

  // Calculation Summary
  doc.setFontSize(9);
  doc.setTextColor(grayText);
  doc.text('Subtotal:', 130, currentY);
  doc.text(`Rs. ${order.subtotal.toFixed(2)}`, 170, currentY);
  currentY += 6;

  if (order.discountAmount > 0) {
    doc.setTextColor('#C94B5E');
    doc.text(`Discount (${order.couponCode || 'Promo'}):`, 130, currentY);
    doc.text(`- Rs. ${order.discountAmount.toFixed(2)}`, 170, currentY);
    currentY += 6;
    doc.setTextColor(grayText);
  }

  doc.text('Handmade Packaging & Shipping:', 130, currentY);
  doc.text(order.shippingCharge === 0 ? 'FREE' : `Rs. ${order.shippingCharge.toFixed(2)}`, 170, currentY);
  currentY += 6;

  doc.text('GST / Taxes (Included):', 130, currentY);
  doc.text(`Rs. ${order.taxAmount.toFixed(2)}`, 170, currentY);
  currentY += 8;

  // Final Total
  doc.setFillColor(245, 240, 248);
  doc.rect(125, currentY - 4, 65, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryPlum);
  doc.text('Final Paid Total:', 130, currentY + 3);
  doc.text(`Rs. ${order.totalAmount.toFixed(2)}`, 166, currentY + 3);

  // Footer notes
  const footerY = 240;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryPlum);
  doc.text('Thank You for Supporting Handmade Crochet Artistry!', 20, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(grayText);
  doc.text('Every stitch in your order was handcrafted with love and care.', 20, footerY + 5);
  doc.text(`For queries, custom requests, or care guides, contact us at ${siteConfig.contactEmail}`, 20, footerY + 9);
  doc.text('Authorized Signatory: Loop & Love Artisans', 140, footerY + 12);

  return doc;
}

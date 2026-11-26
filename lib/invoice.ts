import fs from 'fs';
import path from 'path';
import { Order } from './types';
import jsPDF from 'jspdf';
import { siteConfig } from '@/src/config/site';

function getLogoBase64(): string | null {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'loop-and-love-logo.jpg');
    if (fs.existsSync(logoPath)) {
      const buffer = fs.readFileSync(logoPath);
      return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }
  } catch (err) {
    console.warn('Could not load store logo for invoice:', err);
  }
  return null;
}

export function generateInvoicePDF(order: Order): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Colors
  const primaryPlum = '#2E1D36';
  const lilac = '#9D7BB0';
  const grayText = '#555555';
  const emeraldGreen = '#047857';

  // Store Logo
  const logoData = getLogoBase64();
  const headerTextX = logoData ? 48 : 20;
  if (logoData) {
    try {
      doc.addImage(logoData, 'JPEG', 20, 14, 24, 24);
    } catch (e) {
      console.warn('jsPDF addImage warning:', e);
    }
  }

  // Store Brand Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(primaryPlum);
  doc.text('LOOP & LOVE', headerTextX, 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(lilac);
  doc.text('HANDMADE WITH LOVE • ARTISANAL CROCHET BOUTIQUE', headerTextX, 26.5);

  doc.setFontSize(8);
  doc.setTextColor(grayText);
  doc.text(`Email: ${siteConfig.contactEmail} | Instagram: ${siteConfig.instagramHandle}`, headerTextX, 31.5);
  doc.text(`${siteConfig.location} | Phone: ${siteConfig.phone}`, headerTextX, 36);

  // Invoice Title & Meta (Right Column)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(primaryPlum);
  doc.text('TAX INVOICE', 142, 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(grayText);
  doc.text(`Invoice No: INV-${order.orderNumber.replace('LL-', '')}`, 142, 27);
  doc.text(`Order No: #${order.orderNumber}`, 142, 32);
  doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 142, 37);

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(20, 44, 190, 44);

  // Billing & Shipping To (Left Column)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryPlum);
  doc.text('BILLED & DELIVERED TO:', 20, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(grayText);
  doc.text(`Name: ${order.customerName}`, 20, 58);
  doc.text(`Phone: ${order.customerPhone || 'N/A'}`, 20, 63);
  doc.text(`Email: ${order.customerEmail || 'N/A'}`, 20, 68);

  const addrLine1 = [order.shippingAddress.street, order.shippingAddress.landmark]
    .filter(Boolean)
    .join(', ');
  const addrLines = doc.splitTextToSize(addrLine1 || 'Address on file', 85);
  doc.text(addrLines, 20, 73);
  const afterAddrY = 73 + addrLines.length * 4.5;
  doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`, 20, afterAddrY);

  // Payment & Delivery Details (Right Column)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryPlum);
  doc.text('PAYMENT & DELIVERY DETAILS:', 112, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(grayText);
  doc.text(`Method: ${order.paymentMethod || 'Razorpay Online'}`, 112, 58);

  const isVerifiedPaid = order.paymentStatus === 'SUCCESS';
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isVerifiedPaid ? emeraldGreen : primaryPlum);
  doc.text(`Status: ${isVerifiedPaid ? 'VERIFIED & PAID' : order.paymentStatus}`, 112, 63);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayText);
  doc.text(`Razorpay Txn ID: ${order.razorpayPaymentId || 'VERIFIED-ONLINE'}`, 112, 68);
  if (order.razorpayOrderId) {
    doc.text(`Razorpay Order ID: ${order.razorpayOrderId}`, 112, 73);
  }
  const deliveryLabel =
    order.deliveryMethod === 'local_own'
      ? 'Local Hand Delivery (Chennai)'
      : 'Express Courier (Tamil Nadu)';
  doc.text(`Delivery: ${deliveryLabel}`, 112, order.razorpayOrderId ? 78 : 73);

  // Table Header
  const tableY = Math.max(92, afterAddrY + 10);
  doc.setFillColor(245, 240, 248);
  doc.rect(20, tableY, 170, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryPlum);
  doc.text('Item Description', 24, tableY + 5.5);
  doc.text('Qty', 122, tableY + 5.5);
  doc.text('Unit Price', 140, tableY + 5.5);
  doc.text('Total', 170, tableY + 5.5);

  let currentY = tableY + 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(grayText);

  order.items.forEach((item) => {
    const itemDesc = `${item.productName} (${item.color || 'Standard'}, ${item.size || 'Standard'})`;
    const wrappedDesc = doc.splitTextToSize(itemDesc, 92);
    doc.text(wrappedDesc, 24, currentY);
    doc.text(`${item.quantity}`, 124, currentY);
    doc.text(`Rs. ${item.unitPrice.toFixed(2)}`, 140, currentY);
    doc.text(`Rs. ${(item.quantity * item.unitPrice).toFixed(2)}`, 170, currentY);
    currentY += Math.max(8, wrappedDesc.length * 4.5 + 3);
  });

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(20, currentY + 2, 190, currentY + 2);
  currentY += 8;

  // Calculation Summary
  doc.setFontSize(9);
  doc.setTextColor(grayText);
  doc.text('Subtotal:', 125, currentY);
  doc.text(`Rs. ${order.subtotal.toFixed(2)}`, 168, currentY);
  currentY += 6;

  if (order.discountAmount > 0) {
    doc.setTextColor('#C94B5E');
    doc.text(`Discount (${order.couponCode || 'Promo'}):`, 125, currentY);
    doc.text(`- Rs. ${order.discountAmount.toFixed(2)}`, 168, currentY);
    currentY += 6;
    doc.setTextColor(grayText);
  }

  doc.text('Delivery & Packaging:', 125, currentY);
  doc.text(order.shippingCharge === 0 ? 'FREE' : `Rs. ${order.shippingCharge.toFixed(2)}`, 168, currentY);
  currentY += 6;

  doc.text('GST / Taxes (Included):', 125, currentY);
  doc.text(`Rs. ${order.taxAmount.toFixed(2)}`, 168, currentY);
  currentY += 8;

  // Final Total
  doc.setFillColor(245, 240, 248);
  doc.rect(122, currentY - 4, 68, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryPlum);
  doc.text('Final Paid Total:', 125, currentY + 3);
  doc.text(`Rs. ${order.totalAmount.toFixed(2)}`, 165, currentY + 3);

  // Footer notes
  const footerY = 242;
  doc.setDrawColor(235, 230, 240);
  doc.line(20, footerY - 6, 190, footerY - 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryPlum);
  doc.text('Thank You for Supporting Handmade Crochet Artistry!', 20, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(grayText);
  doc.text('Every stitch in your order was handcrafted with love and care.', 20, footerY + 5);
  doc.text(`Queries or custom orders? Email ${siteConfig.contactEmail} or DM ${siteConfig.instagramHandle}`, 20, footerY + 9.5);
  doc.text('Authorized Signatory: Loop & Love Artisans', 135, footerY + 13);

  return doc;
}

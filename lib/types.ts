export type UserRole = 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  passwordHash?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  productCount?: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  colorName: string;
  colorHex: string;
  sizeName: string;
  priceModifier: number;
  stock: number;
  sku: string;
}

export type ProductStatus = 'AVAILABLE' | 'SOLD_OUT' | 'COMING_SOON' | 'HIDDEN';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  categoryId: string;
  images: string[];
  materials: string;
  dimensions: string;
  stock: number;
  sku: string;
  prepTimeDays: number;
  careInstructions: string;
  tags: string[];
  status: ProductStatus;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  variants: ProductVariant[];
  highlights?: string[];
  customNotice?: string;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  image: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiryDate: string;
  isActive: boolean;
  usageCount: number;
}

export type OrderStatus =
  | 'Order Placed'
  | 'Payment Verified'
  | 'Order Confirmed'
  | 'Processing'
  | 'Making Your Crochet Product'
  | 'Quality Check'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Refund Initiated'
  | 'Refunded';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  image: string;
  color: string;
  size: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. LL-2026-1001
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  shippingAddress: Address;
  subtotal: number;
  shippingCharge: number;
  taxAmount: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  orderStatus: OrderStatus;
  statusHistory: { status: OrderStatus; timestamp: string; note?: string }[];
  trackingNumber?: string;
  courierPartner?: string;
  estimatedDeliveryDate?: string;
  specialInstructions?: string;
  invoiceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomOrderStatus =
  | 'PENDING_REVIEW'
  | 'QUOTED'
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_REJECTED'
  | 'PAYMENT_PENDING'
  | 'PAID_IN_PRODUCTION'
  | 'QUALITY_CHECK'
  | 'COMPLETED'
  | 'CANCELLED';

export interface CustomOrderRequest {
  id: string;
  requestNumber: string; // e.g. COR-2026-101
  userId?: string;
  customerName: string;
  email: string;
  phone: string;
  productType: string;
  description: string;
  preferredColors: string;
  preferredSize: string;
  quantity: number;
  budgetRange: string;
  requiredDeliveryDate: string;
  referenceImages: string[];
  additionalNotes?: string;
  status: CustomOrderStatus;
  adminNotes?: string;
  quotation?: {
    quoteAmount: number;
    estimatedPrepDays: number;
    breakdown: string;
    validUntil: string;
    quotedAt: string;
  };
  associatedOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OTPRecord {
  id: string;
  target: string; // email or phone
  code: string;
  type: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET';
  expiresAt: string;
  attempts: number;
  isUsed: boolean;
  createdAt: string;
}

export interface RestockNotification {
  id: string;
  productId: string;
  email: string;
  phone?: string;
  color?: string;
  createdAt: string;
  isNotified: boolean;
}

export interface NotificationItem {
  id: string;
  userId?: string; // null means for all admins
  type: 'NEW_ORDER' | 'PAYMENT_CONFIRMED' | 'CUSTOM_ORDER' | 'STOCK_ALERT' | 'ORDER_STATUS';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  accentColor?: string;
}

export interface HeroBannerConfig {
  slides: HeroSlide[];
}

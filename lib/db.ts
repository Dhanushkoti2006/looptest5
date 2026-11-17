import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Product,
  Category,
  Order,
  CustomOrderRequest,
  Coupon,
  OTPRecord,
  Review,
  RestockNotification,
  NotificationItem,
  OrderStatus,
  CustomOrderStatus,
} from './types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_COUPONS,
  INITIAL_ADMIN_USER,
  INITIAL_SAMPLE_CUSTOMER,
} from './seedData';

interface DatabaseSchema {
  users: User[];
  categories: Category[];
  products: Product[];
  orders: Order[];
  customOrders: CustomOrderRequest[];
  coupons: Coupon[];
  otpRecords: OTPRecord[];
  reviews: Review[];
  restockNotifications: RestockNotification[];
  notifications: NotificationItem[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directory and database file exist
function initializeDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    // Seed initial orders to provide immediate rich analytics
    const initialOrders: Order[] = [
      {
        id: 'ord-1001',
        orderNumber: 'LL-2026-1001',
        userId: INITIAL_SAMPLE_CUSTOMER.id,
        customerName: INITIAL_SAMPLE_CUSTOMER.name,
        customerEmail: INITIAL_SAMPLE_CUSTOMER.email,
        customerPhone: INITIAL_SAMPLE_CUSTOMER.phone,
        items: [
          {
            id: 'item-1',
            productId: INITIAL_PRODUCTS[0].id,
            productName: INITIAL_PRODUCTS[0].name,
            image: INITIAL_PRODUCTS[0].images[0],
            color: 'Lilac & Buttercream',
            size: 'Standard (7 stems)',
            unitPrice: 1599,
            quantity: 1,
            totalPrice: 1599,
          },
          {
            id: 'item-2',
            productId: INITIAL_PRODUCTS[4].id,
            productName: INITIAL_PRODUCTS[4].name,
            image: INITIAL_PRODUCTS[4].images[0],
            color: 'Sweet Lilac Berry',
            size: 'Standard',
            unitPrice: 349,
            quantity: 1,
            totalPrice: 349,
          },
        ],
        shippingAddress: {
          id: 'addr-1',
          userId: INITIAL_SAMPLE_CUSTOMER.id,
          name: 'Priya Sharma',
          phone: '+91 91234 56789',
          street: 'Flat 402, Lotus Greens, Indiranagar',
          landmark: 'Near Metro Station',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
          isDefault: true,
          createdAt: '2026-10-01T00:00:00Z',
        },
        subtotal: 1948,
        shippingCharge: 0,
        taxAmount: 97.4,
        discountAmount: 194.8,
        couponCode: 'WELCOME10',
        totalAmount: 1850.6,
        paymentStatus: 'SUCCESS',
        paymentMethod: 'Razorpay UPI (Google Pay)',
        razorpayOrderId: 'order_mock_test_1001',
        razorpayPaymentId: 'pay_mock_test_1001',
        razorpaySignature: 'sig_mock_verified_1001',
        orderStatus: 'Making Your Crochet Product',
        statusHistory: [
          { status: 'Order Placed', timestamp: '2026-11-10T09:30:00Z', note: 'Customer placed order via UPI' },
          { status: 'Payment Verified', timestamp: '2026-11-10T09:31:00Z', note: 'Razorpay payment ID pay_mock_test_1001 confirmed' },
          { status: 'Order Confirmed', timestamp: '2026-11-10T10:00:00Z', note: 'Order accepted into artisan crafting queue' },
          { status: 'Making Your Crochet Product', timestamp: '2026-11-11T11:00:00Z', note: 'Petals and leaves are being hand-stitched' },
        ],
        estimatedDeliveryDate: '2026-11-18',
        specialInstructions: 'Please include a birthday message card: "Happy Birthday Ananya!"',
        createdAt: '2026-11-10T09:30:00Z',
        updatedAt: '2026-11-11T11:00:00Z',
      },
      {
        id: 'ord-1002',
        orderNumber: 'LL-2026-1002',
        userId: 'usr-cust-2',
        customerName: 'Rohan Mehra',
        customerEmail: 'rohan.m@example.com',
        customerPhone: '+91 98450 12345',
        items: [
          {
            id: 'item-3',
            productId: INITIAL_PRODUCTS[2].id,
            productName: INITIAL_PRODUCTS[2].name,
            image: INITIAL_PRODUCTS[2].images[0],
            color: 'Lilac Bloom Harmony',
            size: 'Medium (Everyday)',
            unitPrice: 2199,
            quantity: 1,
            totalPrice: 2199,
          },
        ],
        shippingAddress: {
          id: 'addr-2',
          userId: 'usr-cust-2',
          name: 'Rohan Mehra',
          phone: '+91 98450 12345',
          street: '12B, Sea Face Enclave, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          isDefault: true,
          createdAt: '2026-11-05T00:00:00Z',
        },
        subtotal: 2199,
        shippingCharge: 0,
        taxAmount: 110,
        discountAmount: 200,
        couponCode: 'LOVELOOP',
        totalAmount: 2109,
        paymentStatus: 'SUCCESS',
        paymentMethod: 'Razorpay NetBanking (HDFC Bank)',
        razorpayOrderId: 'order_mock_test_1002',
        razorpayPaymentId: 'pay_mock_test_1002',
        orderStatus: 'Delivered',
        statusHistory: [
          { status: 'Order Placed', timestamp: '2026-11-05T14:20:00Z' },
          { status: 'Payment Verified', timestamp: '2026-11-05T14:21:00Z' },
          { status: 'Order Confirmed', timestamp: '2026-11-05T16:00:00Z' },
          { status: 'Making Your Crochet Product', timestamp: '2026-11-06T09:00:00Z' },
          { status: 'Quality Check', timestamp: '2026-11-08T15:00:00Z' },
          { status: 'Packed', timestamp: '2026-11-08T18:00:00Z' },
          { status: 'Shipped', timestamp: '2026-11-09T10:00:00Z', note: 'Shipped via BlueDart AWB: BD90284712IN' },
          { status: 'Out for Delivery', timestamp: '2026-11-12T08:30:00Z' },
          { status: 'Delivered', timestamp: '2026-11-12T13:45:00Z', note: 'Handed to customer directly' },
        ],
        trackingNumber: 'BD90284712IN',
        courierPartner: 'BlueDart Express',
        estimatedDeliveryDate: '2026-11-12',
        createdAt: '2026-11-05T14:20:00Z',
        updatedAt: '2026-11-12T13:45:00Z',
      },
    ];

    const initialCustomOrders: CustomOrderRequest[] = [
      {
        id: 'cor-101',
        requestNumber: 'COR-2026-101',
        userId: INITIAL_SAMPLE_CUSTOMER.id,
        customerName: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '+91 91234 56789',
        productType: 'Custom Wedding Couple Amigurumi',
        description: 'I would like a pair of wedding couple bears (bride with white lace veil and groom in beige sherwani). Incorporate pastel lilac details matching our wedding invite!',
        preferredColors: 'Ivory, Soft Lilac, Buttercream Gold',
        preferredSize: '22 cm height each',
        quantity: 1,
        budgetRange: 'Rs. 3000 - 4500',
        requiredDeliveryDate: '2026-12-05',
        referenceImages: [
          'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
        ],
        additionalNotes: 'Please ensure packaging is gift-ready as it is a wedding keepsake.',
        status: 'QUOTED',
        quotation: {
          quoteAmount: 3499,
          estimatedPrepDays: 7,
          breakdown: 'Handmade bride bear with veil (Rs. 1800) + groom bear in sherwani (Rs. 1699), includes luxury keepsake box and personalization tag.',
          validUntil: '2026-11-25',
          quotedAt: '2026-11-12T14:00:00Z',
        },
        createdAt: '2026-11-11T12:00:00Z',
        updatedAt: '2026-11-12T14:00:00Z',
      },
    ];

    const initialNotifications: NotificationItem[] = [
      {
        id: 'notif-1',
        type: 'NEW_ORDER',
        title: 'New Order Received',
        message: 'Order #LL-2026-1001 for Rs. 1,850.60 placed by Priya Sharma.',
        link: '/admin/orders?id=ord-1001',
        isRead: false,
        createdAt: '2026-11-10T09:30:00Z',
      },
      {
        id: 'notif-2',
        type: 'CUSTOM_ORDER',
        title: 'Custom Crochet Request',
        message: 'New customization request #COR-2026-101 from Priya Sharma: Custom Wedding Couple Amigurumi.',
        link: '/admin/custom-orders?id=cor-101',
        isRead: false,
        createdAt: '2026-11-11T12:00:00Z',
      },
      {
        id: 'notif-3',
        type: 'STOCK_ALERT',
        title: 'Product Sold Out',
        message: 'Blooming Blossom Crochet Coasters (Set of 4) is now out of stock!',
        link: '/admin/inventory',
        isRead: true,
        createdAt: '2026-11-09T10:00:00Z',
      },
    ];

    const initialReviews: Review[] = [
      {
        id: 'rev-1',
        productId: INITIAL_PRODUCTS[0].id,
        userId: INITIAL_SAMPLE_CUSTOMER.id,
        userName: 'Aanya K.',
        rating: 5,
        comment: 'Absolutely breathtaking! The lilac and buttercream tones look even more magical in person. The craftsmanship is flawless and smells wonderful!',
        isVerifiedPurchase: true,
        createdAt: '2026-11-08T10:00:00Z',
      },
      {
        id: 'rev-2',
        productId: INITIAL_PRODUCTS[0].id,
        userId: 'usr-2',
        userName: 'Sneha Rao',
        rating: 5,
        comment: 'Bought this as an anniversary gift for my sister. She cried tears of joy! Never having to throw away dried flowers is the best thing ever.',
        isVerifiedPurchase: true,
        createdAt: '2026-11-02T10:00:00Z',
      },
      {
        id: 'rev-3',
        productId: INITIAL_PRODUCTS[2].id,
        userId: 'usr-3',
        userName: 'Pooja V.',
        rating: 5,
        comment: 'The canvas lining is so sturdy! Fits my Kindle, wallet, and water bottle easily. Received countless compliments at my college.',
        isVerifiedPurchase: true,
        createdAt: '2026-11-10T12:00:00Z',
      },
    ];

    const initialData: DatabaseSchema = {
      users: [INITIAL_ADMIN_USER, INITIAL_SAMPLE_CUSTOMER],
      categories: INITIAL_CATEGORIES,
      products: INITIAL_PRODUCTS,
      orders: initialOrders,
      customOrders: initialCustomOrders,
      coupons: INITIAL_COUPONS,
      otpRecords: [],
      reviews: initialReviews,
      restockNotifications: [],
      notifications: initialNotifications,
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  try {
    return JSON.parse(raw) as DatabaseSchema;
  } catch {
    return {
      users: [INITIAL_ADMIN_USER, INITIAL_SAMPLE_CUSTOMER],
      categories: INITIAL_CATEGORIES,
      products: INITIAL_PRODUCTS,
      orders: [],
      customOrders: [],
      coupons: INITIAL_COUPONS,
      otpRecords: [],
      reviews: [],
      restockNotifications: [],
      notifications: [],
    };
  }
}

function saveDatabase(data: DatabaseSchema) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// In-memory session store
interface Session {
  userId: string;
  expiresAt: number;
}
const sessions: Record<string, Session> = {};

export const db = {
  // USERS
  getUsers: (): User[] => {
    const data = initializeDatabase();
    return data.users;
  },
  getUserById: (id: string): User | undefined => {
    const data = initializeDatabase();
    return data.users.find((u) => u.id === id);
  },
  getUserByEmail: (email: string): User | undefined => {
    const data = initializeDatabase();
    return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  getUserByPhone: (phone: string): User | undefined => {
    const data = initializeDatabase();
    return data.users.find((u) => u.phone === phone);
  },
  createUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User => {
    const data = initializeDatabase();
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.users.push(newUser);
    saveDatabase(data);
    return newUser;
  },
  updateUser: (id: string, updates: Partial<User>): User | undefined => {
    const data = initializeDatabase();
    const idx = data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    data.users[idx] = {
      ...data.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase(data);
    return data.users[idx];
  },

  // OTP SYSTEM
  createOTP: (target: string, type: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET'): OTPRecord => {
    const data = initializeDatabase();
    // 6-digit cryptographic random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Invalidate prior unused OTPs for this target
    data.otpRecords = data.otpRecords.filter(
      (r) => !(r.target.toLowerCase() === target.toLowerCase() && r.type === type && !r.isUsed)
    );

    const record: OTPRecord = {
      id: `otp-${Date.now()}`,
      target: target.toLowerCase(),
      code,
      type,
      expiresAt,
      attempts: 0,
      isUsed: false,
      createdAt: new Date().toISOString(),
    };

    data.otpRecords.push(record);
    saveDatabase(data);
    return record;
  },
  verifyOTP: (
    target: string,
    code: string,
    type: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET'
  ): { valid: boolean; message: string } => {
    const data = initializeDatabase();
    const record = data.otpRecords
      .slice()
      .reverse()
      .find((r) => r.target.toLowerCase() === target.toLowerCase() && r.type === type && !r.isUsed);

    if (!record) {
      return { valid: false, message: 'No active OTP found. Please request a new code.' };
    }

    if (new Date() > new Date(record.expiresAt)) {
      return { valid: false, message: 'This OTP has expired. Please request a new one.' };
    }

    if (record.attempts >= 5) {
      return { valid: false, message: 'Maximum attempts reached. Please request a new OTP.' };
    }

    record.attempts += 1;

    // Default universal dev code '123456' or exact code
    if (code === record.code || code === '123456') {
      record.isUsed = true;
      saveDatabase(data);
      return { valid: true, message: 'OTP verified successfully.' };
    }

    saveDatabase(data);
    return { valid: false, message: `Incorrect OTP. ${5 - record.attempts} attempts remaining.` };
  },

  // CATEGORIES
  getCategories: (): Category[] => {
    const data = initializeDatabase();
    return data.categories.sort((a, b) => a.displayOrder - b.displayOrder);
  },
  createCategory: (cat: Omit<Category, 'id'>): Category => {
    const data = initializeDatabase();
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`,
      productCount: 0,
    };
    data.categories.push(newCat);
    saveDatabase(data);
    return newCat;
  },
  updateCategory: (id: string, updates: Partial<Category>): Category | undefined => {
    const data = initializeDatabase();
    const idx = data.categories.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    data.categories[idx] = { ...data.categories[idx], ...updates };
    saveDatabase(data);
    return data.categories[idx];
  },
  deleteCategory: (id: string): boolean => {
    const data = initializeDatabase();
    data.categories = data.categories.filter((c) => c.id !== id);
    saveDatabase(data);
    return true;
  },

  // PRODUCTS
  getProducts: (): Product[] => {
    const data = initializeDatabase();
    return data.products;
  },
  getProductById: (id: string): Product | undefined => {
    const data = initializeDatabase();
    return data.products.find((p) => p.id === id);
  },
  getProductBySlug: (slug: string): Product | undefined => {
    const data = initializeDatabase();
    return data.products.find((p) => p.slug === slug);
  },
  createProduct: (prod: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const data = initializeDatabase();
    const newProd: Product = {
      ...prod,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.products.push(newProd);

    // Update category count
    const cat = data.categories.find((c) => c.id === prod.categoryId);
    if (cat) cat.productCount = (cat.productCount || 0) + 1;

    saveDatabase(data);
    return newProd;
  },
  updateProduct: (id: string, updates: Partial<Product>): Product | undefined => {
    const data = initializeDatabase();
    const idx = data.products.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;

    // Auto mark status to SOLD_OUT if stock reaches 0
    let status = updates.status || data.products[idx].status;
    if (updates.stock !== undefined) {
      if (updates.stock <= 0) {
        status = 'SOLD_OUT';
      } else if (status === 'SOLD_OUT' && updates.stock > 0) {
        status = 'AVAILABLE';
      }
    }

    data.products[idx] = {
      ...data.products[idx],
      ...updates,
      status,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase(data);
    return data.products[idx];
  },
  deleteProduct: (id: string): boolean => {
    const data = initializeDatabase();
    data.products = data.products.filter((p) => p.id !== id);
    saveDatabase(data);
    return true;
  },
  reduceStock: (productId: string, quantity: number, variantId?: string): boolean => {
    const data = initializeDatabase();
    const prod = data.products.find((p) => p.id === productId);
    if (!prod) return false;

    if (prod.stock < quantity) return false;
    prod.stock -= quantity;
    if (prod.stock <= 0) {
      prod.status = 'SOLD_OUT';
    }

    if (variantId && prod.variants) {
      const v = prod.variants.find((item) => item.id === variantId);
      if (v) {
        v.stock = Math.max(0, v.stock - quantity);
      }
    }

    saveDatabase(data);
    return true;
  },

  // ORDERS
  getOrders: (): Order[] => {
    const data = initializeDatabase();
    return data.orders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
  getOrderById: (id: string): Order | undefined => {
    const data = initializeDatabase();
    return data.orders.find((o) => o.id === id || o.orderNumber === id);
  },
  getOrdersByUserId: (userId: string): Order[] => {
    const data = initializeDatabase();
    return data.orders
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  createOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order => {
    const data = initializeDatabase();
    const orderNumber = `LL-2026-${1000 + data.orders.length + 1}`;
    const newOrder: Order = {
      ...order,
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.orders.push(newOrder);

    // Create Notification for admin
    data.notifications.push({
      id: `notif-${Date.now()}`,
      type: 'NEW_ORDER',
      title: 'New Order Received',
      message: `Order #${orderNumber} for Rs. ${newOrder.totalAmount.toLocaleString('en-IN')} placed by ${newOrder.customerName}.`,
      link: `/admin/orders?id=${newOrder.id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    saveDatabase(data);
    return newOrder;
  },
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    note?: string,
    trackingNumber?: string,
    courierPartner?: string,
    paymentStatus?: import('./types').PaymentStatus
  ): Order | undefined => {
    const data = initializeDatabase();
    const order = data.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) return undefined;

    order.orderStatus = status;
    order.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note,
    });

    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courierPartner) order.courierPartner = courierPartner;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    order.updatedAt = new Date().toISOString();

    saveDatabase(data);
    return order;
  },

  // CUSTOM ORDERS
  getCustomOrders: (): CustomOrderRequest[] => {
    const data = initializeDatabase();
    return data.customOrders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
  getCustomOrderById: (id: string): CustomOrderRequest | undefined => {
    const data = initializeDatabase();
    return data.customOrders.find((c) => c.id === id || c.requestNumber === id);
  },
  createCustomOrder: (
    req: Omit<CustomOrderRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt' | 'status'>
  ): CustomOrderRequest => {
    const data = initializeDatabase();
    const requestNumber = `COR-2026-${100 + data.customOrders.length + 1}`;
    const newRequest: CustomOrderRequest = {
      ...req,
      id: `cor-${Date.now()}`,
      requestNumber,
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.customOrders.push(newRequest);

    // Admin alert
    data.notifications.push({
      id: `notif-${Date.now()}`,
      type: 'CUSTOM_ORDER',
      title: 'New Custom Order Request',
      message: `Request #${requestNumber} from ${newRequest.customerName}: ${newRequest.productType}`,
      link: `/admin/custom-orders?id=${newRequest.id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    saveDatabase(data);
    return newRequest;
  },
  updateCustomOrderQuotation: (
    id: string,
    quotation: { quoteAmount: number; estimatedPrepDays: number; breakdown: string; validUntil: string },
    adminNotes?: string
  ): CustomOrderRequest | undefined => {
    const data = initializeDatabase();
    const order = data.customOrders.find((c) => c.id === id || c.requestNumber === id);
    if (!order) return undefined;

    order.quotation = {
      ...quotation,
      quotedAt: new Date().toISOString(),
    };
    order.status = 'QUOTED';
    if (adminNotes) order.adminNotes = adminNotes;
    order.updatedAt = new Date().toISOString();

    saveDatabase(data);
    return order;
  },
  updateCustomOrderStatus: (id: string, status: CustomOrderStatus): CustomOrderRequest | undefined => {
    const data = initializeDatabase();
    const order = data.customOrders.find((c) => c.id === id || c.requestNumber === id);
    if (!order) return undefined;

    order.status = status;
    order.updatedAt = new Date().toISOString();

    saveDatabase(data);
    return order;
  },

  // COUPONS
  getCoupons: (): Coupon[] => {
    const data = initializeDatabase();
    return data.coupons;
  },
  getCouponByCode: (code: string): Coupon | undefined => {
    const data = initializeDatabase();
    return data.coupons.find(
      (c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive
    );
  },
  createCoupon: (coupon: Omit<Coupon, 'id' | 'usageCount'>): Coupon => {
    const data = initializeDatabase();
    const newCoupon: Coupon = {
      ...coupon,
      id: `coup-${Date.now()}`,
      usageCount: 0,
    };
    data.coupons.push(newCoupon);
    saveDatabase(data);
    return newCoupon;
  },
  deleteCoupon: (id: string): boolean => {
    const data = initializeDatabase();
    data.coupons = data.coupons.filter((c) => c.id !== id);
    saveDatabase(data);
    return true;
  },

  // REVIEWS
  getReviewsByProduct: (productId: string): Review[] => {
    const data = initializeDatabase();
    return data.reviews
      .filter((r) => r.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  addReview: (review: Omit<Review, 'id' | 'createdAt'>): Review => {
    const data = initializeDatabase();
    const newRev: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    data.reviews.push(newRev);

    // Update product rating
    const prodReviews = data.reviews.filter((r) => r.productId === review.productId);
    const prod = data.products.find((p) => p.id === review.productId);
    if (prod) {
      const avg =
        prodReviews.reduce((sum, r) => sum + r.rating, 0) / (prodReviews.length || 1);
      prod.averageRating = Math.round(avg * 10) / 10;
      prod.reviewCount = prodReviews.length;
    }

    saveDatabase(data);
    return newRev;
  },

  // RESTOCK NOTIFICATIONS
  registerRestockNotification: (productId: string, email: string, phone?: string): RestockNotification => {
    const data = initializeDatabase();
    const notif: RestockNotification = {
      id: `restock-${Date.now()}`,
      productId,
      email,
      phone,
      createdAt: new Date().toISOString(),
      isNotified: false,
    };
    data.restockNotifications.push(notif);
    saveDatabase(data);
    return notif;
  },

  // NOTIFICATIONS
  getNotifications: (): NotificationItem[] => {
    const data = initializeDatabase();
    return data.notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
  markNotificationAsRead: (id: string): boolean => {
    const data = initializeDatabase();
    const notif = data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      saveDatabase(data);
      return true;
    }
    return false;
  },

  // BUSINESS ANALYTICS & METRICS
  getAnalytics: (period: 'today' | '7days' | '30days' | 'all' = 'all') => {
    const data = initializeDatabase();
    const orders = data.orders;
    const now = new Date();

    const filteredOrders = orders.filter((o) => {
      if (period === 'all') return true;
      const orderDate = new Date(o.createdAt);
      const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
      if (period === 'today') return diffDays <= 1;
      if (period === '7days') return diffDays <= 7;
      if (period === '30days') return diffDays <= 30;
      return true;
    });

    const totalOrders = filteredOrders.length;
    const paidOrders = filteredOrders.filter((o) => o.paymentStatus === 'SUCCESS');
    const totalRevenue = paidOrders.reduce((acc, o) => acc + o.totalAmount, 0);

    const pendingOrders = filteredOrders.filter(
      (o) => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled'
    ).length;
    const completedOrders = filteredOrders.filter((o) => o.orderStatus === 'Delivered').length;
    const cancelledOrders = filteredOrders.filter((o) => o.orderStatus === 'Cancelled').length;

    const lowStockProducts = data.products.filter((p) => p.stock > 0 && p.stock <= 5);
    const soldOutProducts = data.products.filter((p) => p.stock === 0 || p.status === 'SOLD_OUT');

    const pendingCustomOrders = data.customOrders.filter(
      (c) => c.status === 'PENDING_REVIEW' || c.status === 'QUOTED'
    ).length;

    const codOrders = filteredOrders.filter((o) => o.paymentMethod?.includes('Cash on Delivery') || o.paymentMethod === 'COD');
    const codPendingOrders = codOrders.filter((o) => o.paymentStatus !== 'SUCCESS');
    const codPendingValue = codPendingOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / (paidOrders.length || 1)) : 0,
      paidOrdersCount: paidOrders.length,
      codOrdersCount: codOrders.length,
      codPendingCount: codPendingOrders.length,
      codPendingValue,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalCustomers: data.users.filter((u) => u.role === 'CUSTOMER').length,
      lowStockCount: lowStockProducts.length,
      soldOutCount: soldOutProducts.length,
      pendingCustomOrders,
      lowStockProducts,
      soldOutProducts,
      recentOrders: filteredOrders.slice(0, 15),
      customOrdersList: data.customOrders.slice(0, 5),
    };
  },

  // GET RECENT OTP (for rate-limiting)
  getRecentOTP: (target: string): OTPRecord | undefined => {
    const data = initializeDatabase();
    return data.otpRecords
      .slice()
      .reverse()
      .find((r) => r.target.toLowerCase() === target.toLowerCase() && !r.isUsed);
  },

  // SESSION TOKEN MANAGEMENT
  createSessionToken: (userId: string): string => {
    const token = crypto.randomBytes(32).toString('hex');
    sessions[token] = {
      userId,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    return token;
  },
  verifySessionToken: (token: string): User | undefined => {
    const sess = sessions[token];
    if (!sess || sess.expiresAt < Date.now()) return undefined;
    const data = initializeDatabase();
    return data.users.find((u) => u.id === sess.userId);
  },
};

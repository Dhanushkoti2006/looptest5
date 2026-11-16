// lib/db.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';               // <‑‑ add this import
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

/* -----------------------------------------------------------------
   In‑memory session store
   ----------------------------------------------------------------- */
interface Session {
  userId: string;
  expiresAt: number;   // epoch ms
}
const sessions: Record<string, Session> = {};

/**
 * Generate a random opaque token string.
 * (In a real app you’d replace this with JWT or a proper auth service.)
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a session token for the given user id and store it.
 * Token lives for 1 week (same as the cookie maxAge set in the OTP route).
 */
function createSessionToken(userId: string): string {
  const token = generateToken();
  sessions[token] = {
    userId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week
  };
  return token;
}

/**
 * Validate a token and return the associated user (or undefined if invalid/expired).
 */
function verifySessionToken(token: string): User | undefined {
  const sess = sessions[token];
  if (!sess || sess.expiresAt < Date.now()) return undefined;
  return getUserById(sess.userId);
}

/* -----------------------------------------------------------------
   Existing DB implementation (unchanged)
   ----------------------------------------------------------------- */
// … (all of the code you already have, up to the export
//  at the bottom)

export const db = {
  // … existing methods …
  getUsers,
  getUserById,
  getUserByEmail,
  getUserByPhone,
  createUser,
  // … other CRUD helpers …
  createSessionToken,   // <-- expose it
  verifySessionToken,   // <-- optional, useful for protected routes
};
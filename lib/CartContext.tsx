'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CartItem, Product, Coupon } from './types';
import { useAuth } from './AuthContext';
import { createClient } from './supabase/client';

interface CartContextType {
  cart: CartItem[];
  wishlist: string[];
  coupon: Coupon | null;
  discountAmount: number;
  subtotal: number;
  shippingCharge: number;
  taxAmount: number;
  totalAmount: number;
  addToCart: (product: Product, color?: string, size?: string, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [supabaseCartId, setSupabaseCartId] = useState<string | null>(null);

  const initialLoadDone = useRef(false);

  // 1. Initial Load from localStorage (runs once on client mount)
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('loop_and_love_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedWishlist = localStorage.getItem('loop_and_love_wishlist');
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    } catch (e) {
      console.warn('Could not load cart/wishlist from local storage:', e);
    } finally {
      initialLoadDone.current = true;
    }
  }, []);

  // 2. Persist to localStorage whenever cart/wishlist changes
  useEffect(() => {
    if (!initialLoadDone.current) return;
    try {
      localStorage.setItem('loop_and_love_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    try {
      localStorage.setItem('loop_and_love_wishlist', JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  // 3. Sync with Supabase on user login
  useEffect(() => {
    if (!user) {
      setSupabaseCartId(null);
      return;
    }

    const syncWithSupabase = async () => {
      try {
        const supabase = createClient();

        // 3a. Get or create user's cart in Supabase
        let { data: existingCart } = await (supabase.from('carts') as any)
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!existingCart) {
          const { data: createdCart, error: createCartErr } = await (supabase.from('carts') as any)
            .insert({ user_id: user.id })
            .select('id')
            .single();

          if (!createCartErr && createdCart) {
            existingCart = createdCart;
          }
        }

        if (existingCart) {
          setSupabaseCartId(existingCart.id);

          // 3b. Fetch current items in Supabase cart
          const { data: remoteItems } = await (supabase.from('cart_items') as any)
            .select(`
              id,
              quantity,
              product_id,
              products (
                *,
                product_images (image_url, display_order)
              )
            `)
            .eq('cart_id', existingCart.id);

          // Format remote items
          const formattedRemoteItems: CartItem[] = (remoteItems || [])
            .filter((item: any) => item.products)
            .map((item: any) => {
              const p = item.products;
              const img = p.product_images?.[0]?.image_url || '/images/photo-coming-soon.svg';
              const price = Number(p.discount_price || p.price);
              return {
                id: item.id,
                productId: p.id,
                productName: p.name,
                productSlug: p.slug,
                image: img,
                color: 'Standard',
                size: 'Standard',
                price,
                quantity: item.quantity,
                maxStock: p.stock,
                isMadeToOrder: Boolean(p.is_made_to_order),
              };
            });

          // 3c. Merge local items with remote items
          const mergedCart = [...formattedRemoteItems];
          const localCart = cart;

          for (const localItem of localCart) {
            const existsInRemote = mergedCart.find((r) => r.productId === localItem.productId);
            if (!existsInRemote) {
              mergedCart.push(localItem);
              // Save local item to Supabase
              await (supabase.from('cart_items') as any).upsert({
                cart_id: existingCart.id,
                product_id: localItem.productId,
                quantity: localItem.quantity,
              });
            }
          }

          if (mergedCart.length > 0) {
            setCart(mergedCart);
          }

          // 3d. Sync Wishlist from Supabase
          const { data: remoteWishlist } = await (supabase.from('wishlist') as any)
            .select('product_id')
            .eq('user_id', user.id);

          if (remoteWishlist && Array.isArray(remoteWishlist)) {
            const remoteIds = remoteWishlist.map((w: any) => w.product_id);
            setWishlist((prev) => Array.from(new Set([...prev, ...remoteIds])));
          }
        }
      } catch (err) {
        console.warn('Supabase cart sync error:', err);
      }
    };

    syncWithSupabase();
  }, [user]);

  const addToCart = async (
    product: Product,
    color?: string,
    size?: string,
    quantity: number = 1
  ) => {
    const selectedColor = color || (product.variants?.[0]?.colorName ?? 'Standard');
    const selectedSize = size || (product.variants?.[0]?.sizeName ?? 'Standard');
    const itemPrice = product.discountPrice || product.price;

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === product.id);

      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = Math.min(
          product.stock,
          updated[existingIdx].quantity + quantity
        );
        updated[existingIdx].quantity = newQty;
        return updated;
      } else {
        const newItem: CartItem = {
          id: `${product.id}-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          image: product.images[0] || '/images/photo-coming-soon.svg',
          color: selectedColor,
          size: selectedSize,
          price: itemPrice,
          quantity: Math.min(product.stock, quantity),
          maxStock: product.stock,
          isMadeToOrder: Boolean(product.isMadeToOrder),
        };
        return [...prev, newItem];
      }
    });

    // Supabase background sync
    if (user && supabaseCartId) {
      try {
        const supabase = createClient();
        await (supabase.from('cart_items') as any).upsert({
          cart_id: supabaseCartId,
          product_id: product.id,
          quantity: quantity,
        });
      } catch (e) {
        console.warn('Could not sync cart item to Supabase:', e);
      }
    }
  };

  const removeFromCart = async (itemId: string) => {
    const itemToRemove = cart.find((i) => i.id === itemId);
    setCart((prev) => prev.filter((item) => item.id !== itemId));

    if (user && supabaseCartId && itemToRemove) {
      try {
        const supabase = createClient();
        await (supabase.from('cart_items') as any)
          .delete()
          .eq('cart_id', supabaseCartId)
          .eq('product_id', itemToRemove.productId);
      } catch (e) {
        console.warn('Could not remove item from Supabase cart:', e);
      }
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const itemToUpdate = cart.find((i) => i.id === itemId);
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.min(item.maxStock, quantity) }
          : item
      )
    );

    if (user && supabaseCartId && itemToUpdate) {
      try {
        const supabase = createClient();
        await (supabase.from('cart_items') as any)
          .update({ quantity: Math.min(itemToUpdate.maxStock, quantity) })
          .eq('cart_id', supabaseCartId)
          .eq('product_id', itemToUpdate.productId);
      } catch (e) {
        console.warn('Could not update quantity in Supabase cart:', e);
      }
    }
  };

  const clearCart = async () => {
    setCart([]);
    setCoupon(null);

    if (user && supabaseCartId) {
      try {
        const supabase = createClient();
        await (supabase.from('cart_items') as any).delete().eq('cart_id', supabaseCartId);
      } catch (e) {
        console.warn('Could not clear Supabase cart:', e);
      }
    }
  };

  const toggleWishlist = async (productId: string) => {
    const isAdding = !wishlist.includes(productId);

    setWishlist((prev) =>
      isAdding ? [...prev, productId] : prev.filter((id) => id !== productId)
    );

    if (user) {
      try {
        const supabase = createClient();
        if (isAdding) {
          await (supabase.from('wishlist') as any).upsert({
            user_id: user.id,
            product_id: productId,
          });
        } else {
          await (supabase.from('wishlist') as any)
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId);
        }
      } catch (e) {
        console.warn('Could not sync wishlist with Supabase:', e);
      }
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Standard shipping charge calculation (Free above Rs. 999)
  const shippingCharge = subtotal >= 999 || subtotal === 0 ? 0 : 99;

  let discountAmount = 0;
  if (coupon && subtotal >= coupon.minOrderValue) {
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(coupon.maxDiscount, discountAmount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }
  }

  // 5% GST on net taxable value
  const taxAmount = Math.round((subtotal - discountAmount) * 0.05 * 100) / 100;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingCharge + taxAmount);

  const applyCoupon = async (code: string) => {
    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.valid && data.coupon) {
        if (subtotal < data.coupon.minOrderValue) {
          return {
            success: false,
            message: `Minimum order value for coupon ${code} is Rs. ${data.coupon.minOrderValue}.`,
          };
        }
        setCoupon(data.coupon);
        return { success: true, message: `Coupon ${code} applied successfully!` };
      }
      return { success: false, message: data.message || 'Invalid or expired coupon code.' };
    } catch {
      return { success: false, message: 'Failed to apply coupon.' };
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        coupon,
        discountAmount,
        subtotal,
        shippingCharge,
        taxAmount,
        totalAmount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

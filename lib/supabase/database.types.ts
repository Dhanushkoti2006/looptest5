export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'customer' | 'admin';
export type DeliveryMethod = 'local_own' | 'courier_manual';
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'making'
  | 'packed'
  | 'out_for_delivery'
  | 'shipped'
  | 'delivered'
  | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type CustomRequestStatus =
  | 'pending'
  | 'quoted'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          phone?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string;
          price: number;
          stock: number;
          is_active: boolean;
          is_featured: boolean;
          materials: string | null;
          dimensions: string | null;
          prep_time_days: number;
          care_instructions: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          slug: string;
          description: string;
          price: number;
          stock?: number;
          is_active?: boolean;
          is_featured?: boolean;
          materials?: string | null;
          dimensions?: string | null;
          prep_time_days?: number;
          care_instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          slug?: string;
          description?: string;
          price?: number;
          stock?: number;
          is_active?: boolean;
          is_featured?: boolean;
          materials?: string | null;
          dimensions?: string | null;
          prep_time_days?: number;
          care_instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          image_url: string;
          alt_text: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          image_url: string;
          alt_text?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          image_url?: string;
          alt_text?: string | null;
          display_order?: number;
          created_at?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string;
          street_address: string;
          apartment: string | null;
          city: string;
          state: string;
          pincode: string;
          is_default: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          phone: string;
          street_address: string;
          apartment?: string | null;
          city: string;
          state: string;
          pincode: string;
          is_default?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          phone?: string;
          street_address?: string;
          apartment?: string | null;
          city?: string;
          state?: string;
          pincode?: string;
          is_default?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      carts: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          product_id: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          product_id?: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      delivery_zones: {
        Row: {
          id: string;
          zone_name: string;
          pincode: string;
          delivery_method: DeliveryMethod;
          delivery_fee: number;
          free_above: number | null;
          estimated_days_min: number;
          estimated_days_max: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          zone_name: string;
          pincode: string;
          delivery_method: DeliveryMethod;
          delivery_fee?: number;
          free_above?: number | null;
          estimated_days_min?: number;
          estimated_days_max?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          zone_name?: string;
          pincode?: string;
          delivery_method?: DeliveryMethod;
          delivery_fee?: number;
          free_above?: number | null;
          estimated_days_min?: number;
          estimated_days_max?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      couriers: {
        Row: {
          id: string;
          name: string;
          tracking_url_template: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          tracking_url_template?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          tracking_url_template?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          status: OrderStatus;
          payment_status: PaymentStatus;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          subtotal: number;
          delivery_fee: number;
          total: number;
          delivery_method: DeliveryMethod;
          shipping_full_name: string;
          shipping_phone: string;
          shipping_street_address: string;
          shipping_apartment: string | null;
          shipping_city: string;
          shipping_state: string;
          shipping_pincode: string;
          customer_note: string | null;
          courier_name: string | null;
          tracking_number: string | null;
          tracking_url: string | null;
          delivery_person_name: string | null;
          delivery_person_phone: string | null;
          estimated_delivery_date: string | null;
          cancel_reason: string | null;
          cancelled_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          user_id?: string | null;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          subtotal: number;
          delivery_fee?: number;
          total: number;
          delivery_method: DeliveryMethod;
          shipping_full_name: string;
          shipping_phone: string;
          shipping_street_address: string;
          shipping_apartment?: string | null;
          shipping_city: string;
          shipping_state: string;
          shipping_pincode: string;
          customer_note?: string | null;
          courier_name?: string | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
          delivery_person_name?: string | null;
          delivery_person_phone?: string | null;
          estimated_delivery_date?: string | null;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          user_id?: string | null;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          subtotal?: number;
          delivery_fee?: number;
          total?: number;
          delivery_method?: DeliveryMethod;
          shipping_full_name?: string;
          shipping_phone?: string;
          shipping_street_address?: string;
          shipping_apartment?: string | null;
          shipping_city?: string;
          shipping_state?: string;
          shipping_pincode?: string;
          customer_note?: string | null;
          courier_name?: string | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
          delivery_person_name?: string | null;
          delivery_person_phone?: string | null;
          estimated_delivery_date?: string | null;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          unit_price: number;
          quantity: number;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          unit_price: number;
          quantity: number;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          unit_price?: number;
          quantity?: number;
          image_url?: string | null;
          created_at?: string;
        };
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: string;
          notes: string | null;
          changed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          status: string;
          notes?: string | null;
          changed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          status?: string;
          notes?: string | null;
          changed_by?: string | null;
          created_at?: string;
        };
      };
      custom_requests: {
        Row: {
          id: string;
          request_number: string;
          user_id: string | null;
          customer_name: string;
          email: string;
          phone: string;
          product_type: string;
          description: string;
          reference_images: Json;
          budget_range: string | null;
          status: CustomRequestStatus;
          admin_notes: string | null;
          quotation_amount: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_number: string;
          user_id?: string | null;
          customer_name: string;
          email: string;
          phone: string;
          product_type: string;
          description: string;
          reference_images?: Json;
          budget_range?: string | null;
          status?: CustomRequestStatus;
          admin_notes?: string | null;
          quotation_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_number?: string;
          user_id?: string | null;
          customer_name?: string;
          email?: string;
          phone?: string;
          product_type?: string;
          description?: string;
          reference_images?: Json;
          budget_range?: string | null;
          status?: CustomRequestStatus;
          admin_notes?: string | null;
          quotation_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string | null;
          rating: number;
          comment: string | null;
          is_approved: boolean;
          is_verified_purchase: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id?: string | null;
          rating: number;
          comment?: string | null;
          is_approved?: boolean;
          is_verified_purchase?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          user_id?: string | null;
          rating?: number;
          comment?: string | null;
          is_approved?: boolean;
          is_verified_purchase?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      wishlist: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          created_at?: string;
        };
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      notify_me_requests: {
        Row: {
          id: string;
          product_id: string;
          email: string;
          is_notified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          email: string;
          is_notified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          email?: string;
          is_notified?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      active_couriers: {
        Row: {
          id: string;
          name: string;
          tracking_url_template: string | null;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      delivery_method: DeliveryMethod;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      custom_request_status: CustomRequestStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Profile = Tables<'profiles'>;
export type Category = Tables<'categories'>;
export type Product = Tables<'products'>;
export type ProductImage = Tables<'product_images'>;
export type Address = Tables<'addresses'>;
export type Cart = Tables<'carts'>;
export type CartItem = Tables<'cart_items'>;
export type DeliveryZone = Tables<'delivery_zones'>;
export type Courier = Tables<'couriers'>;
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type OrderStatusHistory = Tables<'order_status_history'>;
export type CustomRequest = Tables<'custom_requests'>;
export type Review = Tables<'reviews'>;
export type WishlistItem = Tables<'wishlist'>;
export type NewsletterSubscriber = Tables<'newsletter_subscribers'>;
export type NotifyMeRequest = Tables<'notify_me_requests'>;


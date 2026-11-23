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

export interface Database {
  public: {
    Tables: {
      hero_slides: {
        Row: {
          id: string;
          image_url: string;
          title: string;
          subtitle: string;
          button_text: string;
          button_link: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          title: string;
          subtitle?: string;
          button_text?: string;
          button_link?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          image_url?: string;
          title?: string;
          subtitle?: string;
          button_text?: string;
          button_link?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
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
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string;
          price: number;
          discount_price: number | null;
          stock: number;
          is_active: boolean;
          is_featured: boolean;
          materials: string | null;
          dimensions: string | null;
          prep_time_days: number;
          care_instructions: string | null;
          highlights: string[] | null;
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
          discount_price?: number | null;
          stock?: number;
          is_active?: boolean;
          is_featured?: boolean;
          materials?: string | null;
          dimensions?: string | null;
          prep_time_days?: number;
          care_instructions?: string | null;
          highlights?: string[] | null;
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
          discount_price?: number | null;
          stock?: number;
          is_active?: boolean;
          is_featured?: boolean;
          materials?: string | null;
          dimensions?: string | null;
          prep_time_days?: number;
          care_instructions?: string | null;
          highlights?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          image_url: string;
          sort_order: number;
          display_order: number;
          alt_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url?: string;
          image_url?: string;
          sort_order?: number;
          display_order?: number;
          alt_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          image_url?: string;
          sort_order?: number;
          display_order?: number;
          alt_text?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string;
          line1: string;
          line2: string | null;
          street_address: string | null;
          apartment: string | null;
          city: string;
          state: string;
          pincode: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          phone: string;
          line1?: string;
          line2?: string | null;
          street_address?: string | null;
          apartment?: string | null;
          city: string;
          state: string;
          pincode: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          phone?: string;
          line1?: string;
          line2?: string | null;
          street_address?: string | null;
          apartment?: string | null;
          city?: string;
          state?: string;
          pincode?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_id: string;
          quantity: number;
          variant_color: string | null;
          variant_size: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          product_id: string;
          quantity?: number;
          variant_color?: string | null;
          variant_size?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          product_id?: string;
          quantity?: number;
          variant_color?: string | null;
          variant_size?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
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
          razorpay_refund_id: string | null;
          subtotal: number;
          delivery_fee: number;
          total: number;
          delivery_method: DeliveryMethod;
          shipping_full_name: string;
          shipping_phone: string;
          shipping_line1: string;
          shipping_line2: string | null;
          shipping_street_address: string | null;
          shipping_apartment: string | null;
          shipping_city: string;
          shipping_state: string;
          shipping_pincode: string;
          customer_note: string | null;
          cancel_reason: string | null;
          cancelled_at: string | null;
          delivery_person_name: string | null;
          delivery_person_phone: string | null;
          courier_name: string | null;
          tracking_number: string | null;
          tracking_url: string | null;
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
          razorpay_refund_id?: string | null;
          subtotal: number;
          delivery_fee?: number;
          total: number;
          delivery_method?: DeliveryMethod;
          shipping_full_name: string;
          shipping_phone: string;
          shipping_line1?: string;
          shipping_line2?: string | null;
          shipping_street_address?: string | null;
          shipping_apartment?: string | null;
          shipping_city: string;
          shipping_state: string;
          shipping_pincode: string;
          customer_note?: string | null;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          delivery_person_name?: string | null;
          delivery_person_phone?: string | null;
          courier_name?: string | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
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
          razorpay_refund_id?: string | null;
          subtotal?: number;
          delivery_fee?: number;
          total?: number;
          delivery_method?: DeliveryMethod;
          shipping_full_name?: string;
          shipping_phone?: string;
          shipping_line1?: string;
          shipping_line2?: string | null;
          shipping_street_address?: string | null;
          shipping_apartment?: string | null;
          shipping_city?: string;
          shipping_state?: string;
          shipping_pincode?: string;
          customer_note?: string | null;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          delivery_person_name?: string | null;
          delivery_person_phone?: string | null;
          courier_name?: string | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
          quantity?: number;
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
        Relationships: [];
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
        Relationships: [];
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
          status: string;
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
          status?: string;
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
          status?: string;
          admin_notes?: string | null;
          quotation_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      notify_me_requests: {
        Row: {
          id: string;
          product_id: string | null;
          email: string;
          is_notified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          email: string;
          is_notified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          email?: string;
          is_notified?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type ProductRow = Database['public']['Tables']['products']['Row'];
export type ProductImageRow = Database['public']['Tables']['product_images']['Row'];
export type AddressRow = Database['public']['Tables']['addresses']['Row'];
export type OrderRow = Database['public']['Tables']['orders']['Row'];
export type OrderItemRow = Database['public']['Tables']['order_items']['Row'];

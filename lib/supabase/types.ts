export type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | 'PARTIAL';
export type CmsStatus = 'draft' | 'published';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Role;
          full_name: string | null;
          phone: string | null;
          locale: string;
          marketing_opt_in: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: Role;
          full_name?: string | null;
          phone?: string | null;
          locale?: string;
          marketing_opt_in?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: Role;
          full_name?: string | null;
          phone?: string | null;
          locale?: string;
          marketing_opt_in?: boolean;
          updated_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          name: string;
          canton: string;
          street: string | null;
          postal_code: string | null;
          city: string | null;
          timezone: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          canton: string;
          street?: string | null;
          postal_code?: string | null;
          city?: string | null;
          timezone?: string;
          notes?: string | null;
        };
        Update: {
          name?: string;
          canton?: string;
          street?: string | null;
          postal_code?: string | null;
          city?: string | null;
          timezone?: string;
          notes?: string | null;
        };
      };
      services: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          buffer_before_minutes: number;
          buffer_after_minutes: number;
          price_chf: number;
          currency: string;
          cms_status: CmsStatus;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          duration_minutes: number;
          buffer_before_minutes?: number;
          buffer_after_minutes?: number;
          price_chf: number;
          currency?: string;
          cms_status?: CmsStatus;
          is_active?: boolean;
        };
        Update: {
          slug?: string;
          name?: string;
          description?: string | null;
          duration_minutes?: number;
          buffer_before_minutes?: number;
          buffer_after_minutes?: number;
          price_chf?: number;
          currency?: string;
          cms_status?: CmsStatus;
          is_active?: boolean;
        };
      };
      resources: {
        Row: {
          id: string;
          location_id: string;
          name: string;
          capacity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          name: string;
          capacity?: number;
        };
        Update: {
          name?: string;
          capacity?: number;
          location_id?: string;
        };
      };
      service_resources: {
        Row: {
          service_id: string;
          resource_id: string;
          quantity: number;
        };
        Insert: {
          service_id: string;
          resource_id: string;
          quantity?: number;
        };
        Update: {
          quantity?: number;
        };
      };
      staff: {
        Row: {
          id: string;
          location_id: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          calendar_color: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          location_id: string;
          display_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          calendar_color?: string | null;
          active?: boolean;
        };
        Update: {
          location_id?: string;
          display_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          calendar_color?: string | null;
          active?: boolean;
        };
      };
      staff_services: {
        Row: {
          staff_id: string;
          service_id: string;
          duration_minutes: number | null;
          buffer_before_minutes: number | null;
          buffer_after_minutes: number | null;
          price_chf: number | null;
        };
        Insert: {
          staff_id: string;
          service_id: string;
          duration_minutes?: number | null;
          buffer_before_minutes?: number | null;
          buffer_after_minutes?: number | null;
          price_chf?: number | null;
        };
        Update: {
          duration_minutes?: number | null;
          buffer_before_minutes?: number | null;
          buffer_after_minutes?: number | null;
          price_chf?: number | null;
        };
      };
      customers: {
        Row: {
          id: string;
          profile_id: string | null;
          email: string;
          phone: string | null;
          preferred_name: string | null;
          notes: string | null;
          marketing_opt_in: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          email: string;
          phone?: string | null;
          preferred_name?: string | null;
          notes?: string | null;
          marketing_opt_in?: boolean;
        };
        Update: {
          profile_id?: string | null;
          email?: string;
          phone?: string | null;
          preferred_name?: string | null;
          notes?: string | null;
          marketing_opt_in?: boolean;
        };
      };
      availability_blocks: {
        Row: {
          id: string;
          staff_id: string;
          location_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
          capacity_override: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          location_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
          capacity_override?: number | null;
          notes?: string | null;
        };
        Update: {
          start_time?: string;
          end_time?: string;
          weekday?: number;
          capacity_override?: number | null;
          notes?: string | null;
        };
      };
      time_off: {
        Row: {
          id: string;
          staff_id: string;
          start_at: string;
          end_at: string;
          reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          start_at: string;
          end_at: string;
          reason?: string | null;
        };
        Update: {
          start_at?: string;
          end_at?: string;
          reason?: string | null;
        };
      };
      appointments: {
        Row: {
          id: string;
          public_id: string;
          staff_id: string;
          customer_id: string;
          location_id: string;
          service_id: string;
          start_at: string;
          end_at: string;
          appointment_range: unknown;
          status: AppointmentStatus;
          payment_status: PaymentStatus;
          total_amount_chf: number;
          currency: string;
          stripe_checkout_id: string | null;
          stripe_payment_intent_id: string | null;
          sumup_checkout_id: string | null;
          notes: string | null;
          cancellation_reason: string | null;
          metadata: Record<string, unknown>;
          confirmed_at: string | null;
          cancelled_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          public_id: string;
          staff_id: string;
          customer_id: string;
          location_id: string;
          service_id: string;
          start_at: string;
          end_at: string;
          status?: AppointmentStatus;
          payment_status?: PaymentStatus;
          total_amount_chf: number;
          currency?: string;
          stripe_checkout_id?: string | null;
          stripe_payment_intent_id?: string | null;
          sumup_checkout_id?: string | null;
          notes?: string | null;
          cancellation_reason?: string | null;
          metadata?: Record<string, unknown>;
          confirmed_at?: string | null;
          cancelled_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          status?: AppointmentStatus;
          payment_status?: PaymentStatus;
          stripe_checkout_id?: string | null;
          stripe_payment_intent_id?: string | null;
          sumup_checkout_id?: string | null;
          notes?: string | null;
          cancellation_reason?: string | null;
          metadata?: Record<string, unknown>;
          confirmed_at?: string | null;
          cancelled_at?: string | null;
          completed_at?: string | null;
          total_amount_chf?: number;
          start_at?: string;
          end_at?: string;
        };
      };
      appointment_resources: {
        Row: {
          appointment_id: string;
          resource_id: string;
          quantity: number;
        };
        Insert: {
          appointment_id: string;
          resource_id: string;
          quantity?: number;
        };
        Update: {
          quantity?: number;
        };
      };
      invoices: {
        Row: {
          id: string;
          appointment_id: string;
          subtotal_chf: number;
          tax_chf: number;
          total_chf: number;
          status: PaymentStatus;
          stripe_invoice_id: string | null;
          sumup_receipt_id: string | null;
          issued_at: string;
          due_at: string | null;
          paid_at: string | null;
          metadata: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          subtotal_chf: number;
          tax_chf?: number;
          total_chf: number;
          status?: PaymentStatus;
          stripe_invoice_id?: string | null;
          sumup_receipt_id?: string | null;
          issued_at?: string;
          due_at?: string | null;
          paid_at?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: {
          subtotal_chf?: number;
          tax_chf?: number;
          total_chf?: number;
          status?: PaymentStatus;
          stripe_invoice_id?: string | null;
          sumup_receipt_id?: string | null;
          due_at?: string | null;
          paid_at?: string | null;
          metadata?: Record<string, unknown>;
        };
      };
      cms_blocks: {
        Row: {
          id: string;
          slug: string;
          title: string;
          summary: string | null;
          body: Record<string, unknown>;
          status: CmsStatus;
          published_at: string | null;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          summary?: string | null;
          body?: Record<string, unknown>;
          status?: CmsStatus;
          published_at?: string | null;
          locale?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          summary?: string | null;
          body?: Record<string, unknown>;
          status?: CmsStatus;
          published_at?: string | null;
          locale?: string;
        };
      };
      analytics_events: {
        Row: {
          id: number;
          profile_id: string | null;
          event_name: string;
          event_properties: Record<string, unknown>;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          profile_id?: string | null;
          event_name: string;
          event_properties?: Record<string, unknown>;
          occurred_at?: string;
        };
        Update: {
          event_properties?: Record<string, unknown>;
        };
      };
      webhook_logs: {
        Row: {
          id: number;
          provider: string;
          event_id: string;
          event_type: string;
          status: string;
          payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: number;
          provider: string;
          event_id: string;
          event_type: string;
          status: string;
          payload: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          status?: string;
          payload?: Record<string, unknown>;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      role: Role;
      appointment_status: AppointmentStatus;
      payment_status: PaymentStatus;
      cms_status: CmsStatus;
    };
  };
}

export type ProfilesRow = Database['public']['Tables']['profiles']['Row'];
export type ServicesRow = Database['public']['Tables']['services']['Row'];
export type StaffRow = Database['public']['Tables']['staff']['Row'];
export type StaffServicesRow = Database['public']['Tables']['staff_services']['Row'];
export type AvailabilityBlockRow = Database['public']['Tables']['availability_blocks']['Row'];
export type TimeOffRow = Database['public']['Tables']['time_off']['Row'];
export type AppointmentRow = Database['public']['Tables']['appointments']['Row'];
export type ResourceRow = Database['public']['Tables']['resources']['Row'];
export type ServiceResourceRow = Database['public']['Tables']['service_resources']['Row'];
export type AppointmentResourceRow = Database['public']['Tables']['appointment_resources']['Row'];
export type LocationRow = Database['public']['Tables']['locations']['Row'];

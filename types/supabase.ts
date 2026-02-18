export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'customer' | 'organizer' | 'admin'
          phone_number: string | null
          profile_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'customer' | 'organizer' | 'admin'
          phone_number?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'customer' | 'organizer' | 'admin'
          phone_number?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          organizer_id: string
          category: string
          venue_name: string
          venue_address: string
          city: string
          country: string
          start_date: string
          end_date: string | null
          image_url: string | null
          is_public: boolean
          status: 'draft' | 'published' | 'cancelled' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          organizer_id: string
          category: string
          venue_name: string
          venue_address: string
          city: string
          country: string
          start_date: string
          end_date?: string | null
          image_url?: string | null
          is_public?: boolean
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          organizer_id?: string
          category?: string
          venue_name?: string
          venue_address?: string
          city?: string
          country?: string
          start_date?: string
          end_date?: string | null
          image_url?: string | null
          is_public?: boolean
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      ticket_types: {
        Row: {
          id: string
          event_id: string
          name: string
          description: string | null
          price: number
          currency: string
          quantity_total: number
          quantity_available: number
          sales_start_date: string | null
          sales_end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          description?: string | null
          price: number
          currency?: string
          quantity_total: number
          quantity_available: number
          sales_start_date?: string | null
          sales_end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          description?: string | null
          price?: number
          currency?: string
          quantity_total?: number
          quantity_available?: number
          sales_start_date?: string | null
          sales_end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          order_id: string
          event_id: string
          ticket_type_id: string
          user_id: string
          holder_name: string
          holder_email: string
          qr_code: string
          status: 'valid' | 'used' | 'cancelled' | 'expired'
          checked_in_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          event_id: string
          ticket_type_id: string
          user_id: string
          holder_name: string
          holder_email: string
          qr_code: string
          status?: 'valid' | 'used' | 'cancelled' | 'expired'
          checked_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          event_id?: string
          ticket_type_id?: string
          user_id?: string
          holder_name?: string
          holder_email?: string
          qr_code?: string
          status?: 'valid' | 'used' | 'cancelled' | 'expired'
          checked_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          event_id: string
          total_amount: number
          currency: string
          payment_method: 'mpesa' | 'paypal' | 'flutterwave' | 'card'
          payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_reference: string | null
          phone_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          total_amount: number
          currency?: string
          payment_method: 'mpesa' | 'paypal' | 'flutterwave' | 'card'
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_reference?: string | null
          phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          total_amount?: number
          currency?: string
          payment_method?: 'mpesa' | 'paypal' | 'flutterwave' | 'card'
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_reference?: string | null
          phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          event_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'customer' | 'organizer' | 'admin'
      event_status: 'draft' | 'published' | 'cancelled' | 'completed'
      ticket_status: 'valid' | 'used' | 'cancelled' | 'expired'
      payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
      payment_method: 'mpesa' | 'paypal' | 'flutterwave' | 'card'
    }
  }
}

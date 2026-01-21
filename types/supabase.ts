/**
 * Supabase Database Types
 * 
 * This file contains TypeScript types for all database tables.
 * Generated based on the schema used throughout the codebase.
 */

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
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          is_public: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      wishlist_items: {
        Row: {
          id: string
          wishlist_id: string
          product_name: string
          product_url: string | null
          product_price: number | null
          product_image: string | null
          quantity?: number
          priority?: number
          description?: string | null
          category?: string | null
          stock_status?: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          wishlist_id: string
          product_name: string
          product_url?: string | null
          product_price?: number | null
          product_image?: string | null
          quantity?: number
          priority?: number
          description?: string | null
          category?: string | null
          stock_status?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          wishlist_id?: string
          product_name?: string
          product_url?: string | null
          product_price?: number | null
          product_image?: string | null
          quantity?: number
          priority?: number
          description?: string | null
          category?: string | null
          stock_status?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      group_gifts: {
        Row: {
          id: string
          organizer_id: string
          title: string
          target_amount: number
          recipient_name: string | null
          status: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          organizer_id: string
          title: string
          target_amount: number
          recipient_name?: string | null
          status?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          organizer_id?: string
          title?: string
          target_amount?: number
          recipient_name?: string | null
          status?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      contributions: {
        Row: {
          id: string
          wishlist_item_id: string | null
          group_gift_id: string | null
          contributor_id: string
          amount: number
          message: string | null
          role: 'organizer' | 'contributor'
          contributor_name: string | null
          contributor_email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wishlist_item_id?: string | null
          group_gift_id?: string | null
          contributor_id: string
          amount: number
          message?: string | null
          role?: 'organizer' | 'contributor'
          contributor_name?: string | null
          contributor_email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          wishlist_item_id?: string | null
          group_gift_id?: string | null
          contributor_id?: string
          amount?: number
          message?: string | null
          role?: 'organizer' | 'contributor'
          contributor_name?: string | null
          contributor_email?: string | null
          created_at?: string
        }
      }
      share_links: {
        Row: {
          id: string
          token: string
          wishlist_id: string | null
          product_id: string | null
          created_by_user_id: string
          access_level: 'view' | 'contribute'
          expires_at: string | null
          created_at: string
          updated_at: string | null
          view_count: number
          last_viewed_at: string | null
        }
        Insert: {
          id?: string
          token: string
          wishlist_id?: string | null
          product_id?: string | null
          created_by_user_id: string
          access_level?: 'view' | 'contribute'
          expires_at?: string | null
          created_at?: string
          updated_at?: string | null
          view_count?: number
          last_viewed_at?: string | null
        }
        Update: {
          id?: string
          token?: string
          wishlist_id?: string | null
          product_id?: string | null
          created_by_user_id?: string
          access_level?: 'view' | 'contribute'
          expires_at?: string | null
          created_at?: string
          updated_at?: string | null
          view_count?: number
          last_viewed_at?: string | null
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
      [_ in never]: never
    }
  }
}

// Convenience type exports
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Wishlist = Database['public']['Tables']['wishlists']['Row']
export type WishlistItem = Database['public']['Tables']['wishlist_items']['Row']
export type GroupGift = Database['public']['Tables']['group_gifts']['Row']
export type Contribution = Database['public']['Tables']['contributions']['Row']
export type ShareLink = Database['public']['Tables']['share_links']['Row']

export type WishlistInsert = Database['public']['Tables']['wishlists']['Insert']
export type WishlistItemInsert = Database['public']['Tables']['wishlist_items']['Insert']
export type GroupGiftInsert = Database['public']['Tables']['group_gifts']['Insert']
export type ContributionInsert = Database['public']['Tables']['contributions']['Insert']
export type ShareLinkInsert = Database['public']['Tables']['share_links']['Insert']

export type WishlistUpdate = Database['public']['Tables']['wishlists']['Update']
export type WishlistItemUpdate = Database['public']['Tables']['wishlist_items']['Update']
export type GroupGiftUpdate = Database['public']['Tables']['group_gifts']['Update']
export type ContributionUpdate = Database['public']['Tables']['contributions']['Update']
export type ShareLinkUpdate = Database['public']['Tables']['share_links']['Update']

// Share link access levels
export type ShareAccessLevel = 'view' | 'contribute'

// Contributor role types
export type ContributorRole = 'organizer' | 'contributor'


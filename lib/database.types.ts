export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      credential_pg: {
        Row: {
          bazos_bkod: string | null
          bazos_email: string | null
          bazos_name: string | null
          bazos_password: string | null
          bazos_rewrite: boolean | null
          bazos_sk_bkod: string | null
          bazos_top_max: number | null
          budibase_user_id: string | null
          created_at: string | null
          email: string
          facebook_cuser: string | null
          facebook_email: string | null
          facebook_password: string | null
          facebook_xs: string | null
          id: number
          location: string | null
          proxy_ip: string | null
          proxy_ip_sbazar: string | null
          role: string
          sbazar_cookie_ds: string | null
          sbazar_email: string | null
          sbazar_password: string | null
          sbazar_profile: string | null
          status_cz: string | null
          status_sk: string | null
          telephone1: string | null
          telephone2: string | null
          tier: string | null
          user_id: string | null
          zipcode: number | null
          zipcode_sk: string | null
        }
        Insert: {
          bazos_bkod?: string | null
          bazos_email?: string | null
          bazos_name?: string | null
          bazos_password?: string | null
          bazos_rewrite?: boolean | null
          bazos_sk_bkod?: string | null
          bazos_top_max?: number | null
          budibase_user_id?: string | null
          created_at?: string | null
          email: string
          facebook_cuser?: string | null
          facebook_email?: string | null
          facebook_password?: string | null
          facebook_xs?: string | null
          id?: number
          location?: string | null
          proxy_ip?: string | null
          proxy_ip_sbazar?: string | null
          role?: string
          sbazar_cookie_ds?: string | null
          sbazar_email?: string | null
          sbazar_password?: string | null
          sbazar_profile?: string | null
          status_cz?: string | null
          status_sk?: string | null
          telephone1?: string | null
          telephone2?: string | null
          tier?: string | null
          user_id?: string | null
          zipcode?: number | null
          zipcode_sk?: string | null
        }
        Update: {
          bazos_bkod?: string | null
          bazos_email?: string | null
          bazos_name?: string | null
          bazos_password?: string | null
          bazos_rewrite?: boolean | null
          bazos_sk_bkod?: string | null
          bazos_top_max?: number | null
          budibase_user_id?: string | null
          created_at?: string | null
          email?: string
          facebook_cuser?: string | null
          facebook_email?: string | null
          facebook_password?: string | null
          facebook_xs?: string | null
          id?: number
          location?: string | null
          proxy_ip?: string | null
          proxy_ip_sbazar?: string | null
          role?: string
          sbazar_cookie_ds?: string | null
          sbazar_email?: string | null
          sbazar_password?: string | null
          sbazar_profile?: string | null
          status_cz?: string | null
          status_sk?: string | null
          telephone1?: string | null
          telephone2?: string | null
          tier?: string | null
          user_id?: string | null
          zipcode?: number | null
          zipcode_sk?: string | null
        }
        Relationships: []
      }
      offer_detail_pg: {
        Row: {
          "auto id": number
          autorenew: boolean | null
          autorenew_freq: string | null
          bb_email_od: string | null
          bb_marketplace_id: string | null
          bb_offer_id: string | null
          condition: string | null
          date: string | null
          last_date_renewed: string | null
          link: string | null
          next_date_renew: string | null
        }
        Insert: {
          "auto id"?: number
          autorenew?: boolean | null
          autorenew_freq?: string | null
          bb_email_od?: string | null
          bb_marketplace_id?: string | null
          bb_offer_id?: string | null
          condition?: string | null
          date?: string | null
          last_date_renewed?: string | null
          link?: string | null
          next_date_renew?: string | null
        }
        Update: {
          "auto id"?: number
          autorenew?: boolean | null
          autorenew_freq?: string | null
          bb_email_od?: string | null
          bb_marketplace_id?: string | null
          bb_offer_id?: string | null
          condition?: string | null
          date?: string | null
          last_date_renewed?: string | null
          link?: string | null
          next_date_renew?: string | null
        }
        Relationships: []
      }
      offer_pg: {
        Row: {
          "auto id": number
          autorenew_freq: string | null
          autorenewal: boolean | null
          autotop: boolean | null
          bb_email: string | null
          bb_id: string | null
          created_at: string | null
          description: string | null
          eshop_product_id: string | null
          location: string | null
          preview_image: string | null
          price: number | null
          state: string | null
          title: string | null
          zipcode: number | null
        }
        Insert: {
          "auto id"?: number
          autorenew_freq?: string | null
          autorenewal?: boolean | null
          autotop?: boolean | null
          bb_email?: string | null
          bb_id?: string | null
          created_at?: string | null
          description?: string | null
          eshop_product_id?: string | null
          location?: string | null
          preview_image?: string | null
          price?: number | null
          state?: string | null
          title?: string | null
          zipcode?: number | null
        }
        Update: {
          "auto id"?: number
          autorenew_freq?: string | null
          autorenewal?: boolean | null
          autotop?: boolean | null
          bb_email?: string | null
          bb_id?: string | null
          created_at?: string | null
          description?: string | null
          eshop_product_id?: string | null
          location?: string | null
          preview_image?: string | null
          price?: number | null
          state?: string | null
          title?: string | null
          zipcode?: number | null
        }
        Relationships: []
      }
      proxy: {
        Row: {
          bb_email: string | null
          id: number
          ip: string
          used: boolean | null
        }
        Insert: {
          bb_email?: string | null
          id?: number
          ip: string
          used?: boolean | null
        }
        Update: {
          bb_email?: string | null
          id?: number
          ip?: string
          used?: boolean | null
        }
        Relationships: []
      }
      scraper_tasks: {
        Row: {
          bb_email: string | null
          completed_at: string | null
          created_at: string | null
          error: string | null
          id: string
          marketplace: string | null
          max_retries: number | null
          offer_id: number | null
          payload: Json
          priority: number | null
          result: Json | null
          retry_count: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          type: string
        }
        Insert: {
          bb_email?: string | null
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          marketplace?: string | null
          max_retries?: number | null
          offer_id?: number | null
          payload?: Json
          priority?: number | null
          result?: Json | null
          retry_count?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          type: string
        }
        Update: {
          bb_email?: string | null
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          marketplace?: string | null
          max_retries?: number | null
          offer_id?: number | null
          payload?: Json
          priority?: number | null
          result?: Json | null
          retry_count?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      voucher: {
        Row: {
          bb_email: string | null
          created_at: string | null
          id: number
          is_valid: boolean | null
          used: boolean | null
          value: string
        }
        Insert: {
          bb_email?: string | null
          created_at?: string | null
          id?: number
          is_valid?: boolean | null
          used?: boolean | null
          value: string
        }
        Update: {
          bb_email?: string | null
          created_at?: string | null
          id?: number
          is_valid?: boolean | null
          used?: boolean | null
          value?: string
        }
        Relationships: []
      }
      shops: {
        Row: {
          id: string
          user_id: string | null
          owner_email: string
          slug: string
          custom_domain: string | null
          is_active: boolean
          linked_credential_emails: string[]
          shop_name: string
          tagline: string | null
          phone: string | null
          phone_href: string | null
          email: string | null
          owner_name: string | null
          ico: string | null
          address_line: string | null
          address_city: string | null
          region: string | null
          opening_hours: string | null
          shipping_price: string | null
          shipping_price_tires: string | null
          shipping_price_rims: string | null
          map_link: string | null
          google_maps_link: string | null
          caravan_url: string | null
          template_id: string
          primary_color: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          owner_email: string
          slug: string
          custom_domain?: string | null
          is_active?: boolean
          linked_credential_emails?: string[]
          shop_name: string
          tagline?: string | null
          phone?: string | null
          phone_href?: string | null
          email?: string | null
          owner_name?: string | null
          ico?: string | null
          address_line?: string | null
          address_city?: string | null
          region?: string | null
          opening_hours?: string | null
          shipping_price?: string | null
          shipping_price_tires?: string | null
          shipping_price_rims?: string | null
          map_link?: string | null
          google_maps_link?: string | null
          caravan_url?: string | null
          template_id?: string
          primary_color?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          owner_email?: string
          slug?: string
          custom_domain?: string | null
          is_active?: boolean
          linked_credential_emails?: string[]
          shop_name?: string
          tagline?: string | null
          phone?: string | null
          phone_href?: string | null
          email?: string | null
          owner_name?: string | null
          ico?: string | null
          address_line?: string | null
          address_city?: string | null
          region?: string | null
          opening_hours?: string | null
          shipping_price?: string | null
          shipping_price_tires?: string | null
          shipping_price_rims?: string | null
          map_link?: string | null
          google_maps_link?: string | null
          caravan_url?: string | null
          template_id?: string
          primary_color?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cron_jobs: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
          trigger_type: string
          schedule_cron: string
          schedule_preset: string | null
          schedule_human: string | null
          action_type: string
          target_emails: string[]
          max_items: number
          settings: Json
          last_run_at: string | null
          last_run_status: string | null
          last_run_message: string | null
          last_run_duration_ms: number | null
          next_run_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean
          trigger_type?: string
          schedule_cron?: string
          schedule_preset?: string | null
          schedule_human?: string | null
          action_type: string
          target_emails?: string[]
          max_items?: number
          settings?: Json
          last_run_at?: string | null
          last_run_status?: string | null
          last_run_message?: string | null
          last_run_duration_ms?: number | null
          next_run_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          trigger_type?: string
          schedule_cron?: string
          schedule_preset?: string | null
          schedule_human?: string | null
          action_type?: string
          target_emails?: string[]
          max_items?: number
          settings?: Json
          last_run_at?: string | null
          last_run_status?: string | null
          last_run_message?: string | null
          last_run_duration_ms?: number | null
          next_run_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cron_job_logs: {
        Row: {
          id: string
          job_id: string
          job_name: string
          action_type: string
          triggered_by: string
          status: string
          started_at: string
          finished_at: string | null
          duration_ms: number | null
          processed_count: number
          message: string | null
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          job_name: string
          action_type: string
          triggered_by?: string
          status: string
          started_at?: string
          finished_at?: string | null
          duration_ms?: number | null
          processed_count?: number
          message?: string | null
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          job_name?: string
          action_type?: string
          triggered_by?: string
          status?: string
          started_at?: string
          finished_at?: string | null
          duration_ms?: number | null
          processed_count?: number
          message?: string | null
          details?: Json
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

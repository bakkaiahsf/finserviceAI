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
          name: string | null
          email: string
          password_hash: string | null
          role: 'admin' | 'compliance_officer' | 'analyst' | 'viewer'
          organization_id: string | null
          consent_flags: Json | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          email: string
          password_hash?: string | null
          role?: 'admin' | 'compliance_officer' | 'analyst' | 'viewer'
          organization_id?: string | null
          consent_flags?: Json | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          password_hash?: string | null
          role?: 'admin' | 'compliance_officer' | 'analyst' | 'viewer'
          organization_id?: string | null
          consent_flags?: Json | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_product_id: string | null
          plan_id: number | null
          plan_name: string | null
          subscription_status: 'active' | 'canceled' | 'past_due' | 'unpaid' | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_product_id?: string | null
          plan_id?: number | null
          plan_name?: string | null
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'unpaid' | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_product_id?: string | null
          plan_id?: number | null
          plan_name?: string | null
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'unpaid' | null
        }
      }
      companies: {
        Row: {
          id: string
          company_number: string
          company_name: string
          status: string | null
          type: string | null
          incorporation_date: string | null
          registered_office: Json | null
          sic_codes: Json | null
          last_ch_sync: string | null
          companies_house_data: Json | null
          ai_summary: string | null
          ai_risk_score: number | null
          ai_insights: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_number: string
          company_name: string
          status?: string | null
          type?: string | null
          incorporation_date?: string | null
          registered_office?: Json | null
          sic_codes?: Json | null
          last_ch_sync?: string | null
          companies_house_data?: Json | null
          ai_summary?: string | null
          ai_risk_score?: number | null
          ai_insights?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_number?: string
          company_name?: string
          status?: string | null
          type?: string | null
          incorporation_date?: string | null
          registered_office?: Json | null
          sic_codes?: Json | null
          last_ch_sync?: string | null
          companies_house_data?: Json | null
          ai_summary?: string | null
          ai_risk_score?: number | null
          ai_insights?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      plans: {
        Row: {
          id: number
          slug: string
          name: string
          monthly_price_cents: number
          yearly_price_cents: number
          entitlements: Json
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          slug: string
          name: string
          monthly_price_cents?: number
          yearly_price_cents?: number
          entitlements: Json
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          slug?: string
          name?: string
          monthly_price_cents?: number
          yearly_price_cents?: number
          entitlements?: Json
          is_active?: boolean
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
      user_role: 'admin' | 'compliance_officer' | 'analyst' | 'viewer'
      job_status: 'pending' | 'processing' | 'completed' | 'failed'
      subscription_status: 'active' | 'canceled' | 'past_due' | 'unpaid'
    }
  }
}
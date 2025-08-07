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
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'compliance_officer' | 'analyst' | 'viewer'
          organization: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'compliance_officer' | 'analyst' | 'viewer'
          organization?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'compliance_officer' | 'analyst' | 'viewer'
          organization?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          company_number: string
          company_name: string
          registered_office: Json | null
          incorporation_date: string | null
          company_status: string | null
          company_type: string | null
          sic_codes: number[] | null
          source_data: Json | null
          reconciliation_confidence: number | null
          ai_summary: string | null
          ai_risk_score: number | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_number: string
          company_name: string
          registered_office?: Json | null
          incorporation_date?: string | null
          company_status?: string | null
          company_type?: string | null
          sic_codes?: number[] | null
          source_data?: Json | null
          reconciliation_confidence?: number | null
          ai_summary?: string | null
          ai_risk_score?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_number?: string
          company_name?: string
          registered_office?: Json | null
          incorporation_date?: string | null
          company_status?: string | null
          company_type?: string | null
          sic_codes?: number[] | null
          source_data?: Json | null
          reconciliation_confidence?: number | null
          ai_summary?: string | null
          ai_risk_score?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      persons: {
        Row: {
          id: string
          name: Json
          date_of_birth: string | null
          nationality: string | null
          address: Json | null
          source_data: Json | null
          reconciliation_confidence: number | null
          is_verified: boolean
          ai_risk_assessment: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: Json
          date_of_birth?: string | null
          nationality?: string | null
          address?: Json | null
          source_data?: Json | null
          reconciliation_confidence?: number | null
          is_verified?: boolean
          ai_risk_assessment?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: Json
          date_of_birth?: string | null
          nationality?: string | null
          address?: Json | null
          source_data?: Json | null
          reconciliation_confidence?: number | null
          is_verified?: boolean
          ai_risk_assessment?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      relationships: {
        Row: {
          id: string
          from_entity_id: string
          to_entity_id: string
          from_entity_type: string
          to_entity_type: string
          relationship_type: string
          ownership_percentage: number | null
          voting_rights_percentage: number | null
          appointment_date: string | null
          resignation_date: string | null
          source_data: Json | null
          reconciliation_confidence: number | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_entity_id: string
          to_entity_id: string
          from_entity_type: string
          to_entity_type: string
          relationship_type: string
          ownership_percentage?: number | null
          voting_rights_percentage?: number | null
          appointment_date?: string | null
          resignation_date?: string | null
          source_data?: Json | null
          reconciliation_confidence?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          from_entity_id?: string
          to_entity_id?: string
          from_entity_type?: string
          to_entity_type?: string
          relationship_type?: string
          ownership_percentage?: number | null
          voting_rights_percentage?: number | null
          appointment_date?: string | null
          resignation_date?: string | null
          source_data?: Json | null
          reconciliation_confidence?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_processing_jobs: {
        Row: {
          id: string
          job_type: string
          entity_id: string
          entity_type: string
          status: string
          input_data: Json | null
          ai_response: Json | null
          deepseek_usage: Json | null
          created_by: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          job_type: string
          entity_id: string
          entity_type: string
          status?: string
          input_data?: Json | null
          ai_response?: Json | null
          deepseek_usage?: Json | null
          created_by?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          job_type?: string
          entity_id?: string
          entity_type?: string
          status?: string
          input_data?: Json | null
          ai_response?: Json | null
          deepseek_usage?: Json | null
          created_by?: string | null
          created_at?: string
          completed_at?: string | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
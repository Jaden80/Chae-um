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
      schools: {
        Row: {
          id: string
          neis_code: string
          name: string
          address: string | null
          lat: number | null
          lng: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          neis_code: string
          name: string
          address?: string | null
          lat?: number | null
          lng?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          neis_code?: string
          name?: string
          address?: string | null
          lat?: number | null
          lng?: number | null
          created_at?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          school_id: string | null
          role: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          email: string
          name: string
          school_id?: string | null
          role?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          school_id?: string | null
          role?: string | null
          created_at?: string | null
        }
      }
      places: {
        Row: {
          id: string
          source: string | null
          external_id: string | null
          name: string
          category: string | null
          address: string | null
          lat: number | null
          lng: number | null
          phone: string | null
          website: string | null
          reservation_required: boolean | null
          operating_hours: Json | null
          certified: boolean | null
          certification_info: Json | null
          safety_score: number | null
          last_synced_at: string | null
        }
        Insert: {
          id?: string
          source?: string | null
          external_id?: string | null
          name: string
          category?: string | null
          address?: string | null
          lat?: number | null
          lng?: number | null
          phone?: string | null
          website?: string | null
          reservation_required?: boolean | null
          operating_hours?: Json | null
          certified?: boolean | null
          certification_info?: Json | null
          safety_score?: number | null
          last_synced_at?: string | null
        }
        Update: {
          id?: string
          source?: string | null
          external_id?: string | null
          name?: string
          category?: string | null
          address?: string | null
          lat?: number | null
          lng?: number | null
          phone?: string | null
          website?: string | null
          reservation_required?: boolean | null
          operating_hours?: Json | null
          certified?: boolean | null
          certification_info?: Json | null
          safety_score?: number | null
          last_synced_at?: string | null
        }
      }
      events: {
        Row: {
          id: string
          user_id: string
          school_id: string | null
          subject: string | null
          grade: number | null
          unit: string | null
          trip_date: string | null
          student_count: number | null
          type: string | null
          status: string | null
          selected_place_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          school_id?: string | null
          subject?: string | null
          grade?: number | null
          unit?: string | null
          trip_date?: string | null
          student_count?: number | null
          type?: string | null
          status?: string | null
          selected_place_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          school_id?: string | null
          subject?: string | null
          grade?: number | null
          unit?: string | null
          trip_date?: string | null
          student_count?: number | null
          type?: string | null
          status?: string | null
          selected_place_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      recommendations: {
        Row: {
          id: string
          event_id: string
          place_id: string
          match_score: number | null
          match_reason: string | null
          distance_km: number | null
          rank: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          place_id: string
          match_score?: number | null
          match_reason?: string | null
          distance_km?: number | null
          rank?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          place_id?: string
          match_score?: number | null
          match_reason?: string | null
          distance_km?: number | null
          rank?: number | null
          created_at?: string | null
        }
      }
      documents: {
        Row: {
          id: string
          event_id: string
          type: string | null
          content_md: string | null
          pdf_url: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          type?: string | null
          content_md?: string | null
          pdf_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          type?: string | null
          content_md?: string | null
          pdf_url?: string | null
          created_at?: string | null
        }
      }
      previsit_checklists: {
        Row: {
          id: string
          event_id: string
          checklist_data: Json | null
          photos: Json | null
          report_md: string | null
          submitted_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          checklist_data?: Json | null
          photos?: Json | null
          report_md?: string | null
          submitted_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          checklist_data?: Json | null
          photos?: Json | null
          report_md?: string | null
          submitted_at?: string | null
        }
      }
    }
  }
}

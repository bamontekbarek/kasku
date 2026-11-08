// Ditulis manual mengikuti migrasi 20261108120000_init_accounts.sql.
// Setelah project Supabase di-link, timpa dengan:
//   npx supabase gen types typescript --linked > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string; locale: string; timezone: string; created_at: string; updated_at: string };
        Insert: { id: string; full_name?: string; locale?: string; timezone?: string; created_at?: string; updated_at?: string };
        Update: { id?: string; full_name?: string; locale?: string; timezone?: string; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      categories: {
        Row: { id: string; user_id: string; name: string; color: string; is_system: boolean; sort_order: number; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; name: string; color: string; is_system?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; name?: string; color?: string; is_system?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      notification_settings: {
        Row: {
          user_id: string; budget_near: boolean; budget_threshold: number; budget_over: boolean; daily_reminder: boolean;
          reminder_time: string; weekly_summary: boolean; monthly_report: boolean; updated_at: string;
        };
        Insert: {
          user_id: string; budget_near?: boolean; budget_threshold?: number; budget_over?: boolean; daily_reminder?: boolean;
          reminder_time?: string; weekly_summary?: boolean; monthly_report?: boolean; updated_at?: string;
        };
        Update: {
          user_id?: string; budget_near?: boolean; budget_threshold?: number; budget_over?: boolean; daily_reminder?: boolean;
          reminder_time?: string; weekly_summary?: boolean; monthly_report?: boolean; updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

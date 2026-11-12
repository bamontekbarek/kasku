export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      budgets: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          id: string
          month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          id?: string
          month: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          id?: string
          month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_user_id_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          id: string
          is_system: boolean
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          is_system?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_system?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expense_items: {
        Row: {
          expense_id: string
          id: string
          name: string
          position: number
          price: number
          user_id: string
        }
        Insert: {
          expense_id: string
          id?: string
          name: string
          position?: number
          price?: number
          user_id?: string
        }
        Update: {
          expense_id?: string
          id?: string
          name?: string
          position?: number
          price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_items_expense_id_user_id_fkey"
            columns: ["expense_id", "user_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          id: string
          merchant: string
          note: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          receipt_id: string | null
          source: Database["public"]["Enums"]["expense_source"]
          spent_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          id?: string
          merchant?: string
          note?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receipt_id?: string | null
          source?: Database["public"]["Enums"]["expense_source"]
          spent_at: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          id?: string
          merchant?: string
          note?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receipt_id?: string | null
          source?: Database["public"]["Enums"]["expense_source"]
          spent_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_user_id_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "expenses_receipt_fkey"
            columns: ["receipt_id", "user_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          budget_near: boolean
          budget_over: boolean
          budget_threshold: number
          daily_reminder: boolean
          monthly_report: boolean
          reminder_time: string
          updated_at: string
          user_id: string
          weekly_summary: boolean
        }
        Insert: {
          budget_near?: boolean
          budget_over?: boolean
          budget_threshold?: number
          daily_reminder?: boolean
          monthly_report?: boolean
          reminder_time?: string
          updated_at?: string
          user_id: string
          weekly_summary?: boolean
        }
        Update: {
          budget_near?: boolean
          budget_over?: boolean
          budget_threshold?: number
          daily_reminder?: boolean
          monthly_report?: boolean
          reminder_time?: string
          updated_at?: string
          user_id?: string
          weekly_summary?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          dedupe_key: string
          id: string
          link: string
          params: Json
          read_at: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          dedupe_key: string
          id?: string
          link?: string
          params?: Json
          read_at?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          dedupe_key?: string
          id?: string
          link?: string
          params?: Json
          read_at?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          locale: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          locale?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          locale?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          ai_model: string | null
          ai_result: Json | null
          cached_tokens: number | null
          completion_tokens: number | null
          created_at: string
          error: string | null
          id: string
          image_bytes: number
          image_hash: string
          image_height: number | null
          image_width: number | null
          prompt_tokens: number | null
          scanned_at: string | null
          status: Database["public"]["Enums"]["receipt_status"]
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          ai_result?: Json | null
          cached_tokens?: number | null
          completion_tokens?: number | null
          created_at?: string
          error?: string | null
          id?: string
          image_bytes: number
          image_hash: string
          image_height?: number | null
          image_width?: number | null
          prompt_tokens?: number | null
          scanned_at?: string | null
          status?: Database["public"]["Enums"]["receipt_status"]
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model?: string | null
          ai_result?: Json | null
          cached_tokens?: number | null
          completion_tokens?: number | null
          created_at?: string
          error?: string | null
          id?: string
          image_bytes?: number
          image_hash?: string
          image_height?: number | null
          image_width?: number | null
          prompt_tokens?: number | null
          scanned_at?: string | null
          status?: Database["public"]["Enums"]["receipt_status"]
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scan_ip_usage: {
        Row: { count: number; hour: string; ip: string }
        Insert: { count?: number; hour: string; ip: string }
        Update: { count?: number; hour?: string; ip?: string }
        Relationships: []
      }
      scan_usage: {
        Row: {
          count: number
          day: string
          in_progress: boolean
          last_scan_at: string | null
          minute_count: number
          minute_started_at: string | null
          user_id: string
        }
        Insert: {
          count?: number
          day: string
          in_progress?: boolean
          last_scan_at?: string | null
          minute_count?: number
          minute_started_at?: string | null
          user_id: string
        }
        Update: {
          count?: number
          day?: string
          in_progress?: boolean
          last_scan_at?: string | null
          minute_count?: number
          minute_started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ai_usage_since: {
        Args: { p_since: string }
        Returns: { cached_tokens: number; completion_tokens: number; prompt_tokens: number }[]
      }
      consume_scan_quota: {
        Args: { p_daily: number; p_ip: string | null; p_ip_hourly: number; p_per_minute: number; p_user: string }
        Returns: Json
      }
      delete_category: { Args: { p_id: string }; Returns: undefined }
      finish_scan: { Args: { p_refund: boolean; p_user: string }; Returns: undefined }
      get_category_totals: {
        Args: { p_month?: string }
        Returns: {
          category_id: string
          color: string
          is_system: boolean
          name: string
          total: number
          tx_count: number
        }[]
      }
      get_budget_status: { Args: { p_month?: string }; Returns: Json }
      get_period_summary: {
        Args: { p_anchor?: string; p_period: string }
        Returns: Json
      }
      mark_notifications_read: { Args: { p_ids?: string[] | null }; Returns: undefined }
      save_budget: {
        Args: { p_categories: Json; p_month: string; p_remind?: boolean | null; p_total: number }
        Returns: undefined
      }
      save_expense: {
        Args: {
          p_amount: number
          p_category_id: string
          p_id: string | null
          p_items?: Json | null
          p_merchant: string
          p_note: string
          p_payment_method: Database["public"]["Enums"]["payment_method"]
          p_receipt_id?: string | null
          p_source?: Database["public"]["Enums"]["expense_source"]
          p_spent_at: string
        }
        Returns: string
      }
    }
    Enums: {
      expense_source: "manual" | "scan"
      notification_type: "budget_near" | "budget_over" | "daily_reminder" | "weekly_summary" | "monthly_report" | "security"
      payment_method: "cash" | "debit" | "qris" | "credit_card" | "ewallet"
      receipt_status: "uploaded" | "processing" | "done" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      expense_source: ["manual", "scan"],
      notification_type: ["budget_near", "budget_over", "daily_reminder", "weekly_summary", "monthly_report", "security"],
      payment_method: ["cash", "debit", "qris", "credit_card", "ewallet"],
      receipt_status: ["uploaded", "processing", "done", "failed"],
    },
  },
} as const

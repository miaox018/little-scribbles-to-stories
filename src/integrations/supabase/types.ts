export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      coupon_codes: {
        Row: {
          applicable_tiers: string[] | null
          code: string
          created_at: string
          currency: string | null
          current_redemptions: number
          discount_amount: number | null
          discount_percent: number | null
          id: string
          is_active: boolean
          max_redemptions: number | null
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          applicable_tiers?: string[] | null
          code: string
          created_at?: string
          currency?: string | null
          current_redemptions?: number
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          applicable_tiers?: string[] | null
          code?: string
          created_at?: string
          currency?: string | null
          current_redemptions?: number
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_code_id: string | null
          discount_applied: number
          id: string
          redeemed_at: string
          subscription_tier: string
          user_id: string
        }
        Insert: {
          coupon_code_id?: string | null
          discount_applied: number
          id?: string
          redeemed_at?: string
          subscription_tier: string
          user_id: string
        }
        Update: {
          coupon_code_id?: string | null
          discount_applied?: number
          id?: string
          redeemed_at?: string
          subscription_tier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_code_id_fkey"
            columns: ["coupon_code_id"]
            isOneToOne: false
            referencedRelation: "coupon_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_usage: {
        Row: {
          created_at: string
          id: string
          month_year: string
          stories_created: number
          total_pages_regenerated: number
          total_pages_uploaded: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month_year: string
          stories_created?: number
          total_pages_regenerated?: number
          total_pages_uploaded?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month_year?: string
          stories_created?: number
          total_pages_regenerated?: number
          total_pages_uploaded?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          art_style: string | null
          cancelled_at: string | null
          character_summary: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          meta_context_version: number | null
          status: string | null
          title: string
          total_pages: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          art_style?: string | null
          cancelled_at?: string | null
          character_summary?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          meta_context_version?: number | null
          status?: string | null
          title: string
          total_pages?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          art_style?: string | null
          cancelled_at?: string | null
          character_summary?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          meta_context_version?: number | null
          status?: string | null
          title?: string
          total_pages?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      story_pages: {
        Row: {
          created_at: string | null
          enhanced_prompt: string | null
          generated_image_url: string | null
          id: string
          is_approved: boolean | null
          original_image_url: string | null
          page_number: number
          story_id: string
          transformation_status: string | null
          updated_at: string | null
          user_feedback: string | null
        }
        Insert: {
          created_at?: string | null
          enhanced_prompt?: string | null
          generated_image_url?: string | null
          id?: string
          is_approved?: boolean | null
          original_image_url?: string | null
          page_number: number
          story_id: string
          transformation_status?: string | null
          updated_at?: string | null
          user_feedback?: string | null
        }
        Update: {
          created_at?: string | null
          enhanced_prompt?: string | null
          generated_image_url?: string | null
          id?: string
          is_approved?: boolean | null
          original_image_url?: string | null
          page_number?: number
          story_id?: string
          transformation_status?: string | null
          updated_at?: string | null
          user_feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_pages_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          created_at: string
          id: string
          month_year: string
          pages_regenerated: number
          pages_uploaded: number
          story_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month_year: string
          pages_regenerated?: number
          pages_uploaded?: number
          story_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month_year?: string
          pages_regenerated?: number
          pages_uploaded?: number
          story_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_create_story: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      can_regenerate_pages: {
        Args: {
          user_id_param: string
          story_id_param: string
          additional_regens?: number
        }
        Returns: boolean
      }
      can_upload_pages: {
        Args: {
          user_id_param: string
          story_id_param: string
          additional_pages?: number
        }
        Returns: boolean
      }
      cleanup_expired_stories: {
        Args: Record<PropertyKey, never>
        Returns: {
          deleted_story_id: string
          deleted_pages_count: number
        }[]
      }
      get_user_limits: {
        Args: { user_id_param: string }
        Returns: {
          subscription_tier: string
          stories_per_month: number
          pages_per_story: number
          regenerations_per_story: number
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      record_coupon_redemption: {
        Args: {
          p_code: string
          p_user_id: string
          p_tier: string
          p_discount_applied: number
        }
        Returns: boolean
      }
      validate_coupon: {
        Args: { p_code: string; p_user_id: string; p_tier: string }
        Returns: {
          valid: boolean
          discount_percent: number
          discount_amount: number
          currency: string
          error_message: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      subscription_tier: "free" | "storypro" | "storypro_plus"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      subscription_tier: ["free", "storypro", "storypro_plus"],
    },
  },
} as const

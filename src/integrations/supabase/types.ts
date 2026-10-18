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
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          currency: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      split_expenses: {
        Row: {
          amount: number
          created_at: string
          description: string
          group_id: string
          id: string
          occurred_on: string
          paid_by: string
          split_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          group_id: string
          id?: string
          occurred_on?: string
          paid_by: string
          split_type?: string
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          group_id?: string
          id?: string
          occurred_on?: string
          paid_by?: string
          split_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_expenses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "split_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "split_expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "split_members"
            referencedColumns: ["id"]
          },
        ]
      }
      split_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      split_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          is_self: boolean
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          is_self?: boolean
          name: string
          user_id?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          is_self?: boolean
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "split_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      split_settlements: {
        Row: {
          amount: number
          created_at: string
          from_member: string
          group_id: string
          id: string
          settled_on: string
          to_member: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          from_member: string
          group_id: string
          id?: string
          settled_on?: string
          to_member: string
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          from_member?: string
          group_id?: string
          id?: string
          settled_on?: string
          to_member?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_settlements_from_member_fkey"
            columns: ["from_member"]
            isOneToOne: false
            referencedRelation: "split_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "split_settlements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "split_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "split_settlements_to_member_fkey"
            columns: ["to_member"]
            isOneToOne: false
            referencedRelation: "split_members"
            referencedColumns: ["id"]
          },
        ]
      }
      split_shares: {
        Row: {
          amount: number
          expense_id: string
          id: string
          member_id: string
          user_id: string
        }
        Insert: {
          amount: number
          expense_id: string
          id?: string
          member_id: string
          user_id?: string
        }
        Update: {
          amount?: number
          expense_id?: string
          id?: string
          member_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_shares_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "split_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "split_shares_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "split_members"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          is_sample: boolean
          merchant: string | null
          note: string | null
          occurred_at: string
          payment_method: string
          receipt_path: string | null
          recurring: boolean
          split_expense_id: string | null
          tags: string[]
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          id?: string
          is_sample?: boolean
          merchant?: string | null
          note?: string | null
          occurred_at?: string
          payment_method?: string
          receipt_path?: string | null
          recurring?: boolean
          split_expense_id?: string | null
          tags?: string[]
          type: string
          user_id?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          is_sample?: boolean
          merchant?: string | null
          note?: string | null
          occurred_at?: string
          payment_method?: string
          receipt_path?: string | null
          recurring?: boolean
          split_expense_id?: string | null
          tags?: string[]
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_split_expense_id_fkey"
            columns: ["split_expense_id"]
            isOneToOne: false
            referencedRelation: "split_expenses"
            referencedColumns: ["id"]
          },
        ]
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
  public: {
    Enums: {},
  },
} as const

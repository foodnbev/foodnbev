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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          category: Database["public"]["Enums"]["company_category"]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["company_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["company_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          attachment_mime: string | null
          attachment_name: string | null
          attachment_path: string | null
          attachment_size: number | null
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          attachment_mime?: string | null
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          attachment_mime?: string | null
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alias: string
          created_at: string
          email: string
          full_name: string | null
          id: string
          involved: boolean
          mobile: string | null
        }
        Insert: {
          alias: string
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          involved?: boolean
          mobile?: string | null
        }
        Update: {
          alias?: string
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          involved?: boolean
          mobile?: string | null
        }
        Relationships: []
      }
      project_info_entries: {
        Row: {
          attachment_mime: string | null
          attachment_name: string | null
          attachment_path: string | null
          attachment_size: number | null
          body: string | null
          created_at: string
          created_by: string
          id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          attachment_mime?: string | null
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          body?: string | null
          created_at?: string
          created_by: string
          id?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          attachment_mime?: string | null
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          body?: string | null
          created_at?: string
          created_by?: string
          id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_info_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_parties: {
        Row: {
          category: Database["public"]["Enums"]["party_category"]
          company: string | null
          company_id: string | null
          contact_name: string | null
          created_at: string
          created_by: string
          email: string | null
          id: string
          other_label: string | null
          phone: string | null
          project_id: string
          spec_description: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["party_category"]
          company?: string | null
          company_id?: string | null
          contact_name?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          other_label?: string | null
          phone?: string | null
          project_id: string
          spec_description?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["party_category"]
          company?: string | null
          company_id?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          other_label?: string | null
          phone?: string | null
          project_id?: string
          spec_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_parties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_parties_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_ratings: {
        Row: {
          accuracy: number
          created_at: string
          hotness: number
          id: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy: number
          created_at?: string
          hotness: number
          id?: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number
          created_at?: string
          hotness?: number
          id?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_ratings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string
          facility_type: Database["public"]["Enums"]["facility_type"]
          food_subtype: Database["public"]["Enums"]["food_subtype"] | null
          id: string
          name: string
          status: Database["public"]["Enums"]["project_status"]
          work_type: Database["public"]["Enums"]["work_type"] | null
        }
        Insert: {
          address: string
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description: string
          facility_type: Database["public"]["Enums"]["facility_type"]
          food_subtype?: Database["public"]["Enums"]["food_subtype"] | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["project_status"]
          work_type?: Database["public"]["Enums"]["work_type"] | null
        }
        Update: {
          address?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string
          facility_type?: Database["public"]["Enums"]["facility_type"]
          food_subtype?: Database["public"]["Enums"]["food_subtype"] | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["project_status"]
          work_type?: Database["public"]["Enums"]["work_type"] | null
        }
        Relationships: []
      }
      rfq_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          asker_id: string
          created_at: string
          id: string
          question: string
          rfq_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          asker_id: string
          created_at?: string
          id?: string
          question: string
          rfq_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          asker_id?: string
          created_at?: string
          id?: string
          question?: string
          rfq_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_questions_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_quotes: {
        Row: {
          amend_count: number
          amount: number | null
          anonymous: boolean
          body: string
          company_id: string | null
          created_at: string
          id: string
          rfq_id: string
          submitter_id: string
          updated_at: string
        }
        Insert: {
          amend_count?: number
          amount?: number | null
          anonymous?: boolean
          body: string
          company_id?: string | null
          created_at?: string
          id?: string
          rfq_id: string
          submitter_id: string
          updated_at?: string
        }
        Update: {
          amend_count?: number
          amount?: number | null
          anonymous?: boolean
          body?: string
          company_id?: string | null
          created_at?: string
          id?: string
          rfq_id?: string
          submitter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_quotes_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          anonymous: boolean
          categories: Database["public"]["Enums"]["party_category"][]
          closed_at: string | null
          company_id: string | null
          created_at: string
          created_by: string
          deadline: string | null
          description: string
          id: string
          project_id: string | null
          updated_at: string
        }
        Insert: {
          anonymous?: boolean
          categories?: Database["public"]["Enums"]["party_category"][]
          closed_at?: string | null
          company_id?: string | null
          created_at?: string
          created_by: string
          deadline?: string | null
          description: string
          id?: string
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          anonymous?: boolean
          categories?: Database["public"]["Enums"]["party_category"][]
          closed_at?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string
          id?: string
          project_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfqs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          thread_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          thread_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          thread_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          created_at: string
          created_by: string
          id: string
          project_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          project_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_connected: { Args: { _a: string; _b: string }; Returns: boolean }
      get_party_presence: { Args: { p_id: string }; Returns: string[] }
      get_rating_summary: {
        Args: { p_id: string }
        Returns: {
          avg_accuracy: number
          avg_hotness: number
          rating_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      project_completeness: { Args: { p_id: string }; Returns: number }
      rfq_is_open: { Args: { _id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      company_category:
        | "architect"
        | "general_contractor"
        | "flooring"
        | "groundworks"
        | "other"
      connection_status: "pending" | "accepted" | "rejected"
      facility_type: "brewery" | "distillery" | "food_processing"
      food_subtype: "meat" | "fish" | "snacks" | "coldroom" | "other"
      party_category:
        | "end_user"
        | "architect"
        | "general_contractor"
        | "me"
        | "real_estate_planner"
        | "consultant"
        | "flooring"
        | "groundworks"
        | "drainage"
        | "other"
      project_status: "planning" | "underway" | "completed" | "unknown"
      work_type: "newbuild" | "extension" | "refurbishment" | "modification"
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
      company_category: [
        "architect",
        "general_contractor",
        "flooring",
        "groundworks",
        "other",
      ],
      connection_status: ["pending", "accepted", "rejected"],
      facility_type: ["brewery", "distillery", "food_processing"],
      food_subtype: ["meat", "fish", "snacks", "coldroom", "other"],
      party_category: [
        "end_user",
        "architect",
        "general_contractor",
        "me",
        "real_estate_planner",
        "consultant",
        "flooring",
        "groundworks",
        "drainage",
        "other",
      ],
      project_status: ["planning", "underway", "completed", "unknown"],
      work_type: ["newbuild", "extension", "refurbishment", "modification"],
    },
  },
} as const

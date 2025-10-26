 
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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bridges: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          ta_plan_url: string | null
          x: number
          y: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          ta_plan_url?: string | null
          x: number
          y: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          ta_plan_url?: string | null
          x?: number
          y?: number
        }
        Relationships: []
      }
      broar: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          ta_plan_url: string | null
          x: number
          y: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          ta_plan_url?: string | null
          x: number
          y: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          ta_plan_url?: string | null
          x?: number
          y?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string | null
          delivered: boolean | null
          delivered_at: string | null
          encrypted: boolean | null
          encryption_key: string | null
          from_user_id: string
          from_user_name: string
          group_id: string | null
          id: string
          message: string
          read: boolean | null
          read_at: string | null
          to_user_id: string
        }
        Insert: {
          created_at?: string | null
          delivered?: boolean | null
          delivered_at?: string | null
          encrypted?: boolean | null
          encryption_key?: string | null
          from_user_id: string
          from_user_name: string
          group_id?: string | null
          id?: string
          message: string
          read?: boolean | null
          read_at?: string | null
          to_user_id: string
        }
        Update: {
          created_at?: string | null
          delivered?: boolean | null
          delivered_at?: string | null
          encrypted?: boolean | null
          encryption_key?: string | null
          from_user_id?: string
          from_user_name?: string
          group_id?: string | null
          id?: string
          message?: string
          read?: boolean | null
          read_at?: string | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "work_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      deviations: {
        Row: {
          bridge_id: string | null
          created_at: string | null
          description: string
          id: string
          photos: Json | null
          proposal: string | null
          status: string | null
          synced: boolean | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bridge_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          photos?: Json | null
          proposal?: string | null
          status?: string | null
          synced?: boolean | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bridge_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          photos?: Json | null
          proposal?: string | null
          status?: string | null
          synced?: boolean | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deviations_bridge_id_fkey"
            columns: ["bridge_id"]
            isOneToOne: false
            referencedRelation: "bridges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          file_url: string | null
          id: string
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
          uploaded_at: string | null
          version: number | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          file_url?: string | null
          id?: string
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          version?: number | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          file_url?: string | null
          id?: string
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ice_candidates: {
        Row: {
          call_id: string
          candidate: Json
          created_at: string | null
          from_user_id: string
          id: string
        }
        Insert: {
          call_id: string
          candidate: Json
          created_at?: string | null
          from_user_id: string
          id?: string
        }
        Update: {
          call_id?: string
          candidate?: Json
          created_at?: string | null
          from_user_id?: string
          id?: string
        }
        Relationships: []
      }
      jobb: {
        Row: {
          ansvarig_anvandare: string | null
          anteckningar: string | null
          bilder: Json | null
          bro_id: string | null
          created_at: string | null
          gps: Json | null
          id: string
          material: string | null
          slut_tid: string | null
          start_tid: string | null
          status: string | null
          synced: boolean | null
          tidsatgang: number | null
          updated_at: string | null
          weather_data: Json | null
        }
        Insert: {
          ansvarig_anvandare?: string | null
          anteckningar?: string | null
          bilder?: Json | null
          bro_id?: string | null
          created_at?: string | null
          gps?: Json | null
          id?: string
          material?: string | null
          slut_tid?: string | null
          start_tid?: string | null
          status?: string | null
          synced?: boolean | null
          tidsatgang?: number | null
          updated_at?: string | null
          weather_data?: Json | null
        }
        Update: {
          ansvarig_anvandare?: string | null
          anteckningar?: string | null
          bilder?: Json | null
          bro_id?: string | null
          created_at?: string | null
          gps?: Json | null
          id?: string
          material?: string | null
          slut_tid?: string | null
          start_tid?: string | null
          status?: string | null
          synced?: boolean | null
          tidsatgang?: number | null
          updated_at?: string | null
          weather_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "jobb_ansvarig_anvandare_fkey"
            columns: ["ansvarig_anvandare"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobb_bro_id_fkey"
            columns: ["bro_id"]
            isOneToOne: false
            referencedRelation: "bridges"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          delivered: boolean | null
          delivered_at: string | null
          encrypted: boolean | null
          group_id: string | null
          id: string
          read: boolean | null
          read_at: string | null
          receiver_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          delivered?: boolean | null
          delivered_at?: string | null
          encrypted?: boolean | null
          group_id?: string | null
          id?: string
          read?: boolean | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          delivered?: boolean | null
          delivered_at?: string | null
          encrypted?: boolean | null
          group_id?: string | null
          id?: string
          read?: boolean | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_history: {
        Row: {
          event_id: string | null
          event_type: string | null
          id: number
          message: string | null
          read_at: string | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          event_id?: string | null
          event_type?: string | null
          id?: number
          message?: string | null
          read_at?: string | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          event_id?: string | null
          event_type?: string | null
          id?: number
          message?: string | null
          read_at?: string | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          status: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          last_seen: string | null
          online: boolean | null
          updated_at: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          last_seen?: string | null
          online?: boolean | null
          updated_at?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          last_seen?: string | null
          online?: boolean | null
          updated_at?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      user_traffic_filters: {
        Row: {
          counties: string[] | null
          created_at: string | null
          event_types: string[] | null
          high_priority_only: boolean | null
          id: string
          municipalities: string[] | null
          notifications_enabled: boolean | null
          road_numbers: string[] | null
          severity_filter: string[] | null
          sound_alerts: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          counties?: string[] | null
          created_at?: string | null
          event_types?: string[] | null
          high_priority_only?: boolean | null
          id?: string
          municipalities?: string[] | null
          notifications_enabled?: boolean | null
          road_numbers?: string[] | null
          severity_filter?: string[] | null
          sound_alerts?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          counties?: string[] | null
          created_at?: string | null
          event_types?: string[] | null
          high_priority_only?: boolean | null
          id?: string
          municipalities?: string[] | null
          notifications_enabled?: boolean | null
          road_numbers?: string[] | null
          severity_filter?: string[] | null
          sound_alerts?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webrtc_calls: {
        Row: {
          answer: Json | null
          created_at: string | null
          from_user_id: string
          id: string
          offer: Json | null
          status: string
          to_user_id: string
          updated_at: string | null
        }
        Insert: {
          answer?: Json | null
          created_at?: string | null
          from_user_id: string
          id: string
          offer?: Json | null
          status?: string
          to_user_id: string
          updated_at?: string | null
        }
        Update: {
          answer?: Json | null
          created_at?: string | null
          from_user_id?: string
          id?: string
          offer?: Json | null
          status?: string
          to_user_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      work_group_members: {
        Row: {
          group_id: string | null
          id: string
          joined_at: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          group_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          group_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "work_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_groups: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          invite_code: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          invite_code: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          invite_code?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      jobs: {
        Row: {
          bridge_id: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          id: string | null
          photos: Json | null
          start_time: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bridge_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string | null
          photos?: Json | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bridge_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string | null
          photos?: Json | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobb_ansvarig_anvandare_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobb_bro_id_fkey"
            columns: ["bridge_id"]
            isOneToOne: false
            referencedRelation: "bridges"
            referencedColumns: ["id"]
          },
        ]
      }
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
    Enums: {},
  },
} as const

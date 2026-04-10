 
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
      ai_action_queue: {
        Row: {
          action_type: string
          approved_at: string | null
          approved_by: string | null
          confidence_score: number | null
          created_at: string | null
          executed_at: string | null
          id: string
          proposed_action: Json
          reasoning: string | null
          status: string | null
          target_entity: string
          target_id: string
        }
        Insert: {
          action_type: string
          approved_at?: string | null
          approved_by?: string | null
          confidence_score?: number | null
          created_at?: string | null
          executed_at?: string | null
          id?: string
          proposed_action: Json
          reasoning?: string | null
          status?: string | null
          target_entity: string
          target_id: string
        }
        Update: {
          action_type?: string
          approved_at?: string | null
          approved_by?: string | null
          confidence_score?: number | null
          created_at?: string | null
          executed_at?: string | null
          id?: string
          proposed_action?: Json
          reasoning?: string | null
          status?: string | null
          target_entity?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_action_queue_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          insight_type: string
          prediction_data: Json
          recommendation: string | null
          related_booking_id: string | null
          related_enquiry_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          insight_type: string
          prediction_data: Json
          recommendation?: string | null
          related_booking_id?: string | null
          related_enquiry_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          insight_type?: string
          prediction_data?: Json
          recommendation?: string | null
          related_booking_id?: string | null
          related_enquiry_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_related_enquiry_id_fkey"
            columns: ["related_enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          access_token: string | null
          booking_date: string | null
          created_at: string | null
          id: string
          invoice_generated_at: string | null
          invoice_number: string | null
          notes: string | null
          paid_amount: number | null
          payment_status: string
          qbo_invoice_id: string | null
          reminder_sent_at: string | null
          scheduled_class_id: string
          status: string
          stripe_payment_id: string | null
          student_email: string
          student_id: string | null
          student_name: string
          student_phone: string | null
          token_expires_at: string | null
          total_amount: number
          updated_at: string | null
          usi_number: string | null
        }
        Insert: {
          access_token?: string | null
          booking_date?: string | null
          created_at?: string | null
          id?: string
          invoice_generated_at?: string | null
          invoice_number?: string | null
          notes?: string | null
          paid_amount?: number | null
          payment_status?: string
          qbo_invoice_id?: string | null
          reminder_sent_at?: string | null
          scheduled_class_id: string
          status?: string
          stripe_payment_id?: string | null
          student_email: string
          student_id?: string | null
          student_name: string
          student_phone?: string | null
          token_expires_at?: string | null
          total_amount: number
          updated_at?: string | null
          usi_number?: string | null
        }
        Update: {
          access_token?: string | null
          booking_date?: string | null
          created_at?: string | null
          id?: string
          invoice_generated_at?: string | null
          invoice_number?: string | null
          notes?: string | null
          paid_amount?: number | null
          payment_status?: string
          qbo_invoice_id?: string | null
          reminder_sent_at?: string | null
          scheduled_class_id?: string
          status?: string
          stripe_payment_id?: string | null
          student_email?: string
          student_id?: string | null
          student_name?: string
          student_phone?: string | null
          token_expires_at?: string | null
          total_amount?: number
          updated_at?: string | null
          usi_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_scheduled_class_id_fkey"
            columns: ["scheduled_class_id"]
            isOneToOne: false
            referencedRelation: "scheduled_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_feedback: {
        Row: {
          booking_id: string
          comments: string | null
          course_quality: number | null
          created_at: string | null
          id: string
          rating: number
          scheduled_class_id: string
          student_email: string
          testimonial_approved: boolean | null
          trainer_quality: number | null
          venue_quality: number | null
          would_recommend: boolean | null
        }
        Insert: {
          booking_id: string
          comments?: string | null
          course_quality?: number | null
          created_at?: string | null
          id?: string
          rating: number
          scheduled_class_id: string
          student_email: string
          testimonial_approved?: boolean | null
          trainer_quality?: number | null
          venue_quality?: number | null
          would_recommend?: boolean | null
        }
        Update: {
          booking_id?: string
          comments?: string | null
          course_quality?: number | null
          created_at?: string | null
          id?: string
          rating?: number
          scheduled_class_id?: string
          student_email?: string
          testimonial_approved?: boolean | null
          trainer_quality?: number | null
          venue_quality?: number | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "course_feedback_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_feedback_scheduled_class_id_fkey"
            columns: ["scheduled_class_id"]
            isOneToOne: false
            referencedRelation: "scheduled_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      course_templates: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          duration_hours: number
          id: string
          max_students: number | null
          name: string
          price_deposit: number
          price_full: number
          requirements: string | null
          units: string[] | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          duration_hours: number
          id?: string
          max_students?: number | null
          name: string
          price_deposit?: number
          price_full: number
          requirements?: string | null
          units?: string[] | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          duration_hours?: number
          id?: string
          max_students?: number | null
          name?: string
          price_deposit?: number
          price_full?: number
          requirements?: string | null
          units?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      document_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          document_id: string | null
          id: string
          metadata: Json | null
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          document_id?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          document_id?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_audit_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_audit_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          booking_id: string | null
          course_id: string | null
          deleted_at: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_latest_version: boolean | null
          mime_type: string | null
          notes: string | null
          parent_document_id: string | null
          scheduled_class_id: string | null
          tags: string[] | null
          trainer_id: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          booking_id?: string | null
          course_id?: string | null
          deleted_at?: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_latest_version?: boolean | null
          mime_type?: string | null
          notes?: string | null
          parent_document_id?: string | null
          scheduled_class_id?: string | null
          tags?: string[] | null
          trainer_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          booking_id?: string | null
          course_id?: string | null
          deleted_at?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_latest_version?: boolean | null
          mime_type?: string | null
          notes?: string | null
          parent_document_id?: string | null
          scheduled_class_id?: string | null
          tags?: string[] | null
          trainer_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_scheduled_class_id_fkey"
            columns: ["scheduled_class_id"]
            isOneToOne: false
            referencedRelation: "scheduled_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_parse_logs: {
        Row: {
          body_text: string | null
          created_at: string | null
          created_enquiry_id: string | null
          error_message: string | null
          from_email: string
          id: string
          parsed_data: Json | null
          status: string | null
          subject: string | null
        }
        Insert: {
          body_text?: string | null
          created_at?: string | null
          created_enquiry_id?: string | null
          error_message?: string | null
          from_email: string
          id?: string
          parsed_data?: Json | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          body_text?: string | null
          created_at?: string | null
          created_enquiry_id?: string | null
          error_message?: string | null
          from_email?: string
          id?: string
          parsed_data?: Json | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_parse_logs_created_enquiry_id_fkey"
            columns: ["created_enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiries: {
        Row: {
          course_interest: string | null
          created_at: string | null
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          preferred_dates: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          course_interest?: string | null
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          preferred_dates?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          course_interest?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          preferred_dates?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invoice_counter: {
        Row: {
          current_number: number | null
          id: number
        }
        Insert: {
          current_number?: number | null
          id?: number
        }
        Update: {
          current_number?: number | null
          id?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string
          status: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method: string
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_classes: {
        Row: {
          course_template_id: string
          created_at: string | null
          end_datetime: string
          id: string
          location: string
          max_students: number | null
          notes: string | null
          start_datetime: string
          status: string
          trainer_id: string | null
          updated_at: string | null
        }
        Insert: {
          course_template_id: string
          created_at?: string | null
          end_datetime: string
          id?: string
          location: string
          max_students?: number | null
          notes?: string | null
          start_datetime: string
          status?: string
          trainer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          course_template_id?: string
          created_at?: string | null
          end_datetime?: string
          id?: string
          location?: string
          max_students?: number | null
          notes?: string | null
          start_datetime?: string
          status?: string
          trainer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_classes_course_template_id_fkey"
            columns: ["course_template_id"]
            isOneToOne: false
            referencedRelation: "course_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_classes_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_churn_risk: { Args: { p_booking_id: string }; Returns: Json }
      create_document_version: {
        Args: {
          p_document_id: string
          p_new_file_path: string
          p_new_filename: string
          p_uploaded_by: string
        }
        Returns: string
      }
      detect_upsell_opportunities: {
        Args: { p_booking_id: string }
        Returns: Json
      }
      generate_student_token: { Args: never; Returns: string }
      get_next_invoice_number: { Args: never; Returns: string }
      log_document_access: {
        Args: {
          p_action: string
          p_document_id: string
          p_metadata?: Json
          p_user_id?: string
        }
        Returns: undefined
      }
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

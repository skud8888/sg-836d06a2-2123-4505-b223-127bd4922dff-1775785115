 
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
            foreignKeyName: "ai_insights_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "payment_tracking"
            referencedColumns: ["booking_id"]
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
      attendance_records: {
        Row: {
          created_at: string | null
          enrollment_id: string
          id: string
          notes: string | null
          session_date: string
          status: string | null
          student_id: string
        }
        Insert: {
          created_at?: string | null
          enrollment_id: string
          id?: string
          notes?: string | null
          session_date: string
          status?: string | null
          student_id: string
        }
        Update: {
          created_at?: string | null
          enrollment_id?: string
          id?: string
          notes?: string | null
          session_date?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_config: {
        Row: {
          backup_location: string | null
          created_at: string | null
          enabled: boolean | null
          encryption_enabled: boolean | null
          id: string
          last_backup_at: string | null
          next_backup_at: string | null
          notification_emails: string[] | null
          notify_on_failure: boolean | null
          retention_days: number
          schedule: string
          time: string
          updated_at: string | null
        }
        Insert: {
          backup_location?: string | null
          created_at?: string | null
          enabled?: boolean | null
          encryption_enabled?: boolean | null
          id?: string
          last_backup_at?: string | null
          next_backup_at?: string | null
          notification_emails?: string[] | null
          notify_on_failure?: boolean | null
          retention_days?: number
          schedule?: string
          time?: string
          updated_at?: string | null
        }
        Update: {
          backup_location?: string | null
          created_at?: string | null
          enabled?: boolean | null
          encryption_enabled?: boolean | null
          id?: string
          last_backup_at?: string | null
          next_backup_at?: string | null
          notification_emails?: string[] | null
          notify_on_failure?: boolean | null
          retention_days?: number
          schedule?: string
          time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_history: {
        Row: {
          backup_type: string
          checksum: string | null
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          error_message: string | null
          file_path: string | null
          id: string
          rows_backed_up: number | null
          size_bytes: number | null
          status: string
          tables_backed_up: string[] | null
        }
        Insert: {
          backup_type: string
          checksum?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          file_path?: string | null
          id?: string
          rows_backed_up?: number | null
          size_bytes?: number | null
          status: string
          tables_backed_up?: string[] | null
        }
        Update: {
          backup_type?: string
          checksum?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          file_path?: string | null
          id?: string
          rows_backed_up?: number | null
          size_bytes?: number | null
          status?: string
          tables_backed_up?: string[] | null
        }
        Relationships: []
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
      certificate_templates: {
        Row: {
          background_url: string | null
          body_template: string
          border_style: string | null
          color_scheme: Json | null
          created_at: string | null
          font_family: string | null
          footer_text: string | null
          header_text: string | null
          id: string
          is_default: boolean | null
          logo_url: string | null
          name: string
          signature_url: string | null
          template_type: string | null
          updated_at: string | null
        }
        Insert: {
          background_url?: string | null
          body_template: string
          border_style?: string | null
          color_scheme?: Json | null
          created_at?: string | null
          font_family?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name: string
          signature_url?: string | null
          template_type?: string | null
          updated_at?: string | null
        }
        Update: {
          background_url?: string | null
          body_template?: string
          border_style?: string | null
          color_scheme?: Json | null
          created_at?: string | null
          font_family?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name?: string
          signature_url?: string | null
          template_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_number: string
          completion_date: string | null
          course_template_id: string
          created_at: string | null
          id: string
          instructor_name: string | null
          instructor_signature: string | null
          issue_date: string
          pdf_url: string | null
          status: string | null
          student_id: string
          updated_at: string | null
          verification_code: string | null
        }
        Insert: {
          certificate_number: string
          completion_date?: string | null
          course_template_id: string
          created_at?: string | null
          id?: string
          instructor_name?: string | null
          instructor_signature?: string | null
          issue_date?: string
          pdf_url?: string | null
          status?: string | null
          student_id: string
          updated_at?: string | null
          verification_code?: string | null
        }
        Update: {
          certificate_number?: string
          completion_date?: string | null
          course_template_id?: string
          created_at?: string | null
          id?: string
          instructor_name?: string | null
          instructor_signature?: string | null
          issue_date?: string
          pdf_url?: string | null
          status?: string | null
          student_id?: string
          updated_at?: string | null
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_template_id_fkey"
            columns: ["course_template_id"]
            isOneToOne: false
            referencedRelation: "course_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          document_type: string
          id: string
          is_active: boolean | null
          name: string
          template_content: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          document_type: string
          id?: string
          is_active?: boolean | null
          name: string
          template_content: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          document_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          template_content?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
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
            foreignKeyName: "course_feedback_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "payment_tracking"
            referencedColumns: ["booking_id"]
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
      course_lessons: {
        Row: {
          content: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          module_id: string
          order_index: number
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          module_id: string
          order_index?: number
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          module_id?: string
          order_index?: number
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_materials: {
        Row: {
          created_at: string | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          lesson_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          lesson_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          lesson_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          duration_hours: number | null
          id: string
          order_index: number
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          order_index?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_templates"
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
      course_waitlist: {
        Row: {
          course_template_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          notified_at: string | null
          position: number
          status: string | null
          student_email: string
          student_name: string
          student_phone: string | null
        }
        Insert: {
          course_template_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notified_at?: string | null
          position: number
          status?: string | null
          student_email: string
          student_name: string
          student_phone?: string | null
        }
        Update: {
          course_template_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notified_at?: string | null
          position?: number
          status?: string | null
          student_email?: string
          student_name?: string
          student_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_waitlist_course_template_id_fkey"
            columns: ["course_template_id"]
            isOneToOne: false
            referencedRelation: "course_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_replies: {
        Row: {
          attachments: Json | null
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_helpful: boolean | null
          is_instructor_answer: boolean | null
          parent_reply_id: string | null
          thread_id: string
          updated_at: string | null
          upvotes_count: number | null
        }
        Insert: {
          attachments?: Json | null
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_helpful?: boolean | null
          is_instructor_answer?: boolean | null
          parent_reply_id?: string | null
          thread_id: string
          updated_at?: string | null
          upvotes_count?: number | null
        }
        Update: {
          attachments?: Json | null
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_helpful?: boolean | null
          is_instructor_answer?: boolean | null
          parent_reply_id?: string | null
          thread_id?: string
          updated_at?: string | null
          upvotes_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "discussion_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "discussion_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_threads: {
        Row: {
          author_id: string
          category: string | null
          content: string
          course_lesson_id: string | null
          course_module_id: string | null
          course_template_id: string
          created_at: string | null
          id: string
          is_answered: boolean | null
          is_locked: boolean | null
          is_pinned: boolean | null
          replies_count: number | null
          title: string
          updated_at: string | null
          upvotes_count: number | null
          views_count: number | null
        }
        Insert: {
          author_id: string
          category?: string | null
          content: string
          course_lesson_id?: string | null
          course_module_id?: string | null
          course_template_id: string
          created_at?: string | null
          id?: string
          is_answered?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          replies_count?: number | null
          title: string
          updated_at?: string | null
          upvotes_count?: number | null
          views_count?: number | null
        }
        Update: {
          author_id?: string
          category?: string | null
          content?: string
          course_lesson_id?: string | null
          course_module_id?: string | null
          course_template_id?: string
          created_at?: string | null
          id?: string
          is_answered?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          replies_count?: number | null
          title?: string
          updated_at?: string | null
          upvotes_count?: number | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_threads_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_threads_course_lesson_id_fkey"
            columns: ["course_lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_threads_course_module_id_fkey"
            columns: ["course_module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_threads_course_template_id_fkey"
            columns: ["course_template_id"]
            isOneToOne: false
            referencedRelation: "course_templates"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "payment_tracking"
            referencedColumns: ["booking_id"]
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
      email_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          html_content: string
          id: string
          metadata: Json | null
          recipient_email: string
          sent_at: string | null
          status: string | null
          subject: string
          template_type: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          html_content: string
          id?: string
          metadata?: Json | null
          recipient_email: string
          sent_at?: string | null
          status?: string | null
          subject: string
          template_type?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          html_content?: string
          id?: string
          metadata?: Json | null
          recipient_email?: string
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_type?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string | null
          description: string | null
          html_template: string
          id: string
          name: string
          subject: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          html_template: string
          id?: string
          name: string
          subject: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          html_template?: string
          id?: string
          name?: string
          subject?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
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
      enrollments: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          completed_at: string | null
          course_template_id: string
          created_at: string | null
          enrolled_at: string | null
          id: string
          payment_status: string
          payment_type: string | null
          status: string
          stripe_payment_id: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          completed_at?: string | null
          course_template_id: string
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          payment_status?: string
          payment_type?: string | null
          status?: string
          stripe_payment_id?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          completed_at?: string | null
          course_template_id?: string
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          payment_status?: string
          payment_type?: string | null
          status?: string
          stripe_payment_id?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_template_id_fkey"
            columns: ["course_template_id"]
            isOneToOne: false
            referencedRelation: "course_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_capture: {
        Row: {
          booking_id: string | null
          captured_at: string | null
          captured_by: string | null
          created_at: string | null
          description: string | null
          evidence_type: string
          file_name: string
          file_path: string
          geolocation: Json | null
          id: string
          metadata: Json | null
          mime_type: string | null
          scheduled_class_id: string | null
          synced_at: string | null
        }
        Insert: {
          booking_id?: string | null
          captured_at?: string | null
          captured_by?: string | null
          created_at?: string | null
          description?: string | null
          evidence_type: string
          file_name: string
          file_path: string
          geolocation?: Json | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          scheduled_class_id?: string | null
          synced_at?: string | null
        }
        Update: {
          booking_id?: string | null
          captured_at?: string | null
          captured_by?: string | null
          created_at?: string | null
          description?: string | null
          evidence_type?: string
          file_name?: string
          file_path?: string
          geolocation?: Json | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          scheduled_class_id?: string | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_capture_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_capture_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "payment_tracking"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "evidence_capture_scheduled_class_id_fkey"
            columns: ["scheduled_class_id"]
            isOneToOne: false
            referencedRelation: "scheduled_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_payouts: {
        Row: {
          commission_rate: number | null
          courses_completed: number | null
          created_at: string | null
          id: string
          instructor_id: string
          instructor_share: number | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          period_end: string
          period_start: string
          platform_fee: number | null
          status: string | null
          students_taught: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          commission_rate?: number | null
          courses_completed?: number | null
          created_at?: string | null
          id?: string
          instructor_id: string
          instructor_share?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end: string
          period_start: string
          platform_fee?: number | null
          status?: string | null
          students_taught?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          commission_rate?: number | null
          courses_completed?: number | null
          created_at?: string | null
          id?: string
          instructor_id?: string
          instructor_share?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string
          period_start?: string
          platform_fee?: number | null
          status?: string | null
          students_taught?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_payouts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role: string
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      learning_objectives: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: string
          objective: string
          order_index: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id: string
          objective: string
          order_index?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: string
          objective?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_objectives_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_completions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          lesson_id: string
          notes: string | null
          student_progress_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id: string
          notes?: string | null
          student_progress_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string
          notes?: string | null
          student_progress_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_completions_student_progress_id_fkey"
            columns: ["student_progress_id"]
            isOneToOne: false
            referencedRelation: "student_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          channel: string
          created_at: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          message: string | null
          metadata: Json | null
          notification_type: string
          recipient_email: string | null
          recipient_phone: string | null
          sent_at: string | null
          status: string
          subject: string | null
        }
        Insert: {
          channel: string
          created_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          notification_type: string
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status: string
          subject?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          notification_type?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          daily_digest: boolean | null
          desktop_notifications: boolean | null
          digest_time: string | null
          email_attendance_marked: boolean | null
          email_booking_cancelled: boolean | null
          email_course_reminder: boolean | null
          email_document_uploaded: boolean | null
          email_new_booking: boolean | null
          email_new_enquiry: boolean | null
          email_payment_failed: boolean | null
          email_payment_received: boolean | null
          id: string
          notification_sound: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sms_booking_cancelled: boolean | null
          sms_course_reminder: boolean | null
          sms_new_booking: boolean | null
          sms_payment_received: boolean | null
          updated_at: string | null
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          created_at?: string | null
          daily_digest?: boolean | null
          desktop_notifications?: boolean | null
          digest_time?: string | null
          email_attendance_marked?: boolean | null
          email_booking_cancelled?: boolean | null
          email_course_reminder?: boolean | null
          email_document_uploaded?: boolean | null
          email_new_booking?: boolean | null
          email_new_enquiry?: boolean | null
          email_payment_failed?: boolean | null
          email_payment_received?: boolean | null
          id?: string
          notification_sound?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_booking_cancelled?: boolean | null
          sms_course_reminder?: boolean | null
          sms_new_booking?: boolean | null
          sms_payment_received?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          created_at?: string | null
          daily_digest?: boolean | null
          desktop_notifications?: boolean | null
          digest_time?: string | null
          email_attendance_marked?: boolean | null
          email_booking_cancelled?: boolean | null
          email_course_reminder?: boolean | null
          email_document_uploaded?: boolean | null
          email_new_booking?: boolean | null
          email_new_enquiry?: boolean | null
          email_payment_failed?: boolean | null
          email_payment_received?: boolean | null
          id?: string
          notification_sound?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_booking_cancelled?: boolean | null
          sms_course_reminder?: boolean | null
          sms_new_booking?: boolean | null
          sms_payment_received?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      payment_plan_installments: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          id: string
          installment_number: number
          paid_amount: number | null
          paid_at: string | null
          payment_plan_id: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          id?: string
          installment_number: number
          paid_amount?: number | null
          paid_at?: string | null
          payment_plan_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          id?: string
          installment_number?: number
          paid_amount?: number | null
          paid_at?: string | null
          payment_plan_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_plan_installments_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plans: {
        Row: {
          booking_id: string | null
          created_at: string | null
          frequency: string
          id: string
          installment_amount: number
          installments: number
          start_date: string
          status: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          frequency: string
          id?: string
          installment_amount: number
          installments: number
          start_date: string
          status?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          frequency?: string
          id?: string
          installment_amount?: number
          installments?: number
          start_date?: string
          status?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "payment_tracking"
            referencedColumns: ["booking_id"]
          },
        ]
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
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "payment_tracking"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      payout_rules: {
        Row: {
          commission_rate: number
          course_template_id: string | null
          created_at: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          instructor_id: string | null
          is_active: boolean | null
          minimum_payout: number | null
          payment_method: string | null
          payout_schedule: string | null
          updated_at: string | null
        }
        Insert: {
          commission_rate?: number
          course_template_id?: string | null
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          minimum_payout?: number | null
          payment_method?: string | null
          payout_schedule?: string | null
          updated_at?: string | null
        }
        Update: {
          commission_rate?: number
          course_template_id?: string | null
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          minimum_payout?: number | null
          payment_method?: string | null
          payout_schedule?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_rules_course_template_id_fkey"
            columns: ["course_template_id"]
            isOneToOne: false
            referencedRelation: "course_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_rules_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          organization_name: string | null
          phone: string | null
          role: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          organization_name?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          organization_name?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          action: string
          granted_at: string | null
          id: string
          resource: string
          role: string
        }
        Insert: {
          action: string
          granted_at?: string | null
          id?: string
          resource: string
          role: string
        }
        Update: {
          action?: string
          granted_at?: string | null
          id?: string
          resource?: string
          role?: string
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
      signature_requests: {
        Row: {
          booking_id: string | null
          contract_template_id: string | null
          created_at: string | null
          declined_at: string | null
          document_type: string
          expires_at: string | null
          id: string
          last_reminder_at: string | null
          metadata: Json | null
          recipient_email: string
          recipient_name: string
          reminder_sent_count: number | null
          sent_at: string | null
          signature_data: string | null
          signed_at: string | null
          signed_document_id: string | null
          signer_ip: string | null
          status: string
          updated_at: string | null
          viewed_at: string | null
        }
        Insert: {
          booking_id?: string | null
          contract_template_id?: string | null
          created_at?: string | null
          declined_at?: string | null
          document_type: string
          expires_at?: string | null
          id?: string
          last_reminder_at?: string | null
          metadata?: Json | null
          recipient_email: string
          recipient_name: string
          reminder_sent_count?: number | null
          sent_at?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signed_document_id?: string | null
          signer_ip?: string | null
          status?: string
          updated_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          booking_id?: string | null
          contract_template_id?: string | null
          created_at?: string | null
          declined_at?: string | null
          document_type?: string
          expires_at?: string | null
          id?: string
          last_reminder_at?: string | null
          metadata?: Json | null
          recipient_email?: string
          recipient_name?: string
          reminder_sent_count?: number | null
          sent_at?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signed_document_id?: string | null
          signer_ip?: string | null
          status?: string
          updated_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "payment_tracking"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      stripe_payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          payment_method: string | null
          receipt_url: string | null
          refund_id: string | null
          refunded_amount: number | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          receipt_url?: string | null
          refund_id?: string | null
          refunded_amount?: number | null
          status: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          receipt_url?: string | null
          refund_id?: string | null
          refunded_amount?: number | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "payment_tracking"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      student_progress: {
        Row: {
          certificate_issued: boolean | null
          completed_at: string | null
          completion_percentage: number | null
          course_template_id: string
          created_at: string | null
          enrollment_id: string
          id: string
          started_at: string | null
          status: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          certificate_issued?: boolean | null
          completed_at?: string | null
          completion_percentage?: number | null
          course_template_id: string
          created_at?: string | null
          enrollment_id: string
          id?: string
          started_at?: string | null
          status?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          certificate_issued?: boolean | null
          completed_at?: string | null
          completion_percentage?: number | null
          course_template_id?: string
          created_at?: string | null
          enrollment_id?: string
          id?: string
          started_at?: string | null
          status?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_course_template_id_fkey"
            columns: ["course_template_id"]
            isOneToOne: false
            referencedRelation: "course_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      thread_subscriptions: {
        Row: {
          id: string
          subscribed_at: string | null
          thread_id: string
          user_id: string
        }
        Insert: {
          id?: string
          subscribed_at?: string | null
          thread_id: string
          user_id: string
        }
        Update: {
          id?: string
          subscribed_at?: string | null
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_subscriptions_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "discussion_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          priority: string | null
          rating: number | null
          resolved_at: string | null
          screenshot_url: string | null
          status: string
          subject: string
          updated_at: string | null
          user_email: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: string | null
          rating?: number | null
          resolved_at?: string | null
          screenshot_url?: string | null
          status?: string
          subject: string
          updated_at?: string | null
          user_email: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string | null
          rating?: number | null
          resolved_at?: string | null
          screenshot_url?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
          user_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      activity_feed: {
        Row: {
          action: string | null
          created_at: string | null
          event_icon: string | null
          event_type: string | null
          id: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_email: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          event_icon?: never
          event_type?: never
          id?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_email?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          event_icon?: never
          event_type?: never
          id?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      payment_tracking: {
        Row: {
          balance_due: number | null
          booking_date: string | null
          booking_id: string | null
          booking_status: string | null
          course_code: string | null
          course_name: string | null
          days_overdue: number | null
          paid_amount: number | null
          payment_status: string | null
          start_datetime: string | null
          student_email: string | null
          student_name: string | null
          total_amount: number | null
        }
        Relationships: []
      }
      student_analytics: {
        Row: {
          avg_rating: number | null
          cancelled_courses: number | null
          completed_courses: number | null
          first_booking_date: string | null
          last_booking_date: string | null
          lifetime_value: number | null
          outstanding_balance: number | null
          student_email: string | null
          student_name: string | null
          student_phone: string | null
          total_bookings: number | null
          total_paid: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_churn_risk: { Args: { p_booking_id: string }; Returns: Json }
      check_user_role: { Args: { check_role: string }; Returns: boolean }
      complete_signature: {
        Args: {
          p_request_id: string
          p_signature_data: string
          p_signer_ip: string
        }
        Returns: string
      }
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
      has_permission: {
        Args: { p_action: string; p_resource: string; p_user_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_new_values?: Json
          p_old_values?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: string
      }
      log_document_access: {
        Args: {
          p_action: string
          p_document_id: string
          p_metadata?: Json
          p_user_id?: string
        }
        Returns: undefined
      }
      schedule_payment_reminder: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      send_signature_reminder: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      universal_search: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          metadata: Json
          relevance: number
          result_id: string
          result_type: string
          subtitle: string
          title: string
        }[]
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

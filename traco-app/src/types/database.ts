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
      achievements: {
        Row: {
          context_data: Json | null
          earned_at: string
          goal_id: string | null
          id: string
          shared: boolean
          tenant_id: string
          type: Database["public"]["Enums"]["achievement_type"]
        }
        Insert: {
          context_data?: Json | null
          earned_at?: string
          goal_id?: string | null
          id?: string
          shared?: boolean
          tenant_id: string
          type: Database["public"]["Enums"]["achievement_type"]
        }
        Update: {
          context_data?: Json | null
          earned_at?: string
          goal_id?: string | null
          id?: string
          shared?: boolean
          tenant_id?: string
          type?: Database["public"]["Enums"]["achievement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "achievements_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnesis_form_versions: {
        Row: {
          answers: Json
          created_at: string
          edit_reason: string | null
          edited_by: string | null
          form_id: string
          id: string
          integrity_hash: string
          is_original: boolean
          signature_png: string | null
          signed_at: string | null
          signer_ip: string | null
          tenant_id: string
          version_number: number
        }
        Insert: {
          answers: Json
          created_at?: string
          edit_reason?: string | null
          edited_by?: string | null
          form_id: string
          id?: string
          integrity_hash: string
          is_original?: boolean
          signature_png?: string | null
          signed_at?: string | null
          signer_ip?: string | null
          tenant_id: string
          version_number: number
        }
        Update: {
          answers?: Json
          created_at?: string
          edit_reason?: string | null
          edited_by?: string | null
          form_id?: string
          id?: string
          integrity_hash?: string
          is_original?: boolean
          signature_png?: string | null
          signed_at?: string | null
          signer_ip?: string | null
          tenant_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_form_versions_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_form_versions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_form_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnesis_forms: {
        Row: {
          answers: Json | null
          client_id: string
          created_at: string
          current_version_id: string | null
          edit_count: number
          expires_at: string
          id: string
          integrity_hash: string | null
          pdf_url: string | null
          public_token: string | null
          signature_png: string | null
          signed_at: string | null
          signer_ip: string | null
          status: string
          template_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          answers?: Json | null
          client_id: string
          created_at?: string
          current_version_id?: string | null
          edit_count?: number
          expires_at?: string
          id?: string
          integrity_hash?: string | null
          pdf_url?: string | null
          public_token?: string | null
          signature_png?: string | null
          signed_at?: string | null
          signer_ip?: string | null
          status?: string
          template_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          answers?: Json | null
          client_id?: string
          created_at?: string
          current_version_id?: string | null
          edit_count?: number
          expires_at?: string
          id?: string
          integrity_hash?: string | null
          pdf_url?: string | null
          public_token?: string | null
          signature_png?: string | null
          signed_at?: string | null
          signer_ip?: string | null
          status?: string
          template_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_forms_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_forms_current_version_id_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_form_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_forms_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_forms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnesis_templates: {
        Row: {
          created_at: string
          fields: Json
          id: string
          is_default: boolean
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fields?: Json
          id?: string
          is_default?: boolean
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fields?: Json
          id?: string
          is_default?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_followups: {
        Row: {
          aftercare_notes: string | null
          appointment_id: string
          client_feedback: string | null
          created_at: string
          id: string
          physical_activity: string | null
          tenant_id: string
          updated_at: string
          water_glasses: number | null
        }
        Insert: {
          aftercare_notes?: string | null
          appointment_id: string
          client_feedback?: string | null
          created_at?: string
          id?: string
          physical_activity?: string | null
          tenant_id: string
          updated_at?: string
          water_glasses?: number | null
        }
        Update: {
          aftercare_notes?: string | null
          appointment_id?: string
          client_feedback?: string | null
          created_at?: string
          id?: string
          physical_activity?: string | null
          tenant_id?: string
          updated_at?: string
          water_glasses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_followups_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_followups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_procedures: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          products_used: Json
          step_times: Json
          technical_notes: string | null
          technique: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          products_used?: Json
          step_times?: Json
          technical_notes?: string | null
          technique?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          products_used?: Json
          step_times?: Json
          technical_notes?: string | null
          technique?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_procedures_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_procedures_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          client_id: string
          created_at: string
          id: string
          notes: string | null
          notes_internal: string | null
          performed_at: string
          price: number
          procedure_id: string
          professional_id: string | null
          return_due_date: string | null
          scheduled_end_at: string | null
          scheduled_start_at: string | null
          source: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          notes_internal?: string | null
          performed_at: string
          price?: number
          procedure_id: string
          professional_id?: string | null
          return_due_date?: string | null
          scheduled_end_at?: string | null
          scheduled_start_at?: string | null
          source?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          notes_internal?: string | null
          performed_at?: string
          price?: number
          procedure_id?: string
          professional_id?: string | null
          return_due_date?: string | null
          scheduled_end_at?: string | null
          scheduled_start_at?: string | null
          source?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_drafts: {
        Row: {
          client_birth_date: string | null
          client_email: string | null
          client_full_name: string
          client_notes: string | null
          client_phone: string
          created_at: string
          id: string
          procedure_id: string
          professional_id: string
          scheduled_start_at: string
          status: string
          studio_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          client_birth_date?: string | null
          client_email?: string | null
          client_full_name: string
          client_notes?: string | null
          client_phone: string
          created_at?: string
          id?: string
          procedure_id: string
          professional_id: string
          scheduled_start_at: string
          status?: string
          studio_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          client_birth_date?: string | null
          client_email?: string | null
          client_full_name?: string
          client_notes?: string | null
          client_phone?: string
          created_at?: string
          id?: string
          procedure_id?: string
          professional_id?: string
          scheduled_start_at?: string
          status?: string
          studio_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_drafts_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_drafts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_drafts_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_drafts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_reactions: {
        Row: {
          appointment_id: string | null
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          occurred_when: string
          photo_urls: string[]
          reaction_type: string
          recorded_at: string
          status: string
          symptoms: string
          tenant_id: string
          treatment: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          occurred_when: string
          photo_urls?: string[]
          reaction_type: string
          recorded_at?: string
          status?: string
          symptoms: string
          tenant_id: string
          treatment?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          occurred_when?: string
          photo_urls?: string[]
          reaction_type?: string
          recorded_at?: string
          status?: string
          symptoms?: string
          tenant_id?: string
          treatment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_reactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          birth_date: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          last_recovery_email_sent_at: string | null
          notes: string | null
          phone: string
          skin_phototype: string | null
          tags: string[]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          last_recovery_email_sent_at?: string | null
          notes?: string | null
          phone: string
          skin_phototype?: string | null
          tags?: string[]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          last_recovery_email_sent_at?: string | null
          notes?: string | null
          phone?: string
          skin_phototype?: string | null
          tags?: string[]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_recurrences: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          next_due_date: string
          parent_expense_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          next_due_date: string
          parent_expense_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          next_due_date?: string
          parent_expense_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_recurrences_parent_expense_id_fkey"
            columns: ["parent_expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_recurrences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          date: string
          description: string
          id: string
          is_recurring: boolean
          linked_product_id: string | null
          notes: string | null
          receipt_url: string | null
          recurrence_pattern: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          date?: string
          description: string
          id?: string
          is_recurring?: boolean
          linked_product_id?: string | null
          notes?: string | null
          receipt_url?: string | null
          recurrence_pattern?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string
          id?: string
          is_recurring?: boolean
          linked_product_id?: string | null
          notes?: string | null
          receipt_url?: string | null
          recurrence_pattern?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_linked_product_id_fkey"
            columns: ["linked_product_id"]
            isOneToOne: false
            referencedRelation: "favorite_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_products: {
        Row: {
          brand: string
          category: string | null
          created_at: string
          default_step_time: number | null
          id: string
          product: string
          tenant_id: string
          use_count: number
        }
        Insert: {
          brand: string
          category?: string | null
          created_at?: string
          default_step_time?: number | null
          id?: string
          product: string
          tenant_id: string
          use_count?: number
        }
        Update: {
          brand?: string
          category?: string | null
          created_at?: string
          default_step_time?: number | null
          id?: string
          product?: string
          tenant_id?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "favorite_products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_reports: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          included_fields: Json
          period_end: string | null
          period_start: string | null
          report_type: Database["public"]["Enums"]["report_type"]
          shared_at: string | null
          storage_path: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          included_fields?: Json
          period_end?: string | null
          period_start?: string | null
          report_type: Database["public"]["Enums"]["report_type"]
          shared_at?: string | null
          storage_path?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          included_fields?: Json
          period_end?: string | null
          period_start?: string | null
          report_type?: Database["public"]["Enums"]["report_type"]
          shared_at?: string | null
          storage_path?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          achieved_at: string | null
          ai_strategy_generated_at: string | null
          ai_strategy_text: string | null
          created_at: string
          created_by: string | null
          current_value: number
          description: string | null
          end_date: string
          id: string
          milestones_reached: number
          period_type: Database["public"]["Enums"]["goal_period"]
          start_date: string
          status: Database["public"]["Enums"]["goal_status"]
          target_value: number
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["goal_type"]
          updated_at: string
        }
        Insert: {
          achieved_at?: string | null
          ai_strategy_generated_at?: string | null
          ai_strategy_text?: string | null
          created_at?: string
          created_by?: string | null
          current_value?: number
          description?: string | null
          end_date: string
          id?: string
          milestones_reached?: number
          period_type: Database["public"]["Enums"]["goal_period"]
          start_date: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_value: number
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["goal_type"]
          updated_at?: string
        }
        Update: {
          achieved_at?: string | null
          ai_strategy_generated_at?: string | null
          ai_strategy_text?: string | null
          created_at?: string
          created_by?: string | null
          current_value?: number
          description?: string | null
          end_date?: string
          id?: string
          milestones_reached?: number
          period_type?: Database["public"]["Enums"]["goal_period"]
          start_date?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_value?: number
          tenant_id?: string
          title?: string
          type?: Database["public"]["Enums"]["goal_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_key_photo: boolean
          notes: string | null
          procedure_id: string | null
          storage_path: string
          taken_at: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_key_photo?: boolean
          notes?: string | null
          procedure_id?: string | null
          storage_path: string
          taken_at?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_key_photo?: boolean
          notes?: string | null
          procedure_id?: string | null
          storage_path?: string
          taken_at?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      procedures: {
        Row: {
          color: string
          created_at: string
          default_price: number
          default_return_days: number
          id: string
          is_active: boolean
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          default_price?: number
          default_return_days?: number
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          default_price?: number
          default_return_days?: number
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedures_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_notes: {
        Row: {
          appointment_id: string | null
          client_id: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          pinned: boolean
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          pinned?: boolean
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          pinned?: boolean
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services: {
        Row: {
          created_at: string
          custom_price: number | null
          duration_minutes: number
          id: string
          is_active: boolean
          procedure_id: string
          professional_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_price?: number | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          procedure_id: string
          professional_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_price?: number | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          procedure_id?: string
          professional_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          profile_id: string
          rating: number
          role_title: string | null
          sort_order: number
          studio_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          profile_id: string
          rating?: number
          role_title?: string | null
          sort_order?: number
          studio_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          profile_id?: string
          rating?: number
          role_title?: string | null
          sort_order?: number
          studio_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sharing_preferences: {
        Row: {
          created_at: string
          custom_brand_color: string | null
          default_template: Database["public"]["Enums"]["sharing_template"]
          id: string
          never_show_expenses: boolean
          never_show_profit: boolean
          never_show_revenue: boolean
          tenant_id: string
          updated_at: string
          watermark_enabled: boolean
        }
        Insert: {
          created_at?: string
          custom_brand_color?: string | null
          default_template?: Database["public"]["Enums"]["sharing_template"]
          id?: string
          never_show_expenses?: boolean
          never_show_profit?: boolean
          never_show_revenue?: boolean
          tenant_id: string
          updated_at?: string
          watermark_enabled?: boolean
        }
        Update: {
          created_at?: string
          custom_brand_color?: string | null
          default_template?: Database["public"]["Enums"]["sharing_template"]
          id?: string
          never_show_expenses?: boolean
          never_show_profit?: boolean
          never_show_revenue?: boolean
          tenant_id?: string
          updated_at?: string
          watermark_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sharing_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          address: string | null
          bio: string | null
          booking_buffer_minutes: number
          cover_image_url: string | null
          created_at: string
          id: string
          is_solo: boolean
          name: string
          rating: number
          reviews_count: number
          slug: string
          tenant_id: string
          timezone: string
          updated_at: string
          waitlist_enabled: boolean
        }
        Insert: {
          address?: string | null
          bio?: string | null
          booking_buffer_minutes?: number
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_solo?: boolean
          name: string
          rating?: number
          reviews_count?: number
          slug: string
          tenant_id: string
          timezone?: string
          updated_at?: string
          waitlist_enabled?: boolean
        }
        Update: {
          address?: string | null
          bio?: string | null
          booking_buffer_minutes?: number
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_solo?: boolean
          name?: string
          rating?: number
          reviews_count?: number
          slug?: string
          tenant_id?: string
          timezone?: string
          updated_at?: string
          waitlist_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "studios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          accent_color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          whatsapp_template: string | null
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          whatsapp_template?: string | null
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          whatsapp_template?: string | null
        }
        Relationships: []
      }
      time_off: {
        Row: {
          created_at: string
          end_at: string
          id: string
          is_recurring: boolean
          professional_id: string
          reason: string | null
          start_at: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_at: string
          id?: string
          is_recurring?: boolean
          professional_id: string
          reason?: string | null
          start_at: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_at?: string
          id?: string
          is_recurring?: boolean
          professional_id?: string
          reason?: string | null
          start_at?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_off_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_entries: {
        Row: {
          client_email: string | null
          client_full_name: string
          client_phone: string
          created_at: string
          id: string
          preferred_date: string
          procedure_id: string | null
          professional_id: string | null
          status: string
          studio_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          client_email?: string | null
          client_full_name: string
          client_phone: string
          created_at?: string
          id?: string
          preferred_date: string
          procedure_id?: string | null
          professional_id?: string | null
          status?: string
          studio_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          client_email?: string | null
          client_full_name?: string
          client_phone?: string
          created_at?: string
          id?: string
          preferred_date?: string
          procedure_id?: string | null
          professional_id?: string | null
          status?: string
          studio_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      working_hours: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          professional_id: string
          start_time: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          professional_id: string
          start_time: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          professional_id?: string
          start_time?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_hours_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      refresh_active_goals: { Args: { p_tenant_id: string }; Returns: number }
      tenant_id: { Args: never; Returns: string }
      update_goal_progress: { Args: { p_goal_id: string }; Returns: number }
    }
    Enums: {
      achievement_type:
        | "first_client"
        | "tenth_client"
        | "hundredth_client"
        | "first_recovery"
        | "streak_7"
        | "streak_30"
        | "monthly_record"
        | "goal_25"
        | "goal_50"
        | "goal_75"
        | "goal_100"
        | "big_recovery"
        | "first_month_pro"
      expense_category:
        | "products"
        | "rent"
        | "marketing"
        | "transport"
        | "equipment"
        | "tax"
        | "other"
      goal_period: "week" | "month" | "quarter" | "year"
      goal_status: "active" | "achieved" | "failed" | "cancelled"
      goal_type:
        | "revenue"
        | "appointments"
        | "new_clients"
        | "recovered_clients"
        | "custom"
      report_type:
        | "daily"
        | "weekly"
        | "monthly"
        | "achievement"
        | "goal_milestone"
        | "custom"
      sharing_template: "minimal" | "operational" | "full"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      achievement_type: [
        "first_client",
        "tenth_client",
        "hundredth_client",
        "first_recovery",
        "streak_7",
        "streak_30",
        "monthly_record",
        "goal_25",
        "goal_50",
        "goal_75",
        "goal_100",
        "big_recovery",
        "first_month_pro",
      ],
      expense_category: [
        "products",
        "rent",
        "marketing",
        "transport",
        "equipment",
        "tax",
        "other",
      ],
      goal_period: ["week", "month", "quarter", "year"],
      goal_status: ["active", "achieved", "failed", "cancelled"],
      goal_type: [
        "revenue",
        "appointments",
        "new_clients",
        "recovered_clients",
        "custom",
      ],
      report_type: [
        "daily",
        "weekly",
        "monthly",
        "achievement",
        "goal_milestone",
        "custom",
      ],
      sharing_template: ["minimal", "operational", "full"],
    },
  },
} as const

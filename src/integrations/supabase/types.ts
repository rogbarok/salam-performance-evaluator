export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      criteria: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          scale: string
          type: string
          updated_at: string
          weight: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
          scale: string
          type: string
          updated_at?: string
          weight: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          scale?: string
          type?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      employee_evaluations: {
        Row: {
          created_at: string
          employee_id: string
          hari_alpa: number
          hari_izin: number
          hari_sakit: number
          id: string
          inisiatif: number
          kerjasama: number
          keterlambatan: number
          kualitas_kerja: number
          kuantitas_kerja: number
          pemahaman_tugas: number
          prestasi: number
          pulang_cepat: number
          surat_peringatan: number
          tanggung_jawab: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          hari_alpa?: number
          hari_izin?: number
          hari_sakit?: number
          id?: string
          inisiatif: number
          kerjasama: number
          keterlambatan?: number
          kualitas_kerja: number
          kuantitas_kerja: number
          pemahaman_tugas: number
          prestasi?: number
          pulang_cepat?: number
          surat_peringatan?: number
          tanggung_jawab: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          hari_alpa?: number
          hari_izin?: number
          hari_sakit?: number
          id?: string
          inisiatif?: number
          kerjasama?: number
          keterlambatan?: number
          kualitas_kerja?: number
          kuantitas_kerja?: number
          pemahaman_tugas?: number
          prestasi?: number
          pulang_cepat?: number
          surat_peringatan?: number
          tanggung_jawab?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          department: string
          email: string
          hire_date: string
          id: string
          name: string
          position: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          email: string
          hire_date: string
          id?: string
          name: string
          position: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          email?: string
          hire_date?: string
          id?: string
          name?: string
          position?: string
          updated_at?: string
        }
        Relationships: []
      }
      evaluation_scores: {
        Row: {
          created_at: string
          criteria_id: string
          employee_id: string
          id: string
          score: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          criteria_id: string
          employee_id: string
          id?: string
          score?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          criteria_id?: string
          employee_id?: string
          id?: string
          score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_scores_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_scores_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      saw_calculations: {
        Row: {
          calculation_date: string
          created_at: string
          id: string
          total_criteria: number
          total_employees: number
        }
        Insert: {
          calculation_date?: string
          created_at?: string
          id?: string
          total_criteria: number
          total_employees: number
        }
        Update: {
          calculation_date?: string
          created_at?: string
          id?: string
          total_criteria?: number
          total_employees?: number
        }
        Relationships: []
      }
      saw_normalized_matrix: {
        Row: {
          calculation_date: string
          created_at: string
          criteria_code: string
          employee_id: string
          id: string
          normalized_value: number
          raw_value: number
          weight: number
        }
        Insert: {
          calculation_date?: string
          created_at?: string
          criteria_code: string
          employee_id: string
          id?: string
          normalized_value: number
          raw_value: number
          weight: number
        }
        Update: {
          calculation_date?: string
          created_at?: string
          criteria_code?: string
          employee_id?: string
          id?: string
          normalized_value?: number
          raw_value?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "saw_normalized_matrix_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      saw_results: {
        Row: {
          calculation_date: string
          converted_score: number
          created_at: string
          employee_id: string
          final_score: number
          id: string
          note: string | null
          rank: number
          recommendation: string
        }
        Insert: {
          calculation_date?: string
          converted_score: number
          created_at?: string
          employee_id: string
          final_score: number
          id?: string
          note?: string | null
          rank: number
          recommendation: string
        }
        Update: {
          calculation_date?: string
          converted_score?: number
          created_at?: string
          employee_id?: string
          final_score?: number
          id?: string
          note?: string | null
          rank?: number
          recommendation?: string
        }
        Relationships: [
          {
            foreignKeyName: "saw_results_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
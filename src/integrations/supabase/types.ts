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
      achievements: {
        Row: {
          achieved_at: string
          client_id: string
          goal_type: string
          id: string
          month: number
          points: number
          type: string
          year: number
        }
        Insert: {
          achieved_at?: string
          client_id: string
          goal_type: string
          id?: string
          month: number
          points?: number
          type: string
          year: number
        }
        Update: {
          achieved_at?: string
          client_id?: string
          goal_type?: string
          id?: string
          month?: number
          points?: number
          type?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "achievements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          atividade: string | null
          cnpj: string
          contador_user_id: string
          created_at: string | null
          data_abertura: string | null
          id: string
          limite_faturamento_anual: number | null
          mei_user_id: string
          razao_social: string
          tipo_atividade: string | null
          updated_at: string | null
        }
        Insert: {
          atividade?: string | null
          cnpj: string
          contador_user_id: string
          created_at?: string | null
          data_abertura?: string | null
          id?: string
          limite_faturamento_anual?: number | null
          mei_user_id: string
          razao_social: string
          tipo_atividade?: string | null
          updated_at?: string | null
        }
        Update: {
          atividade?: string | null
          cnpj?: string
          contador_user_id?: string
          created_at?: string | null
          data_abertura?: string | null
          id?: string
          limite_faturamento_anual?: number | null
          mei_user_id?: string
          razao_social?: string
          tipo_atividade?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_contador_user_id_fkey"
            columns: ["contador_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_mei_user_id_fkey"
            columns: ["mei_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contador_expenses: {
        Row: {
          categoria: string
          client_id: string | null
          contador_user_id: string
          created_at: string
          data: string
          descricao: string | null
          id: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string
          client_id?: string | null
          contador_user_id: string
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string
          client_id?: string | null
          contador_user_id?: string
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contador_expenses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contador_expenses_contador_user_id_fkey"
            columns: ["contador_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contador_invitations: {
        Row: {
          accepted_at: string | null
          contador_email: string
          contador_user_id: string | null
          created_at: string
          expires_at: string
          id: string
          invite_token: string
          mei_user_id: string
          permissions: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          contador_email: string
          contador_user_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invite_token?: string
          mei_user_id: string
          permissions?: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          contador_email?: string
          contador_user_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invite_token?: string
          mei_user_id?: string
          permissions?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "contador_invitations_contador_user_id_fkey"
            columns: ["contador_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contador_revenues: {
        Row: {
          categoria: string
          client_id: string | null
          contador_user_id: string
          created_at: string
          data: string
          descricao: string | null
          id: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string
          client_id?: string | null
          contador_user_id: string
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string
          client_id?: string | null
          contador_user_id?: string
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contador_revenues_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contador_revenues_contador_user_id_fkey"
            columns: ["contador_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          ativo: boolean
          cargo: string
          client_id: string
          cpf: string
          created_at: string
          data_admissao: string
          data_demissao: string | null
          id: string
          jornada: string
          nome_completo: string
          salario_bruto: number
          tipo_contrato: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cargo: string
          client_id: string
          cpf: string
          created_at?: string
          data_admissao: string
          data_demissao?: string | null
          id?: string
          jornada?: string
          nome_completo: string
          salario_bruto: number
          tipo_contrato?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cargo?: string
          client_id?: string
          cpf?: string
          created_at?: string
          data_admissao?: string
          data_demissao?: string | null
          id?: string
          jornada?: string
          nome_completo?: string
          salario_bruto?: number
          tipo_contrato?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          categoria: string | null
          client_id: string
          created_at: string | null
          data: string
          descricao: string | null
          id: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          categoria?: string | null
          client_id: string
          created_at?: string | null
          data: string
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          categoria?: string | null
          client_id?: string
          created_at?: string | null
          data?: string
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "expenses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      labor_provisions: {
        Row: {
          ano: number
          created_at: string
          employee_id: string
          id: string
          mes: number
          provisao_decimo_terceiro: number
          provisao_ferias: number
          provisao_fgts: number
          total_provisao: number
        }
        Insert: {
          ano: number
          created_at?: string
          employee_id: string
          id?: string
          mes: number
          provisao_decimo_terceiro?: number
          provisao_ferias?: number
          provisao_fgts?: number
          total_provisao?: number
        }
        Update: {
          ano?: number
          created_at?: string
          employee_id?: string
          id?: string
          mes?: number
          provisao_decimo_terceiro?: number
          provisao_ferias?: number
          provisao_fgts?: number
          total_provisao?: number
        }
        Relationships: [
          {
            foreignKeyName: "labor_provisions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_goals: {
        Row: {
          client_id: string
          created_at: string
          expense_reduction_goal: number
          expense_reduction_type: string
          id: string
          month: number
          profit_goal: number
          revenue_goal: number
          sales_count_goal: number
          updated_at: string
          year: number
        }
        Insert: {
          client_id: string
          created_at?: string
          expense_reduction_goal?: number
          expense_reduction_type?: string
          id?: string
          month: number
          profit_goal?: number
          revenue_goal?: number
          sales_count_goal?: number
          updated_at?: string
          year: number
        }
        Update: {
          client_id?: string
          created_at?: string
          expense_reduction_goal?: number
          expense_reduction_type?: string
          id?: string
          month?: number
          profit_goal?: number
          revenue_goal?: number
          sales_count_goal?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_goals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          client_id: string
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      obligations: {
        Row: {
          ano_referencia: number | null
          client_id: string
          created_at: string | null
          data_pagamento: string | null
          id: string
          mes_referencia: number | null
          pago: boolean | null
          tipo: string
          updated_at: string | null
          valor: number | null
          vencimento: string | null
        }
        Insert: {
          ano_referencia?: number | null
          client_id: string
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          mes_referencia?: number | null
          pago?: boolean | null
          tipo: string
          updated_at?: string | null
          valor?: number | null
          vencimento?: string | null
        }
        Update: {
          ano_referencia?: number | null
          client_id?: string
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          mes_referencia?: number | null
          pago?: boolean | null
          tipo?: string
          updated_at?: string | null
          valor?: number | null
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obligations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_calculations: {
        Row: {
          ano: number
          created_at: string
          custo_total: number
          employee_id: string
          fgts: number
          fgts_adicional: number
          id: string
          inss_empregado: number
          inss_empregador: number
          mes: number
          salario_bruto: number
          salario_liquido: number
        }
        Insert: {
          ano: number
          created_at?: string
          custo_total: number
          employee_id: string
          fgts?: number
          fgts_adicional?: number
          id?: string
          inss_empregado?: number
          inss_empregador?: number
          mes: number
          salario_bruto: number
          salario_liquido: number
        }
        Update: {
          ano?: number
          created_at?: string
          custo_total?: number
          employee_id?: string
          fgts?: number
          fgts_adicional?: number
          id?: string
          inss_empregado?: number
          inss_empregador?: number
          mes?: number
          salario_bruto?: number
          salario_liquido?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_calculations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_calculations: {
        Row: {
          client_id: string
          created_at: string
          custo_embalagem: number
          custo_gasolina: number
          custo_produto: number
          custo_taxas: number
          custo_total_unitario: number
          custo_transporte: number
          despesas_fixas_mensais: number
          id: string
          lucro_unitario: number
          margem_desejada: number
          margem_real: number
          nome: string
          preco_venda: number
          quantidade_vendas: number
          tipo: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          custo_embalagem?: number
          custo_gasolina?: number
          custo_produto?: number
          custo_taxas?: number
          custo_total_unitario?: number
          custo_transporte?: number
          despesas_fixas_mensais?: number
          id?: string
          lucro_unitario?: number
          margem_desejada?: number
          margem_real?: number
          nome: string
          preco_venda?: number
          quantidade_vendas?: number
          tipo?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          custo_embalagem?: number
          custo_gasolina?: number
          custo_produto?: number
          custo_taxas?: number
          custo_total_unitario?: number
          custo_transporte?: number
          despesas_fixas_mensais?: number
          id?: string
          lucro_unitario?: number
          margem_desejada?: number
          margem_real?: number
          nome?: string
          preco_venda?: number
          quantidade_vendas?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cpf_cnpj: string | null
          created_at: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          cpf_cnpj?: string | null
          created_at?: string | null
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          cpf_cnpj?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          client_id: string
          created_at: string
          expense_growth: number | null
          id: string
          period_end: string
          period_start: string
          profit: number
          profit_margin: number
          report_data: Json | null
          revenue_growth: number | null
          total_expenses: number
          total_revenue: number
        }
        Insert: {
          client_id: string
          created_at?: string
          expense_growth?: number | null
          id?: string
          period_end: string
          period_start: string
          profit?: number
          profit_margin?: number
          report_data?: Json | null
          revenue_growth?: number | null
          total_expenses?: number
          total_revenue?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          expense_growth?: number | null
          id?: string
          period_end?: string
          period_start?: string
          profit?: number
          profit_margin?: number
          report_data?: Json | null
          revenue_growth?: number | null
          total_expenses?: number
          total_revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      revenues: {
        Row: {
          categoria: string | null
          client_id: string
          created_at: string | null
          data: string
          descricao: string | null
          id: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          categoria?: string | null
          client_id: string
          created_at?: string | null
          data: string
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          categoria?: string | null
          client_id?: string
          created_at?: string | null
          data?: string
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "revenues_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      terminations: {
        Row: {
          aviso_previo: number
          created_at: string
          data_desligamento: string
          decimo_terceiro: number
          employee_id: string
          ferias_proporcionais: number
          ferias_vencidas: number
          id: string
          multa_fgts: number
          saldo_salario: number
          terco_ferias: number
          tipo_rescisao: string
          total_rescisao: number
        }
        Insert: {
          aviso_previo?: number
          created_at?: string
          data_desligamento: string
          decimo_terceiro?: number
          employee_id: string
          ferias_proporcionais?: number
          ferias_vencidas?: number
          id?: string
          multa_fgts?: number
          saldo_salario?: number
          terco_ferias?: number
          tipo_rescisao: string
          total_rescisao?: number
        }
        Update: {
          aviso_previo?: number
          created_at?: string
          data_desligamento?: string
          decimo_terceiro?: number
          employee_id?: string
          ferias_proporcionais?: number
          ferias_vencidas?: number
          id?: string
          multa_fgts?: number
          saldo_salario?: number
          terco_ferias?: number
          tipo_rescisao?: string
          total_rescisao?: number
        }
        Relationships: [
          {
            foreignKeyName: "terminations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
      get_user_email: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "mei" | "contador" | "admin"
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
      app_role: ["mei", "contador", "admin"],
    },
  },
} as const

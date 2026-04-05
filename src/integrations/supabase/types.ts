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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author_id: string
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      broker_lead_interactions: {
        Row: {
          broker_id: string
          created_at: string
          description: string
          id: string
          lead_id: string
          next_contact_date: string | null
          type: Database["public"]["Enums"]["interaction_type"]
        }
        Insert: {
          broker_id: string
          created_at?: string
          description: string
          id?: string
          lead_id: string
          next_contact_date?: string | null
          type?: Database["public"]["Enums"]["interaction_type"]
        }
        Update: {
          broker_id?: string
          created_at?: string
          description?: string
          id?: string
          lead_id?: string
          next_contact_date?: string | null
          type?: Database["public"]["Enums"]["interaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "broker_lead_interactions_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "broker_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_leads: {
        Row: {
          broker_id: string
          created_at: string
          email: string | null
          id: string
          installment_value: number | null
          interest_value: number | null
          name: string
          notes: string | null
          phone: string | null
          preferred_neighborhoods: string[] | null
          priority: Database["public"]["Enums"]["lead_priority"]
          property_type_interest: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          broker_id: string
          created_at?: string
          email?: string | null
          id?: string
          installment_value?: number | null
          interest_value?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          preferred_neighborhoods?: string[] | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          property_type_interest?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          broker_id?: string
          created_at?: string
          email?: string | null
          id?: string
          installment_value?: number | null
          interest_value?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          preferred_neighborhoods?: string[] | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          property_type_interest?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_leads_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_proposals: {
        Row: {
          broker_id: string
          conditions: string | null
          counter_value: number | null
          created_at: string
          id: string
          lead_id: string
          property_id: string
          proposed_value: number
          status: Database["public"]["Enums"]["proposal_status"]
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          broker_id: string
          conditions?: string | null
          counter_value?: number | null
          created_at?: string
          id?: string
          lead_id: string
          property_id: string
          proposed_value: number
          status?: Database["public"]["Enums"]["proposal_status"]
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          broker_id?: string
          conditions?: string | null
          counter_value?: number | null
          created_at?: string
          id?: string
          lead_id?: string
          property_id?: string
          proposed_value?: number
          status?: Database["public"]["Enums"]["proposal_status"]
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_proposals_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "broker_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_proposals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "db_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_reviews: {
        Row: {
          broker_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_reviews_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_tasks: {
        Row: {
          broker_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          priority: Database["public"]["Enums"]["lead_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          type: Database["public"]["Enums"]["task_type"]
          updated_at: string
        }
        Insert: {
          broker_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
        }
        Update: {
          broker_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_tasks_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "broker_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      brokers: {
        Row: {
          commission_rate: number | null
          company_name: string | null
          created_at: string
          creci: string
          id: string
          is_active: boolean
          slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_rate?: number | null
          company_name?: string | null
          created_at?: string
          creci: string
          id?: string
          is_active?: boolean
          slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_rate?: number | null
          company_name?: string | null
          created_at?: string
          creci?: string
          id?: string
          is_active?: boolean
          slug?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      db_properties: {
        Row: {
          accepts_pets: boolean | null
          area: number
          availability: Database["public"]["Enums"]["property_availability"]
          available_from: string | null
          bathrooms: number
          bedrooms: number
          broker_id: string | null
          city: string
          condominium_fee: number | null
          created_at: string
          description: string | null
          features: string[] | null
          furnished: boolean | null
          id: string
          image_url: string | null
          images: string[] | null
          iptu: number | null
          is_highlight: boolean
          land_area: number
          latitude: number | null
          location: string
          longitude: number | null
          min_contract_months: number | null
          neighborhood_data: Json | null
          parking_spaces: number
          price: number
          rental_price: number | null
          slug: string | null
          state: string
          status: Database["public"]["Enums"]["property_status"]
          title: string
          type: Database["public"]["Enums"]["property_type"]
          updated_at: string
          virtual_tour_url: string | null
        }
        Insert: {
          accepts_pets?: boolean | null
          area?: number
          availability?: Database["public"]["Enums"]["property_availability"]
          available_from?: string | null
          bathrooms?: number
          bedrooms?: number
          broker_id?: string | null
          city: string
          condominium_fee?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          furnished?: boolean | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          iptu?: number | null
          is_highlight?: boolean
          land_area?: number
          latitude?: number | null
          location: string
          longitude?: number | null
          min_contract_months?: number | null
          neighborhood_data?: Json | null
          parking_spaces?: number
          price: number
          rental_price?: number | null
          slug?: string | null
          state?: string
          status?: Database["public"]["Enums"]["property_status"]
          title: string
          type?: Database["public"]["Enums"]["property_type"]
          updated_at?: string
          virtual_tour_url?: string | null
        }
        Update: {
          accepts_pets?: boolean | null
          area?: number
          availability?: Database["public"]["Enums"]["property_availability"]
          available_from?: string | null
          bathrooms?: number
          bedrooms?: number
          broker_id?: string | null
          city?: string
          condominium_fee?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          furnished?: boolean | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          iptu?: number | null
          is_highlight?: boolean
          land_area?: number
          latitude?: number | null
          location?: string
          longitude?: number | null
          min_contract_months?: number | null
          neighborhood_data?: Json | null
          parking_spaces?: number
          price?: number
          rental_price?: number | null
          slug?: string | null
          state?: string
          status?: Database["public"]["Enums"]["property_status"]
          title?: string
          type?: Database["public"]["Enums"]["property_type"]
          updated_at?: string
          virtual_tour_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "db_properties_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "db_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_property_visits: {
        Row: {
          broker_id: string
          created_at: string
          feedback: string | null
          id: string
          interest_level: number | null
          lead_id: string
          property_id: string
          status: Database["public"]["Enums"]["visit_status"]
          updated_at: string
          visit_date: string
        }
        Insert: {
          broker_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          interest_level?: number | null
          lead_id: string
          property_id: string
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
          visit_date: string
        }
        Update: {
          broker_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          interest_level?: number | null
          lead_id?: string
          property_id?: string
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_property_visits_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_property_visits_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "broker_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_property_visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "db_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          broker_id: string
          category: Database["public"]["Enums"]["template_category"]
          created_at: string
          id: string
          name: string
          stage: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          body: string
          broker_id: string
          category?: Database["public"]["Enums"]["template_category"]
          created_at?: string
          id?: string
          name: string
          stage?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          broker_id?: string
          category?: Database["public"]["Enums"]["template_category"]
          created_at?: string
          id?: string
          name?: string
          stage?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      property_views: {
        Row: {
          created_at: string
          id: string
          property_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "db_properties"
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
      generate_slug: { Args: { input: string }; Returns: string }
      get_active_broker: {
        Args: { _broker_id: string }
        Returns: {
          company_name: string
          creci: string
          id: string
          is_active: boolean
          user_id: string
        }[]
      }
      get_broker_by_slug: {
        Args: { _slug: string }
        Returns: {
          company_name: string
          creci: string
          id: string
          is_active: boolean
          user_id: string
        }[]
      }
      get_property_by_slug: {
        Args: { _slug: string }
        Returns: {
          accepts_pets: boolean
          area: number
          availability: Database["public"]["Enums"]["property_availability"]
          available_from: string
          bathrooms: number
          bedrooms: number
          broker_id: string
          city: string
          condominium_fee: number
          description: string
          features: string[]
          furnished: boolean
          id: string
          image_url: string
          images: string[]
          iptu: number
          is_highlight: boolean
          land_area: number
          latitude: number
          location: string
          longitude: number
          min_contract_months: number
          parking_spaces: number
          price: number
          rental_price: number
          slug: string
          state: string
          status: Database["public"]["Enums"]["property_status"]
          title: string
          type: Database["public"]["Enums"]["property_type"]
          virtual_tour_url: string
        }[]
      }
      get_property_view_counts: {
        Args: { days_back?: number }
        Returns: {
          property_id: string
          view_count: number
        }[]
      }
      get_public_profile: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          display_name: string
          phone: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "broker"
      interaction_type:
        | "ligacao"
        | "whatsapp"
        | "email"
        | "visita"
        | "reuniao"
        | "outro"
      lead_priority: "baixa" | "media" | "alta"
      lead_source:
        | "site"
        | "indicacao"
        | "portais"
        | "redes_sociais"
        | "telefone"
        | "outro"
      lead_status:
        | "novo"
        | "em_contato"
        | "qualificado"
        | "proposta"
        | "fechado"
        | "perdido"
      property_availability: "available" | "unavailable"
      property_status: "venda" | "aluguel" | "lancamento"
      property_type:
        | "casa"
        | "apartamento"
        | "cobertura"
        | "terreno"
        | "fazenda"
        | "mansao"
        | "kitnet"
        | "flat"
        | "loft"
        | "casa_condominio"
        | "sitio_chacara"
      proposal_status:
        | "rascunho"
        | "enviada"
        | "em_analise"
        | "aceita"
        | "recusada"
        | "expirada"
      task_status: "pendente" | "em_andamento" | "concluida" | "cancelada"
      task_type:
        | "ligacao"
        | "visita"
        | "documento"
        | "reuniao"
        | "follow_up"
        | "outro"
      template_category: "whatsapp" | "email"
      visit_status: "agendada" | "realizada" | "cancelada" | "no_show"
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
      app_role: ["admin", "broker"],
      interaction_type: [
        "ligacao",
        "whatsapp",
        "email",
        "visita",
        "reuniao",
        "outro",
      ],
      lead_priority: ["baixa", "media", "alta"],
      lead_source: [
        "site",
        "indicacao",
        "portais",
        "redes_sociais",
        "telefone",
        "outro",
      ],
      lead_status: [
        "novo",
        "em_contato",
        "qualificado",
        "proposta",
        "fechado",
        "perdido",
      ],
      property_availability: ["available", "unavailable"],
      property_status: ["venda", "aluguel", "lancamento"],
      property_type: [
        "casa",
        "apartamento",
        "cobertura",
        "terreno",
        "fazenda",
        "mansao",
        "kitnet",
        "flat",
        "loft",
        "casa_condominio",
        "sitio_chacara",
      ],
      proposal_status: [
        "rascunho",
        "enviada",
        "em_analise",
        "aceita",
        "recusada",
        "expirada",
      ],
      task_status: ["pendente", "em_andamento", "concluida", "cancelada"],
      task_type: [
        "ligacao",
        "visita",
        "documento",
        "reuniao",
        "follow_up",
        "outro",
      ],
      template_category: ["whatsapp", "email"],
      visit_status: ["agendada", "realizada", "cancelada", "no_show"],
    },
  },
} as const

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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          color: string
          created_at: string
          date: string
          id: string
          notes: string | null
          nutritionist_id: string
          patient_id: string | null
          status: string
          time_end: string
          time_start: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          nutritionist_id: string
          patient_id?: string | null
          status?: string
          time_end: string
          time_start: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          nutritionist_id?: string
          patient_id?: string | null
          status?: string
          time_end?: string
          time_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      food_diary_entries: {
        Row: {
          created_at: string
          date: string
          description: string
          feedback_at: string | null
          feedback_read_at: string | null
          id: string
          meal_type: string
          notes: string | null
          nutritionist_feedback: string | null
          patient_id: string
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string
          description: string
          feedback_at?: string | null
          feedback_read_at?: string | null
          id?: string
          meal_type: string
          notes?: string | null
          nutritionist_feedback?: string | null
          patient_id: string
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          feedback_at?: string | null
          feedback_read_at?: string | null
          id?: string
          meal_type?: string
          notes?: string | null
          nutritionist_feedback?: string | null
          patient_id?: string
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_diary_entries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_daily_checks: {
        Row: {
          check_date: string
          created_at: string
          goal_id: string
          id: string
          patient_id: string
        }
        Insert: {
          check_date?: string
          created_at?: string
          goal_id: string
          id?: string
          patient_id: string
        }
        Update: {
          check_date?: string
          created_at?: string
          goal_id?: string
          id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_daily_checks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "patient_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_daily_checks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_food_items: {
        Row: {
          calories: number | null
          carbs: number | null
          fat: number | null
          fiber: number | null
          food_name: string
          id: string
          is_substitute: boolean
          meal_option_id: string
          protein: number | null
          quantity: string | null
          sodium: number | null
          sort_order: number
          unit: string | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          fat?: number | null
          fiber?: number | null
          food_name: string
          id?: string
          is_substitute?: boolean
          meal_option_id: string
          protein?: number | null
          quantity?: string | null
          sodium?: number | null
          sort_order?: number
          unit?: string | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          fat?: number | null
          fiber?: number | null
          food_name?: string
          id?: string
          is_substitute?: boolean
          meal_option_id?: string
          protein?: number | null
          quantity?: string | null
          sodium?: number | null
          sort_order?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_food_items_meal_option_id_fkey"
            columns: ["meal_option_id"]
            isOneToOne: false
            referencedRelation: "meal_options"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          meal_id: string
          sort_order: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          meal_id: string
          sort_order?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          meal_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_images_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_options: {
        Row: {
          id: string
          image_url: string | null
          meal_id: string
          name: string
          recipe_id: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          image_url?: string | null
          meal_id: string
          name?: string
          recipe_id?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          image_url?: string | null
          meal_id?: string
          name?: string
          recipe_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_options_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_options_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          nutritionist_id: string
          patient_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          nutritionist_id: string
          patient_id?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          nutritionist_id?: string
          patient_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          location: string | null
          meal_plan_id: string
          name: string
          sort_order: number
          time: string | null
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          meal_plan_id: string
          name?: string
          sort_order?: number
          time?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          meal_plan_id?: string
          name?: string
          sort_order?: number
          time?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_nutritionist_id: string
          conversation_patient_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_user_id: string
        }
        Insert: {
          content: string
          conversation_nutritionist_id: string
          conversation_patient_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_user_id: string
        }
        Update: {
          content?: string
          conversation_nutritionist_id?: string
          conversation_patient_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_patient_id_fkey"
            columns: ["conversation_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_anamnesis: {
        Row: {
          alcohol: string | null
          bowel_function: string | null
          created_at: string
          current_medications: string | null
          daily_routine: string | null
          dietary_recall: string | null
          digestive_symptoms: string | null
          exercise_routine: string | null
          family_history: string | null
          food_aversions: string | null
          food_intolerances: string | null
          food_preferences: string | null
          general_notes: string | null
          id: string
          nutritionist_id: string
          patient_id: string
          previous_diets: string | null
          previous_diseases: string | null
          sleep_quality: string | null
          smoking: string | null
          surgeries: string | null
          updated_at: string
        }
        Insert: {
          alcohol?: string | null
          bowel_function?: string | null
          created_at?: string
          current_medications?: string | null
          daily_routine?: string | null
          dietary_recall?: string | null
          digestive_symptoms?: string | null
          exercise_routine?: string | null
          family_history?: string | null
          food_aversions?: string | null
          food_intolerances?: string | null
          food_preferences?: string | null
          general_notes?: string | null
          id?: string
          nutritionist_id: string
          patient_id: string
          previous_diets?: string | null
          previous_diseases?: string | null
          sleep_quality?: string | null
          smoking?: string | null
          surgeries?: string | null
          updated_at?: string
        }
        Update: {
          alcohol?: string | null
          bowel_function?: string | null
          created_at?: string
          current_medications?: string | null
          daily_routine?: string | null
          dietary_recall?: string | null
          digestive_symptoms?: string | null
          exercise_routine?: string | null
          family_history?: string | null
          food_aversions?: string | null
          food_intolerances?: string | null
          food_preferences?: string | null
          general_notes?: string | null
          id?: string
          nutritionist_id?: string
          patient_id?: string
          previous_diets?: string | null
          previous_diseases?: string | null
          sleep_quality?: string | null
          smoking?: string | null
          surgeries?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_anamnesis_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_goals: {
        Row: {
          category: Database["public"]["Enums"]["goal_category"]
          completed_at: string | null
          created_at: string
          current_value: string | null
          deadline: string | null
          description: string | null
          id: string
          nutritionist_id: string
          patient_id: string
          status: Database["public"]["Enums"]["goal_status"]
          target_value: string | null
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["goal_category"]
          completed_at?: string | null
          created_at?: string
          current_value?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          nutritionist_id: string
          patient_id: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_value?: string | null
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["goal_category"]
          completed_at?: string | null
          created_at?: string
          current_value?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          nutritionist_id?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_value?: string | null
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_goals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          allergies: string | null
          auth_user_id: string | null
          birthdate: string | null
          cpf: string | null
          created_at: string
          email: string | null
          goal: string | null
          height: number | null
          id: string
          medical_conditions: string | null
          name: string
          notes: string | null
          nutritionist_id: string
          phone: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          auth_user_id?: string | null
          birthdate?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          goal?: string | null
          height?: number | null
          id?: string
          medical_conditions?: string | null
          name: string
          notes?: string | null
          nutritionist_id: string
          phone?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          address?: string | null
          allergies?: string | null
          auth_user_id?: string | null
          birthdate?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          goal?: string | null
          height?: number | null
          id?: string
          medical_conditions?: string | null
          name?: string
          notes?: string | null
          nutritionist_id?: string
          phone?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          nutritionist_id: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          nutritionist_id: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          nutritionist_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      nutritionists: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string
          crn: string | null
          full_name: string | null
          id: string
          phone: string | null
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          crn?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          crn?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          calories: number | null
          carbs: number | null
          fat: number | null
          fiber: number | null
          food_name: string
          id: string
          protein: number | null
          quantity: string | null
          recipe_id: string
          sodium: number | null
          sort_order: number
          unit: string | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          fat?: number | null
          fiber?: number | null
          food_name: string
          id?: string
          protein?: number | null
          quantity?: string | null
          recipe_id: string
          sodium?: number | null
          sort_order?: number
          unit?: string | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          fat?: number | null
          fiber?: number | null
          food_name?: string
          id?: string
          protein?: number | null
          quantity?: string | null
          recipe_id?: string
          sodium?: number | null
          sort_order?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          notes: string | null
          nutritionist_id: string
          prep_time: string | null
          servings: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          nutritionist_id: string
          prep_time?: string | null
          servings?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          nutritionist_id?: string
          prep_time?: string | null
          servings?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      taco_foods: {
        Row: {
          calories: number | null
          carbs: number | null
          category: string
          description: string
          fat: number | null
          fiber: number | null
          id: number
          nutritionist_id: string | null
          protein: number | null
          sodium: number | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          category: string
          description: string
          fat?: number | null
          fiber?: number | null
          id?: number
          nutritionist_id?: string | null
          protein?: number | null
          sodium?: number | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          category?: string
          description?: string
          fat?: number | null
          fiber?: number | null
          id?: number
          nutritionist_id?: string | null
          protein?: number | null
          sodium?: number | null
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_nutritionist_owner: {
        Args: { nutritionist_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "nutritionist" | "patient"
      goal_category: "peso" | "medida" | "habito" | "nutricional" | "outro"
      goal_status: "ativa" | "concluida" | "cancelada"
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
      app_role: ["nutritionist", "patient"],
      goal_category: ["peso", "medida", "habito", "nutricional", "outro"],
      goal_status: ["ativa", "concluida", "cancelada"],
    },
  },
} as const

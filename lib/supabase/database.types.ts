// Hand-written in the shape of `supabase gen types typescript` output, for the
// schema after migrations 20261015000000_teams_onboarding_roles and
// 20261015000100_workspace_tables. Row, Functions and Relationships mirror the
// CLI. Insert and Update are narrowed to what the `authenticated` role is
// granted, so a write the database would reject fails to compile instead.
//   * Update lists only the granted columns. UPDATE is column-level, and a
//     PATCH naming any other column fails with 42501.
//   * Insert is `never` on profiles, teams and team_members: the client has no
//     INSERT there (profiles come from the signup trigger, teams and
//     memberships from the RPCs).
//   * projects, task_items, polls and events grant table-level INSERT, so
//     their Insert is CLI-shaped.
//   * poll_votes is SELECT-only (Insert and Update `never`): every ballot
//     write goes through set_poll_vote.
// `.upsert()` fails with 42501 on every table: on conflict it SETs ungranted
// columns. When regenerating with the CLI, re-apply the narrowing.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // __InternalSupabase omitted: live PostgREST version unknown (OpenAPI root needs a secret key), so the client assumes v12.
  public: {
    Tables: {
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string
          id: string
          start_time: string
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type: string
          id?: string
          start_time: string
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          option_ids: string[]
          poll_id: string
          updated_at: string
          user_id: string
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          allow_multiple: boolean
          closes_at: string | null
          color: string
          created_at: string
          created_by: string | null
          id: string
          image_uri: string | null
          is_open: boolean
          options: Json
          question: string
          team_id: string
          updated_at: string
        }
        Insert: {
          allow_multiple?: boolean
          closes_at?: string | null
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_uri?: string | null
          is_open?: boolean
          options?: Json
          question: string
          team_id: string
          updated_at?: string
        }
        Update: {
          allow_multiple?: boolean
          closes_at?: string | null
          color?: string
          image_uri?: string | null
          is_open?: boolean
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          grade: string | null
          id: string
          is_coach: boolean
          last_name: string | null
          updated_at: string
        }
        Insert: never
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          first_name?: string | null
          grade?: string | null
          is_coach?: boolean
          last_name?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          assigned_members: string[]
          banner_uri: string | null
          color: string
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          editors: string[]
          id: string
          image_uri: string | null
          name: string
          progress: number
          subtasks: Json
          team_id: string
          updated_at: string
        }
        Insert: {
          assigned_members?: string[]
          banner_uri?: string | null
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          editors?: string[]
          id?: string
          image_uri?: string | null
          name: string
          progress?: number
          subtasks?: Json
          team_id: string
          updated_at?: string
        }
        Update: {
          assigned_members?: string[]
          banner_uri?: string | null
          color?: string
          description?: string
          due_date?: string | null
          editors?: string[]
          image_uri?: string | null
          name?: string
          progress?: number
          subtasks?: Json
        }
        Relationships: [
          {
            foreignKeyName: "projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      task_items: {
        Row: {
          assigned_members: string[]
          color: string
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          due_time: string | null
          editors: string[]
          id: string
          override_flag: boolean
          parent_project_id: string | null
          progress: number
          subtasks: Json
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_members?: string[]
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          due_time?: string | null
          editors?: string[]
          id?: string
          override_flag?: boolean
          parent_project_id?: string | null
          progress?: number
          subtasks?: Json
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_members?: string[]
          color?: string
          description?: string
          due_date?: string | null
          due_time?: string | null
          editors?: string[]
          override_flag?: boolean
          parent_project_id?: string | null
          progress?: number
          subtasks?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_items_parent_project_fkey"
            columns: ["parent_project_id", "team_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "team_id"]
          },
          {
            foreignKeyName: "task_items_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          joined_at: string
          role: string
          team_id: string
          title: string | null
          user_id: string
          work_roles: string[]
        }
        Insert: never
        Update: {
          title?: string | null
          work_roles?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          join_code: string
          name: string
          team_number: number | null
        }
        Insert: never
        Update: {
          name?: string
          team_number?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_team: {
        Args: { p_name: string; p_team_number?: number }
        Returns: string
      }
      generate_join_code: { Args: never; Returns: string }
      is_team_admin: { Args: { p_team_id: string }; Returns: boolean }
      is_team_creator: { Args: { p_team_id: string }; Returns: boolean }
      is_team_member: { Args: { p_team_id: string }; Returns: boolean }
      join_team: { Args: { p_code: string }; Returns: string }
      regenerate_join_code: { Args: { p_team_id: string }; Returns: string }
      remove_member: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: undefined
      }
      set_member_role: {
        Args: { p_role: string; p_team_id: string; p_user_id: string }
        Returns: undefined
      }
      set_poll_vote: {
        Args: { p_option_ids: string[]; p_poll_id: string }
        Returns: undefined
      }
      shares_team_with: { Args: { p_user_id: string }; Returns: boolean }
      team_is_empty: { Args: { p_team_id: string }; Returns: boolean }
      // Typed string like the CLI emits, but null at runtime for a non-member.
      team_role: { Args: { p_team_id: string }; Returns: string }
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

// Hand-maintained aliases below: keep them when regenerating.

export type TeamRole = "owner" | "admin" | "member"

export type ProfileRow = Tables<"profiles">
export type TeamRow = Tables<"teams">
// Gen types emit the CHECK-constrained text column as string; the narrowing lives here so Database's Row types stay as the CLI emits them.
export type TeamMemberRow = Omit<Tables<"team_members">, "role"> & { role: TeamRole }
export type ProjectRow = Tables<"projects">
export type TaskItemRow = Tables<"task_items">
export type PollRow = Tables<"polls">
export type PollVoteRow = Tables<"poll_votes">
export type EventRow = Tables<"events">

export type ProjectInsert = TablesInsert<"projects">
export type ProjectUpdate = TablesUpdate<"projects">
export type TaskItemInsert = TablesInsert<"task_items">
export type TaskItemUpdate = TablesUpdate<"task_items">
export type PollInsert = TablesInsert<"polls">
export type PollUpdate = TablesUpdate<"polls">
export type EventInsert = TablesInsert<"events">
export type EventUpdate = TablesUpdate<"events">
export type ProfileUpdate = TablesUpdate<"profiles">
export type TeamMemberUpdate = TablesUpdate<"team_members">

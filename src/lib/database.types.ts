export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      habits: {
        Row: {
          id: string
          user_id: string
          title: string
          frequency: number
          frequency_period: string
          category: string
          scheduled_days: number[] | null
          habit_type: string
          reminder_time: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          frequency?: number
          frequency_period?: string
          category?: string
          scheduled_days?: number[] | null
          habit_type?: string
          reminder_time?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          frequency?: number
          frequency_period?: string
          category?: string
          scheduled_days?: number[] | null
          habit_type?: string
          reminder_time?: string | null
          created_at?: string
        }
      }
      completions: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          completed_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          completed_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          completed_at?: string
        }
      }
      streak_freezes: {
        Row: {
          id: string
          user_id: string
          habit_id: string
          used_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          habit_id: string
          used_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          habit_id?: string
          used_at?: string
          created_at?: string
        }
      }
    }
  }
}

export type Habit = Database['public']['Tables']['habits']['Row']
export type HabitInsert = Database['public']['Tables']['habits']['Insert']
export type HabitUpdate = Database['public']['Tables']['habits']['Update']
export type Completion = Database['public']['Tables']['completions']['Row']
export type CompletionInsert = Database['public']['Tables']['completions']['Insert']
export type StreakFreeze = Database['public']['Tables']['streak_freezes']['Row']
export type StreakFreezeInsert = Database['public']['Tables']['streak_freezes']['Insert']

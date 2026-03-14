import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Habit, HabitInsert, HabitUpdate, Completion } from '@/lib/database.types'
import {
  format,
  startOfDay,
  eachDayOfInterval,
  subDays,
  differenceInCalendarDays,
  isSameDay,
} from 'date-fns'

export function useHabits() {
  const { user } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<Completion[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHabits = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setHabits(data)
  }, [user])

  const fetchCompletions = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('completions')
      .select('*')
    if (data) setCompletions(data)
  }, [user])

  useEffect(() => {
    if (!user) {
      setHabits([])
      setCompletions([])
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([fetchHabits(), fetchCompletions()]).finally(() => setLoading(false))
  }, [user, fetchHabits, fetchCompletions])

  const addHabit = async (habit: Omit<HabitInsert, 'user_id'>) => {
    if (!user) return
    const newHabit: HabitInsert = { ...habit, user_id: user.id }

    // Optimistic update
    const tempId = crypto.randomUUID()
    const optimistic: Habit = {
      id: tempId,
      user_id: user.id,
      title: habit.title,
      frequency: habit.frequency ?? 1,
      frequency_period: habit.frequency_period ?? 'week',
      category: habit.category ?? 'general',
      times_per_day: habit.times_per_day ?? 1,
      created_at: new Date().toISOString(),
    }
    setHabits(prev => [...prev, optimistic])

    const { data, error } = await supabase
      .from('habits')
      .insert(newHabit)
      .select()
      .single()

    if (error) {
      setHabits(prev => prev.filter(h => h.id !== tempId))
      return
    }
    setHabits(prev => prev.map(h => (h.id === tempId ? data : h)))
  }

  const updateHabit = async (id: string, updates: HabitUpdate) => {
    // Optimistic update
    const previous = habits.find(h => h.id === id)
    setHabits(prev => prev.map(h => (h.id === id ? { ...h, ...updates } : h)))

    const { error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)

    if (error && previous) {
      setHabits(prev => prev.map(h => (h.id === id ? previous : h)))
    }
  }

  const deleteHabit = async (id: string) => {
    // Optimistic update
    const previous = habits
    const previousCompletions = completions
    setHabits(prev => prev.filter(h => h.id !== id))
    setCompletions(prev => prev.filter(c => c.habit_id !== id))

    const { error } = await supabase.from('habits').delete().eq('id', id)

    if (error) {
      setHabits(previous)
      setCompletions(previousCompletions)
    }
  }

  const getCompletionCount = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return completions.filter(c => c.habit_id === habitId && c.completed_at === dateStr).length
  }

  const addCompletion = async (habitId: string, date: Date) => {
    if (!user) return
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return
    const dateStr = format(date, 'yyyy-MM-dd')
    const currentCount = getCompletionCount(habitId, date)
    if (currentCount >= habit.times_per_day) return

    const tempId = crypto.randomUUID()
    const optimistic: Completion = {
      id: tempId,
      habit_id: habitId,
      user_id: user.id,
      completed_at: dateStr,
    }
    setCompletions(prev => [...prev, optimistic])

    const { data, error } = await supabase
      .from('completions')
      .insert({ habit_id: habitId, user_id: user.id, completed_at: dateStr })
      .select()
      .single()

    if (error) {
      setCompletions(prev => prev.filter(c => c.id !== tempId))
    } else if (data) {
      setCompletions(prev => prev.map(c => (c.id === tempId ? data : c)))
    }
  }

  const removeCompletion = async (habitId: string, date: Date) => {
    if (!user) return
    const dateStr = format(date, 'yyyy-MM-dd')
    const existing = completions.filter(
      c => c.habit_id === habitId && c.completed_at === dateStr
    )
    if (existing.length === 0) return

    // Remove the last one added
    const toRemove = existing[existing.length - 1]
    setCompletions(prev => prev.filter(c => c.id !== toRemove.id))
    const { error } = await supabase.from('completions').delete().eq('id', toRemove.id)
    if (error) {
      setCompletions(prev => [...prev, toRemove])
    }
  }

  const toggleCompletion = async (habitId: string, date: Date) => {
    if (!user) return
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return

    const currentCount = getCompletionCount(habitId, date)

    if (currentCount >= habit.times_per_day) {
      // Fully completed — remove all completions for this day
      const dateStr = format(date, 'yyyy-MM-dd')
      const existing = completions.filter(
        c => c.habit_id === habitId && c.completed_at === dateStr
      )
      setCompletions(prev => prev.filter(c => !existing.some(e => e.id === c.id)))
      for (const comp of existing) {
        const { error } = await supabase.from('completions').delete().eq('id', comp.id)
        if (error) {
          setCompletions(prev => [...prev, comp])
        }
      }
    } else {
      // Add one more completion
      await addCompletion(habitId, date)
    }
  }

  const isCompleted = (habitId: string, date: Date) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return false
    return getCompletionCount(habitId, date) >= habit.times_per_day
  }

  const getStreak = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId)
    const requiredCount = habit?.times_per_day ?? 1

    // Count completions per date, only include dates where all iterations are done
    const countByDate = new Map<string, number>()
    for (const c of completions) {
      if (c.habit_id !== habitId) continue
      countByDate.set(c.completed_at, (countByDate.get(c.completed_at) ?? 0) + 1)
    }

    const habitCompletions = [...countByDate.entries()]
      .filter(([, count]) => count >= requiredCount)
      .map(([dateStr]) => startOfDay(new Date(dateStr + 'T00:00:00')))
      .sort((a, b) => b.getTime() - a.getTime())

    if (habitCompletions.length === 0) return { current: 0, longest: 0 }

    // Current streak
    let current = 0
    const today = startOfDay(new Date())

    // Check if today or yesterday has a completion to start streak
    const startDay = isSameDay(habitCompletions[0], today)
      ? today
      : differenceInCalendarDays(today, habitCompletions[0]) === 1
        ? habitCompletions[0]
        : null

    if (startDay) {
      for (let i = 0; i < habitCompletions.length; i++) {
        const expected = subDays(startDay, i)
        if (isSameDay(habitCompletions[i], expected)) {
          current++
        } else {
          break
        }
      }
    }

    // Longest streak
    let longest = 1
    let run = 1
    for (let i = 1; i < habitCompletions.length; i++) {
      if (differenceInCalendarDays(habitCompletions[i - 1], habitCompletions[i]) === 1) {
        run++
        longest = Math.max(longest, run)
      } else {
        run = 1
      }
    }

    return { current, longest: Math.max(longest, current) }
  }

  const getHeatmapData = (habitId?: string) => {
    const today = startOfDay(new Date())
    const startDate = subDays(today, 364)
    const days = eachDayOfInterval({ start: startDate, end: today })

    const filtered = habitId
      ? completions.filter(c => c.habit_id === habitId)
      : completions

    const countMap = new Map<string, number>()
    for (const c of filtered) {
      const key = c.completed_at
      countMap.set(key, (countMap.get(key) ?? 0) + 1)
    }

    return days.map(day => ({
      date: day,
      dateStr: format(day, 'yyyy-MM-dd'),
      count: countMap.get(format(day, 'yyyy-MM-dd')) ?? 0,
    }))
  }

  return {
    habits,
    completions,
    loading,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleCompletion,
    addCompletion,
    removeCompletion,
    getCompletionCount,
    isCompleted,
    getStreak,
    getHeatmapData,
  }
}

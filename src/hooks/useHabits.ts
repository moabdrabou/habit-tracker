import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Habit, HabitInsert, HabitUpdate, Completion, StreakFreeze } from '@/lib/database.types'
import {
  format,
  startOfDay,
  eachDayOfInterval,
  subDays,
  differenceInCalendarDays,
  isSameDay,
  startOfMonth,
  getDay,
} from 'date-fns'

const MAX_ACTIVE_HABITS = 12
const FREEZES_PER_MONTH = 2

export function getTimesPerDay(habit: Habit): number {
  return habit.frequency_period === 'day' ? habit.frequency : 1
}

export function isScheduledForDay(habit: Habit, date: Date): boolean {
  if (!habit.scheduled_days || habit.scheduled_days.length === 0) return true
  return habit.scheduled_days.includes(getDay(date))
}

export function useHabits() {
  const { user } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<Completion[]>([])
  const [freezes, setFreezes] = useState<StreakFreeze[]>([])
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

  const fetchFreezes = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('streak_freezes')
      .select('*')
    if (data) setFreezes(data)
  }, [user])

  useEffect(() => {
    if (!user) {
      setHabits([])
      setCompletions([])
      setFreezes([])
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([fetchHabits(), fetchCompletions(), fetchFreezes()]).finally(() => setLoading(false))
  }, [user, fetchHabits, fetchCompletions, fetchFreezes])

  const addHabit = async (habit: Omit<HabitInsert, 'user_id'>) => {
    if (!user) return
    if (habits.length >= MAX_ACTIVE_HABITS) {
      throw new Error(`Maximum ${MAX_ACTIVE_HABITS} habits allowed. Delete a habit first.`)
    }

    const newHabit: HabitInsert = { ...habit, user_id: user.id }

    const tempId = crypto.randomUUID()
    const optimistic: Habit = {
      id: tempId,
      user_id: user.id,
      title: habit.title,
      frequency: habit.frequency ?? 1,
      frequency_period: habit.frequency_period ?? 'week',
      category: habit.category ?? 'general',
      scheduled_days: habit.scheduled_days ?? null,
      habit_type: habit.habit_type ?? 'build',
      reminder_time: habit.reminder_time ?? null,
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

  const resetCompletions = async (habitId: string, date: Date) => {
    if (!user) return
    const dateStr = format(date, 'yyyy-MM-dd')
    const existing = completions.filter(
      c => c.habit_id === habitId && c.completed_at === dateStr
    )
    if (existing.length === 0) return

    setCompletions(prev => prev.filter(c => !existing.some(e => e.id === c.id)))
    for (const comp of existing) {
      const { error } = await supabase.from('completions').delete().eq('id', comp.id)
      if (error) {
        setCompletions(prev => [...prev, comp])
      }
    }
  }

  const deleteHabit = async (id: string) => {
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
    if (currentCount >= getTimesPerDay(habit)) return

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

    // For avoid habits: toggling means marking a failure (adding a completion)
    if (habit.habit_type === 'avoid') {
      const currentCount = getCompletionCount(habitId, date)
      if (currentCount > 0) {
        // Remove failure mark — back to "avoided successfully"
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
        // Mark failure
        await addCompletion(habitId, date)
      }
      return
    }

    // Build habits: existing toggle logic
    const currentCount = getCompletionCount(habitId, date)

    if (currentCount >= getTimesPerDay(habit)) {
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
      await addCompletion(habitId, date)
    }
  }

  const isCompleted = (habitId: string, date: Date) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return false

    if (habit.habit_type === 'avoid') {
      // For avoid habits: completed (success) means NO completions
      return getCompletionCount(habitId, date) === 0
    }

    return getCompletionCount(habitId, date) >= getTimesPerDay(habit)
  }

  // Check if a day is frozen for a habit
  const isDayFrozen = (habitId: string, dateStr: string) => {
    return freezes.some(f => f.habit_id === habitId && f.used_at === dateStr)
  }

  const getStreak = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return { current: 0, longest: 0 }

    const isAvoid = habit.habit_type === 'avoid'
    const requiredCount = isAvoid ? 0 : getTimesPerDay(habit)

    // Count completions per date
    const countByDate = new Map<string, number>()
    for (const c of completions) {
      if (c.habit_id !== habitId) continue
      countByDate.set(c.completed_at, (countByDate.get(c.completed_at) ?? 0) + 1)
    }

    // Collect frozen dates for this habit
    const frozenDates = new Set(
      freezes.filter(f => f.habit_id === habitId).map(f => f.used_at)
    )

    // Check if a specific date counts as "done"
    const isDayDone = (dateStr: string, date: Date) => {
      // Frozen days always count
      if (frozenDates.has(dateStr)) return true
      // Skip non-scheduled days (they don't count but don't break streak)
      if (!isScheduledForDay(habit, date)) return null // null = skip
      if (isAvoid) {
        return (countByDate.get(dateStr) ?? 0) === 0
      }
      return (countByDate.get(dateStr) ?? 0) >= requiredCount
    }

    const today = startOfDay(new Date())
    const habitCreated = startOfDay(new Date(habit.created_at))

    // Current streak: count backwards from today
    let current = 0
    let checkDate = today
    let started = false

    while (differenceInCalendarDays(checkDate, habitCreated) >= 0) {
      const dateStr = format(checkDate, 'yyyy-MM-dd')
      const result = isDayDone(dateStr, checkDate)

      if (result === null) {
        // Non-scheduled day, skip it
        checkDate = subDays(checkDate, 1)
        continue
      }

      if (result) {
        started = true
        current++
      } else {
        // For today, if not done yet, don't break — just don't count
        if (isSameDay(checkDate, today) && !started) {
          checkDate = subDays(checkDate, 1)
          continue
        }
        break
      }
      checkDate = subDays(checkDate, 1)
    }

    // Longest streak: scan all days from creation to today
    let longest = 0
    let run = 0
    const allDays = eachDayOfInterval({ start: habitCreated, end: today })

    for (const day of allDays) {
      const dateStr = format(day, 'yyyy-MM-dd')
      const result = isDayDone(dateStr, day)

      if (result === null) continue // skip non-scheduled
      if (result) {
        run++
        longest = Math.max(longest, run)
      } else {
        run = 0
      }
    }

    return { current, longest: Math.max(longest, current) }
  }

  // Streak freeze functions
  const getFreezesRemaining = (habitId: string) => {
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const usedThisMonth = freezes.filter(
      f => f.habit_id === habitId && f.used_at >= monthStart
    ).length
    return Math.max(0, FREEZES_PER_MONTH - usedThisMonth)
  }

  const addFreeze = async (habitId: string) => {
    if (!user) return
    if (getFreezesRemaining(habitId) <= 0) return

    const todayStr = format(new Date(), 'yyyy-MM-dd')
    // Don't freeze if already frozen today
    if (isDayFrozen(habitId, todayStr)) return

    const tempId = crypto.randomUUID()
    const optimistic: StreakFreeze = {
      id: tempId,
      user_id: user.id,
      habit_id: habitId,
      used_at: todayStr,
      created_at: new Date().toISOString(),
    }
    setFreezes(prev => [...prev, optimistic])

    const { data, error } = await supabase
      .from('streak_freezes')
      .insert({ user_id: user.id, habit_id: habitId, used_at: todayStr })
      .select()
      .single()

    if (error) {
      setFreezes(prev => prev.filter(f => f.id !== tempId))
    } else if (data) {
      setFreezes(prev => prev.map(f => (f.id === tempId ? data : f)))
    }
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
    freezes,
    loading,
    addHabit,
    updateHabit,
    deleteHabit,
    resetCompletions,
    toggleCompletion,
    addCompletion,
    removeCompletion,
    getCompletionCount,
    isCompleted,
    getStreak,
    getHeatmapData,
    getFreezesRemaining,
    addFreeze,
    isDayFrozen,
    maxActiveHabits: MAX_ACTIVE_HABITS,
  }
}

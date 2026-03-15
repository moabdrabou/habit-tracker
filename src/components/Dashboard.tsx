import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useHabits, isScheduledForDay } from '@/hooks/useHabits'
import { HabitCard } from './HabitCard'
import { HabitDialog } from './HabitDialog'
import { Heatmap } from './Heatmap'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Plus, LogOut, Target, Flame, Trophy, CalendarDays, BarChart3 } from 'lucide-react'
import { format } from 'date-fns'
import type { Habit } from '@/lib/database.types'
import {
  requestNotificationPermission,
  startReminderChecker,
  stopReminderChecker,
} from '@/lib/notifications'

interface DashboardProps {
  onNavigateStats: () => void
}

export function Dashboard({ onNavigateStats }: DashboardProps) {
  const { displayName, signOut } = useAuth()
  const {
    habits,
    loading,
    addHabit,
    updateHabit,
    deleteHabit,
    resetCompletions,
    toggleCompletion,
    getCompletionCount,
    isCompleted,
    getStreak,
    getHeatmapData,
    getFreezesRemaining,
    addFreeze,
    isDayFrozen,
    maxActiveHabits,
  } = useHabits()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [addError, setAddError] = useState<string | null>(null)

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  // Only count scheduled habits for today's progress
  const scheduledToday = habits.filter(h => isScheduledForDay(h, today))
  const todayCompleted = scheduledToday.filter(h => isCompleted(h.id, today)).length
  const todayProgress = scheduledToday.length > 0 ? (todayCompleted / scheduledToday.length) * 100 : 0

  const totalCurrentStreak = habits.reduce((sum, h) => sum + getStreak(h.id).current, 0)
  const bestStreak = Math.max(0, ...habits.map(h => getStreak(h.id).longest))
  const heatmapData = getHeatmapData()

  // Start reminder checker
  useEffect(() => {
    const habitsWithReminders = habits.filter(h => h.reminder_time)
    if (habitsWithReminders.length > 0) {
      requestNotificationPermission()
      startReminderChecker(habits, isCompleted)
    }
    return () => stopReminderChecker()
  }, [habits, isCompleted])

  const handleSave = async (data: {
    title: string
    frequency: number
    frequency_period: string
    category: string
    habit_type: string
    scheduled_days: number[] | null
    reminder_time: string | null
  }) => {
    setAddError(null)
    try {
      if (editingHabit) {
        await updateHabit(editingHabit.id, data)
      } else {
        await addHabit(data)
      }
    } catch (err) {
      if (err instanceof Error) setAddError(err.message)
    }
    setEditingHabit(null)
  }

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit)
    setDialogOpen(true)
  }

  const handleNew = () => {
    setAddError(null)
    setEditingHabit(null)
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const emptySlots = Math.max(0, maxActiveHabits - habits.length)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Habit Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onNavigateStats} title="Stats">
              <BarChart3 className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {displayName}
            </span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CalendarDays className="h-4 w-4" />
              Today
            </div>
            <p className="text-2xl font-bold">{todayCompleted}/{scheduledToday.length}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              Progress
            </div>
            <Progress value={todayProgress} className="mt-2" />
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
              Active Streaks
            </div>
            <p className="text-2xl font-bold">{totalCurrentStreak}d</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Best Streak
            </div>
            <p className="text-2xl font-bold">{bestStreak}d</p>
          </Card>
        </div>

        {/* Heatmap */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Heatmap data={heatmapData} />
          </CardContent>
        </Card>

        {/* Slots counter */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Today — {format(today, 'EEEE, MMMM d')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {habits.length}/{maxActiveHabits} slots used
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleNew} size="sm" disabled={habits.length >= maxActiveHabits}>
              <Plus className="h-4 w-4 mr-1" />
              Add Habit
            </Button>
          </div>
        </div>

        {addError && (
          <p className="text-sm text-destructive">{addError}</p>
        )}

        {/* Habit grid with slots */}
        {habits.length === 0 && !showArchived ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No habits yet</p>
            <p className="text-sm mt-1">Create your first habit to start tracking</p>
            <Button onClick={handleNew} className="mt-4">
              <Plus className="h-4 w-4 mr-1" />
              Create Habit
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {habits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                completed={isCompleted(habit.id, today)}
                completionCount={getCompletionCount(habit.id, today)}
                streak={getStreak(habit.id)}
                freezesRemaining={getFreezesRemaining(habit.id)}
                isFrozenToday={isDayFrozen(habit.id, todayStr)}
                onToggle={() => toggleCompletion(habit.id, today)}
                onEdit={() => handleEdit(habit)}
                onDelete={() => deleteHabit(habit.id)}
                onReset={() => resetCompletions(habit.id, today)}
                onFreeze={() => addFreeze(habit.id)}
              />
            ))}
            {/* Empty slots */}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <button
                key={`empty-${i}`}
                onClick={handleNew}
                className="border-2 border-dashed border-muted rounded-xl p-4 min-h-[80px] flex items-center justify-center text-muted-foreground hover:border-primary/30 hover:text-primary/50 transition-colors cursor-pointer"
              >
                <Plus className="h-5 w-5" />
              </button>
            ))}
          </div>
        )}

      </main>

      <HabitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        habit={editingHabit}
        onSave={handleSave}
      />
    </div>
  )
}

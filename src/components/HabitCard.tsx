import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StreakRing } from '@/components/StreakRing'
import { Pencil, Trash2, Flame, Trophy, RotateCcw, ShieldCheck, ShieldX, Snowflake } from 'lucide-react'
import type { Habit } from '@/lib/database.types'
import { getTimesPerDay, isScheduledForDay } from '@/hooks/useHabits'

const CATEGORY_COLORS: Record<string, string> = {
  health: 'bg-green-500/15 text-green-700 dark:text-green-400',
  fitness: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  learning: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  productivity: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  mindfulness: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400',
  social: 'bg-pink-500/15 text-pink-700 dark:text-pink-400',
  finance: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  hobby: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400',
  general: 'bg-gray-500/15 text-gray-700 dark:text-gray-400',
}

interface HabitCardProps {
  habit: Habit
  completed: boolean
  completionCount: number
  streak: { current: number; longest: number }
  freezesRemaining: number
  isFrozenToday: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onReset: () => void
  onFreeze: () => void
}

export function HabitCard({
  habit,
  completed,
  completionCount,
  streak,
  freezesRemaining,
  isFrozenToday,
  onToggle,
  onEdit,
  onDelete,
  onReset,
  onFreeze,
}: HabitCardProps) {
  const colorClass = CATEGORY_COLORS[habit.category] ?? CATEGORY_COLORS.general
  const isAvoid = habit.habit_type === 'avoid'
  const isMulti = !isAvoid && getTimesPerDay(habit) > 1
  const timesPerDay = getTimesPerDay(habit)
  const progress = isAvoid
    ? (completed ? 1 : 0)
    : Math.min(completionCount / timesPerDay, 1)
  const scheduledToday = isScheduledForDay(habit, new Date())

  // Determine streak ring status
  const getStatus = (): 'on-track' | 'at-risk' | 'broken' => {
    if (isFrozenToday) return 'on-track'
    if (completed) return 'on-track'
    if (streak.current > 0) return 'at-risk'
    return 'broken'
  }

  // For avoid habits: failed means they have completions (broke the habit)
  const avoidFailed = isAvoid && completionCount > 0

  return (
    <Card className={`p-4 transition-all ${
      !scheduledToday ? 'opacity-50' : ''
    } ${isFrozenToday ? 'border-blue-500/30' : ''}`}>
      <div className="flex items-center gap-3">
        {/* Streak Ring replaces checkbox/progress circle */}
        {isAvoid ? (
          <div className="relative">
            <StreakRing
              progress={completed ? 1 : 0}
              streakDays={streak.current}
              size={40}
              status={getStatus()}
              onClick={onToggle}
              label={avoidFailed ? '!' : undefined}
            />
            {avoidFailed ? (
              <ShieldX className="absolute -bottom-1 -right-1 h-4 w-4 text-red-500" />
            ) : (
              <ShieldCheck className="absolute -bottom-1 -right-1 h-4 w-4 text-emerald-500" />
            )}
          </div>
        ) : (
          <StreakRing
            progress={progress}
            streakDays={isMulti ? completionCount : streak.current}
            size={40}
            status={getStatus()}
            onClick={onToggle}
            label={isMulti ? `${completionCount}/${timesPerDay}` : undefined}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${completed && !isAvoid ? 'line-through text-muted-foreground' : ''} ${avoidFailed ? 'text-red-500' : ''}`}>
              {habit.title}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
              {habit.category}
            </span>
            {isAvoid && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${avoidFailed ? 'bg-red-500/15 text-red-500' : 'bg-emerald-500/15 text-emerald-500'}`}>
                {avoidFailed ? 'Failed' : 'Avoided'}
              </span>
            )}
            {isFrozenToday && (
              <Snowflake className="h-3.5 w-3.5 text-blue-400" />
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              {streak.current}d streak
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-yellow-500" />
              Best: {streak.longest}d
            </span>
            {!isAvoid && (
              <span>{habit.frequency}x/{habit.frequency_period ?? 'week'}</span>
            )}
            {habit.scheduled_days && habit.scheduled_days.length > 0 && habit.scheduled_days.length < 7 && (
              <span className="text-muted-foreground/70">
                {habit.scheduled_days.map(d => ['S','M','T','W','T','F','S'][d]).join('')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Freeze button */}
          {!completed && !isFrozenToday && freezesRemaining > 0 && scheduledToday && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-400 hover:text-blue-300"
              onClick={onFreeze}
              title={`Freeze streak (${freezesRemaining}/2 left this month)`}
            >
              <Snowflake className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          {completionCount > 0 && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onReset} title="Reset today's completions">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

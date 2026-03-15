import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Pencil, Trash2, Flame, Trophy, Minus, Plus } from 'lucide-react'
import type { Habit } from '@/lib/database.types'
import { getTimesPerDay } from '@/hooks/useHabits'

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
  onToggle: () => void
  onIncrement: () => void
  onDecrement: () => void
  onEdit: () => void
  onDelete: () => void
}

export function HabitCard({ habit, completed, completionCount, streak, onToggle, onIncrement, onDecrement, onEdit, onDelete }: HabitCardProps) {
  const colorClass = CATEGORY_COLORS[habit.category] ?? CATEGORY_COLORS.general
  const isMulti = getTimesPerDay(habit) > 1
  const progress = Math.min(completionCount / getTimesPerDay(habit), 1)

  return (
    <Card className={`p-4 transition-all ${completed ? 'opacity-75' : ''}`}>
      <div className="flex items-center gap-3">
        {isMulti ? (
          <div className="relative flex items-center justify-center h-9 w-9 shrink-0">
            <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-muted/30"
              />
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${progress * 94.25} 94.25`}
                strokeLinecap="round"
                className={completed ? 'text-emerald-500' : 'text-primary'}
              />
            </svg>
            <span className="absolute text-[10px] font-bold">
              {completionCount}/{getTimesPerDay(habit)}
            </span>
          </div>
        ) : (
          <Checkbox
            checked={completed}
            onCheckedChange={onToggle}
            className="h-5 w-5"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${completed ? 'line-through text-muted-foreground' : ''}`}>
              {habit.title}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
              {habit.category}
            </span>
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
            <span>{habit.frequency}x/{habit.frequency_period ?? 'week'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isMulti && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onDecrement}
                disabled={completionCount === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onIncrement}
                disabled={completed}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

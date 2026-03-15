import { useState, useEffect, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Habit } from '@/lib/database.types'

const CATEGORIES = [
  'finance',
  'fitness',
  'general',
  'health',
  'hobby',
  'learning',
  'mindfulness',
  'productivity',
  'social',
]

const DAYS = [
  { value: 0, label: 'Sun', short: 'S' },
  { value: 1, label: 'Mon', short: 'M' },
  { value: 2, label: 'Tue', short: 'T' },
  { value: 3, label: 'Wed', short: 'W' },
  { value: 4, label: 'Thu', short: 'T' },
  { value: 5, label: 'Fri', short: 'F' },
  { value: 6, label: 'Sat', short: 'S' },
]

interface HabitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  habit?: Habit | null
  onSave: (data: {
    title: string
    frequency: number
    frequency_period: string
    category: string
    habit_type: string
    scheduled_days: number[] | null
    reminder_time: string | null
  }) => void
}

export function HabitDialog({ open, onOpenChange, habit, onSave }: HabitDialogProps) {
  const [title, setTitle] = useState('')
  const [frequency, setFrequency] = useState('1')
  const [frequencyPeriod, setFrequencyPeriod] = useState('week')
  const [category, setCategory] = useState('general')
  const [habitType, setHabitType] = useState('build')
  const [scheduledDays, setScheduledDays] = useState<number[]>([])
  const [useScheduledDays, setUseScheduledDays] = useState(false)
  const [reminderTime, setReminderTime] = useState('')

  useEffect(() => {
    if (habit) {
      setTitle(habit.title)
      setFrequency(String(habit.frequency))
      setFrequencyPeriod(habit.frequency_period ?? 'week')
      setCategory(habit.category)
      setHabitType(habit.habit_type ?? 'build')
      setScheduledDays(habit.scheduled_days ?? [])
      setUseScheduledDays(!!habit.scheduled_days && habit.scheduled_days.length > 0)
      setReminderTime(habit.reminder_time ? habit.reminder_time.slice(0, 5) : '')
    } else {
      setTitle('')
      setFrequency('1')
      setFrequencyPeriod('week')
      setCategory('general')
      setHabitType('build')
      setScheduledDays([])
      setUseScheduledDays(false)
      setReminderTime('')
    }
  }, [habit, open])

  const toggleDay = (day: number) => {
    setScheduledDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    )
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      frequency: parseInt(frequency, 10),
      frequency_period: frequencyPeriod,
      category,
      habit_type: habitType,
      scheduled_days: useScheduledDays && scheduledDays.length > 0 ? scheduledDays : null,
      reminder_time: reminderTime || null,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{habit ? 'Edit Habit' : 'New Habit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Habit Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={habitType === 'build' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setHabitType('build')}
                className="flex-1"
              >
                Build
              </Button>
              <Button
                type="button"
                variant={habitType === 'avoid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setHabitType('avoid')}
                className="flex-1"
              >
                Avoid
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {habitType === 'build'
                ? 'Build a positive habit — mark when done'
                : 'Avoid a bad habit — success when you resist'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Habit Name</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={habitType === 'avoid' ? "e.g., Don't smoke" : 'e.g., Morning meditation'}
              required
            />
          </div>

          {/* Frequency — hidden for avoid habits */}
          {habitType === 'build' && (
            <div className="space-y-2">
              <Label>Frequency</Label>
              <div className="flex gap-2">
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(n => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="flex items-center text-sm text-muted-foreground">times per</span>
                <Select value={frequencyPeriod} onValueChange={setFrequencyPeriod}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Day-of-Week Scheduling */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Scheduled Days</Label>
              <button
                type="button"
                onClick={() => {
                  setUseScheduledDays(!useScheduledDays)
                  if (!useScheduledDays && scheduledDays.length === 0) {
                    setScheduledDays([1, 2, 3, 4, 5]) // default weekdays
                  }
                }}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  useScheduledDays
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'text-muted-foreground border-border'
                }`}
              >
                {useScheduledDays ? 'On' : 'Off'}
              </button>
            </div>
            {useScheduledDays && (
              <div className="flex gap-1">
                {DAYS.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                      scheduledDays.includes(day.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                    title={day.label}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            )}
            {!useScheduledDays && (
              <p className="text-xs text-muted-foreground">Every day (tap to pick specific days)</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reminder Time */}
          <div className="space-y-2">
            <Label htmlFor="reminder">Reminder</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="reminder"
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                className="w-36"
              />
              {reminderTime && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReminderTime('')}
                  className="text-xs text-muted-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {reminderTime ? `Reminder at ${reminderTime}` : 'No reminder set'}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{habit ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

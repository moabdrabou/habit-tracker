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

interface HabitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  habit?: Habit | null
  onSave: (data: { title: string; frequency: number; frequency_period: string; category: string; times_per_day: number }) => void
}

export function HabitDialog({ open, onOpenChange, habit, onSave }: HabitDialogProps) {
  const [title, setTitle] = useState('')
  const [frequency, setFrequency] = useState('1')
  const [frequencyPeriod, setFrequencyPeriod] = useState('week')
  const [category, setCategory] = useState('general')
  const [timesPerDay, setTimesPerDay] = useState('1')

  useEffect(() => {
    if (habit) {
      setTitle(habit.title)
      setFrequency(String(habit.frequency))
      setFrequencyPeriod(habit.frequency_period ?? 'week')
      setCategory(habit.category)
      setTimesPerDay(String(habit.times_per_day ?? 1))
    } else {
      setTitle('')
      setFrequency('1')
      setFrequencyPeriod('week')
      setCategory('general')
      setTimesPerDay('1')
    }
  }, [habit, open])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      frequency: parseInt(frequency, 10),
      frequency_period: frequencyPeriod,
      category,
      times_per_day: parseInt(timesPerDay, 10),
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
          <div className="space-y-2">
            <Label htmlFor="title">Habit Name</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Morning meditation"
              required
            />
          </div>

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
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Times per Day</Label>
            <div className="flex items-center gap-2">
              <Select value={timesPerDay} onValueChange={setTimesPerDay}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {parseInt(timesPerDay) === 1 ? 'time per day' : 'times per day'}
              </span>
            </div>
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

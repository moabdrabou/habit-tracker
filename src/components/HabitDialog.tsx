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
  'health',
  'fitness',
  'learning',
  'productivity',
  'mindfulness',
  'social',
  'finance',
  'general',
]

interface HabitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  habit?: Habit | null
  onSave: (data: { title: string; frequency: number; category: string }) => void
}

export function HabitDialog({ open, onOpenChange, habit, onSave }: HabitDialogProps) {
  const [title, setTitle] = useState('')
  const [frequency, setFrequency] = useState('1')
  const [category, setCategory] = useState('general')

  useEffect(() => {
    if (habit) {
      setTitle(habit.title)
      setFrequency(String(habit.frequency))
      setCategory(habit.category)
    } else {
      setTitle('')
      setFrequency('1')
      setCategory('general')
    }
  }, [habit, open])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      frequency: parseInt(frequency, 10),
      category,
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
            <Label htmlFor="frequency">Times per week</Label>
            <Input
              id="frequency"
              type="number"
              min="1"
              max="7"
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
            />
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

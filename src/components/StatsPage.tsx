import { useMemo, useState } from 'react'
import { useHabits } from '@/hooks/useHabits'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, TrendingUp, Trophy, Calendar, Hash } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  format,
  subDays,
  startOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  startOfDay,
  getDay,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  isSameMonth,
  isSameDay,
} from 'date-fns'

interface StatsPageProps {
  onBack: () => void
}

export function StatsPage({ onBack }: StatsPageProps) {
  const { habits, completions, getStreak } = useHabits()
  const [rateView, setRateView] = useState<'weekly' | 'monthly'>('weekly')
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  const today = startOfDay(new Date())

  // Summary stats
  const totalCompletions = completions.length
  const totalHabits = habits.length

  const avgDailyCompletions = useMemo(() => {
    if (completions.length === 0) return 0
    const dates = new Set(completions.map(c => c.completed_at))
    return Math.round((completions.length / dates.size) * 10) / 10
  }, [completions])

  // Best streaks per habit
  const bestStreaks = useMemo(() => {
    return habits
      .map(h => ({ habit: h, streak: getStreak(h.id) }))
      .sort((a, b) => b.streak.longest - a.streak.longest)
      .slice(0, 5)
  }, [habits, getStreak])

  // Completion rate over time
  const completionRateData = useMemo(() => {
    if (habits.length === 0) return []

    if (rateView === 'weekly') {
      const weeks = eachWeekOfInterval({
        start: subDays(today, 90),
        end: today,
      })

      return weeks.map(weekStart => {
        const weekEnd = subDays(startOfWeek(subDays(weekStart, -7)), 0)
        const days = eachDayOfInterval({
          start: weekStart,
          end: weekEnd > today ? today : weekEnd,
        })

        let totalPossible = 0
        let totalDone = 0

        for (const day of days) {
          const dateStr = format(day, 'yyyy-MM-dd')
          for (const habit of habits) {
            if (new Date(habit.created_at) > day) continue
            totalPossible++
            const count = completions.filter(
              c => c.habit_id === habit.id && c.completed_at === dateStr
            ).length
            if (count > 0) totalDone++
          }
        }

        const rate = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0
        return {
          label: format(weekStart, 'MMM d'),
          rate,
        }
      })
    }

    // Monthly view
    const months: Date[] = []
    for (let i = 5; i >= 0; i--) {
      months.push(startOfMonth(subMonths(today, i)))
    }

    return months.map(monthStart => {
      const monthEnd = endOfMonth(monthStart)
      const days = eachDayOfInterval({
        start: monthStart,
        end: monthEnd > today ? today : monthEnd,
      })

      let totalPossible = 0
      let totalDone = 0

      for (const day of days) {
        const dateStr = format(day, 'yyyy-MM-dd')
        for (const habit of habits) {
          if (new Date(habit.created_at) > day) continue
          totalPossible++
          const count = completions.filter(
            c => c.habit_id === habit.id && c.completed_at === dateStr
          ).length
          if (count > 0) totalDone++
        }
      }

      const rate = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0
      return {
        label: format(monthStart, 'MMM'),
        rate,
      }
    })
  }, [habits, completions, rateView, today])

  // Day-of-week breakdown
  const dayOfWeekData = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayCounts = Array(7).fill(0)
    const dayTotals = Array(7).fill(0)

    const last90 = eachDayOfInterval({ start: subDays(today, 89), end: today })

    for (const day of last90) {
      const dow = getDay(day)
      const dateStr = format(day, 'yyyy-MM-dd')

      for (const habit of habits) {
        if (new Date(habit.created_at) > day) continue
        dayTotals[dow]++
        const count = completions.filter(
          c => c.habit_id === habit.id && c.completed_at === dateStr
        ).length
        if (count > 0) dayCounts[dow]++
      }
    }

    return dayNames.map((name, i) => ({
      day: name,
      rate: dayTotals[i] > 0 ? Math.round((dayCounts[i] / dayTotals[i]) * 100) : 0,
    }))
  }, [habits, completions, today])

  // Monthly calendar data
  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth)
    const monthEnd = endOfMonth(calendarMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const dayCompletions = completions.filter(c => c.completed_at === dateStr).length

      let total = 0
      for (const habit of habits) {
        if (new Date(habit.created_at) > day) continue
        total++
      }

      return {
        date: day,
        completions: dayCompletions,
        total,
        rate: total > 0 ? dayCompletions / total : 0,
      }
    })
  }, [calendarMonth, habits, completions])

  const calendarWeeks = useMemo(() => {
    const weeks: typeof calendarData[] = []
    const monthStart = startOfMonth(calendarMonth)
    const startDow = getDay(monthStart)

    // Pad start
    let currentWeek: typeof calendarData = []
    for (let i = 0; i < startDow; i++) {
      currentWeek.push({ date: new Date(0), completions: -1, total: 0, rate: 0 })
    }

    for (const day of calendarData) {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }
    if (currentWeek.length > 0) weeks.push(currentWeek)
    return weeks
  }, [calendarData, calendarMonth])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Stats & Analytics</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <Hash className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{totalCompletions}</p>
            <p className="text-xs text-muted-foreground">Total Completions</p>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{avgDailyCompletions}</p>
            <p className="text-xs text-muted-foreground">Avg/Day</p>
          </Card>
          <Card className="p-4 text-center">
            <Trophy className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{totalHabits}</p>
            <p className="text-xs text-muted-foreground">Active Habits</p>
          </Card>
        </div>

        {/* Completion Rate Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Completion Rate</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant={rateView === 'weekly' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setRateView('weekly')}
                  className="text-xs h-7"
                >
                  Weekly
                </Button>
                <Button
                  variant={rateView === 'monthly' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setRateView('monthly')}
                  className="text-xs h-7"
                >
                  Monthly
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {completionRateData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={completionRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    domain={[0, 100]}
                    tickFormatter={v => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Completion Rate']}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Day-of-Week Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Day-of-Week Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  domain={[0, 100]}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Completion Rate']}
                />
                <Bar dataKey="rate" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Calendar */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Monthly View
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}>
                  &lt;
                </Button>
                <span className="text-sm font-medium min-w-[100px] text-center">
                  {format(calendarMonth, 'MMMM yyyy')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                  disabled={isSameMonth(calendarMonth, today)}
                >
                  &gt;
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-xs text-muted-foreground font-medium py-1">
                    {d}
                  </div>
                ))}
              </div>
              {/* Calendar weeks */}
              {calendarWeeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1">
                  {week.map((day, di) => {
                    if (day.completions === -1) {
                      return <div key={di} className="aspect-square" />
                    }
                    const isToday = isSameDay(day.date, today)
                    const intensity = day.rate === 0 ? 'bg-muted'
                      : day.rate <= 0.33 ? 'bg-emerald-200 dark:bg-emerald-900'
                      : day.rate <= 0.66 ? 'bg-emerald-400 dark:bg-emerald-700'
                      : 'bg-emerald-600 dark:bg-emerald-400'

                    return (
                      <div
                        key={di}
                        className={`aspect-square rounded-md flex items-center justify-center text-xs ${intensity} ${
                          isToday ? 'ring-2 ring-primary' : ''
                        }`}
                        title={`${format(day.date, 'MMM d')}: ${day.completions} completions`}
                      >
                        {format(day.date, 'd')}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Best Streaks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Best Streaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bestStreaks.length > 0 ? (
              <div className="space-y-2">
                {bestStreaks.map(({ habit, streak }, i) => (
                  <div key={habit.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-5">{i + 1}.</span>
                      <span className="font-medium">{habit.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Current: {streak.current}d</span>
                      <span className="font-bold text-yellow-500">{streak.longest}d best</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No habits yet</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

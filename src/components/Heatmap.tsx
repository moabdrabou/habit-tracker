import { format, getDay } from 'date-fns'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface HeatmapDay {
  date: Date
  dateStr: string
  count: number
}

interface HeatmapProps {
  data: HeatmapDay[]
  maxCount?: number
}

function getLevel(count: number, max: number): number {
  if (count === 0) return 0
  if (max <= 1) return count > 0 ? 4 : 0
  const ratio = count / max
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

const LEVEL_CLASSES = [
  'bg-muted',
  'bg-emerald-200 dark:bg-emerald-900',
  'bg-emerald-400 dark:bg-emerald-700',
  'bg-emerald-500 dark:bg-emerald-500',
  'bg-emerald-700 dark:bg-emerald-300',
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function Heatmap({ data, maxCount }: HeatmapProps) {
  const max = maxCount ?? Math.max(...data.map(d => d.count), 1)

  // Group into weeks (columns)
  const weeks: HeatmapDay[][] = []
  let currentWeek: HeatmapDay[] = []

  // Pad the first week
  if (data.length > 0) {
    const firstDow = getDay(data[0].date) // 0=Sun
    for (let i = 0; i < firstDow; i++) {
      currentWeek.push({ date: new Date(0), dateStr: '', count: -1 })
    }
  }

  for (const day of data) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-[3px] min-w-fit">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] pr-1">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="h-[13px] text-[10px] leading-[13px] text-muted-foreground">
                {label}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => {
                if (day.count === -1) {
                  return <div key={di} className="w-[13px] h-[13px]" />
                }
                const level = getLevel(day.count, max)
                return (
                  <Tooltip key={di}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-[13px] h-[13px] rounded-sm ${LEVEL_CLASSES[level]} transition-colors`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-medium">{format(day.date, 'MMM d, yyyy')}</p>
                      <p>{day.count} completion{day.count !== 1 ? 's' : ''}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground justify-end">
        <span>Less</span>
        {LEVEL_CLASSES.map((cls, i) => (
          <div key={i} className={`w-[13px] h-[13px] rounded-sm ${cls}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

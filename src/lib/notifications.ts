import type { Habit } from '@/lib/database.types'

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false

  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export function showNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
    })
  } else {
    new Notification(title, { body, icon: '/pwa-192x192.png' })
  }
}

let reminderInterval: ReturnType<typeof setInterval> | null = null

export function startReminderChecker(habits: Habit[], isCompletedFn: (id: string, date: Date) => boolean) {
  stopReminderChecker()

  // Track which habits have already fired their reminder today
  const firedToday = new Set<string>()

  reminderInterval = setInterval(() => {
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    for (const habit of habits) {
      if (!habit.reminder_time) continue
      if (firedToday.has(habit.id)) continue

      // Compare HH:MM
      const reminderHHMM = habit.reminder_time.slice(0, 5)
      if (currentTime === reminderHHMM && !isCompletedFn(habit.id, now)) {
        firedToday.add(habit.id)
        showNotification(
          'Habit Reminder',
          `Time to: ${habit.title}`
        )
      }
    }
  }, 60_000) // Check every minute
}

export function stopReminderChecker() {
  if (reminderInterval) {
    clearInterval(reminderInterval)
    reminderInterval = null
  }
}

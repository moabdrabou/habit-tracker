import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { AuthPage } from '@/components/AuthPage'
import { DisplayNamePrompt } from '@/components/DisplayNamePrompt'
import { Dashboard } from '@/components/Dashboard'
import { StatsPage } from '@/components/StatsPage'

type View = 'dashboard' | 'stats'

export default function App() {
  const { user, loading, displayName } = useAuth()
  const [view, setView] = useState<View>('dashboard')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) return <AuthPage />

  if (!displayName) return <DisplayNamePrompt />

  if (view === 'stats') {
    return <StatsPage onBack={() => setView('dashboard')} />
  }

  return <Dashboard onNavigateStats={() => setView('stats')} />
}

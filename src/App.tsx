import { useAuth } from '@/context/AuthContext'
import { AuthPage } from '@/components/AuthPage'
import { Dashboard } from '@/components/Dashboard'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return user ? <Dashboard /> : <AuthPage />
}

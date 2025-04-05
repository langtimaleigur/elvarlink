import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/getCurrentUser'
import { LoginForm } from '@/components/login-form'

export default async function LoginPage() {
  const user = await getCurrentUser()
  
  if (user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Welcome to Loopy</h1>
        <LoginForm />
      </div>
    </div>
  )
} 
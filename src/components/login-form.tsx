'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Box } from "lucide-react"

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      // Use router.push instead of window.location
      router.push('/')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Box className="h-8 w-8" />
        <h1 className="text-4xl font-bold mt-4">Loopy</h1>
        <p className="text-xl mt-2">Welcome to Loopy</p>
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label htmlFor="email" className="block">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full p-2 bg-black border rounded"
            placeholder="m@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full p-2 bg-black border rounded"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-white text-black rounded disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="text-center">OR CONTINUE WITH</div>

      <div className="grid grid-cols-2 gap-4">
        <button className="p-2 border rounded">Apple</button>
        <button className="p-2 border rounded">Google</button>
      </div>

      <div>
        Don't have an account?{' '}
        <button
          onClick={() => router.push('/signup')}
          className="text-purple-500"
        >
          Sign up
        </button>
      </div>

      <p className="text-sm">
        By clicking continue, you agree to our{' '}
        <a href="#" className="text-purple-500">Terms of Service</a>
        {' '}and{' '}
        <a href="#" className="text-purple-500">Privacy Policy</a>.
      </p>
    </div>
  )
} 
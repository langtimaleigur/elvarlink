'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  username: string | null
  profile_image_url: string | null
  role: string
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/')
    } catch (error: any) {
      console.error('Error logging out:', error)
      setError(error.message)
    }
  }

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          // Silently redirect to home if no session
          router.replace('/')
          return
        }
      } catch (error) {
        // Silently redirect to home on any auth error
        router.replace('/')
      }
    }

    checkUser()
  }, [router, supabase.auth])

  useEffect(() => {
    let mounted = true

    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        if (!user) {
          router.push('/')
          return
        }

        // Fetch the profile
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError
        if (!data) throw new Error('Profile not found')

        if (mounted) {
          setProfile(data)
        }
      } catch (error: any) {
        console.error('Error in fetchProfile:', error)
        if (mounted) {
          setError(error.message)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchProfile()

    return () => {
      mounted = false
    }
  }, [supabase, router])

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <Skeleton className="h-8 w-48 bg-primary/20" />
            <Skeleton className="h-4 w-32 bg-primary/20" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full bg-primary/20" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 bg-primary/20" />
                <Skeleton className="h-4 w-24 bg-primary/20" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout} variant="destructive">
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>Unable to load your profile information.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout} variant="destructive">
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </div>
            <Button 
              onClick={handleLogout} 
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              Logout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.profile_image_url || undefined} alt={profile.username || 'Profile'} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {profile.first_name?.[0] || profile.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {profile.first_name && profile.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile.username || 'Anonymous User'}
              </h3>
              <p className="text-sm text-muted-foreground">Role: {profile.role}</p>
              <p className="text-sm text-muted-foreground">
                Member since: {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
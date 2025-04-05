'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  username: string | null
  profile_image_url: string | null
}

export default function ProfileSettings() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!user) return

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error

        setProfile(data)
        setFormData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: user.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [supabase])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) return

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Update password if provided
      if (formData.newPassword && formData.newPassword === formData.confirmPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        })
        if (passwordError) throw passwordError
      }

      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          Update your profile information and settings.
        </p>
      </div>
      <Separator />
      
      <form onSubmit={handleProfileUpdate} className="space-y-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.profile_image_url || undefined} alt="Profile" />
            <AvatarFallback className="bg-primary/20 text-primary">
              {profile?.first_name?.[0] || profile?.username?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <Button variant="outline" size="sm">
              Change Avatar
            </Button>
            <p className="text-sm text-muted-foreground">
              JPG, GIF or PNG. Max size of 800K
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Password</h4>
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              disabled={!isEditing}
            />
          </div>
        </div>

        <div className="flex gap-4">
          {isEditing ? (
            <>
              <Button type="submit">Save Changes</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </form>
    </div>
  )
} 
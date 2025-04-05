'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import ProfileSettings from './profile/page'
import DomainsSettings from './domains/page'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      
      {/* Mobile Tabs */}
      <div className="block md:hidden">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5 overflow-x-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="domains">Domains</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="danger">Danger</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardContent className="pt-6">
                <ProfileSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domains">
            <Card>
              <CardContent className="pt-6">
                <DomainsSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Current Plan</Label>
                      <p className="text-sm text-muted-foreground">Free Plan</p>
                    </div>
                    <Button variant="outline">Upgrade</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Payment Method</Label>
                      <p className="text-sm text-muted-foreground">No payment method added</p>
                    </div>
                    <Button variant="outline">Add Payment Method</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive email updates about your account</p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">Receive marketing and promotional emails</p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts about security events</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="danger">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Logout</Label>
                      <p className="text-sm text-muted-foreground">Sign out of your account</p>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>Logout</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Delete Account</Label>
                      <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="destructive" disabled>Delete Account</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-[256px_1fr] gap-6">
        <div className="space-y-1">
          <Button
            variant={activeTab === 'profile' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </Button>
          <Button
            variant={activeTab === 'domains' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('domains')}
          >
            Domains
          </Button>
          <Button
            variant={activeTab === 'billing' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('billing')}
          >
            Billing
          </Button>
          <Button
            variant={activeTab === 'notifications' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </Button>
          <Button
            variant={activeTab === 'danger' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('danger')}
          >
            Danger Zone
          </Button>
        </div>

        <div className="space-y-6">
          <Card className={activeTab === 'profile' ? 'block' : 'hidden'}>
            <CardContent className="pt-6">
              <ProfileSettings />
            </CardContent>
          </Card>

          <Card className={activeTab === 'domains' ? 'block' : 'hidden'}>
            <CardContent className="pt-6">
              <DomainsSettings />
            </CardContent>
          </Card>

          <Card className={activeTab === 'billing' ? 'block' : 'hidden'}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Current Plan</Label>
                    <p className="text-sm text-muted-foreground">Free Plan</p>
                  </div>
                  <Button variant="outline">Upgrade</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Payment Method</Label>
                    <p className="text-sm text-muted-foreground">No payment method added</p>
                  </div>
                  <Button variant="outline">Add Payment Method</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={activeTab === 'notifications' ? 'block' : 'hidden'}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email updates about your account</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">Receive marketing and promotional emails</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">Receive alerts about security events</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={activeTab === 'danger' ? 'block' : 'hidden'}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Logout</Label>
                    <p className="text-sm text-muted-foreground">Sign out of your account</p>
                  </div>
                  <Button variant="outline" onClick={handleLogout}>Logout</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Delete Account</Label>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="destructive" disabled>Delete Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
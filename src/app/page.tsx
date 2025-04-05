import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCurrentUser } from '@/lib/supabase/getCurrentUser'
import { ArrowUpRight, CreditCard, DollarSign, Users } from 'lucide-react'

export default async function HomePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabase = createServerComponentClient({ cookies })
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return <div>Profile not found</div>
  }

  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`

  // Placeholder data for the chart
  const chartData = [4800, 2600, 3200, 2000, 4500, 5200, 4800, 2800, 5400, 2000, 1400, 3800]
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Placeholder recent sales data
  const recentSales = [
    { name: 'Olivia Martin', email: 'olivia.martin@email.com', amount: 1999.00 },
    { name: 'Jackson Lee', email: 'jackson.lee@email.com', amount: 39.00 },
    { name: 'Isabella Nguyen', email: 'isabella.nguyen@email.com', amount: 299.00 },
    { name: 'William Kim', email: 'will@email.com', amount: 99.00 },
    { name: 'Sofia Davis', email: 'sofia.davis@email.com', amount: 39.00 },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <Input
              type="date"
              className="w-[300px]"
              defaultValue="2023-01-20"
            />
            <Button variant="outline">
              Download
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="mb-8">
          <TabsList>
            <TabsTrigger value="overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports">
              Reports
            </TabsTrigger>
            <TabsTrigger value="notifications">
              Notifications
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231.89</div>
              <p className="text-xs text-green-500">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Subscriptions
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+2,350</div>
              <p className="text-xs text-green-500">
                +180.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Sales
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12,234</div>
              <p className="text-xs text-green-500">
                +19% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Active Now
              </CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+573</div>
              <p className="text-xs text-green-500">
                +201 since last hour
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Overview and Recent Sales */}
        <div className="grid gap-4 md:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <div className="flex h-full items-end gap-2">
                  {chartData.map((value, i) => (
                    <div key={i} className="group relative">
                      <div 
                        className="bg-primary w-full rounded-md transition-all hover:bg-primary/80"
                        style={{ 
                          height: `${(value / Math.max(...chartData)) * 100}%`,
                          width: '40px'
                        }}
                      />
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                        {months[i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <p className="text-sm text-muted-foreground">
                You made 265 sales this month.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {recentSales.map((sale) => (
                  <div key={sale.email} className="flex items-center">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary">
                        {sale.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium">{sale.name}</p>
                      <p className="text-sm text-muted-foreground">{sale.email}</p>
                    </div>
                    <div className="ml-auto font-medium">
                      +${sale.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

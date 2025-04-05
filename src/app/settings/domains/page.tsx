'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Domain = {
  id: string
  domain: string
  verified: boolean
}

type DomainGroup = {
  id: string
  domain_id: string
  group_path: string
  fallback_url: string | null
}

export default function DomainsSettings() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [groups, setGroups] = useState<Record<string, DomainGroup[]>>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!user) return

        // Fetch domains
        const { data: domainsData, error: domainsError } = await supabase
          .from('domains')
          .select('id, domain, verified')
          .eq('user_id', user.id)

        if (domainsError) throw domainsError
        setDomains(domainsData || [])

        // Fetch groups if we have domains
        if (domainsData && domainsData.length > 0) {
          const domainIds = domainsData.map(d => d.id)
          const { data: groupsData, error: groupsError } = await supabase
            .from('domain_groups')
            .select('*')
            .in('domain_id', domainIds)

          if (groupsError) throw groupsError

          // Group the groups by domain_id
          const groupsByDomain = (groupsData || []).reduce((acc, group) => {
            if (!acc[group.domain_id]) {
              acc[group.domain_id] = []
            }
            acc[group.domain_id].push(group)
            return acc
          }, {} as Record<string, DomainGroup[]>)

          setGroups(groupsByDomain)
        }
      } catch (error) {
        console.error('Error fetching domains:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Domains & Groups</h3>
        <p className="text-sm text-muted-foreground">
          Manage your domains and link groups.
        </p>
      </div>
      <Separator />

      <div className="space-y-4">
        {domains.map((domain) => (
          <Card key={domain.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{domain.domain}</span>
                {domain.verified && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Verified
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {groups[domain.id]?.map((group) => (
                  <div key={group.id} className="flex items-center justify-between">
                    <div>
                      <Label>{group.group_path}</Label>
                      {group.fallback_url && (
                        <p className="text-sm text-muted-foreground">
                          Fallback: {group.fallback_url}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/groups/${encodeURIComponent(group.group_path)}`)}
                    >
                      View Links
                    </Button>
                  </div>
                ))}
                <Button className="w-full" variant="outline">
                  + Add Group
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {domains.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No domains found</p>
            <Button
              className="mt-4"
              onClick={() => router.push('/domains')}
            >
              Add Your First Domain
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 
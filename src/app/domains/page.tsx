import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/supabase/getCurrentUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import Link from "next/link";

type DomainGroup = {
  id: string;
  domain_id: string;
  group_path: string;
  fallback_url: string | null;
};

export default async function DomainsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const supabase = createServerComponentClient({ cookies });
  
  // First get all domains
  const { data: domains, error: domainsError } = await supabase
    .from("domains")
    .select("id, domain, verified")
    .eq("user_id", currentUser.id);

  if (domainsError) {
    console.error('Error fetching domains:', domainsError);
    return <div>Error loading domains</div>;
  }

  if (!domains || domains.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <h1 className="text-3xl font-bold mb-8">Your Domains</h1>
        <div className="text-gray-400">No domains found. Add your first domain!</div>
      </div>
    );
  }

  // Get domain IDs
  const domainIds = domains.map(d => d.id);

  // Then get all groups for these domains
  const { data: groups, error: groupsError } = await supabase
    .from("domain_groups")
    .select("*")
    .in("domain_id", domainIds);

  if (groupsError) {
    console.error('Error fetching groups:', groupsError);
    return <div>Error loading groups</div>;
  }

  // Group the groups by domain_id for easier access
  const groupsByDomain = groups?.reduce((acc, group) => {
    if (!acc[group.domain_id]) {
      acc[group.domain_id] = [];
    }
    acc[group.domain_id].push(group);
    return acc;
  }, {} as Record<string, DomainGroup[]>);

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <h1 className="text-3xl font-bold mb-8">Your Domains</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {domains.map((domain) => {
          const domainGroups = groupsByDomain?.[domain.id] || [];
          
          return (
            <Card key={domain.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{domain.domain}</span>
                  {domain.verified && (
                    <Badge variant="secondary">
                      Verified
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {domainGroups.map((group: DomainGroup) => (
                    <li key={group.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-primary">{group.group_path}</span>
                        {group.fallback_url && (
                          <span className="text-sm text-muted-foreground">
                            → fallback: {group.fallback_url}
                          </span>
                        )}
                      </div>
                      <Link href={`/groups/${encodeURIComponent(group.group_path)}`}>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                          View Links
                        </Button>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Button className="w-full">
                  + Add Group
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/supabase/getCurrentUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import Link from "next/link";

type Link = {
  id: string;
  slug: string;
  destination_url: string;
  redirect_type: string;
  epc: number;
};

type DomainGroup = {
  id: string;
  path: string;
  fallback_url: string | null;
};

export default async function GroupPage({
  params,
}: {
  params: { path: string };
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const supabase = createServerComponentClient({ cookies });

  // Fetch the domain group
  const { data: group, error: groupError } = await supabase
    .from("domain_groups")
    .select("*")
    .eq("path", decodeURIComponent(params.path))
    .single();

  if (groupError) {
    console.error("Error fetching group:", groupError);
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Error</h1>
          <p className="text-red-400">Failed to load group: {groupError.message}</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Group Not Found</h1>
          <p className="text-gray-400">The requested group does not exist.</p>
        </div>
      </div>
    );
  }

  // Fetch all links for this group
  const { data: links, error: linksError } = await supabase
    .from("links")
    .select("*")
    .eq("group_id", group.id);

  if (linksError) {
    console.error("Error fetching links:", linksError);
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Error</h1>
          <p className="text-red-400">Failed to load links: {linksError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            Links for <span className="text-primary">{group.path}</span>
          </h1>
          <Button>
            + Add New Link
          </Button>
        </div>

        <div className="space-y-4">
          {links?.map((link: Link) => (
            <Card key={link.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-semibold">{link.slug}</span>
                      <Badge variant="secondary">
                        {link.redirect_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{link.destination_url}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">EPC</p>
                    <p className="text-xl font-semibold text-primary">
                      ${(link.epc || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {links?.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No links found in this group
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 
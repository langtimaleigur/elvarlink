import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/supabase/getCurrentUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

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
  params: { path: string; slug: string };
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const supabase = createServerComponentClient({ cookies });

  // First find the group by path
  const { data: group, error: groupError } = await supabase
    .from("domain_groups")
    .select("*")
    .eq("path", params.path)
    .single();

  if (groupError || !group) {
    console.error("Error fetching group:", groupError);
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Error</h1>
          <p className="text-red-400">Failed to load group: {groupError?.message || "Group not found"}</p>
        </div>
      </div>
    );
  }

  // Then find the specific link by slug and group_id
  const { data: links, error: linksError } = await supabase
    .from("links")
    .select("*")
    .eq("group_id", group.id)
    .eq("slug", params.slug);

  if (linksError || !links || links.length === 0) {
    console.error("Error fetching link:", linksError);
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Error</h1>
          <p className="text-red-400">Failed to load link: {linksError?.message || "Link not found"}</p>
        </div>
      </div>
    );
  }

  const link = links[0];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            Link Details
          </h1>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Edit Link
          </Button>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-sm text-gray-400 mb-1">Slug</h2>
                <p className="text-xl font-semibold">{link.slug}</p>
              </div>
              
              <div>
                <h2 className="text-sm text-gray-400 mb-1">Destination URL</h2>
                <p className="text-blue-400 break-all">{link.destination_url}</p>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-sm text-gray-400 mb-1">Redirect Type</h2>
                  <Badge variant="secondary" className="bg-blue-600">
                    {link.redirect_type}
                  </Badge>
                </div>

                <div>
                  <h2 className="text-sm text-gray-400 mb-1">EPC</h2>
                  <p className="text-xl font-semibold text-blue-400">
                    ${(link.epc || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
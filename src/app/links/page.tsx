import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/supabase/getCurrentUser";
import { redirect } from "next/navigation";
import { CreateLinkModal } from "@/components/create-link-modal";
import { LinkCardList } from "@/components/link-card-list";
import { Suspense } from "react";

// Loading component for the LinkCardList
function LinkCardListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div 
          key={i}
          className="rounded-lg border bg-card shadow-sm overflow-hidden p-6"
        >
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center overflow-hidden">
              <div className="h-3 w-3 rounded-full mr-3 flex-shrink-0 bg-muted"></div>
              <div className="w-40 h-5 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="w-20 h-5 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function LinksPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = createServerComponentClient({ cookies });

  // Fetch domains and groups
  const { data: domains, error: domainsError } = await supabase
    .from("domains")
    .select("id, domain")
    .eq("user_id", user.id);

  if (domainsError) {
    console.error("Error fetching domains:", domainsError);
    return <div>Error loading domains: {domainsError.message}</div>;
  }

  const { data: groups, error: groupsError } = await supabase
    .from("domain_groups")
    .select("id, domain_id, group_path")
    .in("domain_id", domains?.map(d => d.id) || []);

  if (groupsError) {
    console.error("Error fetching groups:", groupsError);
    return <div>Error loading groups: {groupsError.message}</div>;
  }

  // Combine domains with their groups
  const domainsWithGroups = domains?.map(domain => ({
    ...domain,
    groups: groups?.filter(group => group.domain_id === domain.id) || []
  })) || [];

  // Fetch links
  const { data: links, error } = await supabase
    .from("links")
    .select(`
      *,
      domain_id,
      group:domain_groups (
        group_path,
        domain:domains (
          domain
        )
      ),
      domain:domains!links_domain_id_fkey (
        domain
      ),
      clicks:clicks(count)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Full query error:", error);
    return <div>Error loading links: {error.message}</div>;
  }

  // Get all unique tags
  const allTags = Array.from(
    new Set(
      links?.flatMap(link => link.tags || []) || []
    )
  ).sort();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Links Manager</h1>
        <Suspense fallback={<div className="w-[120px] h-10 bg-muted/20 rounded animate-pulse"></div>}>
          <CreateLinkModal />
        </Suspense>
      </div>

      <Suspense fallback={<LinkCardListSkeleton />}>
        <LinkCardList 
          data={links || []} 
          domains={domainsWithGroups}
          allTags={allTags}
        />
      </Suspense>
    </div>
  );
}
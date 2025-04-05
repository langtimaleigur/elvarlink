"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { SortingState, ColumnFiltersState, VisibilityState } from "@tanstack/react-table";
import { EditLinkModal } from "./edit-link-modal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { cn } from "@/lib/utils";
import { Copy, MoreHorizontal, ExternalLink, BarChart2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FilterFn } from "@tanstack/react-table";

type Domain = {
  id: string;
  domain: string;
  groups: {
    id: string;
    group_path: string;
    domain_id: string;
  }[];
};

type LinkWithData = {
  id: string;
  domain_id: string | null;
  group_id: string | null;
  slug: string;
  destination_url: string;
  redirect_type: string;
  tags: string[];
  epc: number;
  status: string;
  note: string | null;
  expire_at: string | null;
  created_at: string;
  updated_at: string | null;
  clicks?: { count: number }[];
  domain?: {
    domain: string;
  };
  group?: {
    group_path: string;
  };
};

interface LinksTableProps {
  data: LinkWithData[];
  domains: Domain[];
  allTags: string[];
}

const multiSelectFilter: FilterFn<any> = (row, id, filterValue) => {
  if (!filterValue || !filterValue.length) return true;
  const value = row.getValue(id);
  return filterValue.includes(value);
};

const domainFilter: FilterFn<any> = (row, id, filterValue) => {
  if (!filterValue || !filterValue.length) return true;
  const link = row.original;
  const domainId = link.domain_id;
  const groupId = link.group_id;
  
  return filterValue.some((v: string) => {
    const [filterDomainId, filterGroupId] = v.split(":");
    if (filterGroupId) {
      return domainId === filterDomainId && groupId === filterGroupId;
    }
    return domainId === filterDomainId;
  });
};

const tagsFilter: FilterFn<any> = (row, id, filterValue) => {
  if (!filterValue || !filterValue.length) return true;
  const tags = row.getValue(id) as string[];
  return filterValue.some((v: string) => tags.includes(v));
};

const StatusDot = ({ status, id }: { status: string; id: string }) => {
  const statusStyles = {
    active: "bg-green-500",
    inactive: "bg-gray-400",
    expired: "bg-red-500"
  };
  
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const updateStatus = async (newStatus: string) => {
    if (status === newStatus) return; // Don't update if status hasn't changed
    
    try {
      const { error } = await supabase
        .from("links")
        .update({ status: newStatus })
        .eq("id", id);
      
      if (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update status");
      } else {
        toast.success(`Link marked as ${newStatus}`);
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 p-0 rounded-full hover:bg-accent hover:text-accent-foreground"
        >
          <div className="flex items-center justify-center">
            <div className={cn("h-3 w-3 rounded-full", statusStyles[status as keyof typeof statusStyles] || "bg-gray-300")} />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32">
        <DropdownMenuItem 
          className="flex items-center gap-2 py-2 cursor-pointer" 
          onClick={() => updateStatus("active")}
        >
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span className={cn("font-medium", status === "active" && "text-green-500")}>Active</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="flex items-center gap-2 py-2 cursor-pointer" 
          onClick={() => updateStatus("inactive")}
        >
          <div className="h-2.5 w-2.5 rounded-full bg-gray-400" />
          <span className={cn("font-medium", status === "inactive" && "text-gray-400")}>Inactive</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function LinksTable({ data, domains, allTags }: LinksTableProps) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingLink, setEditingLink] = useState<LinkWithData | null>(null);
  const [showAnalytics, setShowAnalytics] = useState<LinkWithData | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleCopyLink = (link: LinkWithData) => {
    let fullLink = '';
    
    // Get domain from domain property if it exists
    if (link.domain && link.domain.domain) {
      const domainName = link.domain.domain;
      const groupPath = link.group && link.group.group_path ? `/${link.group.group_path}` : '';
      fullLink = `${domainName}${groupPath}/${link.slug}`;
    } else {
      // Fallback to finding domain in the domains array
      const domain = domains.find(d => d.id === link.domain_id);
      const group = domain?.groups.find(g => g.id === link.group_id);
      fullLink = `${domain?.domain || ''}${group ? `/${group.group_path}` : ''}/${link.slug}`;
    }
    
    navigator.clipboard.writeText(fullLink);
    toast.success("Link copied to clipboard");
  };

  const columns: ColumnDef<LinkWithData>[] = [
    {
      accessorKey: "status",
      header: "Status",
      size: 44,
      filterFn: multiSelectFilter,
      cell: ({ row }) => {
        const link = row.original;
        return <StatusDot status={link.status} id={link.id} />;
      },
    },
    {
      accessorKey: "domain_id",
      header: "Link",
      filterFn: domainFilter,
      cell: ({ row }) => {
        const link = row.original;
        let fullLink = '';
        
        // Get domain from domain property if it exists
        if (link.domain && link.domain.domain) {
          const domainName = link.domain.domain;
          const groupPath = link.group && link.group.group_path ? `/${link.group.group_path}` : '';
          fullLink = `${domainName}${groupPath}/${link.slug}`;
        } else {
          // Fallback to finding domain in the domains array
          const domain = domains.find(d => d.id === link.domain_id);
          const group = domain?.groups.find(g => g.id === link.group_id);
          fullLink = `${domain?.domain || ''}${group ? `/${group.group_path}` : ''}/${link.slug}`;
        }
        
        // Check for expiry date
        const expiresAt = link.expire_at ? new Date(link.expire_at) : null;
        const now = new Date();
        
        // Calculate days until expiry
        const daysUntilExpiry = expiresAt ? 
          Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
        
        return (
          <div className="flex flex-col gap-1 max-w-[300px]">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{fullLink}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopyLink(link)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy link</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {expiresAt && daysUntilExpiry ? (
              <span className="text-xs text-muted-foreground">
                Expires in {daysUntilExpiry}d
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Never Expires
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "destination_url",
      header: "Destination",
      cell: ({ row }) => {
        const link = row.original;
        return (
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground truncate max-w-[300px]">
                  {link.destination_url}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => window.open(link.destination_url, "_blank")}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                via {link.redirect_type} redirect
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "clicks",
      header: "Clicks",
      cell: ({ row }) => {
        const clicks = row.original.clicks?.[0]?.count || 0;
        return <span className="font-medium">{clicks}</span>;
      },
    },
    {
      accessorKey: "epc",
      header: "EPC",
      cell: ({ row }) => {
        const epc = row.original.epc || 0;
        return (
          <div className="flex items-center">
            <span className="font-medium">${epc.toFixed(2)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "tags",
      header: "Tags",
      filterFn: tagsFilter,
      cell: ({ row }) => {
        const tags = row.original.tags || [];
        const displayTags = tags.slice(0, 2);
        const remainingCount = tags.length - 2;

        return (
          <div className="flex flex-wrap gap-1">
            {displayTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="outline" className="text-xs">
                +{remainingCount}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "note",
      header: "Notes",
      cell: ({ row }) => {
        const note = row.original.note;
        if (!note) return null;

        const truncatedNote = note.length > 40 ? `${note.slice(0, 40)}...` : note;
        
        return (
          <HoverCard>
            <HoverCardTrigger>
              <span className="text-sm text-muted-foreground">{truncatedNote}</span>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <p className="text-sm">{note}</p>
            </HoverCardContent>
          </HoverCard>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        // Format date to short relative time (3d ago, 4h ago, etc.)
        const formattedDate = formatDistanceToNow(date, { addSuffix: true })
          .replace('about ', '')
          .replace('less than ', '')
          .replace(' minutes', 'm')
          .replace(' minute', 'm')
          .replace(' hours', 'h')
          .replace(' hour', 'h')
          .replace(' days', 'd')
          .replace(' day', 'd')
          .replace(' months', 'mo')
          .replace(' month', 'mo')
          .replace(' years', 'y')
          .replace(' year', 'y')
          .replace(' weeks', 'w')
          .replace(' week', 'w');
        
        return (
          <span className="text-muted-foreground">
            {formattedDate}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const link = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingLink(link)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAnalytics(link)}>
                View Analytics
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div>
      <DataTable
        data={data}
        columns={columns}
        domains={domains}
        allTags={allTags}
        onRowSelectionChange={setRowSelection}
        rowSelection={rowSelection}
        onColumnFiltersChange={setColumnFilters}
        columnFilters={columnFilters}
        onColumnVisibilityChange={setColumnVisibility}
        columnVisibility={columnVisibility}
        onSortingChange={setSorting}
        sorting={sorting}
      />
      {editingLink && (
        <EditLinkModal
          link={editingLink}
          domains={domains}
          open={!!editingLink}
          onOpenChange={(open) => !open && setEditingLink(null)}
        />
      )}
      <Sheet open={!!showAnalytics} onOpenChange={(open) => !open && setShowAnalytics(null)}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Analytics
            </SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <p className="text-muted-foreground">Analytics coming soon...</p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
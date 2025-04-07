"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow, subDays, format } from 'date-fns';
import { ColumnFiltersState, FilterFn } from "@tanstack/react-table";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { LinkCheckButton } from "@/components/LinkCheckButton";

// UI Components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// Icons
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  Clock,
  Copy,
  MoreHorizontal,
  ExternalLink,
  BarChart2,
  Trash2,
  TrendingUp,
  Archive,
  CornerDownRight,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EditLinkModal } from "./edit-link-modal";
import { DataTableToolbar } from "./ui/data-table-toolbar";

type Domain = {
  id: string;
  domain: string;
  is_primary: boolean;
  primary_domain_id: string | null;
};

type ClickData = {
  count: number;
  dates?: {
    date: string;
    count: number;
  }[];
};

type ClicksMap = {
  [linkId: string]: {
    total: number;
    byDate: {
      [date: string]: number;
    };
  };
};

type LinkWithData = {
  id: string;
  domain_id: string | null;
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
  filteredClicks?: number;
  clicksByDate?: { date: string; count: number }[];
  domain?: {
    domain: string;
    is_broken?: boolean;
    last_checked_broken?: string;
    is_primary: boolean;
    primary_domain_id: string | null;
  };
  is_broken?: boolean;
  last_checked_broken?: string;
};

interface LinkCardListProps {
  data: LinkWithData[];
  domains: Domain[];
  allTags: string[];
}

export function LinkCardList({ data, domains, allTags }: LinkCardListProps) {
  const [editingLink, setEditingLink] = useState<LinkWithData | null>(null);
  const [expandedLinks, setExpandedLinks] = useState<string[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isClient, setIsClient] = useState(false);
  const [dateRange, setDateRange] = useState<string>("30");
  const [clicksData, setClicksData] = useState<ClicksMap>({});
  const [processedLinks, setProcessedLinks] = useState<LinkWithData[]>([]);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Prevent hydration errors by marking when we're on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Setup event listeners for filter changes
  useEffect(() => {
    const handleFilterChange = (event: CustomEvent) => {
      setColumnFilters(event.detail.filters);
    };

    const handleFilterReset = () => {
      setColumnFilters([]);
    };

    window.addEventListener('filterchange', handleFilterChange as EventListener);
    window.addEventListener('filterreset', handleFilterReset);

    return () => {
      window.removeEventListener('filterchange', handleFilterChange as EventListener);
      window.removeEventListener('filterreset', handleFilterReset);
    };
  }, []);

  // Fetch click data when date range changes
  useEffect(() => {
    async function fetchClickData() {
      if (!data.length || !isClient) return;

      try {
        const days = parseInt(dateRange, 10);
        const startDate = subDays(new Date(), days).toISOString();

        // Fetch clicks for all links within the date range
        const linkIds = data.map(link => link.id);
        const { data: clicksData, error } = await supabase
          .from('clicks')
          .select('link_id, timestamp')
          .in('link_id', linkIds)
          .gte('timestamp', startDate);

        if (error) {
          console.error('Error fetching clicks:', error);
          return;
        }

        // Process clicks data into a usable format
        const processedClicks: ClicksMap = {};

        // Initialize all links with zero counts
        linkIds.forEach(id => {
          processedClicks[id] = {
            total: 0,
            byDate: {}
          };
        });

        // Count clicks for each link and organize by date
        clicksData?.forEach(click => {
          const linkId = click.link_id;
          const date = click.timestamp.split('T')[0]; // Get YYYY-MM-DD format

          if (!processedClicks[linkId]) {
            processedClicks[linkId] = { total: 0, byDate: {} };
          }

          processedClicks[linkId].total += 1;

          if (!processedClicks[linkId].byDate[date]) {
            processedClicks[linkId].byDate[date] = 0;
          }

          processedClicks[linkId].byDate[date] += 1;
        });

        setClicksData(processedClicks);
      } catch (error) {
        console.error('Error processing clicks data:', error);
      }
    }

    fetchClickData();
  }, [dateRange, data, isClient, supabase]);

  // Process links with filtered click data
  useEffect(() => {
    if (!data.length || !isClient) return;

    const updatedLinks = data.map(link => {
      const clicks = clicksData[link.id]?.total || 0;
      const byDate = clicksData[link.id]?.byDate || {};

      // Convert byDate object to array format for charts
      const clicksByDate = Object.entries(byDate).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date));

      return {
        ...link,
        filteredClicks: clicks,
        clicksByDate
      };
    });

    setProcessedLinks(updatedLinks);
  }, [clicksData, data, isClient]);

  // Copy link to clipboard
  const handleCopyLink = (link: LinkWithData) => {
    let fullLink = '';

    if (link.domain && link.domain.domain) {
      fullLink = `${link.domain.domain}/${link.slug}`;
    } else {
      const domain = domains.find(d => d.id === link.domain_id);
      fullLink = `${domain?.domain || ''}/${link.slug}`;
    }

    navigator.clipboard.writeText(fullLink);
    toast.success("Link copied to clipboard");
  };

  // Update link status
  const updateStatus = async (id: string, newStatus: string) => {
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

  // Delete link
  const deleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from("links")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting link:", error);
        toast.error("Failed to delete link");
      } else {
        toast.success("Link deleted successfully");
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting link:", error);
      toast.error("Failed to delete link");
    }
  };

  // Filter links based on filter state
  const filteredLinks = processedLinks.filter(link => {
    // Apply status filter
    const statusFilters = columnFilters.find(f => f.id === 'status')?.value as string[] || [];
    if (statusFilters.length && !statusFilters.includes(link.status)) {
      return false;
    }

    // Apply domain filter
    const domainFilters = columnFilters.find(f => f.id === 'domain_id')?.value as string[] || [];
    if (domainFilters.length && link.domain_id && !domainFilters.includes(link.domain_id)) {
      return false;
    }

    // Apply redirect type filter
    const typeFilters = columnFilters.find(f => f.id === 'redirect_type')?.value as string[] || [];
    if (typeFilters.length && !typeFilters.includes(link.redirect_type)) {
      return false;
    }

    // Apply tag filter
    const tagFilters = columnFilters.find(f => f.id === 'tags')?.value as string[] || [];
    if (tagFilters.length && !link.tags?.some(tag => tagFilters.includes(tag))) {
      return false;
    }

    return true;
  });

  // Helper to format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true })
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
  };

  // Get full link URL
  const getFullLink = (link: LinkWithData) => {
    if (link.domain && link.domain.domain) {
      return `${link.domain.domain}/${link.slug}`;
    }
    const domain = domains.find(d => d.id === link.domain_id);
    return `${domain?.domain || ''}/${link.slug}`;
  };

  // Helper to generate SVG path for chart
  const generateChartPath = (clickData: { date: string; count: number }[] = [], height = 40, width = 100) => {
    if (!clickData || clickData.length === 0) {
      // Default flat line if no data
      return `M0,${height} L${width},${height}`;
    }

    // Find max value for scaling
    const maxCount = Math.max(...clickData.map(d => d.count), 1);

    // Plot points
    const points = clickData.map((data, index) => {
      const x = (index / (clickData.length - 1 || 1)) * width;
      // Invert Y since SVG 0,0 is top-left
      const y = height - (data.count / maxCount) * height * 0.8;
      return { x, y };
    });

    // Generate the path string
    if (points.length === 1) {
      // If only one point, draw a horizontal line
      return `M0,${points[0].y} L${width},${points[0].y}`;
    }

    // Generate a smooth curve through points
    let path = `M${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const x1 = points[i].x + (points[i + 1].x - points[i].x) / 3;
      const y1 = points[i].y;
      const x2 = points[i].x + 2 * (points[i + 1].x - points[i].x) / 3;
      const y2 = points[i + 1].y;
      path += ` C${x1},${y1} ${x2},${y2} ${points[i + 1].x},${points[i + 1].y}`;
    }

    return path;
  };

  const domainFilter: FilterFn<LinkWithData> = (row, columnId, filterValue) => {
    if (!filterValue || filterValue.length === 0) return true;
    const domainId = row.getValue(columnId) as string;
    return filterValue.includes(domainId);
  };

  // If not yet client-side rendered, show a simplified version to prevent hydration errors
  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="mb-6">
          {/* Simplified toolbar placeholder */}
          <div className="flex items-center justify-between">
            <div className="flex-1 flex items-center gap-4 flex-wrap">
              <div className="w-[150px] h-10 bg-card rounded-md animate-pulse"></div>
              <div className="w-[200px] h-10 bg-card rounded-md animate-pulse"></div>
              <div className="w-[150px] h-10 bg-card rounded-md animate-pulse"></div>
              <div className="w-[200px] h-10 bg-card rounded-md animate-pulse"></div>
            </div>
            <div className="w-[150px] h-10 bg-card rounded-md animate-pulse"></div>
          </div>
        </div>

        {/* Simple loading state */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-lg border bg-muted/30 shadow-sm p-4"
            >
              <div className="flex items-center justify-between w-full gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-muted"></div>
                  <div className="w-40 h-4 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-8 bg-muted rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-muted rounded animate-pulse"></div>
                  <div className="w-4 h-4 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar with filters and date range */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <DataTableToolbar
            table={{
              getState: () => ({ columnFilters }),
              resetColumnFilters: () => setColumnFilters([])
            }}
            domains={domains}
            allTags={allTags}
          />

          <div className="flex-shrink-0">
            <Select
              value={dateRange}
              onValueChange={setDateRange}
            >
              <SelectTrigger className="w-[180px]">
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Link Cards List */}
      <div className="space-y-3">
        {filteredLinks.map((link) => {
          const fullLink = getFullLink(link);
          // Use the filtered clicks instead of the total
          const clicks = link.filteredClicks || 0;
          // Calculate earnings based on filtered clicks and EPC
          const earnings = clicks * link.epc;

          // Check for expiry
          const expiresAt = link.expire_at ? new Date(link.expire_at) : null;
          const now = new Date();
          const daysUntilExpiry = expiresAt ?
            Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

          // Generate chart paths based on click data
          const clicksChartPath = generateChartPath(link.clicksByDate);

          // Status colors
          const getStatusColor = (status: string) => {
            switch (status) {
              case 'active': return 'bg-green-500';
              case 'draft': return 'bg-yellow-500';
              case 'inactive': return 'bg-gray-500';
              case 'expired': return 'bg-red-500';
              default: return 'bg-gray-500';
            }
          };

          // Format expiration date
          const formatExpireDate = (date: Date | null) => {
            if (!date) return null;
            return format(date, 'MMM d');
          };

          // Create SVG for mini sparkline
          const MiniSparkline = () => {
            if (!link.clicksByDate?.length) {
              return <div className="h-[30px] w-[60px] flex items-center justify-center">
                <div className="h-px w-full bg-muted"></div>
              </div>;
            }

            return (
              <div className="h-[30px] w-[60px] relative group">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
                  {/* Light background area */}
                  <defs>
                    <linearGradient id={`gradient-${link.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgb(59, 130, 246, 0.2)" />
                      <stop offset="100%" stopColor="rgb(59, 130, 246, 0)" />
                    </linearGradient>
                  </defs>

                  {/* Area fill */}
                  <path
                    d={`${clicksChartPath} L100,30 L0,30 Z`}
                    fill={`url(#gradient-${link.id})`}
                    className="opacity-50 group-hover:opacity-70 transition-opacity"
                  />

                  {/* Line */}
                  <path
                    d={clicksChartPath}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    className="opacity-70 group-hover:opacity-100 transition-opacity"
                  />
                </svg>
              </div>
            );
          };

          // Truncate destination URL
          const truncateUrl = (url: string, maxLength: number = 30) => {
            if (url.length <= maxLength) return url;

            // Find protocol and domain
            const match = url.match(/^(https?:\/\/)?([^/]+)/i);
            const domain = match ? match[2] : '';

            if (domain.length > maxLength - 5) {
              return domain.substring(0, maxLength - 5) + '...';
            }

            const urlWithoutProtocol = url.replace(/^(https?:\/\/)/, '');

            if (urlWithoutProtocol.length <= maxLength) return urlWithoutProtocol;

            return urlWithoutProtocol.substring(0, maxLength - 3) + '...';
          };

          const isExpanded = expandedLinks.includes(link.id);

          return (
            <div key={link.id} className="rounded-lg border bg-muted/30 shadow-sm overflow-hidden">
              {/* Main row - always visible */}
              <div
                className={cn(
                  "flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20 transition-colors",
                  isExpanded && "border-b border-border/40"
                )}
                onClick={() => {
                  if (isExpanded) {
                    setExpandedLinks(expandedLinks.filter(id => id !== link.id));
                  } else {
                    setExpandedLinks([...expandedLinks, link.id]);
                  }
                }}
              >
                {/* Left side */}
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={cn(
                    "h-2.5 w-2.5 rounded-full flex-shrink-0",
                    getStatusColor(link.status)
                  )} />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">
                        {fullLink}
                      </span>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 flex-shrink-0 opacity-70 hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyLink(link);
                              }}
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

                    <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                      <CornerDownRight className="h-3 w-3 opacity-50 mx-0.5" />
                      <div className="flex items-center gap-1 bg-card rounded-md px-1 py-0.5">
                        <span className="opacity-80">
                          <Badge variant="secondary" className="text-xs font-mono">
                            {link.redirect_type}
                          </Badge>
                        </span>
                        <Minus className="h-3 w-3 opacity-50 mx-0.5" />
                        <span className="truncate opacity-80">
                          {truncateUrl(link.destination_url, 30)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-5">
                  {/* Mini sparkline */}
                  <MiniSparkline />

                  {/* Stats */}
                  <div className="hidden sm:flex flex-col items-end">
                    <div className="text-sm font-medium">
                      {clicks} clicks
                    </div>
                    {link.epc > 0 && (
                      <div className="text-xs text-muted-foreground">
                        EPC: ${link.epc.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Expiration if exists */}
                  {expiresAt && (
                    <div className="hidden md:flex items-center text-xs text-muted-foreground gap-1">
                      <Calendar className="h-3 w-3 opacity-70" />
                      <span>Expires: {formatExpireDate(expiresAt)}</span>
                    </div>
                  )}

                  {/* Actions menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingLink(link)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateStatus(link.id, link.status === 'active' ? 'inactive' : 'active')}
                      >
                        {link.status === 'active' ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-500"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this link?")) {
                            deleteLink(link.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Expand toggle */}
                  <div className="flex items-center justify-center h-6 w-6 text-muted-foreground transition-transform duration-200"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Column 1: Link Details */}
                    <div className="space-y-4">
                      {/* Tags */}
                      {link.tags && link.tags.length > 0 && (
                        <div>
                          <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {link.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Details */}
                      <div>
                        <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Details</h4>
                        <div className="space-y-2 text-sm bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Created</span>
                            <span className="font-medium">{formatRelativeTime(link.created_at)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Redirect Type</span>
                            <span className="font-medium">
                              {link.redirect_type === "301" ? "301 Permanent" : "307 Temporary"}
                            </span>
                          </div>
                          {expiresAt && daysUntilExpiry !== null && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Expires</span>
                              <span className={cn(
                                "font-medium",
                                daysUntilExpiry <= 3 ? "text-red-400" :
                                daysUntilExpiry <= 7 ? "text-yellow-400" : ""
                              )}>
                                {daysUntilExpiry > 0 ? `in ${daysUntilExpiry} days` : "Expired"}
                              </span>
                            </div>
                          )}
                          <div className="pt-2 mt-2 border-t border-border/40">
                            <div className="text-xs text-muted-foreground mb-2">
                              {link.is_broken !== undefined && (
                                <div className="flex items-center gap-1 mb-1">
                                  <span>Status:</span>
                                  {link.is_broken ? (
                                    <span className="text-red-400">Broken</span>
                                  ) : (
                                    <span className="text-green-400">Working</span>
                                  )}
                                </div>
                              )}
                              {link.last_checked_broken && (
                                <div className="opacity-70">
                                  Last checked: {formatRelativeTime(link.last_checked_broken)}
                                </div>
                              )}
                            </div>
                            <LinkCheckButton 
                              linkId={link.id} 
                              isBroken={link.is_broken}
                              lastChecked={link.last_checked_broken}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Destination */}
                      <div>
                        <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Destination</h4>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <a 
                            href={link.destination_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1.5 break-all line-clamp-2"
                          >
                            {link.destination_url}
                            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
                          </a>
                        </div>
                      </div>

                      {/* Notes */}
                      {link.note && (
                        <div>
                          <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Notes</h4>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="bg-muted/30 rounded-lg p-3 cursor-pointer">
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {link.note}
                                </p>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                              <p className="text-sm">{link.note}</p>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                      )}
                    </div>

                    {/* Column 2: Clicks Chart */}
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="mb-4">
                        <h4 className="text-sm text-muted-foreground font-medium">Clicks</h4>
                        <div className="mt-1">
                          <div className="text-2xl font-bold">{clicks}</div>
                          {link.clicksByDate && link.clicksByDate.length > 1 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={cn(
                                "text-xs font-medium",
                                link.clicksByDate[link.clicksByDate.length - 1].count > link.clicksByDate[0].count
                                  ? "text-green-500"
                                  : "text-red-500"
                              )}>
                                {((link.clicksByDate[link.clicksByDate.length - 1].count - link.clicksByDate[0].count) / link.clicksByDate[0].count * 100).toFixed(1)}%
                              </span>
                              <span className="text-xs text-muted-foreground">from last {dateRange} days</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="h-[80px] mt-4">
                        {(link.clicksByDate?.length || 0) > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={link.clicksByDate}
                              margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                            >
                              <CartesianGrid
                                vertical={false}
                                stroke="hsl(var(--border))"
                                opacity={0.1}
                              />
                              <YAxis hide domain={['dataMin', 'dataMax']} />
                              <RechartsTooltip
                                content={({ active, payload }) => {
                                  if (active && payload?.[0]?.value) {
                                    return (
                                      <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-xl">
                                        <div className="flex flex-col gap-1">
                                          <span className="font-medium text-foreground">
                                            {typeof payload[0].value === 'number' ? payload[0].value : 0} clicks
                                          </span>
                                          <span className="text-muted-foreground">
                                            {format(new Date(payload[0].payload.date), 'MMM d')}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{
                                  r: 4,
                                  fill: "#3b82f6",
                                  strokeWidth: 0
                                }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center w-full h-full">
                            <span className="text-sm text-muted-foreground">No data available</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Earnings Chart (only if EPC > 0) */}
                    {link.epc > 0 ? (
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="mb-4">
                          <h4 className="text-sm text-muted-foreground font-medium">Revenue</h4>
                          <div className="mt-1">
                            <div className="text-2xl font-bold">${earnings.toFixed(2)}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-medium text-muted-foreground">
                                EPC ${link.epc.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="h-[80px] mt-4">
                          {(link.clicksByDate?.length || 0) > 0 && link.clicksByDate ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={link.clicksByDate.map(d => ({
                                  date: d.date,
                                  revenue: d.count * link.epc
                                }))}
                                margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                              >
                                <CartesianGrid
                                  vertical={false}
                                  stroke="hsl(var(--border))"
                                  opacity={0.1}
                                />
                                <YAxis hide domain={['dataMin', 'dataMax']} />
                                <RechartsTooltip
                                  content={({ active, payload }) => {
                                    if (active && payload?.[0]?.value) {
                                      const value = typeof payload[0].value === 'number' ? payload[0].value : 0;
                                      return (
                                        <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-xl">
                                          <div className="flex flex-col gap-1">
                                            <span className="font-medium text-foreground">
                                              ${value.toFixed(2)}
                                            </span>
                                            <span className="text-muted-foreground">
                                              {format(new Date(payload[0].payload.date), 'MMM d')}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="revenue"
                                  stroke="#22c55e"
                                  strokeWidth={2}
                                  dot={false}
                                  activeDot={{
                                    r: 4,
                                    fill: "#22c55e",
                                    strokeWidth: 0
                                  }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center w-full h-full">
                              <span className="text-sm text-muted-foreground">No data available</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/30 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                        <div className="mb-2">
                          <h4 className="text-sm text-muted-foreground font-medium">Revenue</h4>
                          <div className="mt-1">
                            <div className="text-2xl font-bold">$0.00</div>
                            <div className="text-xs text-muted-foreground mt-0.5">No earnings configured</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No results message */}
      {filteredLinks.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground">No links found</p>
        </div>
      )}

      {/* Edit modal */}
      {editingLink && (
        <EditLinkModal
          link={editingLink}
          domains={domains}
          open={!!editingLink}
          onOpenChange={(open) => !open && setEditingLink(null)}
        />
      )}
    </div>
  );
} 
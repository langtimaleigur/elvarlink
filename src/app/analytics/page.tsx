"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangeSelector } from "@/components/analytics/date-range-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format, subDays, addDays, differenceInDays } from "date-fns";
import { LinksTable } from "@/components/analytics/links-table";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";
import { useEffect, useState, useCallback } from "react";
import type { DateRange } from "react-day-picker";
import { CopyButton } from "@/components/CopyButton";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "@/components/analytics/sparkline";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DeviceBrowserChart } from "@/components/analytics/device-browser-chart";
import { TopCountries } from "@/components/analytics/top-countries";
import { TopReferrers } from "@/components/analytics/top-referrers";
import { LocationStats } from "@/components/analytics/location-stats";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { BrokenClick } from "@/components/analytics/analytics-charts";
import { Suspense } from "react";

interface Domain {
  id: string;
  domain: string;
  is_primary: boolean;
  primary_domain_id: string | null;
}

interface Link {
  id: string;
  slug: string;
  destination_url: string;
  epc: number;
  status: string;
  expire_at: string | null;
  domain_id: string;
  domain: {
    domain: string;
    is_primary: boolean;
    primary_domain_id: string | null;
  };
  total_clicks: number;
  unique_clicks: number;
  broken_clicks: number;
  growth_rate: number;
  click_history: number[];
  full_url: string;
}

interface UsageData {
  name: string;
  count: number;
}

interface AnalyticsData {
  chartData: {
    date: string;
    clicks: number;
    uniqueClicks: number;
    earnings: number;
    brokenClicks: number;
    domain: {
      domain: string;
      is_primary: boolean;
      primary_domain_id: string | null;
    };
  }[];
  brokenClicks: BrokenClick[];
  trendingLinks: Link[];
  topLinks: Link[];
  expiringLinks: Link[];
  recentlyExpired: Link[];
  stats: {
    totalClicks: number;
    uniqueClicks: number;
    brokenClicks: number;
    totalLinks: number;
  };
  deviceBrowserData: {
    device: UsageData[];
    os: UsageData[];
    browser: UsageData[];
  };
  topCountries: {
    name: string;
    count: number;
  }[];
  allCountries: {
    name: string;
    count: number;
  }[];
  topCities: {
    name: string;
    country: string;
    count: number;
  }[];
  allCities: {
    name: string;
    country: string;
    count: number;
  }[];
  topReferrers: {
    referrer: string;
    count: number;
  }[];
  allReferrers: {
    referrer: string;
    count: number;
  }[];
}

interface CityData {
  name: string;
  country: string;
  count: number;
}

type FilterType = 'device' | 'browser' | 'os' | 'country' | 'city' | 'referrer' | 'domain';

interface Filter {
  type: FilterType;
  value: string;
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleFilterClick = useCallback((type: FilterType, value: string) => {
    setActiveFilters(prev => {
      // Create a copy of current filters
      const newFilters = [...prev];
      
      // Find if we already have this exact filter
      const existingIndex = newFilters.findIndex(f => f.type === type && f.value === value);
      
      if (existingIndex !== -1) {
        // Remove this specific filter
        newFilters.splice(existingIndex, 1);
      } else {
        // For country/city filters, we can have both active at once
        if (type === 'country' || type === 'city') {
          newFilters.push({ type, value });
        } else {
          // For other filter types, remove any existing filter of same type
          const sameTypeIndex = newFilters.findIndex(f => f.type === type);
          if (sameTypeIndex !== -1) {
            newFilters.splice(sameTypeIndex, 1);
          }
          newFilters.push({ type, value });
        }
      }
      
      // Trigger data fetch with new filters
      if (dateRange.from && dateRange.to) {
        fetchData(dateRange.from, dateRange.to, newFilters);
      }
      
      return newFilters;
    });
  }, [dateRange]);

  const clearAllFilters = useCallback(() => {
    setActiveFilters([]);
    // Trigger data fetch without filters
    if (dateRange.from && dateRange.to) {
      fetchData(dateRange.from, dateRange.to, []);
    }
  }, [dateRange]);

  // Update data when date range changes
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchData(dateRange.from, dateRange.to, activeFilters);
    }
  }, [dateRange]);

  const fetchData = async (startDate: Date, endDate: Date, filters: Filter[] = activeFilters) => {
    setLoading(true);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Error getting user:", userError);
      setLoading(false);
      return;
    }
    
    // First get all user's links with domain info
    const { data: links, error: linksError } = await supabase
      .from("links")
      .select(`
        id,
        slug,
        destination_url,
        epc,
        status,
        expire_at,
        domain_id,
        domain:domains!links_domain_id_fkey (
          domain,
          is_primary,
          primary_domain_id
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (linksError) {
      console.error("Error fetching links:", linksError);
      setLoading(false);
      return;
    }

    if (!links || links.length === 0) {
      setLoading(false);
      return;
    }

    // Process links with their URLs
    const linksWithGroups = (links as any[]).map(link => {
      const urlPath = `https://${link.domain?.domain}/${link.slug}`;
      return {
        ...link,
        full_url: urlPath
      };
    });

    // Build click query with filters
    let clickQuery = supabase
      .from("clicks")
      .select(`
        id,
        is_broken,
        timestamp,
        ip_address,
        country,
        city,
        user_agent,
        referrer,
        device,
        os,
        browser,
        link_id,
        links!inner (
          destination_url
        )
      `)
      .in("link_id", linksWithGroups.map(link => link.id))
      .gte("timestamp", startDate.toISOString())
      .lte("timestamp", endDate.toISOString());

    // Apply filters
    filters.forEach(filter => {
      if (filter.type === 'domain') {
        const filteredLinks = linksWithGroups.filter(link => link.domain.domain === filter.value);
        const linkIds = filteredLinks.map(link => link.id);
        clickQuery = clickQuery.in('link_id', linkIds);
      } else if (filter.type === 'referrer') {
        // Handle referrer filter specially since we need to match the domain part
        clickQuery = clickQuery.ilike('referrer', `%${filter.value}%`);
      } else {
        clickQuery = clickQuery.eq(filter.type, filter.value);
      }
    });

    const { data: overviewStats, error: clicksError } = await clickQuery;

    if (clicksError) {
      console.error("Error fetching clicks:", clicksError);
      setLoading(false);
      return;
    }

    //console.log('Raw Supabase clicks data:', overviewStats);
    //console.log('Number of clicks with referrers:', overviewStats?.filter(click => click.referrer).length);

    // Process device, OS, and browser data
    const deviceCounts = new Map<string, number>();
    const osCounts = new Map<string, number>();
    const browserCounts = new Map<string, number>();

    overviewStats?.forEach(click => {
      // Count devices
      if (click.device) {
        deviceCounts.set(click.device, (deviceCounts.get(click.device) || 0) + 1);
      }

      // Count operating systems
      if (click.os) {
        osCounts.set(click.os, (osCounts.get(click.os) || 0) + 1);
      }

      // Count browsers
      if (click.browser) {
        browserCounts.set(click.browser, (browserCounts.get(click.browser) || 0) + 1);
      }
    });

    const deviceBrowserData = {
      device: Array.from(deviceCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      os: Array.from(osCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      browser: Array.from(browserCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
    };

    // Process country and city data
    const countryCounts = new Map<string, number>();
    const cityCounts = new Map<string, { count: number; country: string }>();

    overviewStats?.forEach(click => {
      if (click.country) {
        countryCounts.set(click.country, (countryCounts.get(click.country) || 0) + 1);
      }
      if (click.city) {
        const cityKey = `${click.city}, ${click.country}`;
        const current = cityCounts.get(cityKey) || { count: 0, country: click.country || "" };
        cityCounts.set(cityKey, {
          count: current.count + 1,
          country: click.country || ""
        });
      }
    });

    const allCountries = Array.from(countryCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const topCountries = allCountries.slice(0, 5);

    const processedCities: CityData[] = Array.from(cityCounts.entries())
      .map(([name, data]) => ({ 
        name: name.split(", ")[0], 
        country: data.country,
        count: data.count 
      }))
      .sort((a, b) => b.count - a.count);

    const allCities = processedCities;
    const topCities = processedCities.slice(0, 5);

    // Process referrer data
    const referrerCounts = new Map<string, number>();
   // console.log('Processing referrers from overviewStats:', overviewStats?.length);
    
    overviewStats?.forEach(click => {
      if (click.referrer) {
        let referrer = click.referrer;
        try {
          // Keep the full URL but clean it up
          const url = new URL(click.referrer);
          referrer = url.origin + url.pathname;
        } catch (e) {
          // If URL parsing fails, use the referrer as is
          referrer = click.referrer;
        }
        //console.log('Processing referrer:', referrer);
        referrerCounts.set(referrer, (referrerCounts.get(referrer) || 0) + 1);
      }
    });

    //console.log('Referrer counts:', Array.from(referrerCounts.entries()));
    
    const allReferrers = Array.from(referrerCounts.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count);

    //console.log('Final allReferrers:', allReferrers);
    //console.log('Number of referrers:', allReferrers.length);

    const topReferrers = allReferrers;

    // Calculate stats based on filtered data
    const stats = {
      totalClicks: overviewStats?.length || 0,
      uniqueClicks: new Set(overviewStats?.map(click => 
        `${click.ip_address}-${click.country}-${click.user_agent}`
      )).size,
      brokenClicks: overviewStats?.filter(click => click.is_broken).length || 0,
      totalLinks: links?.length || 0,
    };

    // Process data for charts
    const dailyData = new Map<string, {
      date: string;
      clicks: number;
      uniqueClicks: Set<string>;
      earnings: number;
      brokenClicks: number;
    }>();

    // Initialize daily data
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      dailyData.set(dateStr, {
        date: dateStr,
        clicks: 0,
        uniqueClicks: new Set(),
        earnings: 0,
        brokenClicks: 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Process clicks data
    overviewStats?.forEach(click => {
      const date = format(new Date(click.timestamp), "yyyy-MM-dd");
      const dayData = dailyData.get(date);
      if (dayData) {
        dayData.clicks++;
        dayData.uniqueClicks.add(`${click.ip_address}-${click.country}-${click.user_agent}`);
        
        // Track broken clicks
        if (click.is_broken) {
          dayData.brokenClicks++;
        }
        
        // Calculate earnings
        const link = linksWithGroups?.find(l => l.id === click.link_id);
        if (link) {
          dayData.earnings += link.epc;
        }
      }
    });

    // Convert to array for charts
    const chartData = Array.from(dailyData.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(day => ({
        date: format(new Date(day.date), "MMM dd"),
        clicks: day.clicks,
        uniqueClicks: day.uniqueClicks.size,
        earnings: day.earnings,
        brokenClicks: day.brokenClicks,
        domain: {
          domain: "All Domains",
          is_primary: true,
          primary_domain_id: null
        }
      }));

    // Process links data for tables
    const linksWithStats = linksWithGroups?.map(link => {
      const linkClicks = overviewStats?.filter(click => click.link_id === link.id) || [];
      const uniqueLinkClicks = new Set(linkClicks.map(click => 
        `${click.ip_address}-${click.country}-${click.user_agent}`
      )).size;
      const brokenLinkClicks = linkClicks.filter(click => click.is_broken).length;

      // Calculate growth rate
      const midDate = new Date((startDate.getTime() + endDate.getTime()) / 2);
      const firstHalfClicks = linkClicks.filter(click => 
        new Date(click.timestamp) < midDate
      ).length;
      const secondHalfClicks = linkClicks.filter(click => 
        new Date(click.timestamp) >= midDate
      ).length;
      const growthRate = firstHalfClicks > 0 
        ? ((secondHalfClicks - firstHalfClicks) / firstHalfClicks) * 100 
        : 0;

      // Generate click history for sparkline
      const clickHistory = Array.from(dailyData.values())
        .map(day => linkClicks.filter(click => 
          format(new Date(click.timestamp), "yyyy-MM-dd") === day.date
        ).length);

      return {
        ...link,
        total_clicks: linkClicks.length,
        unique_clicks: uniqueLinkClicks,
        broken_clicks: brokenLinkClicks,
        growth_rate: growthRate,
        click_history: clickHistory,
      };
    }) || [];

    // Sort links for different views
    const topLinks = [...linksWithStats]
      .sort((a, b) => b.total_clicks - a.total_clicks)
      .slice(0, 5);

    const trendingLinks = [...linksWithStats]
      .sort((a, b) => b.growth_rate - a.growth_rate)
      .slice(0, 5);

    const now = new Date();
    const expiringLinks = [...linksWithStats]
      .filter(link => link.expire_at !== null)
      .sort((a, b) => {
        const dateA = a.expire_at ? new Date(a.expire_at).getTime() : Infinity;
        const dateB = b.expire_at ? new Date(b.expire_at).getTime() : Infinity;
        return dateA - dateB;
      });

    const upcomingExpiring = expiringLinks
      .filter(link => {
        if (!link.expire_at) return false;
        const expireDate = new Date(link.expire_at);
        return expireDate > now;
      })
      .slice(0, 5);

    const recentlyExpired = expiringLinks
      .filter(link => {
        if (!link.expire_at) return false;
        const expireDate = new Date(link.expire_at);
        return expireDate <= now;
      })
      .slice(0, 5);

    // Process broken clicks
    const brokenClicks = (overviewStats || [])
      .filter(click => click.is_broken)
      .map(click => {
        const link = linksWithGroups?.find(l => l.id === click.link_id);
        return {
          timestamp: click.timestamp,
          destination_url: (click.links as any).destination_url,
          original_url: link ? `${link.domain.domain}/${link.slug}` : 'Unknown',
          domain: link?.domain.domain || 'Unknown',
          slug: link?.slug || 'Unknown',
          referrer: click.referrer || 'Direct'
        };
      });

    setData({
      chartData,
      brokenClicks,
      trendingLinks,
      topLinks,
      expiringLinks: upcomingExpiring,
      recentlyExpired,
      stats,
      deviceBrowserData,
      topCountries,
      allCountries,
      topCities,
      allCities,
      topReferrers,
      allReferrers
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      }>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold shrink-0">Analytics</h1>
            
            {/* Scrollable Filters */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex-1 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2">
                  {activeFilters.map((filter, index) => (
                    <Badge
                      key={`${filter.type}-${filter.value}-${index}`}
                      variant="secondary"
                      className="flex items-center gap-1 whitespace-nowrap"
                    >
                      <span className="font-medium text-muted-foreground">
                        {filter.type.charAt(0).toUpperCase() + filter.type.slice(1)}:
                      </span>
                      <span>{filter.value}</span>
                      <button
                        onClick={() => handleFilterClick(filter.type, filter.value)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-muted-foreground hover:text-foreground whitespace-nowrap"
                  >
                    Clear all
                  </Button>
                )}
                <DateRangeSelector value={dateRange} onDateRangeChange={setDateRange} />
              </div>
            </div>
          </div>

          {/* Overview Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue Chart Skeleton */}
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded opacity-70" />
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>

            {/* Clicks Chart Skeleton */}
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded opacity-70" />
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          </div>

          {/* Table Skeleton */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-4">
                {['trending', 'top', 'expiring'].map((tab) => (
                  <div key={tab} className="h-8 w-24 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </Suspense>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-4">Analytics</h1>
        <p>No links found. Create some links to see analytics.</p>
      </div>
    );
  }

  // Helper function for status display
  const getStatusDisplay = (status: string, expireAt: string | null) => {
    const now = new Date();
    const isExpired = expireAt && new Date(expireAt) <= now;

    return {
      color: status === 'active' && !isExpired
        ? 'bg-green-500'
        : status === 'archived'
        ? 'bg-gray-300'
        : status === 'draft'
        ? 'bg-gray-500'
        : 'bg-red-500',
      label: isExpired ? 'Expired' : status.charAt(0).toUpperCase() + status.slice(1),
      textDecoration: status === 'archived' ? 'line-through' : 'none'
    };
  };

  // Helper function to parse browser from user agent
  function parseBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Other';
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold shrink-0">Analytics</h1>
          
          {/* Scrollable Filters */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex-1 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2">
                {activeFilters.map((filter, index) => (
                  <Badge
                    key={`${filter.type}-${filter.value}-${index}`}
                    variant="secondary"
                    className="flex items-center gap-1 whitespace-nowrap"
                  >
                    <span className="font-medium text-muted-foreground">
                      {filter.type.charAt(0).toUpperCase() + filter.type.slice(1)}:
                    </span>
                    <span>{filter.value}</span>
                    <button
                      onClick={() => handleFilterClick(filter.type, filter.value)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeFilters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground whitespace-nowrap"
                >
                  Clear all
                </Button>
              )}
              <DateRangeSelector value={dateRange} onDateRangeChange={setDateRange} />
            </div>
          </div>
        </div>

        {/* Charts */}
        <AnalyticsCharts 
          chartData={data.chartData} 
          brokenClicks={data.brokenClicks}
        />

        {/* New Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DeviceBrowserChart 
            data={data.deviceBrowserData} 
            onFilterClick={handleFilterClick}
          />
          <LocationStats 
            topCountries={data.topCountries}
            allCountries={data.allCountries}
            topCities={data.topCities}
            allCities={data.allCities}
            onFilterClick={handleFilterClick}
          />
          <TopReferrers 
            topReferrers={data.topReferrers} 
            allReferrers={data.allReferrers}
            onFilterClick={handleFilterClick}
          />
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top Links */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Top Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.topLinks.map((link) => (
                <div key={link.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div 
                              className={cn(
                                "w-2 h-2 rounded-full",
                                getStatusDisplay(link.status, link.expire_at).color
                              )}
                              style={{
                                textDecoration: getStatusDisplay(link.status, link.expire_at).textDecoration
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{getStatusDisplay(link.status, link.expire_at).label}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <CopyButton 
                        value={link.full_url} 
                        displayValue={link.full_url.replace('https://', '')}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{link.total_clicks} clicks</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild iconOnly>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/links/${link.id}`)}>
                            View Analytics
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {link.destination_url}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Trending Links */}
          <Card>
            <CardHeader>
              <CardTitle>Trending Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.trendingLinks.map((link) => (
                <div key={link.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div 
                              className={cn(
                                "w-2 h-2 rounded-full",
                                getStatusDisplay(link.status, link.expire_at).color
                              )}
                              style={{
                                textDecoration: getStatusDisplay(link.status, link.expire_at).textDecoration
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{getStatusDisplay(link.status, link.expire_at).label}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <CopyButton 
                        value={link.full_url} 
                        displayValue={link.full_url.replace('https://', '')}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{link.total_clicks} clicks</span>
                    <span className="text-emerald-500">+{link.growth_rate.toFixed(1)}%</span>
                  </div>
                  <Sparkline data={link.click_history} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Expiring Links */}
          <Card>
            <CardHeader>
              <CardTitle>Link Expiration</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upcoming" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upcoming">Expiring Soon</TabsTrigger>
                  <TabsTrigger value="expired">Recently Expired</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming" className="space-y-4">
                  {data.expiringLinks.map((link) => (
                    <div key={link.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div 
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    getStatusDisplay(link.status, link.expire_at).color
                                  )}
                                  style={{
                                    textDecoration: getStatusDisplay(link.status, link.expire_at).textDecoration
                                  }}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{getStatusDisplay(link.status, link.expire_at).label}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <CopyButton 
                            value={link.full_url} 
                            displayValue={link.full_url.replace('https://', '')}
                            className="text-sm"
                          />
                          <Badge 
                            variant={
                              link.expire_at && differenceInDays(new Date(link.expire_at), new Date()) <= 3 
                                ? 'destructive' 
                                : 'default'
                            }
                          >
                            {link.expire_at ? `${differenceInDays(new Date(link.expire_at), new Date())}d` : 'No expiry'}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">
                              {link.full_url}
                            </span>
                            <CopyButton value={link.full_url} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{link.total_clicks} clicks</span>
                      </div>
                      <Sparkline data={link.click_history} />
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="expired" className="space-y-4">
                  {data.recentlyExpired.map((link) => (
                    <div key={link.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div 
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    getStatusDisplay(link.status, link.expire_at).color
                                  )}
                                  style={{
                                    textDecoration: getStatusDisplay(link.status, link.expire_at).textDecoration
                                  }}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{getStatusDisplay(link.status, link.expire_at).label}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Badge variant="destructive">
                            Expired {Math.abs(differenceInDays(new Date(link.expire_at!), new Date()))}d ago
                          </Badge>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">
                              {link.full_url}
                            </span>
                            <CopyButton value={link.full_url} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{link.total_clicks} clicks</span>
                      </div>
                      <Sparkline data={link.click_history} />
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Suspense>
  );
} 
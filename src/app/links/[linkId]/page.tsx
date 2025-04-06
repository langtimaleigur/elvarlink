"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format, subDays, differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/CopyButton";
import { Sparkline } from "@/components/analytics/sparkline";
import { DeviceBrowserChart } from "@/components/analytics/device-browser-chart";
import { LocationStats } from "@/components/analytics/location-stats";
import { TopReferrers } from "@/components/analytics/top-referrers";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

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
  tags: string[];
  redirect_type: string;
  note?: string;
  created_at: string;
}

interface AnalyticsData {
  chartData: {
    date: string;
    clicks: number;
    uniqueClicks: number;
    earnings: number;
    domain: {
      domain: string;
      is_primary: boolean;
      primary_domain_id: string | null;
    };
  }[];
  deviceBrowserData: {
    device: { name: string; count: number }[];
    os: { name: string; count: number }[];
    browser: { name: string; count: number }[];
  };
  topCountries: { name: string; count: number }[];
  allCountries: { name: string; count: number }[];
  topCities: { name: string; country: string; count: number }[];
  allCities: { name: string; country: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  allReferrers: { referrer: string; count: number }[];
}

export default function LinkAnalyticsPage({ params }: { params: { linkId: string } }) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [link, setLink] = useState<Link | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  const fetchData = async (startDate: Date, endDate: Date) => {
    setLoading(true);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      router.push("/login");
      return;
    }
    
    try {
      // Fetch the link with proper error handling
      const { data: linkData, error: linkError } = await supabase
        .from("links")
        .select(`
          id,
          slug,
          destination_url,
          epc,
          status,
          expire_at,
          domain_id,
          tags,
          redirect_type,
          note,
          created_at,
          domain:domains (
            domain,
            is_primary,
            primary_domain_id
          )
        `)
        .eq('id', params.linkId)
        .eq('user_id', user.id)
        .single();

      if (linkError) {
        console.error("Error fetching link:", linkError);
        setLoading(false);
        return;
      }

      if (!linkData) {
        console.error("Link not found");
        setLoading(false);
        return;
      }

      // Construct the full URL
      const fullUrl = `https://${linkData.domain?.domain}/${linkData.slug}`;
      const linkWithUrl = { ...linkData, full_url: fullUrl };
      setLink(linkWithUrl);

      // Fetch clicks for this link
      const { data: clicks, error: clicksError } = await supabase
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
          browser
        `)
        .eq("link_id", params.linkId)
        .gte("timestamp", startDate.toISOString())
        .lte("timestamp", endDate.toISOString());

      if (clicksError) {
        console.error("Error fetching clicks:", clicksError);
        setLoading(false);
        return;
      }

      // Process device, OS, and browser data
      const deviceCounts = new Map<string, number>();
      const osCounts = new Map<string, number>();
      const browserCounts = new Map<string, number>();

      clicks?.forEach(click => {
        if (click.device) {
          deviceCounts.set(click.device, (deviceCounts.get(click.device) || 0) + 1);
        }
        if (click.os) {
          osCounts.set(click.os, (osCounts.get(click.os) || 0) + 1);
        }
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

      clicks?.forEach(click => {
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

      const processedCities = Array.from(cityCounts.entries())
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
      clicks?.forEach(click => {
        if (click.referrer) {
          let referrer = click.referrer;
          try {
            // Try to extract domain from URL
            const url = new URL(click.referrer);
            referrer = url.hostname;
          } catch (e) {
            // If URL parsing fails, use the referrer as is
            referrer = click.referrer.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
          }
          referrerCounts.set(referrer, (referrerCounts.get(referrer) || 0) + 1);
        }
      });

      const allReferrers = Array.from(referrerCounts.entries())
        .map(([referrer, count]) => ({ referrer, count }))
        .sort((a, b) => b.count - a.count);

      const topReferrers = allReferrers.slice(0, 10);

      // Process data for charts
      const dailyData = new Map<string, {
        date: string;
        clicks: number;
        uniqueClicks: Set<string>;
        earnings: number;
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
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Process clicks data
      clicks?.forEach(click => {
        const date = format(new Date(click.timestamp), "yyyy-MM-dd");
        const dayData = dailyData.get(date);
        if (dayData) {
          dayData.clicks++;
          dayData.uniqueClicks.add(`${click.ip_address}-${click.country}-${click.user_agent}`);
          dayData.earnings += linkData.epc;
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
          domain: linkData.domain
        }));

      setData({
        chartData,
        deviceBrowserData,
        topCountries,
        allCountries,
        topCities,
        allCities,
        topReferrers,
        allReferrers
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchData(dateRange.from, dateRange.to);
    }
  }, [dateRange, params.linkId]);

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

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Link Analytics</h1>
          <DateRangePicker value={dateRange} onDateRangeChange={setDateRange} />
        </div>
        {/* Loading skeleton */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!link || !data) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-4">Link Analytics</h1>
        <p>Link not found or you don't have access to it.</p>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(link.status, link.expire_at);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Link Analytics</h1>
        <DateRangePicker value={dateRange} onDateRangeChange={setDateRange} />
      </div>

      {/* Link Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("w-2 h-2 rounded-full", statusDisplay.color)} />
            <div>
              <h2 className="text-xl font-semibold">
                <CopyButton 
                  value={link.full_url} 
                  displayValue={link.full_url.replace('https://', '')}
                  className="text-xl"
                />
              </h2>
              <p className="text-sm text-muted-foreground">
                Created {format(new Date(link.created_at), "MMM d, yyyy")}
                {link.expire_at && (
                  <>
                    {" · "}
                    {link.expire_at && new Date(link.expire_at) > new Date() ? (
                      <>Expires in {differenceInDays(new Date(link.expire_at), new Date())} days</>
                    ) : (
                      <>Expired {Math.abs(differenceInDays(new Date(link.expire_at!), new Date()))} days ago</>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/links/${link.id}/edit`)}>
                Edit Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/links/${link.id}/disable`)}>
                Disable
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/links/${link.id}/delete`)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Destination URL</p>
              <a 
                href={link.destination_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline truncate block"
              >
                {link.destination_url}
              </a>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Redirect Type</p>
              <p className="text-sm font-medium">{link.redirect_type}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tags</p>
              <div className="flex flex-wrap gap-1">
                {link.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm font-medium line-clamp-2">{link.note}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts */}
      <AnalyticsCharts chartData={data.chartData} />

      {/* Analytics Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DeviceBrowserChart data={data.deviceBrowserData} />
        <LocationStats 
          topCountries={data.topCountries}
          allCountries={data.allCountries}
          topCities={data.topCities}
          allCities={data.allCities}
        />
        <TopReferrers topReferrers={data.topReferrers} allReferrers={data.allReferrers} />
      </div>
    </div>
  );
} 
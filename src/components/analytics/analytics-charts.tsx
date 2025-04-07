"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ComposedChart, Line, XAxis, CartesianGrid, ResponsiveContainer, Tooltip, Area, YAxis } from "recharts";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, ListIcon, MoreVertical } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

interface ChartData {
  date: string;
  clicks: number;
  uniqueClicks: number;
  earnings: number;
  brokenClicks?: number;
  domain: {
    domain: string;
    is_primary: boolean;
    primary_domain_id: string | null;
  };
}

export interface BrokenClick {
  timestamp: string;
  destination_url: string;
  original_url: string;
  domain: string;
  slug: string;
  referrer: string;
}

interface BrokenClickGroup {
  destination_url: string;
  original_url: string;
  domain: string;
  slug: string;
  referrer: string;
  total_broken_clicks: number;
  percentage_of_total: number;
  instances: {
    timestamp: string;
    referrer: string;
  }[];
}

interface AnalyticsChartsProps {
  chartData: ChartData[];
  brokenClicks?: BrokenClick[];
}

type ChartType = 'clicks' | 'revenue' | 'broken';

interface ChartConfig {
  [key: string]: {
    label: string | React.ReactNode;
    value: string;
    color: string;
    dataKey: string | string[];
    formatter: (value: number) => string;
    invertGrowth: boolean;
    secondaryColor?: string;
  }
}

const CustomTooltip = ({ active, payload, label, chartType, chartConfig }: any) => {
  if (active && payload && payload.length) {
    const config = chartConfig[chartType];
    
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="flex flex-col gap-1">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            {label}
          </span>
          {Array.isArray(config.dataKey) ? (
            // Show both total and unique clicks
            <>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: config.color }} />
                <span className="font-bold text-muted-foreground">
                  {config.formatter(payload[0].value)} total
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: config.secondaryColor }} />
                <span className="font-bold text-muted-foreground">
                  {config.formatter(payload[1].value)} unique
                </span>
              </div>
            </>
          ) : (
            // Show single value
            <span className="font-bold text-muted-foreground">
              {config.formatter(payload[0].value)}
            </span>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function AnalyticsCharts({ chartData, brokenClicks = [] }: AnalyticsChartsProps) {
  const [activeChart, setActiveChart] = useState<ChartType>('clicks');
  const [animatedCharts, setAnimatedCharts] = useState<Set<ChartType>>(new Set());
  const router = useRouter();

  // Track which charts have been animated
  useEffect(() => {
    if (!animatedCharts.has(activeChart)) {
      setAnimatedCharts(prev => new Set([...prev, activeChart]));
    }
  }, [activeChart]);

  // Process broken clicks data
  const groupedBrokenClicks = useMemo(() => {
    const groups = new Map<string, BrokenClickGroup>();
    
    // First pass: group by URL and count instances
    brokenClicks.forEach(click => {
      const existing = groups.get(click.destination_url);
      if (existing) {
        existing.instances.push({ timestamp: click.timestamp, referrer: click.referrer });
        existing.total_broken_clicks++;
      } else {
        groups.set(click.destination_url, {
          destination_url: click.destination_url,
          original_url: click.original_url,
          domain: click.domain,
          slug: click.slug,
          referrer: click.referrer,
          total_broken_clicks: 1,
          percentage_of_total: 0, // Will calculate in second pass
          instances: [{ timestamp: click.timestamp, referrer: click.referrer }]
        });
      }
    });

    // Second pass: calculate percentages
    const totalClicks = chartData.reduce((acc, day) => acc + day.clicks, 0);
    
    return Array.from(groups.values())
      .map(group => ({
        ...group,
        percentage_of_total: (group.total_broken_clicks / totalClicks) * 100
      }))
      .sort((a, b) => b.total_broken_clicks - a.total_broken_clicks);
  }, [brokenClicks, chartData]);

  const chartConfig: ChartConfig = {
    clicks: {
      label: "Total Clicks",
      value: "clicks",
      color: "#3b82f6",
      dataKey: ["clicks", "uniqueClicks"],
      formatter: (value: number) => value.toLocaleString(),
      invertGrowth: false,
      secondaryColor: "#8b5cf6"
    },
    revenue: {
      label: "Total Revenue",
      value: "revenue",
      color: "#10b981",
      dataKey: "earnings",
      formatter: (value: number) => `$${value.toFixed(2)}`,
      invertGrowth: false
    },
    broken: {
      label: (
        <div className="flex items-center gap-2">
          Dead Link Clicks
          <Drawer>
            <DrawerTrigger asChild>
              <div 
                className="h-4 w-4 hover:bg-muted rounded-md flex items-center justify-center cursor-pointer"
              >
                <ListIcon className="h-3 w-3" />
              </div>
            </DrawerTrigger>
            <DrawerContent>
              <div className="container max-w-screen-2xl mx-auto">
                <DrawerHeader className="px-6 py-4 border-b">
                  <DrawerTitle>Dead Link Clicks</DrawerTitle>
                </DrawerHeader>
                <div className="px-6 py-6">
                  {groupedBrokenClicks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No dead link clicks in this period.</p>
                  ) : (
                    <Accordion type="single" collapsible className="space-y-4">
                      {groupedBrokenClicks.map((group, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
                          <AccordionTrigger className="hover:no-underline [&[data-state=open]>div]:pb-2">
                            <div className="flex flex-1 flex-col md:flex-row md:items-center justify-between gap-2 md:gap-6">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="shrink-0">
                                    {group.domain}
                                  </Badge>
                                  <p className="font-medium truncate">/{group.slug}</p>
                                </div>
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                  → {group.destination_url}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 shrink-0 min-w-[180px] justify-start md:justify-end">
                                <Badge variant="outline">
                                  {group.total_broken_clicks} clicks
                                </Badge>
                                <Badge 
                                  variant={group.percentage_of_total > 5 ? "destructive" : "secondary"}
                                >
                                  {group.percentage_of_total.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-4">
                              <div className="rounded-md bg-muted p-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-sm font-medium">Original Link</div>
                                    <div className="text-sm text-muted-foreground mt-1 break-all">
                                      {group.original_url}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">Destination</div>
                                    <div className="text-sm text-muted-foreground mt-1 break-all">
                                      {group.destination_url}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="text-sm font-medium">Click Instances</div>
                                <div className="space-y-3">
                                  {group.instances.map((instance, i) => (
                                    <div key={i} className="text-sm">
                                      <div className="font-medium">
                                        {format(new Date(instance.timestamp), "MMM d, yyyy 'at' h:mm:ss a")}
                                      </div>
                                      <div className="text-muted-foreground mt-0.5 break-all">
                                        From: {instance.referrer === 'Direct' ? 'Direct Traffic' : instance.referrer}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      ),
      value: "broken",
      color: "#ef4444",
      dataKey: "brokenClicks",
      formatter: (value: number) => value.toLocaleString(),
      invertGrowth: true
    }
  };

  const totals = useMemo(() => ({
    clicks: chartData.reduce((acc, curr) => acc + curr.clicks, 0),
    revenue: chartData.reduce((acc, curr) => acc + curr.earnings, 0),
    broken: chartData.reduce((acc, curr) => acc + (curr.brokenClicks || 0), 0),
  }), [chartData]);

  // Calculate growth rates
  const midPoint = Math.floor(chartData.length / 2);
  const firstHalf = chartData.slice(0, midPoint);
  const secondHalf = chartData.slice(midPoint);

  const growth = {
    clicks: {
      first: firstHalf.reduce((acc, curr) => acc + curr.clicks, 0),
      second: secondHalf.reduce((acc, curr) => acc + curr.clicks, 0)
    },
    revenue: {
      first: firstHalf.reduce((acc, curr) => acc + curr.earnings, 0),
      second: secondHalf.reduce((acc, curr) => acc + curr.earnings, 0)
    },
    broken: {
      first: firstHalf.reduce((acc, curr) => acc + (curr.brokenClicks || 0), 0),
      second: secondHalf.reduce((acc, curr) => acc + (curr.brokenClicks || 0), 0)
    }
  };

  const growthRates = {
    clicks: ((growth.clicks.second - growth.clicks.first) / growth.clicks.first) * 100,
    revenue: ((growth.revenue.second - growth.revenue.first) / growth.revenue.first) * 100,
    broken: growth.broken.first > 0 ? ((growth.broken.second - growth.broken.first) / growth.broken.first) * 100 : 0
  };

  return (
    <Card className="bg-card">
      <CardHeader className="flex p-0">
        <div className="flex flex-1">
          {(Object.keys(chartConfig) as ChartType[]).map((key) => {
            const config = chartConfig[key];
            const growthRate = growthRates[key];
            const isPositive = key === 'broken' ? growthRate > 0 : growthRate > 0;
            
            return (
              <div
                key={key}
                onClick={() => setActiveChart(key)}
                className={cn(
                  "flex flex-1 flex-col justify-center gap-1 px-6 py-4 text-left transition-colors relative cursor-pointer",
                  "border-r last:border-r-0",
                  activeChart === key ? "bg-muted" : "hover:bg-muted/50"
                )}
              >
                <span className="text-xs text-muted-foreground">
                  {config.label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {config.formatter(totals[key])}
                </span>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Badge variant="secondary" className={cn(
                          "px-1.5 py-0.5 inline-flex items-center",
                          growthRate === 0 ? "bg-muted text-muted-foreground hover:bg-muted/80" :
                          key === 'broken' ? (
                            growthRate > 0 
                              ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                              : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                          ) : (
                            growthRate > 0 
                              ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                              : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          )
                        )}>
                          {growthRate === 0 ? (
                            <span>No change</span>
                          ) : (
                            <>
                              {isPositive ? (
                                <ArrowUpIcon className="w-3 h-3 mr-1" />
                              ) : (
                                <ArrowDownIcon className="w-3 h-3 mr-1" />
                              )}
                              <span>{Math.abs(Math.round(growthRate))}%</span>
                            </>
                          )}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Compared to previous period</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
                {activeChart === key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </div>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorBroken" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke="hsl(var(--border))" 
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                fontSize={12}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                fontSize={12}
                stroke="hsl(var(--muted-foreground))"
                allowDecimals={false}
                minTickGap={5}
                domain={[0, 'auto']}
              />
              <Tooltip
                content={({ active, payload, label }) => (
                  <CustomTooltip 
                    active={active} 
                    payload={payload} 
                    label={label} 
                    chartType={activeChart}
                    chartConfig={chartConfig}
                  />
                )}
                cursor={false}
              />
              {activeChart === 'clicks' ? (
                // Render clicks chart with two lines - total clicks must be rendered first
                <>
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    fill="url(#colorClicks)"
                    fillOpacity={0.4}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: "#3b82f6",
                      strokeWidth: 0
                    }}
                    isAnimationActive={!animatedCharts.has('clicks')}
                    animationDuration={1000}
                    connectNulls={true}
                    baseValue={0}
                  />
                  <Area
                    type="monotone"
                    dataKey="uniqueClicks"
                    fill="url(#colorUnique)"
                    fillOpacity={0.4}
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: "#8b5cf6",
                      strokeWidth: 0
                    }}
                    isAnimationActive={!animatedCharts.has('clicks')}
                    animationDuration={1000}
                    connectNulls={true}
                    baseValue={0}
                  />
                </>
              ) : (
                // Render single line charts
                <Area
                  type="monotone"
                  dataKey={chartConfig[activeChart].dataKey as string}
                  fill={`url(#color${activeChart.charAt(0).toUpperCase() + activeChart.slice(1)})`}
                  fillOpacity={0.4}
                  stroke={chartConfig[activeChart].color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: chartConfig[activeChart].color,
                    strokeWidth: 0
                  }}
                  isAnimationActive={!animatedCharts.has(activeChart)}
                  animationDuration={1000}
                  connectNulls={true}
                  baseValue={0}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 
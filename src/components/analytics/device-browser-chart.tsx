"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsItem } from "./analytics-item";
import { ScrollableContainer } from "./scrollable-container";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface UsageData {
  name: string;
  count: number;
}

type FilterType = 'device' | 'browser' | 'os' | 'country' | 'city' | 'referrer';

interface DeviceBrowserChartProps {
  data: {
    device: UsageData[];
    os: UsageData[];
    browser: UsageData[];
  };
  onFilterClick?: (type: FilterType, value: string) => void;
}

type ChartType = 'device' | 'os' | 'browser';

export function DeviceBrowserChart({ data, onFilterClick }: DeviceBrowserChartProps) {
  const [selectedType, setSelectedType] = useState<ChartType>('device');
  const [showPercentages, setShowPercentages] = useState(false);

  const calculatePercentage = (count: number, total: number) => {
    return (count / total) * 100;
  };

  const getTotalCount = (data: UsageData[]) => {
    return data.reduce((acc, item) => acc + item.count, 0);
  };

  const displayData = data[selectedType];
  const totalCount = getTotalCount(displayData);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Devices & Browsers</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-sm font-normal"
            >
              {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[140px]">
            <DropdownMenuItem
              onClick={() => setSelectedType('device')}
              selected={selectedType === 'device'}
              className="py-2"
            >
              Device
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSelectedType('os')}
              selected={selectedType === 'os'}
              className="py-2"
            >
              OS
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSelectedType('browser')}
              selected={selectedType === 'browser'}
              className="py-2"
            >
              Browser
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <ScrollableContainer maxHeight="250px">
          <div 
            className="space-y-2"
            onMouseLeave={() => setShowPercentages(false)}
          >
            {displayData.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  if (x > rect.width - 60) {
                    setShowPercentages(true);
                  }
                }}
              >
                <AnalyticsItem
                  type={selectedType}
                  value={item.name}
                  count={item.count}
                  percentage={calculatePercentage(item.count, totalCount)}
                  onFilterClick={onFilterClick}
                  showPercentages={showPercentages}
                />
              </div>
            ))}
          </div>
        </ScrollableContainer>
      </CardContent>
    </Card>
  );
} 
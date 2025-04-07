"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsItem } from "./analytics-item";
import { ScrollableContainer } from "./scrollable-container";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import type { AnalyticsCardProps, FilterType } from "@/lib/types/analytics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AnalyticsCard({ 
  title,
  data = [],
  activeFilters = [],
  onFilterClick,
  filterTypes,
  defaultFilterType,
  maxHeight = "300px"
}: AnalyticsCardProps) {
  const [selectedType, setSelectedType] = useState<FilterType | undefined>(defaultFilterType);
  const [selectedDomain, setSelectedDomain] = useState<string>("All Domains");
  const [showPercentages, setShowPercentages] = useState(false);

  // Get unique domains for domain filtering
  const uniqueDomains = useMemo(() => {
    if (!filterTypes?.includes('domain')) return [];
    const domains = new Set<string>();
    data.forEach(item => {
      if (item.metadata?.domain) {
        domains.add(item.metadata.domain);
      }
    });
    return ["All Domains", ...Array.from(domains)];
  }, [data, filterTypes]);

  // Filter data based on selected type and/or domain
  const displayData = useMemo(() => {
    let filteredData = data;

    // If we have filterTypes, filter by the selected type
    if (filterTypes?.length && filterTypes[0] !== 'domain') {
      filteredData = data.filter(item => item.type === selectedType);
    }

    // Local domain filtering (only affects the card's content)
    if (filterTypes?.includes('domain') && selectedDomain !== "All Domains") {
      filteredData = filteredData.filter(item => item.metadata?.domain === selectedDomain);
    }

    // Special handling for link filters:
    // - In the Links card (where items are of type 'link'), only show the selected link
    // - In other cards, show all items but filtered by the selected link's data
    const linkFilter = activeFilters.find(f => f.type === 'link');
    if (linkFilter && data[0]?.type === 'link') {
      // For the Links card, only show the selected link
      filteredData = filteredData.filter(item => item.name === linkFilter.value);
    }

    return filteredData;
  }, [data, filterTypes, selectedType, selectedDomain, activeFilters]);

  const totalCount = displayData.reduce((acc, item) => acc + item.count, 0);

  // If no data, show empty state
  if (!data?.length) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const getDropdownLabel = () => {
    if (filterTypes?.includes('domain')) {
      return selectedDomain;
    }
    return selectedType?.charAt(0).toUpperCase() + selectedType?.slice(1) || 'All';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {filterTypes && filterTypes.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-sm font-normal"
              >
                {getDropdownLabel()}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {filterTypes[0] === 'domain' ? (
                uniqueDomains.map(domain => (
                  <DropdownMenuItem
                    key={domain}
                    onClick={() => setSelectedDomain(domain)}
                    className="py-2"
                  >
                    {domain}
                  </DropdownMenuItem>
                ))
              ) : (
                filterTypes.map(type => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className="py-2"
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        <ScrollableContainer maxHeight={maxHeight}>
          <div className="space-y-2">
            {displayData.map((item, index) => (
              <AnalyticsItem
                key={`${item.type}-${item.name}-${index}`}
                name={item.name}
                count={item.count}
                type={item.type}
                metadata={item.metadata}
                isActive={activeFilters.some(f => 
                  (f.type === item.type && f.value === item.name)
                )}
                onClick={() => onFilterClick?.(item.type, item.name)}
                showPercentage={showPercentages}
                total={totalCount}
              />
            ))}
          </div>
        </ScrollableContainer>
      </CardContent>
    </Card>
  );
} 
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
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface LocationData {
  name: string;
  count: number;
}

interface CityData extends LocationData {
  country: string;
}

type FilterType = 'device' | 'browser' | 'os' | 'country' | 'city' | 'referrer';

interface LocationStatsProps {
  topCountries: LocationData[];
  allCountries: LocationData[];
  topCities: CityData[];
  allCities: CityData[];
  onFilterClick?: (type: FilterType, value: string) => void;
}

type LocationType = 'country' | 'city';

export function LocationStats({ 
  topCountries, 
  allCountries,
  topCities,
  allCities,
  onFilterClick 
}: LocationStatsProps) {
  const [selectedType, setSelectedType] = useState<LocationType>('country');
  const [showPercentages, setShowPercentages] = useState(false);

  const calculatePercentage = (count: number, total: number) => {
    return (count / total) * 100;
  };

  const getTotalCount = (data: LocationData[]) => {
    return data.reduce((acc, item) => acc + item.count, 0);
  };

  const displayData = selectedType === 'country' ? allCountries : allCities;
  const totalCount = getTotalCount(displayData);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>
          Location
        </CardTitle>
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
              onClick={() => setSelectedType('country')}
              selected={selectedType === 'country'}
              className="py-2"
            >
              Countries
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSelectedType('city')}
              selected={selectedType === 'city'}
              className="py-2"
            >
              Cities
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
                  // Only trigger if hovering the number area
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  if (x > rect.width - 60) { // Roughly the width of the number area
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
                  countryCode={selectedType === 'city' ? (item as CityData).country : undefined}
                />
              </div>
            ))}
          </div>
        </ScrollableContainer>
      </CardContent>
    </Card>
  );
} 
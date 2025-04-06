"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsItem } from "./analytics-item";
import { ScrollableContainer } from "./scrollable-container";
import { useState } from "react";

interface ReferrerData {
  referrer: string;
  count: number;
}

type FilterType = 'device' | 'browser' | 'os' | 'country' | 'city' | 'referrer';

interface TopReferrersProps {
  topReferrers: ReferrerData[];
  allReferrers: ReferrerData[];
  onFilterClick?: (type: FilterType, value: string) => void;
}

export function TopReferrers({
  topReferrers,
  allReferrers,
  onFilterClick,
}: TopReferrersProps) {
  const [showPercentages, setShowPercentages] = useState(false);

  const calculatePercentage = (count: number, total: number) => {
    return (count / total) * 100;
  };

  const getTotalCount = (data: ReferrerData[]) => {
    return data.reduce((acc, item) => acc + item.count, 0);
  };

  const totalCount = getTotalCount(allReferrers);

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base font-medium">Referrers</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollableContainer maxHeight="300px">
          <div 
            className="space-y-2"
            onMouseLeave={() => setShowPercentages(false)}
          >
            {topReferrers.map((item) => (
              <div 
                key={item.referrer}
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
                  type="referrer"
                  value={item.referrer}
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
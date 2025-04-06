"use client";

import { Button } from "@/components/ui/button";
import { subDays, differenceInDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangeSelectorProps {
  value: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function DateRangeSelector({ value, onDateRangeChange }: DateRangeSelectorProps) {
  const ranges = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 14 days", days: 14 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 60 days", days: 60 },
    { label: "Last 90 days", days: 90 },
  ];

  const getActiveRange = () => {
    if (!value.from || !value.to) return ranges[2]; // Default to 30 days
    const days = differenceInDays(value.to, value.from) + 1;
    return ranges.find(range => range.days === days) || ranges[2];
  };

  const handleRangeChange = (days: number) => {
    const to = new Date();
    const from = subDays(to, days - 1);
    onDateRangeChange({ from, to });
  };

  const activeRange = getActiveRange();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-sm font-normal"
        >
          {activeRange.label}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[140px]">
        <DropdownMenuItem
          onClick={() => handleRangeChange(7)}
          selected={activeRange.days === 7}
          className="py-2"
        >
          Last 7 days
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleRangeChange(14)}
          selected={activeRange.days === 14}
          className="py-2"
        >
          Last 14 days
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleRangeChange(30)}
          selected={activeRange.days === 30}
          className="py-2"
        >
          Last 30 days
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleRangeChange(60)}
          selected={activeRange.days === 60}
          className="py-2"
        >
          Last 60 days
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleRangeChange(90)}
          selected={activeRange.days === 90}
          className="py-2"
        >
          Last 90 days
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 
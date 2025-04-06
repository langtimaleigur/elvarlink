"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  value: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedRange, setSelectedRange] = React.useState<DateRange>(value);

  // Update internal state when prop changes
  React.useEffect(() => {
    setSelectedRange(value);
  }, [value]);

  const handleSelect = (range: DateRange | undefined) => {
    if (range) {
      setSelectedRange(range);
    }
  };

  const handleApply = () => {
    if (selectedRange?.from && selectedRange?.to) {
      onDateRangeChange(selectedRange);
      setOpen(false);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "px-3 justify-start text-left font-normal w-fit",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "MMM d")} - {format(value.to, "MMM d")}
                </>
              ) : (
                format(value.from, "MMM d")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="space-y-4 p-3">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={selectedRange?.from}
              selected={selectedRange}
              onSelect={handleSelect}
              numberOfMonths={2}
            />
            <div className="flex justify-end gap-2 border-t pt-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                disabled={!selectedRange?.from || !selectedRange?.to}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 
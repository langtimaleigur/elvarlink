"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { InfoIcon } from "lucide-react";

export function RevenueTooltip() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <InfoIcon className="h-4 w-4 text-muted-foreground ml-2 cursor-help" />
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Estimated Revenue</h4>
          <p className="text-sm text-muted-foreground">
            This is an estimated calculation based on your EPC (earnings per click) multiplied by the total number of clicks. Actual earnings may vary based on conversion rates and other factors.
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
} 
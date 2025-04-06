"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  displayValue?: string;
  className?: string;
}

export function CopyButton({ value, displayValue, className }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      // Ensure the value has https:// prefix for clipboard
      const valueToCopy = value.startsWith('http') ? value : `https://${value}`;
      await navigator.clipboard.writeText(valueToCopy);
      setHasCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            onClick={copyToClipboard}
            className={cn(
              "h-auto p-0 hover:bg-transparent text-muted-foreground hover:text-foreground",
              className
            )}
          >
            {displayValue || value}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy link</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 
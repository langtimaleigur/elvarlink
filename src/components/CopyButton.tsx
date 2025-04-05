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

interface CopyButtonProps {
  value: string;
}

export function CopyButton({ value }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
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
            size="icon"
            onClick={copyToClipboard}
            className="h-8 w-8"
          >
            {hasCopied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span className="sr-only">Copy link</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy link</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 
'use client';

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, X, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LinkCheckButtonProps {
  linkId: string;
  isBroken?: boolean;
  lastChecked?: string;
  showStatus?: boolean;
  onDebug?: () => void;
}

export function LinkCheckButton({ 
  linkId, 
  isBroken, 
  lastChecked,
  showStatus = false,
  onDebug
}: LinkCheckButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const handleCheck = () => {
    if (isDisabled) return;

    onDebug?.();
    setIsPending(true);

    fetch("/api/check-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ linkId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API returned ${res.status}: ${text}`);
        }

        const result = await res.json();

        if (result?.is_broken === true) {
          toast.error("Link is broken", {
            description: result.status ? `HTTP Status: ${result.status}` : "Could not reach the destination URL",
          });
        } else if (result?.is_broken === false) {
          toast.success("Link is working", {
            description: result.status ? `HTTP Status: ${result.status}` : "Successfully reached the destination URL",
          });
        } else {
          toast.error("Error checking link", {
            description: "Could not determine link status",
          });
        }
      })
      .catch(() => {
        toast.error("Error checking link", {
          description: "Please try again later",
        });
      })
      .finally(() => {
        setIsPending(false);
        setIsDisabled(true);
        setTimeout(() => setIsDisabled(false), 5000); // cooldown
      });
  };

  if (showStatus) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {isBroken ? (
                <X className="h-4 w-4 text-red-500" />
              ) : (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {lastChecked
                ? `Last checked: ${format(new Date(lastChecked), "MMM d, yyyy, HH:mm")}`
                : "Not checked yet"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      onClick={handleCheck}
      disabled={isPending || isDisabled}
      variant="outline"
      size="sm"
      className="w-full"
    >
      {isPending ? (
        "Checking..."
      ) : (
        <>
          <LinkIcon className="mr-2 h-4 w-4" />
          Check Link Health
        </>
      )}
    </Button>
  );
}
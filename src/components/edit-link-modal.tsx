"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarIcon, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TagInput } from "@/components/ui/tag-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

type Domain = {
  id: string;
  domain: string;
  is_primary: boolean;
  primary_domain_id: string | null;
};

type Link = {
  id: string;
  domain_id: string | null;
  slug: string;
  destination_url: string;
  redirect_type: string;
  tags: string[];
  epc: number;
  status: string;
  note: string | null;
  expire_at: string | null;
};

interface EditLinkModalProps {
  link: Link;
  domains: Domain[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditLinkModal({ link, domains, open, onOpenChange }: EditLinkModalProps) {
  const [selectedDomainId, setSelectedDomainId] = useState<string>(link.domain_id || "");
  const [slug, setSlug] = useState(link.slug);
  const [destinationUrl, setDestinationUrl] = useState(link.destination_url);
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(
    link.expire_at ? new Date(link.expire_at) : undefined
  );
  const [tags, setTags] = useState<string[]>(link.tags || []);
  const [epc, setEpc] = useState<number>(link.epc || 0);
  const [loading, setLoading] = useState(false);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [redirectType, setRedirectType] = useState<string>(link.redirect_type || "307");
  const [status, setStatus] = useState<string>(link.status || "active");
  const [notes, setNotes] = useState<string>(link.note || "");
  const router = useRouter();
  const supabase = createClientComponentClient();

  const getSelectedDomain = () => {
    return domains.find(d => d.id === selectedDomainId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomainId || !slug) {
      toast.error("Please select a domain and enter a slug");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    try {
      console.log("Current status value:", status);
      console.log("Original link status:", link.status);
      
      // Get current link data to compare
      const { data: currentLink, error: fetchError } = await supabase
        .from("links")
        .select("*")
        .eq("id", link.id)
        .single();
        
      if (fetchError) {
        console.error("Error fetching current link:", fetchError);
      } else {
        console.log("Current link data:", currentLink);
      }
      
      // Create base update payload without status
      const baseUpdateData = {
        domain_id: selectedDomainId,
        slug,
        destination_url: destinationUrl,
        expire_at: expirationDate,
        tags: tags || [],
        epc: epc || 0,
        redirect_type: redirectType || "307",
        note: notes || null,
      };
      
      // Only attempt to update status if it has changed
      if (status !== link.status) {
        console.log(`Status changed from ${link.status} to ${status}`);
        
        // Try updating without changing status first
        console.log("Updating without changing status");
        const { error: noStatusError } = await supabase
          .from("links")
          .update(baseUpdateData)
          .eq("id", link.id);

        if (noStatusError) {
          console.error("Error updating link without status change:", noStatusError);
          toast.error(`Failed to update link: ${noStatusError.message}`);
          setLoading(false);
          return;
        }
        
        // If that worked, now try to update just the status
        // Try different formats of the status value
        const statusValues = [
          status, // Original as is
          status.toUpperCase(), // ACTIVE, INACTIVE
          status.toLowerCase(), // active, inactive
          status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(), // Active, Inactive
        ];
        
        let statusUpdateSuccess = false;
        
        for (const statusValue of statusValues) {
          try {
            console.log(`Trying status update with value: "${statusValue}"`);
            const { error: statusError } = await supabase
              .from("links")
              .update({ status: statusValue })
              .eq("id", link.id);
            
            if (!statusError) {
              console.log(`Status update succeeded with value: "${statusValue}"`);
              statusUpdateSuccess = true;
              break;
            } else {
              console.error(`Status update failed with value: "${statusValue}"`, statusError);
            }
          } catch (e) {
            console.error(`Exception updating status with value "${statusValue}":`, e);
          }
        }
        
        if (!statusUpdateSuccess) {
          toast.success("Link updated, but status could not be changed");
          onOpenChange(false);
          router.refresh();
          setLoading(false);
          return;
        }
      } else {
        // If status hasn't changed, just update everything else
        console.log("Status not changed, updating other fields");
        const { error } = await supabase
          .from("links")
          .update(baseUpdateData)
          .eq("id", link.id);

        if (error) {
          console.error("Error updating link:", error);
          toast.error(`Failed to update link: ${error.message}`);
          setLoading(false);
          return;
        }
      }
      
      toast.success("Link updated successfully");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred while updating the link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Link</DialogTitle>
          <DialogDescription>
            Update your short link settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="space-y-2 w-full">
              <Label>URL</Label>
              <div className="flex w-full">
                <Select 
                  value={selectedDomainId} 
                  onValueChange={setSelectedDomainId}
                >
                  <SelectTrigger className="w-fit rounded-r-none border-r-0">
                    <SelectValue placeholder="Select domain">
                      {getSelectedDomain()?.domain || "Select domain"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    {domains.map((domain) => (
                      <SelectItem 
                        key={domain.id}
                        value={domain.id}
                        className="font-semibold hover:bg-accent/50 pl-2"
                      >
                        {domain.domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1">
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="my-slug"
                    className="rounded-l-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destination URL *</Label>
            <Input
              id="destination"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Label>Redirect Type</Label>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-accent"
                    >
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Redirect Types</h4>
                      <p className="text-sm">
                        <span className="font-medium">301 - Permanent:</span> Search engines will update their index to the new URL.
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">307 - Temporary:</span> Search engines will keep the original URL in their index.
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <Tabs 
                value={redirectType} 
                onValueChange={setRedirectType}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="301">301</TabsTrigger>
                  <TabsTrigger value="307">307</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex-1 space-y-2">
              <Label>Link Status</Label>
              <Tabs 
                value={status} 
                onValueChange={setStatus}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write a private note about this link..."
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="advanced">
              <AccordionTrigger>Advanced Options</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Tags</Label>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-accent"
                        >
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Tags</h4>
                          <p className="text-sm">
                            Add tags to help organize and filter your links. Tags can be used to:
                          </p>
                          <ul className="text-sm list-disc pl-4 space-y-1">
                            <li>Group related links together</li>
                            <li>Filter links in the dashboard</li>
                            <li>Track performance by category</li>
                          </ul>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <TagInput
                    tags={tags}
                    setTags={setTags}
                    suggestions={existingTags}
                    placeholder="Type to add tags..."
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="epc">Earnings Per Click (EPC)</Label>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 hover:bg-accent"
                          >
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-semibold">Earnings Per Click (EPC)</h4>
                            <p className="text-sm">
                              EPC is an estimate of how much you earn per click on this link. This helps you:
                            </p>
                            <ul className="text-sm list-disc pl-4 space-y-1">
                              <li>Track link performance</li>
                              <li>Compare different links</li>
                              <li>Calculate potential earnings</li>
                            </ul>
                            <p className="text-sm text-muted-foreground mt-2">
                              Note: This is just an estimate and actual earnings may vary.
                            </p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="epc"
                        type="number"
                        step="1"
                        value={epc || ""}
                        onChange={(e) => setEpc(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="pl-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Expiration Date</Label>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 hover:bg-accent"
                          >
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-semibold">Expiration Date</h4>
                            <p className="text-sm">
                              Set an expiration date for your link. After this date:
                            </p>
                            <ul className="text-sm list-disc pl-4 space-y-1">
                              <li>The link will no longer be accessible</li>
                              <li>Visitors will see an expiration message</li>
                              <li>You can still view link stats in your dashboard</li>
                            </ul>
                            <p className="text-sm text-muted-foreground mt-2">
                              Leave empty for no expiration.
                            </p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !expirationDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {expirationDate ? format(expirationDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <div className="rounded-md border">
                          <Calendar
                            mode="single"
                            selected={expirationDate}
                            onSelect={(date) => {
                              setExpirationDate(date);
                              const closeEvent = new Event('click');
                              document.dispatchEvent(closeEvent);
                            }}
                            defaultMonth={expirationDate}
                            fromDate={new Date()}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Link"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
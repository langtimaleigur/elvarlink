"use client";

import { useState, useEffect, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, CalendarIcon, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { DomainGroupSelect } from "./domain-group-select";
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
  groups: {
    id: string;
    group_path: string;
    domain_id: string;
  }[];
};

export function CreateLinkModal() {
  const [open, setOpen] = useState(false);
  const [selectedDomainGroup, setSelectedDomainGroup] = useState<string>("");
  const [domains, setDomains] = useState<Domain[]>([]);
  const [slug, setSlug] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [expirationDate, setExpirationDate] = useState<Date | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [epc, setEpc] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const [redirectType, setRedirectType] = useState<string>("307");
  const [status, setStatus] = useState<string>("active");
  const [notes, setNotes] = useState<string>("");
  const router = useRouter();
  const supabase = createClientComponentClient();
  const slugInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      fetchExistingTags();
      fetchDomains();
    }
  }, [open]);

  useEffect(() => {
    if (openTooltip) {
      const timer = setTimeout(() => {
        setOpenTooltip(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [openTooltip]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        slugInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const fetchExistingTags = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("links")
      .select("tags")
      .eq("user_id", user.id)
      .not("tags", "is", null);

    if (error) {
      console.error("Error fetching tags:", error);
      return;
    }

    const allTags = data
      .flatMap(link => link.tags || [])
      .filter((tag, index, self) => self.indexOf(tag) === index)
      .sort();

    setExistingTags(allTags);
  };

  const fetchDomains = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: domainsData, error: domainsError } = await supabase
      .from("domains")
      .select("*")
      .eq("user_id", user.id);

    if (domainsError) {
      toast.error("Failed to fetch domains");
      return;
    }

    const { data: groupsData, error: groupsError } = await supabase
      .from("domain_groups")
      .select("*")
      .in("domain_id", domainsData.map(d => d.id));

    if (groupsError) {
      toast.error("Failed to fetch groups");
      return;
    }

    const domainsWithGroups = domainsData.map(domain => ({
      ...domain,
      groups: groupsData.filter(group => group.domain_id === domain.id)
    }));

    setDomains(domainsWithGroups);
  };

  const getSelectedDomain = () => {
    const [domainId] = selectedDomainGroup.split(":");
    return domains.find(d => d.id === domainId);
  };

  const getSelectedGroup = () => {
    const [domainId, groupId] = selectedDomainGroup.split(":");
    const domain = domains.find(d => d.id === domainId);
    return domain?.groups.find(g => g.id === groupId);
  };

  const getDisplayValue = () => {
    const domain = getSelectedDomain();
    const group = getSelectedGroup();
    
    if (!domain) return "Select domain";
    if (!group) return domain.domain;
    return `${domain.domain}/${group.group_path}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomainGroup || !slug) {
      toast.error("Please select a domain and enter a slug");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    const [domainId, groupId] = selectedDomainGroup.split(":");

    try {
      const { error } = await supabase.from("links").insert({
        user_id: user.id,
        domain_id: domainId,
        group_id: groupId || null,
        slug,
        destination_url: destinationUrl,
        redirect_type: redirectType || "307",
        tags: tags || [],
        epc: epc || 0,
        expire_at: expirationDate,
        status: status || "active",
        note: notes || null,
      });

      if (error) {
        console.error("Error creating link:", error);
        toast.error(`Failed to create link: ${error.message}`);
      } else {
        toast.success("Link created successfully");
        setOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred while creating the link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Link</DialogTitle>
          <DialogDescription>
            Create a new short link with optional expiration date and tags.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="space-y-2 w-full">
              <Label>URL</Label>
              <div className="flex w-full">
                <Select 
                  value={selectedDomainGroup} 
                  onValueChange={setSelectedDomainGroup}
                >
                  <SelectTrigger className="w-fit rounded-r-none border-r-0">
                    <SelectValue placeholder="Select domain">
                      {getDisplayValue()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    {domains.map((domain) => (
                      <div key={domain.id}>
                        <SelectItem 
                          value={domain.id}
                          className="font-semibold hover:bg-accent/50 pl-2"
                        >
                          {domain.domain}
                        </SelectItem>
                        {domain.groups.map((group) => (
                          <SelectItem 
                            key={group.id} 
                            value={`${domain.id}:${group.id}`}
                            className="pl-6 text-sm hover:bg-accent/50"
                          >
                            {domain.domain}/{group.group_path}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1">
                  <Input
                    ref={slugInputRef}
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
                  <TabsTrigger value="draft">Draft</TabsTrigger>
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
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Link"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
"use client";

import { useState, useRef, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarIcon, Info, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { verifyDomainTXT, verifyDomainWellKnown } from '@/lib/actions/domains';
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type Domain = {
  id: string;
  domain: string;
  is_primary: boolean;
  primary_domain_id: string | null;
  verified: boolean;
  verification_method: "TXT" | "FILE" | null;
  txt_record_value: string | null;
};

interface CreateLinkModalProps {
  domains: Domain[];
}

export function CreateLinkModal({ domains: initialDomains }: CreateLinkModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<string>("");
  const [slug, setSlug] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [expirationDate, setExpirationDate] = useState<Date | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [epc, setEpc] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [redirectType, setRedirectType] = useState<string>("307");
  const [status, setStatus] = useState<string>("active");
  const [notes, setNotes] = useState<string>("");
  const [domains, setDomains] = useState<Domain[]>(initialDomains);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const slugInputRef = useRef<HTMLInputElement>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    message: string;
    lastChecked: Date | null;
  }>({ message: "", lastChecked: null });

  useEffect(() => {
    if (open) {
      fetchDomains();
    }
  }, [open]);

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

    setDomains(domainsData || []);
  };

  const getSelectedDomain = () => {
    return domains.find(d => d.id === selectedDomainId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomainId || !slug) {
      toast.error("Please select a domain and enter a slug");
      return;
    }

    const selectedDomain = getSelectedDomain();
    if (!selectedDomain?.verified) {
      toast.error("Please verify your domain before creating links");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    try {
      const { error } = await supabase.from("links").insert({
        user_id: user.id,
        domain_id: selectedDomainId,
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

  const handleVerifyDomain = async () => {
    const selectedDomain = getSelectedDomain();
    if (!selectedDomain) return;

    setIsVerifying(true);
    setVerificationStatus(prev => ({ ...prev, lastChecked: new Date() }));

    try {
      const result = selectedDomain.verification_method === "TXT"
        ? await verifyDomainTXT(selectedDomain.id)
        : await verifyDomainWellKnown(selectedDomain.id);

      if (result.success) {
        setVerificationStatus({
          message: "Domain verified successfully!",
          lastChecked: new Date()
        });
        toast.success("Domain verified successfully!");
        fetchDomains(); // Refresh domains list
      } else {
        setVerificationStatus({
          message: "Not yet verified. This can take up to 24h.",
          lastChecked: new Date()
        });
        toast.error(result.reason || "Verification failed. Please check your settings.");
      }
    } catch (error) {
      setVerificationStatus({
        message: "An error occurred during verification",
        lastChecked: new Date()
      });
      toast.error("Failed to verify domain");
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTimeSinceLastCheck = () => {
    if (!verificationStatus.lastChecked) return null;
    
    const seconds = Math.floor((new Date().getTime() - verificationStatus.lastChecked.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
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
                        <div className="flex items-center gap-2">
                          <span>{domain.domain}</span>
                          {!domain.verified && (
                            <Badge variant="secondary" className="text-xs">
                              Unverified
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
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
              {getSelectedDomain() && !getSelectedDomain()?.verified && (
                <Alert variant="default" className="bg-muted">
                  <AlertDescription className="flex flex-col gap-2">
                    <p>This domain needs to be verified before you can create links.</p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleVerifyDomain}
                        disabled={isVerifying}
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify Domain'
                        )}
                      </Button>
                      {verificationStatus.message && (
                        <span className="text-sm text-muted-foreground">
                          {verificationStatus.message}
                          {verificationStatus.lastChecked && (
                            <span className="ml-1">
                              Last checked {formatTimeSinceLastCheck()}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
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
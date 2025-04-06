"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Domain = {
  id: string;
  domain: string;
};

type DomainGroup = {
  id: string;
  group_path: string;
  domain_id: string;
};

type DomainWithGroups = Domain & {
  groups: DomainGroup[];
};

interface DomainGroupSelectProps {
  value: string;
  onChange: (value: string) => void;
  onDomainChange?: (domainId: string) => void;
}

export function DomainGroupSelect({ value, onChange, onDomainChange }: DomainGroupSelectProps) {
  const [domains, setDomains] = useState<DomainWithGroups[]>([]);
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  const [selectedDomainForNewGroup, setSelectedDomainForNewGroup] = useState<string>("");
  const [newGroupPath, setNewGroupPath] = useState("");
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    if (domains.length > 0 && !value) {
      // Preselect the first domain
      onChange(domains[0].id);
      if (onDomainChange) {
        onDomainChange(domains[0].id);
      }
    }
  }, [domains, value, onChange, onDomainChange]);

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

  const handleValueChange = (newValue: string) => {
    onChange(newValue);
    const [domainId] = newValue.split(":");
    if (onDomainChange) {
      onDomainChange(domainId);
    }
  };

  const handleAddGroup = async () => {
    if (!selectedDomainForNewGroup || !newGroupPath) {
      toast.error("Please fill in all fields");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("domain_groups")
      .insert({
        domain_id: selectedDomainForNewGroup,
        group_path: newGroupPath,
      });

    if (error) {
      toast.error("Failed to create group");
      return;
    }

    toast.success("Group created successfully");
    setNewGroupDialogOpen(false);
    setNewGroupPath("");
    fetchDomains();
  };

  const getSelectedDomain = () => {
    const [domainId] = value.split(":");
    return domains.find(d => d.id === domainId);
  };

  const getSelectedGroup = () => {
    const [domainId, groupId] = value.split(":");
    const domain = domains.find(d => d.id === domainId);
    return domain?.groups.find(g => g.id === groupId);
  };

  const getDisplayValue = () => {
    if (!value || !domains.length) return "Select a domain";
    const [domainId, groupId] = value.split(":");
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return "Select a domain";
    if (!groupId) return domain.domain;
    const group = domain.groups.find(g => g.id === groupId);
    if (!group) return domain.domain;
    return `${domain.domain}/${group.group_path}`;
  };

  return (
    <div className="space-y-2">
      <Label>Domain</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full max-w-[50vw] min-w-[100px] justify-between bg-card/95 font-medium"
          >
            {getDisplayValue()}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[300px]">
          {domains.map((domain) => (
            <div key={domain.id}>
              <DropdownMenuItem
                onClick={() => handleValueChange(domain.id)}
                className="font-semibold hover:bg-accent/50 pl-2"
              >
                {domain.domain}
              </DropdownMenuItem>
              {domain.groups.map((group) => (
                <DropdownMenuItem
                  key={group.id}
                  onClick={() => handleValueChange(`${domain.id}:${group.id}`)}
                  className="pl-6 text-sm hover:bg-accent/50"
                >
                  {domain.domain}/{group.group_path}
                </DropdownMenuItem>
              ))}
              <Dialog open={newGroupDialogOpen} onOpenChange={setNewGroupDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm hover:bg-accent/50 pl-6"
                    onClick={() => setSelectedDomainForNewGroup(domain.id)}
                  >
                    <Plus className="w-3 h-3 mr-2" />
                    Add group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Group</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Domain</Label>
                      <Input value={domain.domain} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Group Path</Label>
                      <Input
                        value={newGroupPath}
                        onChange={(e) => setNewGroupPath(e.target.value)}
                        placeholder="e.g., go"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleAddGroup}>Add Group</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              {domain.groups.length > 0 && <Separator className="my-1" />}
              <Separator />
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 
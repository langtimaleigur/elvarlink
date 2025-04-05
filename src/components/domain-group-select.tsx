"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
    const domain = getSelectedDomain();
    const group = getSelectedGroup();
    
    if (!domain) return "Select a domain";
    if (!group) return domain.domain;
    return `${domain.domain}/${group.group_path}`;
  };

  return (
    <div className="space-y-2">
      <Label>Domain</Label>
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full max-w-[50vw] min-w-[100px]">
          <SelectValue>{getDisplayValue()}</SelectValue>
        </SelectTrigger>
        <SelectContent className="w-[300px]">
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
              <div className="px-2 py-1.5">
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
              </div>
              {domain.groups.length > 0 && <Separator className="my-1" />}
              <Separator />

            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 
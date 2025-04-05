"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface DataTableToolbarProps<TData> {
  table: {
    getState: () => { columnFilters: any[] };
    getColumn?: (id: string) => { getFilterValue: () => any; setFilterValue: (value: any) => void } | undefined;
    resetColumnFilters: () => void;
  };
  domains?: { id: string; domain: string; groups: { id: string; group_path: string }[] }[];
  allTags?: string[];
}

export function DataTableToolbar<TData>({
  table,
  domains = [],
  allTags = [],
}: DataTableToolbarProps<TData>) {
  const [isClient, setIsClient] = useState(false);
  
  // Prevent hydration errors by marking when we're on the client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const isFiltered = table.getState().columnFilters.length > 0;

  const handleFilterChange = (columnId: string, value: string) => {
    const getColumnFilter = () => {
      // For Table implementation
      if (table.getColumn) {
        return table.getColumn(columnId)?.getFilterValue() as string[] || [];
      }
      
      // For non-Table implementation
      return (table.getState().columnFilters.find(f => f.id === columnId)?.value as string[]) || [];
    };
    
    const setColumnFilter = (newValue: string[] | undefined) => {
      // For Table implementation
      if (table.getColumn) {
        table.getColumn(columnId)?.setFilterValue(newValue);
        return;
      }
      
      // For non-Table implementation - assuming columnFilters state is being properly managed elsewhere
      const currentFilters = [...table.getState().columnFilters];
      const filterIndex = currentFilters.findIndex(f => f.id === columnId);
      
      if (filterIndex >= 0) {
        if (newValue && newValue.length) {
          currentFilters[filterIndex] = { id: columnId, value: newValue };
        } else {
          currentFilters.splice(filterIndex, 1);
        }
      } else if (newValue && newValue.length) {
        currentFilters.push({ id: columnId, value: newValue });
      }
      
      // This assumes the parent component is managing columnFilters state
      if (typeof window !== 'undefined') {
        // Dispatch custom event with updated filters
        window.dispatchEvent(
          new CustomEvent('filterchange', { 
            detail: { filters: currentFilters } 
          })
        );
      }
    };
    
    const currentFilters = getColumnFilter();
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter(v => v !== value)
      : [...currentFilters, value];
    
    setColumnFilter(newFilters.length ? newFilters : undefined);
  };

  const getActiveFilters = () => {
    const filters: { column: string; value: string; label: string }[] = [];
    const columnFilters = table.getState().columnFilters;
    
    // Status filters
    const statusFilters = columnFilters.find(f => f.id === "status")?.value as string[] || [];
    statusFilters.forEach(value => {
      filters.push({ column: "status", value, label: value });
    });

    // Domain/group filters
    const domainFilters = columnFilters.find(f => f.id === "domain_id")?.value as string[] || [];
    domainFilters.forEach(value => {
      const [domainId, groupId] = value.split(":");
      const domain = domains.find(d => d.id === domainId);
      const group = domain?.groups.find(g => g.id === groupId);
      const label = group 
        ? `${domain?.domain}/${group.group_path}`
        : domain?.domain || value;
      filters.push({ column: "domain_id", value, label });
    });

    // Type filters
    const typeFilters = columnFilters.find(f => f.id === "redirect_type")?.value as string[] || [];
    typeFilters.forEach(value => {
      filters.push({ 
        column: "redirect_type", 
        value, 
        label: value === "301" ? "301 Permanent" : "307 Temporary" 
      });
    });

    // Tag filters
    const tagFilters = columnFilters.find(f => f.id === "tags")?.value as string[] || [];
    tagFilters.forEach(value => {
      filters.push({ column: "tags", value, label: value });
    });

    return filters;
  };

  // Show a loading skeleton if not yet on client
  if (!isClient) {
    return (
      <div className="space-y-4 flex-1">
        <div className="flex flex-wrap gap-2">
          <div className="w-[150px] h-10 bg-card rounded-md animate-pulse"></div>
          <div className="w-[150px] h-10 bg-card rounded-md animate-pulse"></div>
          <div className="w-[150px] h-10 bg-card rounded-md animate-pulse"></div>
          <div className="w-[150px] h-10 bg-card rounded-md animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex-1">
      <div className="flex flex-wrap gap-2">
        <div className="w-auto sm:w-[150px]">
          <Select
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-auto sm:w-[200px]">
          <Select
            onValueChange={(value) => handleFilterChange("domain_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Domain/Group" />
            </SelectTrigger>
            <SelectContent>
              {domains.map((domain) => (
                <div key={domain.id}>
                  <SelectItem value={domain.id} className="font-semibold">
                    {domain.domain}
                  </SelectItem>
                  {domain.groups.map((group) => (
                    <SelectItem
                      key={group.id}
                      value={`${domain.id}:${group.id}`}
                      className="pl-4"
                    >
                      {domain.domain}/{group.group_path}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-auto sm:w-[150px]">
          <Select
            onValueChange={(value) => handleFilterChange("redirect_type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Redirect Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="301">301 Permanent</SelectItem>
              <SelectItem value="307">307 Temporary</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-auto sm:w-[200px]">
          <Select
            onValueChange={(value) => handleFilterChange("tags", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tags" />
            </SelectTrigger>
            <SelectContent>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isFiltered && (
        <div className="flex flex-wrap gap-2">
          {getActiveFilters().map((filter) => (
            <Badge
              key={`${filter.column}-${filter.value}`}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => handleFilterChange(filter.column, filter.value)}
            >
              {filter.label} ×
            </Badge>
          ))}
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              
              // Dispatch event for non-Table implementations
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('filterreset')
                );
              }
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
} 
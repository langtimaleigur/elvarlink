"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/supabase/schema";
import { format } from "date-fns";
import { Sparkline } from "./sparkline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

interface LinksTableProps {
  links: (Link & {
    total_clicks: number;
    unique_clicks: number;
    broken_clicks: number;
    growth_rate?: number;
    click_history?: number[];
  })[];
  type: "trending" | "top" | "broken";
}

type Domain = {
  id: string;
  domain: string;
  is_primary: boolean;
  primary_domain_id: string | null;
};

type LinkWithData = {
  id: string;
  domain_id: string;
  group_id: string | null;
  slug: string;
  destination_url: string;
  redirect_type: string;
  tags: string[];
  epc?: number;
  status: string;
  note: string | null;
  expire_at: string | null;
  created_at: string;
  updated_at: string | null;
  clicks?: { count: number }[];
  domain?: {
    domain: string;
    is_primary: boolean;
    primary_domain_id: string | null;
  };
  group?: {
    group_path: string;
    domain: {
      domain: string;
    };
  } | null;
};

export function LinksTable({ links, type }: LinksTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Link</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead className="text-right">Total Clicks</TableHead>
            <TableHead className="text-right">Unique Clicks</TableHead>
            {type === "trending" && (
              <TableHead className="text-right">Growth</TableHead>
            )}
            {type === "top" && (
              <TableHead className="text-right">EPC</TableHead>
            )}
            {type === "broken" && (
              <TableHead className="text-right">Broken Rate</TableHead>
            )}
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow key={link.id}>
              <TableCell className="font-medium">
                {link.slug}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {link.destination_url}
              </TableCell>
              <TableCell className="text-right">
                {link.total_clicks}
              </TableCell>
              <TableCell className="text-right">
                {link.unique_clicks}
              </TableCell>
              {type === "trending" && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {link.growth_rate && (
                      <span className={link.growth_rate >= 0 ? "text-green-500" : "text-red-500"}>
                        {link.growth_rate.toFixed(1)}%
                      </span>
                    )}
                    {link.click_history && (
                      <Sparkline data={link.click_history} />
                    )}
                  </div>
                </TableCell>
              )}
              {type === "top" && (
                <TableCell className="text-right">
                  ${link.epc ? link.epc.toFixed(2) : '0.00'}
                </TableCell>
              )}
              {type === "broken" && (
                <TableCell className="text-right">
                  {((link.broken_clicks / link.total_clicks) * 100).toFixed(1)}%
                </TableCell>
              )}
              <TableCell>
                <Badge
                  variant={
                    link.status === "active"
                      ? "default"
                      : link.status === "draft"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {link.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 
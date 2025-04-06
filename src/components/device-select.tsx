import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DeviceSelectProps = {
  value: string;
  onChange: (value: string) => void;
};

const devices = [
  { id: "all", name: "All Devices" },
  { id: "desktop", name: "Desktop" },
  { id: "mobile", name: "Mobile" },
  { id: "tablet", name: "Tablet" },
  { id: "other", name: "Other" },
];

export function DeviceSelect({ value, onChange }: DeviceSelectProps) {
  const selectedDevice = devices.find((device) => device.id === value) || devices[0];

  return (
    <div className="space-y-2">
      <Label>Device</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full max-w-[50vw] min-w-[100px] justify-between bg-card/95 font-medium"
          >
            {selectedDevice.name}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          {devices.map((device) => (
            <DropdownMenuItem
              key={device.id}
              onClick={() => onChange(device.id)}
              className="hover:bg-accent/50"
            >
              {device.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 
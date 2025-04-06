import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { countries } from "@/lib/countries";

type CountrySelectProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CountrySelect({ value, onChange }: CountrySelectProps) {
  const selectedCountry = countries.find((country) => country.code === value) || countries[0];

  return (
    <div className="space-y-2">
      <Label>Country</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full max-w-[50vw] min-w-[100px] justify-between bg-card/95 font-medium"
          >
            {selectedCountry.name}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px] max-h-[300px] overflow-y-auto">
          {countries.map((country) => (
            <DropdownMenuItem
              key={country.code}
              onClick={() => onChange(country.code)}
              className="hover:bg-accent/50"
            >
              {country.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 
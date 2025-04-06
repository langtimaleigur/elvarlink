import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { useState } from "react";

interface CountryData {
  country: string;
  count: number;
}

interface TopCountriesProps {
  topCountries: CountryData[];
  allCountries: CountryData[];
}

export function TopCountries({ topCountries, allCountries }: TopCountriesProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = allCountries.filter(country =>
    country.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Countries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Country</span>
            <span>Clicks</span>
          </div>
          {topCountries.map((country) => (
            <div
              key={country.country}
              className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
            >
              <span className="text-sm font-medium">{country.country}</span>
              <span className="text-sm text-muted-foreground">{country.count}</span>
            </div>
          ))}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="w-full mt-4">
              See more
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>All Countries</SheetTitle>
            </SheetHeader>
            <div className="relative mt-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search countries..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <ScrollArea className="h-[calc(100vh-200px)] mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2 sticky top-0 bg-background z-10">
                  <span>Country</span>
                  <span>Clicks</span>
                </div>
                {filteredCountries.map((country) => (
                  <div
                    key={country.country}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <span className="text-sm font-medium">{country.country}</span>
                    <span className="text-sm text-muted-foreground">{country.count}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
} 
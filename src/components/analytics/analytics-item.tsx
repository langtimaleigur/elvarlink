"use client";

import { cn } from "@/lib/utils";
import { 
  Circle, 
  ExternalLink,
  Monitor,
  Smartphone,
  Tablet,
  Chrome,
  Globe,
  Apple,
  MonitorIcon,
  Laptop2,
  SmartphoneIcon,
  TabletIcon,
  MonitorUp,
  Compass,
  ArrowUpRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { countryToFlag } from "./flag-label";
import { useState, useEffect } from "react";

type FilterType = 'device' | 'browser' | 'os' | 'country' | 'city' | 'referrer';

interface AnalyticsItemProps {
  type: FilterType;
  value: string;
  count: number;
  percentage?: number;
  onFilterClick?: (type: FilterType, value: string) => void;
  countryCode?: string; // For cities
  showPercentages?: boolean;
}

// Icon mappings for different categories
const browserIcons: Record<string, React.ReactNode> = {
  'Chrome': <Chrome className="h-4 w-4" />,
  'Firefox': <Globe className="h-4 w-4" />, // Replace with Firefox icon when available
  'Safari': <Compass className="h-4 w-4" />, // Replace with Safari icon when available
  'Edge': <Globe className="h-4 w-4" />, // Replace with Edge icon when available
  'Opera': <Globe className="h-4 w-4" />, // Replace with Opera icon when available
  // Add more browsers as needed
  'default': <Globe className="h-4 w-4" />
};

const deviceIcons: Record<string, React.ReactNode> = {
  'desktop': <MonitorIcon className="h-4 w-4" />,
  'laptop': <Laptop2 className="h-4 w-4" />,
  'mobile': <SmartphoneIcon className="h-4 w-4" />,
  'tablet': <TabletIcon className="h-4 w-4" />,
  'default': <Monitor className="h-4 w-4" />
};

const osIcons: Record<string, React.ReactNode> = {
  'Windows': <MonitorUp className="h-4 w-4" />,
  'macOS': <Apple className="h-4 w-4" />,
  'iOS': <SmartphoneIcon className="h-4 w-4" />,
  'Android': <SmartphoneIcon className="h-4 w-4" />,
  'Linux': <MonitorIcon className="h-4 w-4" />,
  'default': <Circle className="h-4 w-4" />
};

const getDeviceIcon = (device: string) => {
  const normalizedDevice = device.toLowerCase();
  return deviceIcons[normalizedDevice] || deviceIcons.default;
};

const getBrowserIcon = (browser: string) => {
  return browserIcons[browser] || browserIcons.default;
};

const getOSIcon = (os: string) => {
  return osIcons[os] || osIcons.default;
};

const getReferrerIcon = (referrer: string) => {
  return <Globe className="h-3.5 w-3.5" />;
};

export function AnalyticsItem({ 
  type, 
  value, 
  count, 
  percentage = 0, 
  onFilterClick,
  countryCode,
  showPercentages = false
}: AnalyticsItemProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(5); // Start at minimum 5%
  const [isHoveringLink, setIsHoveringLink] = useState(false);

  // Animate the percentage on mount
  useEffect(() => {
    // Ensure minimum 5% width
    const targetPercentage = Math.max(5, percentage);
    // Start animation after a small delay
    const timeout = setTimeout(() => {
      setAnimatedPercentage(targetPercentage);
    }, 100);
    return () => clearTimeout(timeout);
  }, [percentage]);

  const getIcon = () => {
    switch (type) {
      case 'device':
        return getDeviceIcon(value);
      case 'browser':
        return getBrowserIcon(value);
      case 'os':
        return getOSIcon(value);
      case 'country':
        return <span className="text-lg">{countryToFlag(value)}</span>;
      case 'city':
        return <span className="text-lg">{countryCode ? countryToFlag(countryCode) : '🏢'}</span>;
      case 'referrer':
        return getReferrerIcon(value);
      default:
        return null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // If it's a referrer and clicking the link icon, open the URL
    if (type === 'referrer' && (e.target as HTMLElement).closest('.referrer-link')) {
      e.stopPropagation();
      let url = value;
      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }
      window.open(url, '_blank');
    } else {
      // Otherwise trigger the filter
      onFilterClick?.(type, value);
    }
  };

  return (
    <div
      className="group cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        <div 
          className="relative h-8 bg-[#131313] rounded-md overflow-hidden flex-1"
          style={{ 
            backgroundImage: `linear-gradient(to right, #2a2a2a ${animatedPercentage}%, transparent ${animatedPercentage}%)`,
            transition: 'background-image 0.5s ease-out'
          }}
        >
          <div className="absolute inset-0 flex items-center px-3 gap-3">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-2 pr-3">
              <span className="font-medium text-sm truncate">
                {value}
              </span>
              {type === 'referrer' && (
                <TooltipProvider delayDuration={1000}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-1.5 rounded-md group-hover:bg-gray-800/50 transition-colors referrer-link">
                        <ArrowUpRight
                          className="h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-400"
                          onMouseEnter={() => setIsHoveringLink(true)}
                          onMouseLeave={() => setIsHoveringLink(false)}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="top" 
                      sideOffset={5}
                      className="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                    >
                      <p>Visit website</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
        <div className="w-12 text-right text-sm font-medium">
          {showPercentages ? `${percentage.toFixed(1)}%` : count}
        </div>
      </div>
    </div>
  );
} 
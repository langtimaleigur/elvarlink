"use client";

import { cn } from "@/lib/utils";
import { 
  Circle, 
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
  Link2,
} from "lucide-react";
import { countryToFlag } from "./flag-label";
import { useState, useEffect } from "react";
import type { FilterType } from "@/lib/types/analytics";
import { format } from "date-fns";
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatNumber } from '@/lib/utils';

interface AnalyticsItemProps {
  name: string;
  count: number;
  type: FilterType;
  metadata?: {
    countryCode?: string;
    domain?: string;
    url?: string;
    epc?: number;
    clicks?: number;
    isEarnings?: boolean;
  };
  isActive?: boolean;
  onClick?: () => void;
  showPercentage?: boolean;
  total?: number;
}

// Icon mappings for different categories
const browserIcons: Record<string, React.ReactNode> = {
  'Chrome': <Chrome className="h-4 w-4" />,
  'Firefox': <Globe className="h-4 w-4" />,
  'Safari': <Compass className="h-4 w-4" />,
  'Edge': <Globe className="h-4 w-4" />,
  'Opera': <Globe className="h-4 w-4" />,
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
  const normalizedDevice = device?.toLowerCase() || 'default';
  for (const [key, icon] of Object.entries(deviceIcons)) {
    if (normalizedDevice.includes(key)) {
      return icon;
    }
  }
  return deviceIcons.default;
};

const getBrowserIcon = (browser: string) => {
  const normalizedBrowser = browser?.toLowerCase() || 'default';
  for (const [key, icon] of Object.entries(browserIcons)) {
    if (normalizedBrowser.includes(key.toLowerCase())) {
      return icon;
    }
  }
  return browserIcons.default;
};

const getOSIcon = (os: string) => {
  const normalizedOS = os?.toLowerCase() || 'default';
  for (const [key, icon] of Object.entries(osIcons)) {
    if (normalizedOS.includes(key.toLowerCase())) {
      return icon;
    }
  }
  return osIcons.default;
};

const getReferrerIcon = (referrer: string) => {
  return <Globe className="h-4 w-4" />;
};

const getLinkIcon = () => {
  return <Link2 className="h-4 w-4" />;
};

const getExpirationIcon = () => {
  return <Circle className="h-4 w-4" />;
};

export function AnalyticsItem({
  name,
  count,
  type,
  metadata,
  isActive,
  onClick,
  showPercentage,
  total = 0,
}: AnalyticsItemProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const [animatedPercentage, setAnimatedPercentage] = useState(5);

  useEffect(() => {
    const targetPercentage = Math.max(5, percentage);
    const timeout = setTimeout(() => {
      setAnimatedPercentage(targetPercentage);
    }, 100);
    return () => clearTimeout(timeout);
  }, [percentage]);

  const getIcon = () => {
    switch (type) {
      case 'device':
        return getDeviceIcon(name);
      case 'browser':
        return getBrowserIcon(name);
      case 'os':
        return getOSIcon(name);
      case 'country':
        return <span className="text-lg">{countryToFlag(name)}</span>;
      case 'city':
        return <span className="text-lg">{metadata?.countryCode ? countryToFlag(metadata.countryCode) : '🏢'}</span>;
      case 'referrer':
        return getReferrerIcon(name);
      case 'link':
        return getLinkIcon();
      default:
        return null;
    }
  };

  const formatEarnings = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const displayCount = metadata?.isEarnings ? formatEarnings(count) : formatNumber(count);
  
  const tooltipContent = () => {
    if (metadata?.isEarnings && metadata.epc && metadata.clicks) {
      return (
        <div className="space-y-1">
          <p>EPC: {formatEarnings(metadata.epc)}</p>
          <p>Clicks: {formatNumber(metadata.clicks)}</p>
          <p>Total Earnings: {formatEarnings(count)}</p>
        </div>
      );
    }
    if (metadata?.url) {
      return (
        <div className="space-y-1">
          <p>URL: {metadata.url}</p>
          <p>Clicks: {formatNumber(count)}</p>
          {metadata.domain && <p>Domain: {metadata.domain}</p>}
        </div>
      );
    }
    return showPercentage ? `${displayCount} (${percentage.toFixed(1)}%)` : displayCount;
  };

  return (
    <div
      className={cn(
        "group cursor-pointer",
        isActive && "opacity-100"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <div 
          className={cn(
            "relative h-8 bg-[#131313] rounded-md overflow-hidden flex-1",
            isActive && "ring-1 ring-primary"
          )}
          style={{ 
            backgroundImage: `linear-gradient(to right, ${isActive ? '#3b3b3b' : '#2a2a2a'} ${animatedPercentage}%, transparent ${animatedPercentage}%)`,
            transition: 'background-image 0.5s ease-out'
          }}
        >
          <div className="absolute inset-0 flex items-center px-3 gap-3">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-2 pr-3">
              <span className={cn(
                "font-medium text-sm truncate",
                isActive && "text-primary"
              )}>
                {name}
              </span>
            </div>
          </div>
        </div>
        <div className="w-20 text-right text-sm font-medium">
          {displayCount}
          {showPercentage && <span className="ml-2 text-muted-foreground">({percentage.toFixed(1)}%)</span>}
        </div>
      </div>
    </div>
  );
} 
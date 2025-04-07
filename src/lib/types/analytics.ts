export type FilterType = 'device' | 'os' | 'browser' | 'country' | 'city' | 'referrer' | 'link' | 'domain' | 'expiration';

export interface Filter {
  type: FilterType;
  value: string;
}

export interface AnalyticsItemData {
  name: string;
  count: number;
  type: FilterType;
  metadata?: {
    countryCode?: string;
    icon?: string;
    domain?: string;
    url?: string;
    expireAt?: string | null;
  };
}

export interface AnalyticsCardProps {
  title: string;
  data?: AnalyticsItemData[];
  activeFilters?: Filter[];
  onFilterClick?: (type: FilterType, value: string) => void;
  filterTypes?: FilterType[]; // Optional dropdown filter types
  defaultFilterType?: FilterType;
  maxHeight?: string;
} 
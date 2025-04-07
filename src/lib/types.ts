import type { Click } from "./supabase/schema";

export type FilterType = keyof Pick<Click, 'device' | 'browser' | 'os' | 'country' | 'city' | 'referrer'> | 'link' | 'expiration' | 'domain';

export interface Filter {
  type: FilterType;
  value: string;
} 
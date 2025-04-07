// schema.ts — Supabase schema definition for Loopy
// This file is used to type Supabase data in the frontend (Cursor, etc.)
// Ensure this stays synced with your Supabase SQL tables!

// Domains — can either be a primary domain (e.g., elvar.surf) or a "grouped" subdomain (e.g., elvar.surf/go)
export interface Domain {
  id: string;
  domain: string; // e.g., "elvar.surf" or "elvar.surf/go"
  user_id: string;
  verified: boolean;
  is_primary: boolean; // true = base domain; false = path/group like elvar.surf/go
  primary_domain_id?: string | null; // for sub-paths: points to the "parent" domain
  verification_method?: "TXT" | "FILE" | null;
  txt_record_value?: string | null;
  created_at: string;
  updated_at: string;
}

// Links — all shortened or custom URLs live here
export interface Link {
  id: string;
  domain_id: string; // points to the domain (or grouped domain) this link belongs to
  slug: string; // final part of the link path
  destination_url: string; // where this redirects to
  tags: string[]; // optional tags for filtering
  redirect_type: "301" | "307"; // default redirect behavior
  status: "active" | "draft" | "archived" | "expired"; // link status
  notes?: string; // internal notes
  epc?: number; // optional earnings-per-click
  created_at: string;
  updated_at: string;
  expire_at?: string;
  user_id: string;
  is_broken?: boolean; // did this resolve or fail
  last_checked_broken?: string; // timestamp of when the link was last checked for brokenness
  utm_params?: Record<string, string>; // custom UTM tracking fields
}

// Clicks — one row per unique or duplicate visit
export interface Click {
  id: string;
  link_id: string;
  timestamp: string; // when the click happened
  user_agent?: string;
  device?: "Desktop" | "Mobile" | "Tablet"; // parsed device type
  referrer?: string; // e.g. https://google.com
  ip_address?: string;
  country?: string; // full country name (e.g. "Iceland")
  city?: string; // city name if available
  is_broken?: boolean; // did this resolve or fail
  browser?: string; // parsed browser (e.g., Chrome)
  os?: string; // parsed OS (e.g., Android)
}

// Profiles — user info and subscription limits
export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  profile_image_url?: string;
  role: "admin" | "user";
  created_at: string;
  updated_at: string;

  // Limits and access settings
  link_limit?: number;        // Max number of links user can create
  click_limit?: number;       // Max number of trackable clicks per month
  retention_limit?: number;   // Days of click history retention

  // Subscription and billing
  plan?: "free" | "pro" | "business"; // Current plan name
  stripe_customer_id?: string;       // Stripe customer ID
  stripe_subscription_id?: string;   // Stripe subscription ID
  trial_ends_at?: string | null;     // Trial expiration date
  billing_status?: "active" | "past_due" | "canceled" | "trialing" | null; // Billing status
}

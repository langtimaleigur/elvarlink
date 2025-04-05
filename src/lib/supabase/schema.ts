export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          username: string;
          profile_image_url: string;
          role: string;
          created_at: string;
        };
      };
      domains: {
        Row: {
          id: string;
          domain: string;
          verified: boolean;
          created_at: string;
        };
      };
      domain_groups: {
        Row: {
          id: string;
          domain_id: string;
          slug: string;
          fallback_url: string | null;
          created_at: string;
        };
      };
      links: {
        Row: {
          id: string;
          user_id: string;
          slug: string;
          destination_url: string;
          redirect_type: string;
          tags: string[];
          epc: number;
          created_at: string;
          updated_at: string;
          expire_at: string | null;
          group_id: string | null;
          domain_id: string | null;
          status: string //'active' | 'draft' | 'archived' | 'expired';
          note: string | null;      
        };
      };
      clicks: {
        Row: {
          id: string;
          link_id: string;
          timestamp: string;
          user_agent: string | null;
          device: string | null;
          referrer: string | null;
          ip_address: string | null;
          country: string | null;
          is_broken: boolean;
        };
      };
    };
  };
};
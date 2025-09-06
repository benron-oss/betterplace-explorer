
export interface ApiLink {
  rel: string;
  href: string;
  method: string;
}

export interface Contact {
  id: number;
  name: string;
}

export interface Organisation {
  id: number;
  name: string;
  contact: Contact | null;
  links: ApiLink[];
}

export interface Project {
  id: number;
  title: string;
  contact: Contact | null;
  carrier: {
    name: string;
  } | null;
  donations_total_in_cents?: number;
  donated_amount_in_cents?: number;
  closed_at: string | null;
  completed_at: string | null;
  donations_prohibited: boolean;
  incomplete_needs_count?: number;
  incomplete_need_count?: number;
  links: ApiLink[];
  updated_at?: string | null;
  activated_at?: string | null;
}

export interface FundraisingEvent {
  id: number;
  title: string;
  contact: Contact | null;
  donations_total_in_cents?: number;
  donated_amount_in_cents?: number;
  closed_at: string | null;
  links: ApiLink[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FeaturedProject {
  id: number;
  title: string;
}

export interface FundraisingEventWithProjects extends FundraisingEvent {
  featuredProjects: FeaturedProject[];
}

export interface SearchResults {
  organisations: Organisation[];
  projects: Project[];
  fundraisingEvents: FundraisingEventWithProjects[];
}

// Wrapper for paginated list responses from the API
export interface ApiListResponse<T> {
  data: T[];
  total_entries: number;
  total_pages: number;
  per_page: number;
  page: number;
  links: ApiLink[];
}

import { ApiListResponse, FeaturedProject, FundraisingEvent, Organisation, Project } from '../types';

const API_BASE = 'https://api.betterplace.org/de/api_v4';

async function fetcher<T>(url: string, timeoutMs: number = 60000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (response.status === 404) {
      throw new Error(`Not Found: 404`);
    }
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    try {
      return await response.json() as T;
    } catch (e) {
      console.error("Failed to parse JSON from API response:", e);
      throw new Error("Invalid JSON response from API.");
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('API request timed out.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchAllPages<T>(endpoint: string): Promise<T[]> {
  const perPage = 100;
  const MAX_RETRIES = 5; // Increased retries
  const RETRY_DELAY_MS = 2000;

  const initialEndpoint = endpoint.includes('?') ? `${endpoint}&per_page=${perPage}` : `${endpoint}?per_page=${perPage}`;
  
  let firstPageResponse: ApiListResponse<T> | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      firstPageResponse = await fetcher<ApiListResponse<T>>(initialEndpoint);
      break; // Success
    } catch (error) {
      console.warn(`Failed to fetch first page (attempt ${attempt}/${MAX_RETRIES}):`, error);
      if (attempt === MAX_RETRIES) throw new Error(`Failed to fetch initial page after ${MAX_RETRIES} attempts.`);
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt - 1)));
    }
  }

  if (!firstPageResponse || !firstPageResponse.data) {
    console.error("Initial API response is invalid for endpoint:", endpoint, firstPageResponse);
    return [];
  }

  let allData = firstPageResponse.data;
  const totalPages = firstPageResponse.total_pages;

  if (totalPages <= 1) return allData;

  for (let page = 2; page <= totalPages; page++) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetcher<ApiListResponse<T>>(`${initialEndpoint}&page=${page}`);
        if (response && response.data) {
          allData = allData.concat(response.data);
        }
        break; // Success, break retry loop
      } catch (error) {
        console.warn(`Failed to fetch page ${page} (attempt ${attempt}/${MAX_RETRIES}):`, error);
        if (attempt === MAX_RETRIES) {
          throw new Error(`Failed to fetch page ${page} after ${MAX_RETRIES} attempts.`);
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt - 1)));
      }
    }
  }
  return allData;
}

export interface SyncResponse<T> {
    data: T[] | null;
    etag: string | null;
    notModified: boolean;
}

async function syncAll<T>(resource: string, etag: string | null): Promise<SyncResponse<T>> {
    const endpoint = `${API_BASE}/${resource}.json?per_page=1`;
    const headers = new Headers();
    if (etag) {
        headers.append('If-None-Match', etag);
    }
    
    const response = await fetch(endpoint, { headers });
    
    if (response.status === 304) {
        return { data: null, etag, notModified: true };
    }
    
    if (!response.ok) {
        throw new Error(`API check for ${resource} failed with status ${response.status}`);
    }
    
    const newEtag = response.headers.get('Etag');
    const allData = await fetchAllPages<T>(`${API_BASE}/${resource}.json`);
    
    return { data: allData, etag: newEtag, notModified: false };
}

export const syncAllOrganisations = (etag: string | null) => syncAll<Organisation>('organisations', etag);
export const syncAllProjects = (etag: string | null) => syncAll<Project>('projects', etag);
export const syncAllFundraisingEvents = (etag: string | null) => syncAll<FundraisingEvent>('fundraising_events', etag);


// --- ID-based fetching ---
export const getOrganisationById = (id: string) => fetcher<Organisation>(`${API_BASE}/organisations/${id}.json`);
export const getProjectById = (id: string) => fetcher<Project>(`${API_BASE}/projects/${id}.json`);
export const getFundraisingEventById = (id: string) => fetcher<FundraisingEvent>(`${API_BASE}/fundraising_events/${id}.json`);

// --- Ancillary data (with pagination handling) ---
export const getFeaturedProjects = (eventId: number) => fetchAllPages<FeaturedProject>(`${API_BASE}/fundraising_events/${eventId}/featured_projects.json`);
export const getProjectsForOrganisation = (organisationId: number) => fetchAllPages<Project>(`${API_BASE}/organisations/${organisationId}/projects.json`);
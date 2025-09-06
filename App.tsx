
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Organisation, Project, FundraisingEvent, FundraisingEventWithProjects, SearchResults } from './types';
import {
  getOrganisationById,
  getProjectById,
  getFundraisingEventById,
  syncAllOrganisations,
  syncAllProjects,
  syncAllFundraisingEvents,
  getFeaturedProjects,
  getProjectsForOrganisation,
} from './services/api';
import * as cache from './services/cache';
import SearchBar, { SearchTerms } from './components/SearchBar';
import ResultsDisplay from './components/ResultsDisplay';
import LoadingSpinner from './components/LoadingSpinner';

type SearchState = 'initial' | 'loading' | 'no-results' | 'results';
type CacheStatus = 'idle' | 'syncing' | 'ready' | 'failed';

const levenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = a[j - 1] === b[i - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[b.length][a.length];
};

const filterByContactName = <T extends { contact: { name: string } | null }>(items: T[], searchTerm: string): T[] => {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase().replace(/\./g, '');
  const searchParts = normalizedSearchTerm.split(/\s+/).filter(p => p);
  return items.filter(item => {
      const contactName = item.contact?.name?.trim().toLowerCase();
      if (!contactName) return false;
      const contactNameParts = contactName.split(/\s+/);
      const contactLastName = contactNameParts[contactNameParts.length - 1] || '';
      const contactFirstName = contactNameParts[0] || '';
      if (contactName.replace(/\./g, '') === normalizedSearchTerm) return true;
      if (searchParts.length === 1 && contactLastName === searchParts[0]) return true;
      if (searchParts.length === 2 && searchParts[0].length === 1 && contactFirstName.startsWith(searchParts[0]) && contactLastName === searchParts[1]) {
          return true;
      }
      return false;
  });
};

const App: React.FC = () => {
  const [searchState, setSearchState] = useState<SearchState>('initial');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [lastSearchedTerm, setLastSearchedTerm] = useState('');
  
  const [allOrganisations, setAllOrganisations] = useState<Organisation[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allFundraisingEvents, setAllFundraisingEvents] = useState<FundraisingEvent[]>([]);

  const [cacheStatus, setCacheStatus] = useState({
      orgs: 'idle' as CacheStatus,
      projects: 'idle' as CacheStatus,
      events: 'idle' as CacheStatus,
  });

  const [showReadyMessage, setShowReadyMessage] = useState(false);

  useEffect(() => {
    const syncData = async () => {
        const syncTask = async <T,>(
            type: keyof typeof cacheStatus,
            setState: React.Dispatch<React.SetStateAction<T[]>>,
            getFromCache: () => Promise<cache.CachedData<T> | null>,
            saveToCache: (data: T[], etag: string | null) => Promise<void>,
            updateTimestamp: () => Promise<void>,
            syncApiCall: (etag: string | null) => Promise<any>
        ) => {
            // Step 1: Immediately load from cache to make app responsive
            const cached = await getFromCache();
            if (cached) {
                setState(cached.data);
                setCacheStatus(prev => ({ ...prev, [type]: 'ready' }));
            } else {
                // If nothing in cache, we must sync
                setCacheStatus(prev => ({ ...prev, [type]: 'syncing' }));
            }

            // Step 2: Check for updates if cache is stale or missing
            if (!cached || cache.isCacheStale(cached.timestamp)) {
                if (cached) { // Only show syncing if we had data before, otherwise it's already syncing
                    setCacheStatus(prev => ({ ...prev, [type]: 'syncing' }));
                }
                try {
                    const syncResult = await syncApiCall(cached?.etag || null);
                    if (syncResult.notModified) {
                        await updateTimestamp();
                    } else if (syncResult.data) {
                        await saveToCache(syncResult.data, syncResult.etag);
                        setState(syncResult.data);
                    }
                    setCacheStatus(prev => ({ ...prev, [type]: 'ready' }));
                } catch (error) {
                    console.error(`Failed to sync ${type}:`, error);
                    setCacheStatus(prev => ({ ...prev, [type]: 'failed' }));
                }
            }
        };

        // Run sync tasks concurrently. They manage their own state.
        syncTask<Organisation>('orgs', setAllOrganisations, cache.getOrganisationsFromCache, cache.saveOrganisationsToCache, cache.updateOrganisationsTimestamp, syncAllOrganisations);
        syncTask<Project>('projects', setAllProjects, cache.getProjectsFromCache, cache.saveProjectsToCache, cache.updateProjectsTimestamp, syncAllProjects);
        syncTask<FundraisingEvent>('events', setAllFundraisingEvents, cache.getFundraisingEventsFromCache, cache.saveFundraisingEventsToCache, cache.updateFundraisingEventsTimestamp, syncAllFundraisingEvents);
    };

    syncData();
  }, []);

  const overallSyncStatus = useMemo<CacheStatus>(() => {
    const statuses = Object.values(cacheStatus);
    if (statuses.some(s => s === 'failed')) return 'failed';
    if (statuses.some(s => s === 'syncing')) return 'syncing';
    if (statuses.every(s => s === 'ready')) {
       if (!showReadyMessage) {
           setShowReadyMessage(true);
           setTimeout(() => setShowReadyMessage(false), 4000);
       }
       return 'ready';
    }
    return 'idle';
  }, [cacheStatus, showReadyMessage]);

  const contactCacheStatus = useMemo<CacheStatus>(() => {
    const statuses = [cacheStatus.projects, cacheStatus.events, cacheStatus.orgs];
    if (statuses.some(s => s === 'failed')) return 'failed';
    if (statuses.some(s => s === 'syncing')) return 'syncing';
    if (statuses.every(s => s === 'ready')) return 'ready';
    return 'idle';
  }, [cacheStatus.projects, cacheStatus.events, cacheStatus.orgs]);

  const processFundraisingEvents = useCallback(async (events: FundraisingEvent[]): Promise<FundraisingEventWithProjects[]> => {
    const resultsWithProjects: FundraisingEventWithProjects[] = [];
    for (const event of events) {
        try {
            const featuredProjects = await getFeaturedProjects(event.id);
            resultsWithProjects.push({ ...event, featuredProjects });
        } catch (error) {
            console.error(`Failed to fetch featured projects for event ${event.id}:`, error);
            resultsWithProjects.push({ ...event, featuredProjects: [] });
        }
    }
    return resultsWithProjects;
  }, []);

  const handleIdSearch = useCallback(async (id: string): Promise<SearchResults> => {
    const [orgRes, projRes, eventRes] = await Promise.allSettled([
        getOrganisationById(id),
        getProjectById(id),
        getFundraisingEventById(id)
    ]);
    
    const orgs = orgRes.status === 'fulfilled' ? [orgRes.value] : [];
    const projs = projRes.status === 'fulfilled' ? [projRes.value] : [];
    const events = eventRes.status === 'fulfilled' ? [eventRes.value] : [];
    
    return {
        organisations: orgs,
        projects: projs,
        fundraisingEvents: await processFundraisingEvents(events),
    };
  }, [processFundraisingEvents]);

  const handleContactSearch = useCallback(async (term: string): Promise<SearchResults> => {
      const orgsByContact = filterByContactName(allOrganisations, term);
      const projsByContact = filterByContactName(allProjects, term);
      const eventsByContact = filterByContactName(allFundraisingEvents, term);
      
      return {
          organisations: orgsByContact,
          projects: projsByContact,
          fundraisingEvents: await processFundraisingEvents(eventsByContact),
      };
  }, [allOrganisations, allProjects, allFundraisingEvents, processFundraisingEvents]);

  const handleOrgSearch = useCallback(async (term: string): Promise<SearchResults> => {
      if (allOrganisations.length === 0) {
          return { organisations: [], projects: [], fundraisingEvents: [] };
      }
      
      const normalizedSearchTerm = term.toLowerCase();
      const searchWords = normalizedSearchTerm.split(/\s+/).filter(Boolean);

      const orgsByCarrierName = allOrganisations.filter(org => {
        const orgNameLower = org.name.toLowerCase();
        if (orgNameLower.includes(normalizedSearchTerm)) return true;
        
        const orgWords = orgNameLower.split(/\s+/).filter(Boolean);
        return searchWords.every(searchWord => {
          const maxDistance = Math.max(1, Math.floor(searchWord.length / 5));
          return orgWords.some(orgWord => 
              orgWord.startsWith(searchWord) || 
              levenshteinDistance(searchWord, orgWord) <= maxDistance
          );
        });
      });

      const projectsFromCarriers: Project[] = [];
      const carrierPromises = orgsByCarrierName.map(org => 
          getProjectsForOrganisation(org.id)
            .then(projects => projectsFromCarriers.push(...projects))
            .catch(error => console.error(`Failed to fetch projects for carrier ${org.id}:`, error))
      );
      await Promise.all(carrierPromises);

      return {
          organisations: orgsByCarrierName,
          projects: Array.from(new Map(projectsFromCarriers.map(p => [p.id, p])).values()),
          fundraisingEvents: [],
      };
  }, [allOrganisations]);

  const handleSearch = useCallback(async (terms: SearchTerms) => {
    setSearchState('loading');
    setResults(null);
    let finalResults: SearchResults = { organisations: [], projects: [], fundraisingEvents: [] };
    
    const activeTerm = terms.idTerm || terms.contactTerm || terms.orgTerm;
    setLastSearchedTerm(activeTerm);

    try {
        if (terms.idTerm) {
            finalResults = await handleIdSearch(terms.idTerm);
        } else if (terms.contactTerm) {
            finalResults = await handleContactSearch(terms.contactTerm);
        } else if (terms.orgTerm) {
            finalResults = await handleOrgSearch(terms.orgTerm);
        }

        const hasResults = finalResults.organisations.length > 0 || finalResults.projects.length > 0 || finalResults.fundraisingEvents.length > 0;
        setResults(finalResults);
        setSearchState(hasResults ? 'results' : 'no-results');

    } catch (error) {
        console.error("Search failed:", error);
        setSearchState('no-results');
    }
  }, [handleIdSearch, handleContactSearch, handleOrgSearch]);

  const renderContent = () => {
    switch (searchState) {
      case 'initial':
        return <p className="text-center text-gray-500 mt-8">Use one of the fields above to begin your search.</p>;
      case 'loading':
        return <LoadingSpinner />;
      case 'no-results':
        return <p className="text-center text-gray-500 mt-8">No results found for <span className="font-semibold">"{lastSearchedTerm}"</span>.</p>;
      case 'results':
        return results && <ResultsDisplay results={results} />;
      default:
        return null;
    }
  };
  
   const getSyncStatusMessage = () => {
    if (overallSyncStatus === 'failed') return 'Failed to load local data. Some searches are disabled.';
    if (showReadyMessage && overallSyncStatus === 'ready') return 'Data is up-to-date.';
    
    const syncing = [];
    if (cacheStatus.orgs === 'syncing') syncing.push('organisations');
    if (cacheStatus.projects === 'syncing') syncing.push('projects');
    if (cacheStatus.events === 'syncing') syncing.push('events');

    if (syncing.length > 0) return `Syncing ${syncing.join(', ')}...`;

    return '';
  };

  return (
    <div className="min-h-screen bg-brand-gray/50 text-gray-900 font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">betterplace.org explorer</h1>
          <p className="text-lg text-gray-600 mt-2">Find Organisations, Projects, and Fundraising Events quickly.</p>
        </header>
        <section className="sticky top-0 z-10 py-4 bg-brand-gray/50 -my-4">
          <SearchBar 
            onSearch={handleSearch} 
            isLoading={searchState === 'loading'} 
            orgCacheStatus={cacheStatus.orgs}
            contactCacheStatus={contactCacheStatus}
          />
           <div className="text-center text-sm text-gray-500 mt-2 h-5">
            <p
              className={`transition-opacity duration-500 ${
                (overallSyncStatus === 'syncing' || overallSyncStatus === 'failed' || showReadyMessage) ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {getSyncStatusMessage()}
            </p>
          </div>
        </section>
        <section className="mt-8">
          {renderContent()}
        </section>
      </main>
    </div>
  );
};
export default App;

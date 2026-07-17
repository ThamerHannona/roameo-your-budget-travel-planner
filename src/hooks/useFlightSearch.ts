import { useState, useCallback } from 'react';
import { 
  searchFlightsForDestinations,
  fetchFlightOptions,
  FlightSearchResult, 
  FlightOption,
  getCheapestPrice,
  getFlightByTier,
  clearFlightCache 
} from '@/services/serpapi';
import { getAirportCode, CANDIDATE_DESTINATIONS } from '@/utils/airports';
import { format } from 'date-fns';

export interface FlightSearchState {
  isLoading: boolean;
  error: string | null;
  results: Map<string, FlightSearchResult>;
  hasMockData: boolean;
}

export interface FlightSearchOptions {
  destinations?: string[];
  /** Transport budget cap — only return fares at or under this total */
  maxPrice?: number;
  /** Deeper inventory (single-destination budget page) */
  deepSearch?: boolean;
}

export interface UseFlightSearchReturn extends FlightSearchState {
  searchFlights: (
    originCity: string,
    startDate: Date,
    endDate: Date,
    travelers?: number,
    destinationsOrOptions?: string[] | FlightSearchOptions
  ) => Promise<Map<string, FlightSearchResult>>;
  getFlightPrice: (destinationCode: string, tier?: 'budget' | 'mid' | 'premium') => number | null;
  getFlightOptions: (destinationCode: string) => FlightOption[];
  clearCache: () => void;
  reset: () => void;
}

/**
 * Hook for searching flights from SerpAPI
 */
export function useFlightSearch(): UseFlightSearchReturn {
  const [state, setState] = useState<FlightSearchState>({
    isLoading: false,
    error: null,
    results: new Map(),
    hasMockData: false,
  });

  const searchFlights = useCallback(async (
    originCity: string,
    startDate: Date,
    endDate: Date,
    travelers: number = 1,
    destinationsOrOptions: string[] | FlightSearchOptions = [...CANDIDATE_DESTINATIONS]
  ): Promise<Map<string, FlightSearchResult>> => {
    const originCode = getAirportCode(originCity);
    
    if (!originCode) {
      setState(prev => ({
        ...prev,
        error: `Could not find airport code for "${originCity}"`,
        isLoading: false,
      }));
      return new Map();
    }

    const opts: FlightSearchOptions = Array.isArray(destinationsOrOptions)
      ? { destinations: destinationsOrOptions }
      : destinationsOrOptions;
    const destinations = opts.destinations ?? [...CANDIDATE_DESTINATIONS];
    const maxPrice = opts.maxPrice;
    const deepSearch = opts.deepSearch ?? false;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const departureDate = format(startDate, 'yyyy-MM-dd');
      const returnDate = format(endDate, 'yyyy-MM-dd');

      let results: Map<string, FlightSearchResult>;

      // Single destination + deep search = max inventory for budget page
      if (deepSearch && destinations.length === 1) {
        const dest = destinations[0];
        const one = await fetchFlightOptions({
          origin: originCode,
          destination: dest,
          departureDate,
          returnDate,
          adults: travelers,
          maxPrice,
          deepSearch: true,
          expandAirports: true,
        });
        results = new Map([[dest, one]]);
      } else {
        results = await searchFlightsForDestinations(
          originCity,
          departureDate,
          returnDate,
          destinations,
          travelers,
          'economy',
          maxPrice
        );
      }

      const hasMockData = Array.from(results.values()).some(r => r.useMock);
      const resultList = Array.from(results.values());
      const hasLiveOptions = resultList.some(r => !r.useMock && r.options.length > 0);
      const quotaError = resultList.find(r => r.errorCode === 'SERPAPI_QUOTA_EXCEEDED');
      const firstError = resultList.find(r => r.error)?.error;

      setState({
        isLoading: false,
        error: quotaError?.error ?? (!hasLiveOptions && firstError ? firstError : null),
        results,
        hasMockData,
      });

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search flights';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return new Map();
    }
  }, []);

  const getFlightPrice = useCallback((
    destinationCode: string,
    tier: 'budget' | 'mid' | 'premium' = 'budget'
  ): number | null => {
    const result = state.results.get(destinationCode);
    if (!result) return null;

    // Budget-first: default to cheapest, not mid-tier
    if (tier === 'budget') {
      return getCheapestPrice(result) || null;
    }

    const flight = getFlightByTier(result, tier);
    if (flight) return flight.price;

    return getCheapestPrice(result) || null;
  }, [state.results]);

  const getFlightOptions = useCallback((destinationCode: string): FlightOption[] => {
    const result = state.results.get(destinationCode);
    return result?.options || [];
  }, [state.results]);

  const clearCache = useCallback(() => {
    clearFlightCache();
    setState(prev => ({ ...prev, results: new Map() }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      results: new Map(),
      hasMockData: false,
    });
  }, []);

  return {
    ...state,
    searchFlights,
    getFlightPrice,
    getFlightOptions,
    clearCache,
    reset,
  };
}

export default useFlightSearch;

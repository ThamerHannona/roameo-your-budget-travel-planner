import { useState, useCallback } from 'react';
import { 
  searchFlightsForDestinations, 
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

export interface UseFlightSearchReturn extends FlightSearchState {
  searchFlights: (
    originCity: string,
    startDate: Date,
    endDate: Date,
    travelers?: number,
    destinations?: string[]
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
    destinations: string[] = [...CANDIDATE_DESTINATIONS]
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

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const departureDate = format(startDate, 'yyyy-MM-dd');
      const returnDate = format(endDate, 'yyyy-MM-dd');

      const results = await searchFlightsForDestinations(
        originCity,
        departureDate,
        returnDate,
        destinations,
        travelers
      );

      // Check if any results are mock data
      const hasMockData = Array.from(results.values()).some(r => r.useMock);

      setState({
        isLoading: false,
        error: null,
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
    tier: 'budget' | 'mid' | 'premium' = 'mid'
  ): number | null => {
    const result = state.results.get(destinationCode);
    if (!result) return null;

    const flight = getFlightByTier(result, tier);
    if (flight) return flight.price;

    // Fallback to cheapest
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

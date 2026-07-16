import { useState, useCallback } from 'react';
import { fetchHotelOptions, HotelSearchResult, HotelOption, clearHotelCache } from '@/services/hotelApi';
import { format } from 'date-fns';

export interface HotelSearchState {
  isLoading: boolean;
  error: string | null;
  results: Map<string, HotelSearchResult>;
  hasMockData: boolean;
}

export interface HotelSearchCallOptions {
  maxPrice?: number;
  maxPricePerNight?: number;
  includeVacationRentals?: boolean;
}

export interface UseHotelSearchReturn extends HotelSearchState {
  search: (
    destination: string,
    checkIn: Date | string,
    checkOut: Date | string,
    travelers?: number,
    options?: HotelSearchCallOptions
  ) => Promise<HotelSearchResult | void>;
  searchHotels: (
    destination: string,
    checkIn: Date,
    checkOut: Date,
    travelers?: number,
    options?: HotelSearchCallOptions
  ) => Promise<HotelSearchResult>;
  getHotelPrice: (destination: string, tier?: '3-star' | '4-star' | '5-star') => number | null;
  getHotelOptions: (destination: string) => HotelOption[];
  getResult: (destination: string) => HotelSearchResult | undefined;
  clearCache: () => void;
  reset: () => void;
}

/**
 * Hook for searching hotels from SerpAPI
 */
export function useHotelSearch(): UseHotelSearchReturn {
  const [state, setState] = useState<HotelSearchState>({
    isLoading: false,
    error: null,
    results: new Map(),
    hasMockData: false,
  });

  const searchHotels = useCallback(async (
    destination: string,
    checkIn: Date,
    checkOut: Date,
    travelers: number = 2,
    options: HotelSearchCallOptions = {}
  ): Promise<HotelSearchResult> => {
    if (!destination || !checkIn || !checkOut) {
      throw new Error('Missing required search parameters');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const checkInStr = format(checkIn, 'yyyy-MM-dd');
      const checkOutStr = format(checkOut, 'yyyy-MM-dd');

      const result = await fetchHotelOptions({
        destination,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        adults: travelers,
        maxPrice: options.maxPrice,
        maxPricePerNight: options.maxPricePerNight,
        includeVacationRentals: options.includeVacationRentals ?? true,
      });

      setState(prev => {
        const newResults = new Map(prev.results);
        newResults.set(destination, result);
        return {
          isLoading: false,
          error: null,
          results: newResults,
          hasMockData: result.useMock || false,
        };
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search hotels';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  // Alias for backward compatibility - accepts string or Date
  const search = useCallback(async (
    destination: string,
    checkIn: Date | string,
    checkOut: Date | string,
    travelers: number = 2,
    options: HotelSearchCallOptions = {}
  ): Promise<HotelSearchResult | void> => {
    if (!destination || !checkIn || !checkOut) return;

    const checkInDate = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
    const checkOutDate = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;

    try {
      return await searchHotels(destination, checkInDate, checkOutDate, travelers, options);
    } catch (error) {
      console.error('Hotel search error:', error);
    }
  }, [searchHotels]);

  const getHotelPrice = useCallback((
    destination: string,
    tier: '3-star' | '4-star' | '5-star' = '4-star'
  ): number | null => {
    const result = state.results.get(destination);
    if (!result) return null;

    const hotel = result.options.find(o => o.tier === tier);
    if (hotel) return hotel.totalPrice;

    // Fallback to first option
    return result.options[0]?.totalPrice || null;
  }, [state.results]);

  const getHotelOptions = useCallback((destination: string): HotelOption[] => {
    const result = state.results.get(destination);
    return result?.options || [];
  }, [state.results]);

  const getResult = useCallback((destination: string): HotelSearchResult | undefined => {
    return state.results.get(destination);
  }, [state.results]);

  const clearCache = useCallback(() => {
    clearHotelCache();
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
    search,
    searchHotels,
    getHotelPrice,
    getHotelOptions,
    getResult,
    clearCache,
    reset,
  };
}

export default useHotelSearch;

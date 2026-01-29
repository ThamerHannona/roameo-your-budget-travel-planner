import { useState, useCallback } from 'react';
import { searchHotels } from '@/services/travelApi';
import type { Hotel } from '@/types/travel';

export interface HotelSearchResult {
  destination: string;
  hotels: Hotel[];
  isLoading: boolean;
  error: string | null;
  hasMockData: boolean;
}

export function useHotelSearch() {
  const [results, setResults] = useState<Map<string, HotelSearchResult>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [hasMockData, setHasMockData] = useState(false);

  const search = useCallback(
    async (
      destination: string,
      checkIn: string,
      checkOut: string,
      travelers: number = 1
    ) => {
      if (!destination || !checkIn || !checkOut) return;

      setIsLoading(true);

      try {
        // Check if we have API keys configured
        const hasApiKey = !!import.meta.env.VITE_AMADEUS_KEY;
        setHasMockData(!hasApiKey);

        const hotels = await searchHotels(destination, checkIn, checkOut, travelers);

        const result: HotelSearchResult = {
          destination,
          hotels,
          isLoading: false,
          error: null,
          hasMockData: !hasApiKey,
        };

        setResults((prev) => {
          const newMap = new Map(prev);
          newMap.set(destination, result);
          return newMap;
        });
      } catch (error) {
        console.error('Hotel search error:', error);
        setHasMockData(true);

        const result: HotelSearchResult = {
          destination,
          hotels: [],
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          hasMockData: true,
        };

        setResults((prev) => {
          const newMap = new Map(prev);
          newMap.set(destination, result);
          return newMap;
        });
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getResult = useCallback(
    (destination: string): HotelSearchResult | undefined => {
      return results.get(destination);
    },
    [results]
  );

  return {
    results,
    isLoading,
    hasMockData,
    search,
    getResult,
  };
}

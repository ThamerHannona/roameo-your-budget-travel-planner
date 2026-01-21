import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DestinationMatch } from '@/types/destination';

export type SortOption = 'best-value' | 'lowest-price' | 'highest-confidence' | 'best-weather' | 'least-crowded';

export interface DestinationFilters {
  maxPrice: number | null;
  minConfidence: number;
  weatherPreference: 'any' | 'sunny' | 'mild' | 'avoid-rain';
  crowdPreference: 'any' | 'quiet' | 'moderate' | 'avoid-packed';
  regions: string[];
}

interface DestinationsState {
  destinations: DestinationMatch[];
  ghostTrips: DestinationMatch[];
  selectedForComparison: string[]; // max 3 IDs
  filters: DestinationFilters;
  sortBy: SortOption;
  isLoading: boolean;
  lastSearchTimestamp: number | null;
}

interface DestinationsActions {
  // Data management
  loadDestinations: (destinations: DestinationMatch[], ghostTrips?: DestinationMatch[]) => void;
  clearDestinations: () => void;
  
  // Comparison management (max 3)
  toggleComparison: (destinationId: string) => boolean;
  clearComparison: () => void;
  isSelectedForComparison: (destinationId: string) => boolean;
  getComparisonDestinations: () => DestinationMatch[];
  
  // Filtering
  setFilters: (filters: Partial<DestinationFilters>) => void;
  resetFilters: () => void;
  applyFilters: () => DestinationMatch[];
  
  // Sorting
  setSortBy: (sort: SortOption) => void;
  getSortedDestinations: () => DestinationMatch[];
  
  // Combined filtered + sorted
  getFilteredAndSortedDestinations: () => DestinationMatch[];
  
  // Loading state
  setLoading: (loading: boolean) => void;
}

const defaultFilters: DestinationFilters = {
  maxPrice: null,
  minConfidence: 0,
  weatherPreference: 'any',
  crowdPreference: 'any',
  regions: [],
};

const initialState: DestinationsState = {
  destinations: [],
  ghostTrips: [],
  selectedForComparison: [],
  filters: { ...defaultFilters },
  sortBy: 'best-value',
  isLoading: false,
  lastSearchTimestamp: null,
};

export const useDestinationsStore = create<DestinationsState & DestinationsActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      loadDestinations: (destinations, ghostTrips = []) => {
        set({
          destinations,
          ghostTrips,
          lastSearchTimestamp: Date.now(),
          isLoading: false,
        });
      },

      clearDestinations: () => {
        set({
          destinations: [],
          ghostTrips: [],
          selectedForComparison: [],
          lastSearchTimestamp: null,
        });
      },

      toggleComparison: (destinationId) => {
        const { selectedForComparison } = get();
        
        if (selectedForComparison.includes(destinationId)) {
          // Remove from comparison
          set({
            selectedForComparison: selectedForComparison.filter(id => id !== destinationId),
          });
          return true;
        }
        
        // Add to comparison (max 3)
        if (selectedForComparison.length >= 3) {
          return false; // Can't add more
        }
        
        set({
          selectedForComparison: [...selectedForComparison, destinationId],
        });
        return true;
      },

      clearComparison: () => {
        set({ selectedForComparison: [] });
      },

      isSelectedForComparison: (destinationId) => {
        return get().selectedForComparison.includes(destinationId);
      },

      getComparisonDestinations: () => {
        const { destinations, ghostTrips, selectedForComparison } = get();
        const allDestinations = [...destinations, ...ghostTrips];
        return selectedForComparison
          .map(id => allDestinations.find(d => d.id === id))
          .filter((d): d is DestinationMatch => d !== undefined);
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      resetFilters: () => {
        set({ filters: { ...defaultFilters } });
      },

      applyFilters: () => {
        const { destinations, filters } = get();
        
        return destinations.filter((dest) => {
          // Price filter
          if (filters.maxPrice !== null && dest.estimatedTotalCost > filters.maxPrice) {
            return false;
          }
          
          // Confidence filter
          if (dest.confidenceScore < filters.minConfidence) {
            return false;
          }
          
          // Weather filter
          if (filters.weatherPreference !== 'any') {
            const weatherScore = dest.weatherScore || 0;
            switch (filters.weatherPreference) {
              case 'sunny':
                if (weatherScore < 70) return false;
                break;
              case 'mild':
                if (weatherScore < 50 || weatherScore > 85) return false;
                break;
              case 'avoid-rain':
                if (weatherScore < 60) return false;
                break;
            }
          }
          
          // Crowd filter
          if (filters.crowdPreference !== 'any') {
            const crowdScore = dest.crowdScore || 0;
            switch (filters.crowdPreference) {
              case 'quiet':
                if (crowdScore < 70) return false;
                break;
              case 'moderate':
                if (crowdScore < 40 || crowdScore > 80) return false;
                break;
              case 'avoid-packed':
                if (crowdScore < 50) return false;
                break;
            }
          }
          
          // Region filter
          if (filters.regions.length > 0 && !filters.regions.includes(dest.region)) {
            return false;
          }
          
          return true;
        });
      },

      setSortBy: (sort) => {
        set({ sortBy: sort });
      },

      getSortedDestinations: () => {
        const { destinations, sortBy } = get();
        const sorted = [...destinations];
        
        switch (sortBy) {
          case 'best-value':
            sorted.sort((a, b) => b.valueScore - a.valueScore);
            break;
          case 'lowest-price':
            sorted.sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost);
            break;
          case 'highest-confidence':
            sorted.sort((a, b) => b.confidenceScore - a.confidenceScore);
            break;
          case 'best-weather':
            sorted.sort((a, b) => b.weatherScore - a.weatherScore);
            break;
          case 'least-crowded':
            sorted.sort((a, b) => b.crowdScore - a.crowdScore);
            break;
        }
        
        return sorted;
      },

      getFilteredAndSortedDestinations: () => {
        const { sortBy } = get();
        const filtered = get().applyFilters();
        
        switch (sortBy) {
          case 'best-value':
            filtered.sort((a, b) => b.valueScore - a.valueScore);
            break;
          case 'lowest-price':
            filtered.sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost);
            break;
          case 'highest-confidence':
            filtered.sort((a, b) => b.confidenceScore - a.confidenceScore);
            break;
          case 'best-weather':
            filtered.sort((a, b) => b.weatherScore - a.weatherScore);
            break;
          case 'least-crowded':
            filtered.sort((a, b) => b.crowdScore - a.crowdScore);
            break;
        }
        
        return filtered;
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'roamio-destinations',
      partialize: (state) => ({
        selectedForComparison: state.selectedForComparison,
        filters: state.filters,
        sortBy: state.sortBy,
      }),
    }
  )
);

// Helper to get max comparable count
export const MAX_COMPARISON_COUNT = 3;

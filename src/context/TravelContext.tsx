import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { TravelSearch, SelectedItems, Flight, Hotel } from '@/types/travel';

const STORAGE_KEY_SEARCH = 'travel_search';
const STORAGE_KEY_SELECTIONS = 'travel_selections';

interface TravelContextType {
  search: TravelSearch | null;
  setSearch: (search: TravelSearch) => void;
  selections: SelectedItems;
  // Single selection (legacy)
  selectOutboundFlight: (flight: Flight | null) => void;
  selectReturnFlight: (flight: Flight | null) => void;
  selectHotel: (hotel: Hotel | null) => void;
  // Multi-selection helpers
  addFlight: (flight: Flight) => void;
  removeFlight: (flightId: string) => void;
  addHotel: (hotel: Hotel) => void;
  removeHotel: (hotelId: string) => void;
  // Budget calculations
  getTotalCost: () => number;
  getRemainingBudget: () => number;
  calculateRemaining: () => number;
  resetSelections: () => void;
  clearAll: () => void;
  hasSearch: () => boolean;
  hasSelections: () => boolean;
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

const initialSelections: SelectedItems = {
  outboundFlight: null,
  returnFlight: null,
  hotel: null,
  flights: [],
  hotels: [],
};

// Helper to safely parse JSON from sessionStorage
function getStoredData<T>(key: string, fallback: T): T {
  try {
    const stored = sessionStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (e) {
    console.warn(`Failed to parse ${key} from sessionStorage`, e);
  }
  return fallback;
}

export function TravelProvider({ children }: { children: ReactNode }) {
  const [search, setSearchState] = useState<TravelSearch | null>(() => 
    getStoredData<TravelSearch | null>(STORAGE_KEY_SEARCH, null)
  );
  const [selections, setSelections] = useState<SelectedItems>(() => 
    getStoredData<SelectedItems>(STORAGE_KEY_SELECTIONS, initialSelections)
  );

  // Persist search to sessionStorage
  useEffect(() => {
    if (search) {
      sessionStorage.setItem(STORAGE_KEY_SEARCH, JSON.stringify(search));
    } else {
      sessionStorage.removeItem(STORAGE_KEY_SEARCH);
    }
  }, [search]);

  // Persist selections to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_SELECTIONS, JSON.stringify(selections));
  }, [selections]);

  const setSearch = useCallback((newSearch: TravelSearch) => {
    setSearchState(newSearch);
  }, []);

  const selectOutboundFlight = useCallback((flight: Flight | null) => {
    setSelections(prev => ({ ...prev, outboundFlight: flight }));
  }, []);

  const selectReturnFlight = useCallback((flight: Flight | null) => {
    setSelections(prev => ({ ...prev, returnFlight: flight }));
  }, []);

  const selectHotel = useCallback((hotel: Hotel | null) => {
    setSelections(prev => ({ ...prev, hotel: hotel }));
  }, []);

  const addFlight = useCallback((flight: Flight) => {
    setSelections(prev => {
      if (prev.flights.some(f => f.id === flight.id)) return prev;
      return { ...prev, flights: [...prev.flights, flight] };
    });
  }, []);

  const removeFlight = useCallback((flightId: string) => {
    setSelections(prev => ({
      ...prev,
      flights: prev.flights.filter(f => f.id !== flightId),
    }));
  }, []);

  const addHotel = useCallback((hotel: Hotel) => {
    setSelections(prev => {
      if (prev.hotels.some(h => h.id === hotel.id)) return prev;
      return { ...prev, hotels: [...prev.hotels, hotel] };
    });
  }, []);

  const removeHotel = useCallback((hotelId: string) => {
    setSelections(prev => ({
      ...prev,
      hotels: prev.hotels.filter(h => h.id !== hotelId),
    }));
  }, []);

  const getTotalCost = useCallback(() => {
    let total = 0;
    // Single selections
    if (selections.outboundFlight) total += selections.outboundFlight.price;
    if (selections.returnFlight) total += selections.returnFlight.price;
    if (selections.hotel) total += selections.hotel.totalPrice;
    // Multi selections
    total += selections.flights.reduce((sum, f) => sum + f.price, 0);
    total += selections.hotels.reduce((sum, h) => sum + h.totalPrice, 0);
    return total;
  }, [selections]);

  const getRemainingBudget = useCallback(() => {
    if (!search) return 0;
    return search.budget - getTotalCost();
  }, [search, getTotalCost]);

  const calculateRemaining = useCallback(() => {
    return getRemainingBudget();
  }, [getRemainingBudget]);

  const resetSelections = useCallback(() => {
    setSelections(initialSelections);
  }, []);

  const clearAll = useCallback(() => {
    setSearchState(null);
    setSelections(initialSelections);
    sessionStorage.removeItem(STORAGE_KEY_SEARCH);
    sessionStorage.removeItem(STORAGE_KEY_SELECTIONS);
  }, []);

  const hasSearch = useCallback(() => {
    return search !== null;
  }, [search]);

  const hasSelections = useCallback(() => {
    return !!(
      selections.outboundFlight ||
      selections.returnFlight ||
      selections.hotel ||
      selections.flights.length > 0 ||
      selections.hotels.length > 0
    );
  }, [selections]);

  return (
    <TravelContext.Provider
      value={{
        search,
        setSearch,
        selections,
        selectOutboundFlight,
        selectReturnFlight,
        selectHotel,
        addFlight,
        removeFlight,
        addHotel,
        removeHotel,
        getTotalCost,
        getRemainingBudget,
        calculateRemaining,
        resetSelections,
        clearAll,
        hasSearch,
        hasSelections,
      }}
    >
      {children}
    </TravelContext.Provider>
  );
}

export function useTravel() {
  const context = useContext(TravelContext);
  if (context === undefined) {
    throw new Error('useTravel must be used within a TravelProvider');
  }
  return context;
}

// Alias for backward compatibility
export const useTripContext = useTravel;

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TravelSearch, SelectedItems, Flight, Hotel } from '@/types/travel';

interface TravelContextType {
  search: TravelSearch | null;
  setSearch: (search: TravelSearch) => void;
  selections: SelectedItems;
  selectOutboundFlight: (flight: Flight | null) => void;
  selectReturnFlight: (flight: Flight | null) => void;
  selectHotel: (hotel: Hotel | null) => void;
  getTotalCost: () => number;
  getRemainingBudget: () => number;
  resetSelections: () => void;
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

const initialSelections: SelectedItems = {
  outboundFlight: null,
  returnFlight: null,
  hotel: null,
};

export function TravelProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState<TravelSearch | null>(null);
  const [selections, setSelections] = useState<SelectedItems>(initialSelections);

  const selectOutboundFlight = (flight: Flight | null) => {
    setSelections(prev => ({ ...prev, outboundFlight: flight }));
  };

  const selectReturnFlight = (flight: Flight | null) => {
    setSelections(prev => ({ ...prev, returnFlight: flight }));
  };

  const selectHotel = (hotel: Hotel | null) => {
    setSelections(prev => ({ ...prev, hotel: hotel }));
  };

  const getTotalCost = () => {
    let total = 0;
    if (selections.outboundFlight) total += selections.outboundFlight.price;
    if (selections.returnFlight) total += selections.returnFlight.price;
    if (selections.hotel) total += selections.hotel.totalPrice;
    return total;
  };

  const getRemainingBudget = () => {
    if (!search) return 0;
    return search.budget - getTotalCost();
  };

  const resetSelections = () => {
    setSelections(initialSelections);
  };

  return (
    <TravelContext.Provider
      value={{
        search,
        setSearch,
        selections,
        selectOutboundFlight,
        selectReturnFlight,
        selectHotel,
        getTotalCost,
        getRemainingBudget,
        resetSelections,
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

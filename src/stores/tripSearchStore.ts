import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TravelRegion = 'europe' | 'asia' | 'americas' | 'africa' | 'oceania' | 'anywhere';
export type TravelStyle = 'adventure' | 'relaxation' | 'culture' | 'food' | 'mix';

export interface TripSearchState {
  budget: number;
  days: number;
  departureCity: string;
  dates: {
    start: Date | null;
    end: Date | null;
    flexible: boolean;
  };
  regions: TravelRegion[];
  travelStyle: TravelStyle;
  travelers: number;
}

interface TripSearchActions {
  setBudget: (budget: number) => void;
  setDays: (days: number) => void;
  setDepartureCity: (city: string) => void;
  setDates: (start: Date | null, end: Date | null) => void;
  setFlexibleDates: (flexible: boolean) => void;
  toggleRegion: (region: TravelRegion) => void;
  setRegions: (regions: TravelRegion[]) => void;
  setTravelStyle: (style: TravelStyle) => void;
  setTravelers: (count: number) => void;
  reset: () => void;
  isValid: () => boolean;
}

const initialState: TripSearchState = {
  budget: 2000,
  days: 5,
  departureCity: '',
  dates: {
    start: null,
    end: null,
    flexible: false,
  },
  regions: [],
  travelStyle: 'mix',
  travelers: 1,
};

export const useTripSearchStore = create<TripSearchState & TripSearchActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setBudget: (budget) => set({ budget: Math.max(500, Math.min(10000, budget)) }),
      
      setDays: (days) => set({ days: Math.max(3, Math.min(14, days)) }),
      
      setDepartureCity: (city) => set({ departureCity: city }),
      
      setDates: (start, end) => set((state) => ({
        dates: { ...state.dates, start, end }
      })),
      
      setFlexibleDates: (flexible) => set((state) => ({
        dates: { ...state.dates, flexible }
      })),
      
      toggleRegion: (region) => set((state) => {
        if (region === 'anywhere') {
          return { regions: state.regions.includes('anywhere') ? [] : ['anywhere'] };
        }
        
        const newRegions = state.regions.filter(r => r !== 'anywhere');
        if (newRegions.includes(region)) {
          return { regions: newRegions.filter(r => r !== region) };
        }
        return { regions: [...newRegions, region] };
      }),
      
      setRegions: (regions) => set({ regions }),
      
      setTravelStyle: (style) => set({ travelStyle: style }),
      
      setTravelers: (count) => set({ travelers: Math.max(1, Math.min(10, count)) }),
      
      reset: () => set(initialState),
      
      isValid: () => {
        const state = get();
        return (
          state.budget >= 500 &&
          state.days >= 3 &&
          state.departureCity.trim().length > 0
        );
      },
    }),
    {
      name: 'roamio-trip-search',
      partialize: (state) => ({
        budget: state.budget,
        days: state.days,
        departureCity: state.departureCity,
        dates: {
          start: state.dates.start?.toISOString() ?? null,
          end: state.dates.end?.toISOString() ?? null,
          flexible: state.dates.flexible,
        },
        regions: state.regions,
        travelStyle: state.travelStyle,
        travelers: state.travelers,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.dates) {
          state.dates.start = state.dates.start ? new Date(state.dates.start as unknown as string) : null;
          state.dates.end = state.dates.end ? new Date(state.dates.end as unknown as string) : null;
        }
      },
    }
  )
);

// Helper to get budget per day
export const getBudgetPerDay = (budget: number, days: number) => {
  return Math.round(budget / days);
};

// Example destinations for budget preview
export const getExampleDestinations = (budget: number, days: number): string[] => {
  const perDay = getBudgetPerDay(budget, days);
  
  if (perDay >= 500) {
    return ['Tokyo', 'Paris', 'Dubai'];
  } else if (perDay >= 350) {
    return ['Barcelona', 'Rome', 'Sydney'];
  } else if (perDay >= 250) {
    return ['Lisbon', 'Prague', 'Buenos Aires'];
  } else if (perDay >= 150) {
    return ['Cancún', 'Bangkok', 'Bali'];
  } else {
    return ['Marrakech', 'Ho Chi Minh', 'Cartagena'];
  }
};

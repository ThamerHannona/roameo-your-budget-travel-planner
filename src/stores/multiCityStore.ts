import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CityLeg {
  id: string;
  city: string;
  nights: number;
}

export type PlannerMode = 'specific' | 'multi';

interface MultiCityState {
  mode: PlannerMode | null;
  origin: string;
  legs: CityLeg[];
  startDate: string | null; // ISO
  travelers: number;
  setPlan: (data: Partial<MultiCityState>) => void;
  reset: () => void;
}

const initial = {
  mode: null,
  origin: '',
  legs: [] as CityLeg[],
  startDate: null,
  travelers: 1,
};

export const useMultiCityStore = create<MultiCityState>()(
  persist(
    (set) => ({
      ...initial,
      setPlan: (data) => set((s) => ({ ...s, ...data })),
      reset: () => set(initial),
    }),
    { name: 'roamio-multi-city' }
  )
);

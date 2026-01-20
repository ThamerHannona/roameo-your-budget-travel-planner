import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DestinationMatch } from '@/types/destination';
import type { BudgetBreakdown } from '@/types/trip';
import { DEFAULT_BUDGET_PERCENTAGES } from '@/types/trip';

interface SelectedDestinationState {
  destination: DestinationMatch | null;
  budgetBreakdown: BudgetBreakdown;
}

interface SelectedDestinationActions {
  setDestination: (destination: DestinationMatch) => void;
  setBudgetBreakdown: (breakdown: BudgetBreakdown) => void;
  resetBudgetBreakdown: () => void;
  clear: () => void;
  getDollarAmount: (category: keyof BudgetBreakdown, totalBudget: number) => number;
}

const initialState: SelectedDestinationState = {
  destination: null,
  budgetBreakdown: { ...DEFAULT_BUDGET_PERCENTAGES },
};

export const useSelectedDestinationStore = create<SelectedDestinationState & SelectedDestinationActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setDestination: (destination) => set({ destination }),

      setBudgetBreakdown: (breakdown) => set({ budgetBreakdown: breakdown }),

      resetBudgetBreakdown: () => set({ budgetBreakdown: { ...DEFAULT_BUDGET_PERCENTAGES } }),

      clear: () => set({ ...initialState }),

      getDollarAmount: (category, totalBudget) => {
        const { budgetBreakdown } = get();
        return Math.round((totalBudget * budgetBreakdown[category]) / 100);
      },
    }),
    {
      name: 'roamio-selected-destination',
      partialize: (state) => ({
        destination: state.destination,
        budgetBreakdown: state.budgetBreakdown,
      }),
    }
  )
);

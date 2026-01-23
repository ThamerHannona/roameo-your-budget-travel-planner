import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BudgetConstraints,
  CategoryKey,
  BudgetChange,
  BudgetImpact,
  FlightOption,
  HotelTier,
  DestinationBudget,
} from '@/types/budgetConstraints';
import { marrakechBudgetData, budgetPresets } from '@/data/mockBudgetData';

interface BudgetConstraintsState {
  destinationBudget: DestinationBudget;
  recentChanges: BudgetChange[];
  isLocked: boolean;
}

interface BudgetConstraintsActions {
  setDestinationBudget: (budget: DestinationBudget) => void;
  updateCategory: (category: CategoryKey, value: number) => void;
  getPercentage: (category: CategoryKey) => number;
  getTotalAllocated: () => number;
  getSelectedFlight: () => FlightOption | null;
  getSelectedHotel: () => HotelTier | null;
  applyPreset: (presetKey: keyof typeof budgetPresets) => void;
  resetToDefaults: () => void;
  lockBudget: () => void;
  unlockBudget: () => void;
  clearChanges: () => void;
}

// Helper to snap to nearest option
function snapToNearestOption(value: number, prices: number[]): number {
  return prices.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );
}

// Calculate impact of budget change
function calculateImpact(
  category: CategoryKey,
  delta: number,
  constraints: BudgetConstraints
): BudgetImpact {
  const absDelta = Math.abs(delta);
  const unlocks: string[] = [];
  const trades: string[] = [];

  if (delta < 0) {
    // User is saving money
    if (category === 'hotels') {
      const extraActivities = Math.floor(absDelta / 60);
      unlocks.push(`+${extraActivities} additional activities`);
      unlocks.push('OR upgrade 2 meals to fine dining');
      unlocks.push('OR add private airport transfer');
    } else if (category === 'flights') {
      unlocks.push(`$${absDelta} more for experiences`);
      trades.push('Longer travel time');
    }
  } else {
    // User is spending more
    if (category === 'hotels') {
      const hotelTier = constraints.hotels.tiers.find(
        (t) => t.totalPrice === constraints.hotels.current + delta
      );
      if (hotelTier) {
        unlocks.push(`Upgrade to ${hotelTier.tier} ${hotelTier.name}`);
        unlocks.push(`Includes: ${hotelTier.amenities.join(', ')}`);
      }
    } else if (category === 'activities') {
      const extraActivities = Math.floor(delta / 60);
      unlocks.push(`+${extraActivities} premium activities`);
    }
  }

  const message =
    delta < 0
      ? `Saving $${absDelta} on ${category}`
      : `Adding $${absDelta} to ${category}`;

  return { message, unlocks, trades };
}

// Redistribute budget across flexible categories
function redistributeBudget(
  delta: number,
  excludeCategory: CategoryKey,
  constraints: BudgetConstraints
): BudgetConstraints {
  const flexibleCategories = (['activities', 'food', 'transport'] as const).filter(
    (cat) => cat !== excludeCategory
  );

  if (flexibleCategories.length === 0 || delta === 0) return constraints;

  const newConstraints = { ...constraints };
  let remainingDelta = -delta; // Negative because saving on one = more on others

  // Distribute proportionally
  const totalFlexible = flexibleCategories.reduce(
    (sum, cat) => sum + constraints[cat].current,
    0
  );

  flexibleCategories.forEach((cat, index) => {
    const proportion = constraints[cat].current / totalFlexible;
    let adjustment = Math.round(remainingDelta * proportion);

    // For last category, use remaining to avoid rounding errors
    if (index === flexibleCategories.length - 1) {
      const alreadyAdjusted = flexibleCategories
        .slice(0, -1)
        .reduce((sum, c) => sum + (newConstraints[c].current - constraints[c].current), 0);
      adjustment = remainingDelta - alreadyAdjusted;
    }

    const newValue = Math.max(
      constraints[cat].min,
      Math.min(constraints[cat].max, constraints[cat].current + adjustment)
    );

    // Type-safe assignment
    if (cat === 'activities') {
      newConstraints.activities = { ...constraints.activities, current: newValue };
    } else if (cat === 'food') {
      newConstraints.food = { ...constraints.food, current: newValue };
    } else if (cat === 'transport') {
      newConstraints.transport = { ...constraints.transport, current: newValue };
    }
  });

  return newConstraints;
}

const initialState: BudgetConstraintsState = {
  destinationBudget: marrakechBudgetData,
  recentChanges: [],
  isLocked: false,
};

export const useBudgetConstraintsStore = create<
  BudgetConstraintsState & BudgetConstraintsActions
>()(
  persist(
    (set, get) => ({
      ...initialState,

      setDestinationBudget: (budget) => set({ destinationBudget: budget }),

      updateCategory: (category, value) => {
        const { destinationBudget, recentChanges } = get();
        const constraints = destinationBudget.constraints;
        const currentValue = constraints[category].current;

        // Clamp to min/max
        let clampedValue = Math.max(
          constraints[category].min,
          Math.min(constraints[category].max, value)
        );

        // Snap to nearest option for non-flexible categories
        if (!constraints[category].flexible) {
          if (category === 'flights') {
            const prices = constraints.flights.options.map((o) => o.price);
            clampedValue = snapToNearestOption(clampedValue, prices);
          } else if (category === 'hotels') {
            const prices = constraints.hotels.tiers.map((t) => t.totalPrice);
            clampedValue = snapToNearestOption(clampedValue, prices);
          }
        }

        const delta = clampedValue - currentValue;
        if (delta === 0) return;

        // Calculate impact
        const impact = calculateImpact(category, delta, constraints);

        // Create change record
        const change: BudgetChange = {
          category,
          oldValue: currentValue,
          newValue: clampedValue,
          delta,
          impact,
        };

        // Update the category
        let newConstraints = {
          ...constraints,
          [category]: {
            ...constraints[category],
            current: clampedValue,
          },
        };

        // Redistribute budget for non-flexible categories
        if (!constraints[category].flexible || category === 'flights' || category === 'hotels') {
          newConstraints = redistributeBudget(delta, category, newConstraints);
        }

        set({
          destinationBudget: {
            ...destinationBudget,
            constraints: newConstraints,
          },
          recentChanges: [change, ...recentChanges.slice(0, 4)],
        });
      },

      getPercentage: (category) => {
        const { destinationBudget } = get();
        const total = get().getTotalAllocated();
        const value = destinationBudget.constraints[category].current;
        return Math.round((value / total) * 100);
      },

      getTotalAllocated: () => {
        const { destinationBudget } = get();
        const { constraints } = destinationBudget;
        return (
          constraints.flights.current +
          constraints.hotels.current +
          constraints.activities.current +
          constraints.food.current +
          constraints.transport.current
        );
      },

      getSelectedFlight: () => {
        const { destinationBudget } = get();
        const { flights } = destinationBudget.constraints;
        return flights.options.find((o) => o.price === flights.current) || null;
      },

      getSelectedHotel: () => {
        const { destinationBudget } = get();
        const { hotels } = destinationBudget.constraints;
        return hotels.tiers.find((t) => t.totalPrice === hotels.current) || null;
      },

      applyPreset: (presetKey) => {
        const { destinationBudget } = get();
        const preset = budgetPresets[presetKey];
        const constraints = { ...destinationBudget.constraints };

        const getValueForLevel = (
          category: CategoryKey,
          level: 'min' | 'mid' | 'max'
        ): number => {
          const cat = constraints[category];
          if (level === 'min') return cat.min;
          if (level === 'max') return cat.max;
          return Math.round((cat.min + cat.max) / 2);
        };

        // Apply preset adjustments - type-safe approach
        const categoryKeys: CategoryKey[] = ['flights', 'hotels', 'activities', 'food', 'transport'];
        
        categoryKeys.forEach((category) => {
          const level = preset.adjustments[category] as 'min' | 'mid' | 'max';
          let value = getValueForLevel(category, level);

          // Snap to nearest for non-flexible
          if (category === 'flights') {
            const prices = constraints.flights.options.map((o) => o.price);
            value = snapToNearestOption(value, prices);
            constraints.flights = { ...constraints.flights, current: value };
          } else if (category === 'hotels') {
            const prices = constraints.hotels.tiers.map((t) => t.totalPrice);
            value = snapToNearestOption(value, prices);
            constraints.hotels = { ...constraints.hotels, current: value };
          } else if (category === 'activities') {
            constraints.activities = { ...constraints.activities, current: value };
          } else if (category === 'food') {
            constraints.food = { ...constraints.food, current: value };
          } else if (category === 'transport') {
            constraints.transport = { ...constraints.transport, current: value };
          }
        });

        // Balance to match total budget
        const total =
          constraints.flights.current +
          constraints.hotels.current +
          constraints.activities.current +
          constraints.food.current +
          constraints.transport.current;

        const diff = destinationBudget.totalBudget - total;
        if (diff !== 0) {
          // Add/subtract from activities (most flexible)
          constraints.activities = {
            ...constraints.activities,
            current: Math.max(
              constraints.activities.min,
              Math.min(constraints.activities.max, constraints.activities.current + diff)
            ),
          };
        }

        set({
          destinationBudget: {
            ...destinationBudget,
            constraints,
          },
          recentChanges: [],
        });
      },

      resetToDefaults: () => {
        set({
          destinationBudget: marrakechBudgetData,
          recentChanges: [],
        });
      },

      lockBudget: () => set({ isLocked: true }),
      unlockBudget: () => set({ isLocked: false }),
      clearChanges: () => set({ recentChanges: [] }),
    }),
    {
      name: 'roameo-budget-constraints',
      partialize: (state) => ({
        destinationBudget: state.destinationBudget,
        isLocked: state.isLocked,
      }),
    }
  )
);

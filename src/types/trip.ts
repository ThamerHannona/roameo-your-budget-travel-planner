// Extended trip types for the smart planner

export type TripStyle = 'budget' | 'balanced' | 'comfort';

export interface TripInterest {
  id: string;
  label: string;
  icon: string;
}

export const TRIP_INTERESTS: TripInterest[] = [
  { id: 'adventure', label: 'Adventure', icon: '🏔️' },
  { id: 'food', label: 'Food', icon: '🍜' },
  { id: 'culture', label: 'Culture', icon: '🏛️' },
  { id: 'relaxation', label: 'Relaxation', icon: '🧘' },
  { id: 'nightlife', label: 'Nightlife', icon: '🎉' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'photography', label: 'Photography', icon: '📸' },
  { id: 'history', label: 'History', icon: '📜' },
];

export interface BudgetBreakdown {
  flights: number;
  accommodation: number;
  activities: number;
  food: number;
  transportation: number;
  buffer: number;
}

export const DEFAULT_BUDGET_PERCENTAGES: BudgetBreakdown = {
  flights: 30,
  accommodation: 28,
  activities: 20,
  food: 14,
  transportation: 6,
  buffer: 2,
};

export interface TripBasics {
  origin: string;
  destination: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  travelers: number;
  flexibleDates: boolean;
}

export interface TripPreferences {
  totalBudget: number;
  tripStyle: TripStyle;
  interests: string[];
  budgetBreakdown: BudgetBreakdown;
}

export interface WizardState {
  basics: TripBasics;
  preferences: TripPreferences;
  currentStep: number;
}

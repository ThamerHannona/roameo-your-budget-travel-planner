// Budget Constraints Types for Real-Time Allocation

export interface FlightOption {
  airline: string;
  flightNumber: string;
  price: number;
  duration: string;
  stops: number;
  layover?: string;
  direct?: boolean;
}

export interface HotelTier {
  tier: '3★' | '4★' | '5★';
  name: string;
  pricePerNight: number;
  totalPrice: number;
  description: string;
  amenities: string[];
}

export interface ActivityTier {
  cost: number;
  count: number;
  examples: string[];
}

export interface FoodPerDay {
  budget: number;
  mid: number;
  premium: number;
}

export interface TransportOptions {
  budget: number;
  mid: number;
  premium: number;
}

export interface CategoryConstraint {
  min: number;
  max: number;
  current: number;
  flexible: boolean;
}

export interface FlightConstraint extends CategoryConstraint {
  flexible: false;
  options: FlightOption[];
}

export interface HotelConstraint extends CategoryConstraint {
  flexible: false;
  tiers: HotelTier[];
}

export interface ActivityConstraint extends CategoryConstraint {
  flexible: true;
  tiers: {
    essentials: ActivityTier;
    balanced: ActivityTier;
    premium: ActivityTier;
  };
}

export interface FoodConstraint extends CategoryConstraint {
  flexible: true;
  perDay: FoodPerDay;
}

export interface TransportConstraint extends CategoryConstraint {
  flexible: true;
  options: TransportOptions;
}

export interface BudgetConstraints {
  flights: FlightConstraint;
  hotels: HotelConstraint;
  activities: ActivityConstraint;
  food: FoodConstraint;
  transport: TransportConstraint;
}

export interface BudgetChange {
  category: keyof BudgetConstraints;
  oldValue: number;
  newValue: number;
  delta: number;
  impact: BudgetImpact;
}

export interface BudgetImpact {
  message: string;
  unlocks: string[];
  trades: string[];
}

export interface DestinationBudget {
  destination: string;
  totalBudget: number;
  travelers: number;
  days: number;
  constraints: BudgetConstraints;
}

export type CategoryKey = keyof BudgetConstraints;

export const CATEGORY_COLORS: Record<CategoryKey, string> = {
  flights: 'hsl(217, 91%, 60%)',      // Blue
  hotels: 'hsl(262, 83%, 58%)',        // Purple
  activities: 'hsl(158, 64%, 52%)',    // Green
  food: 'hsl(38, 92%, 50%)',           // Orange
  transport: 'hsl(215, 14%, 34%)',     // Gray
};

export const CATEGORY_ICONS: Record<CategoryKey, string> = {
  flights: '✈️',
  hotels: '🏨',
  activities: '🎯',
  food: '🍽️',
  transport: '🚗',
};

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  flights: 'Flights',
  hotels: 'Hotels',
  activities: 'Activities',
  food: 'Food & Dining',
  transport: 'Transport',
};

import { DestinationMatch } from './destination';

export interface UnlockStrategy {
  id: string;
  type: 'book-earlier' | 'increase-budget' | 'reduce-days' | 'off-season' | 'longer-flights';
  title: string;
  description: string;
  savings: number;
  newPrice: number;
  isUnlocked: boolean;
}

export interface GhostTrip extends DestinationMatch {
  unlockStrategies: UnlockStrategy[];
  amountOver: number;
  specialFeatures: string[];
}

export interface UnlockCalculatorState {
  budgetIncrease: number;
  reduceDays: number;
  selectedMonth: number | null;
  acceptLongerFlights: boolean;
}

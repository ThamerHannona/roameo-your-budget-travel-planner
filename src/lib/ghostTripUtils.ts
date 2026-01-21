import { DestinationMatch } from '@/types/destination';
import { GhostTrip, UnlockStrategy } from '@/types/ghostTrip';

// Special features by destination type
const destinationFeatures: Record<string, string[]> = {
  default: ['Unique cultural experiences', 'Stunning landscapes', 'World-class cuisine'],
  iceland: ['Northern Lights viewing', 'Volcanic landscapes', 'Hot springs & geysers'],
  greece: ['Ancient ruins', 'Mediterranean beaches', 'Island hopping'],
  maldives: ['Overwater bungalows', 'Crystal-clear waters', 'World-class diving'],
  japan: ['Cherry blossoms', 'Ancient temples', 'Cutting-edge technology'],
  newzealand: ['Lord of the Rings filming locations', 'Adventure sports', 'Māori culture'],
  switzerland: ['Alpine scenery', 'Luxury skiing', 'Chocolate & cheese tours'],
  norway: ['Fjord cruises', 'Midnight sun', 'Viking history'],
  australia: ['Great Barrier Reef', 'Unique wildlife', 'Outback adventures'],
};

export function generateUnlockStrategies(
  destination: DestinationMatch,
  userBudget: number,
  currentDays: number
): UnlockStrategy[] {
  const amountOver = destination.estimatedTotalCost - userBudget;
  const strategies: UnlockStrategy[] = [];

  // Strategy 1: Book earlier (flight savings)
  const earlierSavings = Math.round(destination.flightCost * 0.25);
  if (earlierSavings >= amountOver * 0.5) {
    strategies.push({
      id: 'book-earlier',
      type: 'book-earlier',
      title: 'Book 60 days earlier',
      description: `Save $${earlierSavings} on flights by booking in advance`,
      savings: earlierSavings,
      newPrice: destination.estimatedTotalCost - earlierSavings,
      isUnlocked: earlierSavings >= amountOver,
    });
  }

  // Strategy 2: Add budget
  strategies.push({
    id: 'increase-budget',
    type: 'increase-budget',
    title: `Add $${amountOver} to budget`,
    description: 'Increase your budget to unlock this destination',
    savings: 0,
    newPrice: destination.estimatedTotalCost,
    isUnlocked: true,
  });

  // Strategy 3: Reduce days
  if (currentDays > 3) {
    const daysToReduce = Math.min(2, Math.ceil(amountOver / destination.dailyCost));
    const daySavings = daysToReduce * destination.dailyCost;
    const newDays = currentDays - daysToReduce;
    
    if (newDays >= 3) {
      strategies.push({
        id: 'reduce-days',
        type: 'reduce-days',
        title: `Reduce trip to ${newDays} days`,
        description: `Save $${daySavings} by shortening your trip`,
        savings: daySavings,
        newPrice: destination.estimatedTotalCost - daySavings,
        isUnlocked: daySavings >= amountOver,
      });
    }
  }

  // Strategy 4: Off-season
  const offSeasonDiscount = Math.round(destination.estimatedTotalCost * 0.18);
  strategies.push({
    id: 'off-season',
    type: 'off-season',
    title: 'Wait for off-season',
    description: `Travel in shoulder season to save ~18%`,
    savings: offSeasonDiscount,
    newPrice: destination.estimatedTotalCost - offSeasonDiscount,
    isUnlocked: offSeasonDiscount >= amountOver,
  });

  // Strategy 5: Longer flights (cheaper connections)
  const flightSavings = Math.round(destination.flightCost * 0.15);
  strategies.push({
    id: 'longer-flights',
    type: 'longer-flights',
    title: 'Accept longer flights',
    description: `Save $${flightSavings} with 1-2 connections`,
    savings: flightSavings,
    newPrice: destination.estimatedTotalCost - flightSavings,
    isUnlocked: flightSavings >= amountOver,
  });

  return strategies.slice(0, 4);
}

export function getSpecialFeatures(destinationId: string): string[] {
  const id = destinationId.toLowerCase();
  
  for (const [key, features] of Object.entries(destinationFeatures)) {
    if (id.includes(key)) {
      return features;
    }
  }
  
  return destinationFeatures.default;
}

export function convertToGhostTrip(
  destination: DestinationMatch,
  userBudget: number,
  tripDays: number
): GhostTrip {
  return {
    ...destination,
    amountOver: destination.estimatedTotalCost - userBudget,
    unlockStrategies: generateUnlockStrategies(destination, userBudget, tripDays),
    specialFeatures: getSpecialFeatures(destination.id),
  };
}

export function calculateUnlockedPrice(
  basePrice: number,
  budgetIncrease: number,
  reduceDays: number,
  dailyCost: number,
  acceptLongerFlights: boolean,
  flightCost: number,
  useOffSeason: boolean
): number {
  let newPrice = basePrice;
  
  // Reduce days savings
  newPrice -= reduceDays * dailyCost;
  
  // Longer flights savings (15%)
  if (acceptLongerFlights) {
    newPrice -= flightCost * 0.15;
  }
  
  // Off-season savings (18%)
  if (useOffSeason) {
    newPrice -= basePrice * 0.18;
  }
  
  return Math.round(newPrice);
}

import { addDays, isWeekend, getDay, format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import type { DatePrice, PriceTrend, SavingsHighlight, QuickSelectOption, DateRange } from '@/types/dateFlexibility';

// Holiday dates for 2025-2026 (approximate)
const HOLIDAYS: Record<string, string> = {
  '2025-03-29': 'Easter Weekend',
  '2025-03-30': 'Easter Weekend',
  '2025-04-01': 'Easter Monday',
  '2025-04-18': 'Spring Break',
  '2025-04-19': 'Spring Break',
  '2025-04-20': 'Spring Break',
  '2025-05-26': 'Memorial Day',
  '2025-07-04': 'Independence Day',
  '2025-12-24': 'Christmas Eve',
  '2025-12-25': 'Christmas',
  '2025-12-31': 'New Year\'s Eve',
  '2026-01-01': 'New Year\'s Day',
};

// Generate mock price for a specific date
const generateDayPrice = (
  date: Date,
  baseFlightPrice: number,
  baseHotelPrice: number,
  destinationMultiplier: number = 1
): DatePrice => {
  const dateKey = format(date, 'yyyy-MM-dd');
  const dayOfWeek = getDay(date);
  const isWeekendDay = isWeekend(date);
  const holidayName = HOLIDAYS[dateKey];
  const isHolidayDay = !!holidayName;

  // Price fluctuation factors
  let flightMultiplier = 1;
  let hotelMultiplier = 1;

  // Weekend surcharge (10-20%)
  if (isWeekendDay) {
    flightMultiplier *= 1.15;
    hotelMultiplier *= 1.18;
  }

  // Holiday spike (30-60%)
  if (isHolidayDay) {
    flightMultiplier *= 1.45;
    hotelMultiplier *= 1.35;
  }

  // Random daily variation (±8%)
  const randomVariation = 0.92 + Math.random() * 0.16;
  flightMultiplier *= randomVariation;
  hotelMultiplier *= (0.95 + Math.random() * 0.1);

  // Seasonal pattern - simulate shoulder season being cheaper
  const month = date.getMonth();
  if (month === 2 || month === 10) { // March, November
    flightMultiplier *= 0.88;
    hotelMultiplier *= 0.85;
  } else if (month === 6 || month === 7) { // July, August
    flightMultiplier *= 1.25;
    hotelMultiplier *= 1.2;
  }

  // Day of week patterns (Tuesday/Wednesday typically cheapest)
  if (dayOfWeek === 2 || dayOfWeek === 3) {
    flightMultiplier *= 0.92;
  }

  // Apply destination multiplier
  flightMultiplier *= destinationMultiplier;
  hotelMultiplier *= destinationMultiplier;

  const flightPrice = Math.round(baseFlightPrice * flightMultiplier);
  const hotelPrice = Math.round(baseHotelPrice * hotelMultiplier);

  // Some dates unavailable (10% chance)
  const isAvailable = Math.random() > 0.1 || isHolidayDay;

  return {
    date,
    totalPrice: flightPrice + hotelPrice,
    flightPrice,
    hotelPrice,
    isAvailable,
    isWeekend: isWeekendDay,
    isHoliday: isHolidayDay,
    holidayName,
  };
};

// Generate prices for a date range (60 days from start)
export const generatePriceData = (
  startDate: Date,
  baseFlightPrice: number = 450,
  baseHotelPrice: number = 800,
  destinationMultiplier: number = 1
): DatePrice[] => {
  const prices: DatePrice[] = [];
  
  for (let i = 0; i < 90; i++) {
    const date = addDays(startDate, i);
    prices.push(generateDayPrice(date, baseFlightPrice, baseHotelPrice, destinationMultiplier));
  }
  
  return prices;
};

// Get prices for a specific month
export const getMonthPrices = (
  month: Date,
  allPrices: DatePrice[]
): DatePrice[] => {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  
  return allPrices.filter(p => p.date >= start && p.date <= end);
};

// Calculate price for a date range (e.g., 5-day trip)
export const calculateRangePrice = (
  prices: DatePrice[],
  startDate: Date,
  numDays: number
): number => {
  let total = 0;
  const startTime = startDate.getTime();
  
  for (let i = 0; i < numDays; i++) {
    const targetDate = addDays(startDate, i);
    const price = prices.find(p => 
      format(p.date, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd')
    );
    if (price?.isAvailable) {
      // First day includes flight, all days include hotel portion
      if (i === 0) {
        total += price.flightPrice;
      }
      total += Math.round(price.hotelPrice / numDays);
    }
  }
  
  return total;
};

// Generate price trends for chart (simplified - one price per day)
export const generatePriceTrends = (
  prices: DatePrice[],
  tripDuration: number
): PriceTrend[] => {
  return prices.slice(0, 60).map(p => ({
    date: p.date,
    price: p.totalPrice,
  }));
};

// Find savings highlights
export const findSavingsHighlights = (
  prices: DatePrice[],
  currentPrice: number,
  tripDuration: number,
  destinationName: string
): SavingsHighlight[] => {
  const highlights: SavingsHighlight[] = [];
  
  // Find cheapest available period
  const availablePrices = prices.filter(p => p.isAvailable);
  if (availablePrices.length > 0) {
    const cheapest = availablePrices.reduce((a, b) => a.totalPrice < b.totalPrice ? a : b);
    const savings = currentPrice - cheapest.totalPrice;
    
    if (savings > 50) {
      highlights.push({
        type: 'best-deal',
        icon: '💰',
        title: `Best Deal: ${format(cheapest.date, 'MMM d')} - ${format(addDays(cheapest.date, tripDuration - 1), 'MMM d')}`,
        description: `$${cheapest.totalPrice.toLocaleString()} (save $${savings})`,
        dateRange: { start: cheapest.date, end: addDays(cheapest.date, tripDuration - 1) },
        price: cheapest.totalPrice,
        savings,
      });
    }
  }

  // Find most expensive (avoid) period
  const holidays = prices.filter(p => p.isHoliday && p.isAvailable);
  if (holidays.length > 0) {
    const mostExpensive = holidays.reduce((a, b) => a.totalPrice > b.totalPrice ? a : b);
    highlights.push({
      type: 'avoid',
      icon: '⚠️',
      title: `Avoid: ${mostExpensive.holidayName}`,
      description: `$${mostExpensive.totalPrice.toLocaleString()} (+$${(mostExpensive.totalPrice - currentPrice).toLocaleString()})`,
      dateRange: { start: mostExpensive.date, end: addDays(mostExpensive.date, tripDuration - 1) },
      price: mostExpensive.totalPrice,
    });
  }

  // Calculate average
  const avgPrice = Math.round(
    availablePrices.reduce((sum, p) => sum + p.totalPrice, 0) / availablePrices.length
  );
  const currentMonth = format(new Date(), 'MMMM');
  highlights.push({
    type: 'average',
    icon: '📊',
    title: `Average for ${currentMonth}`,
    description: `$${avgPrice.toLocaleString()}`,
  });

  // Shoulder season tip
  const shoulderPrices = prices.filter(p => {
    const month = p.date.getMonth();
    return (month === 2 || month === 3 || month === 9 || month === 10) && p.isAvailable;
  });
  
  if (shoulderPrices.length > 0) {
    const shoulderAvg = Math.round(
      shoulderPrices.reduce((sum, p) => sum + p.totalPrice, 0) / shoulderPrices.length
    );
    const savingsPercent = Math.round((1 - shoulderAvg / avgPrice) * 100);
    
    if (savingsPercent > 5) {
      highlights.push({
        type: 'tip',
        icon: '✨',
        title: 'Shoulder Season Tip',
        description: `Late March & October are ${savingsPercent}% cheaper on average`,
      });
    }
  }

  return highlights;
};

// Generate quick select options
export const generateQuickSelectOptions = (
  prices: DatePrice[],
  tripDuration: number
): QuickSelectOption[] => {
  const availablePrices = prices.filter(p => p.isAvailable);
  
  // Cheapest week
  const cheapest = availablePrices.reduce((a, b) => a.totalPrice < b.totalPrice ? a : b);
  
  // Best weather (simulate - prefer April/May or September/October)
  const bestWeatherPrices = availablePrices.filter(p => {
    const month = p.date.getMonth();
    return month === 3 || month === 4 || month === 8 || month === 9;
  });
  const bestWeather = bestWeatherPrices.length > 0 
    ? bestWeatherPrices.reduce((a, b) => a.totalPrice < b.totalPrice ? a : b)
    : cheapest;

  // Avoid crowds (prefer weekdays, non-holidays)
  const quietPrices = availablePrices.filter(p => !p.isWeekend && !p.isHoliday);
  const quietest = quietPrices.length > 0 
    ? quietPrices.reduce((a, b) => a.totalPrice < b.totalPrice ? a : b)
    : cheapest;

  return [
    {
      id: 'cheapest',
      label: 'Cheapest Week',
      icon: '💰',
      dateRange: { start: cheapest.date, end: addDays(cheapest.date, tripDuration - 1) },
      price: cheapest.totalPrice,
    },
    {
      id: 'best-weather',
      label: 'Best Weather',
      icon: '☀️',
      dateRange: { start: bestWeather.date, end: addDays(bestWeather.date, tripDuration - 1) },
      price: bestWeather.totalPrice,
    },
    {
      id: 'avoid-crowds',
      label: 'Avoid Crowds',
      icon: '🧘',
      dateRange: { start: quietest.date, end: addDays(quietest.date, tripDuration - 1) },
      price: quietest.totalPrice,
    },
  ];
};

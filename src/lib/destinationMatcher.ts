import { Destination, DestinationMatch } from '@/types/destination';
import { destinations } from '@/data/destinations';
import { getFlagEmoji } from '@/data/countryFlags';
import { FlightSearchResult, getCheapestPrice } from '@/services/serpapi';
import { getAirportCode } from '@/utils/airports';

interface MatchCriteria {
  budget: number;           // Total trip budget
  startDate: Date;
  endDate: Date;
  travelers: number;
  tripStyle: 'budget' | 'mid' | 'luxury';
  interests?: string[];
}

interface MatchCriteriaWithFlights extends MatchCriteria {
  flightData?: Map<string, FlightSearchResult>;
}

// Calculate number of nights
const getNights = (start: Date, end: Date): number => {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Get month from date (1-12)
const getMonth = (date: Date): number => date.getMonth() + 1;

// Calculate weather score for given dates
const calculateWeatherScore = (destination: Destination, startDate: Date, endDate: Date): number => {
  const startMonth = getMonth(startDate);
  const endMonth = getMonth(endDate);
  
  let totalScore = 0;
  let months = 0;
  
  for (let month = startMonth; month <= endMonth; month++) {
    const weather = destination.weather[month];
    if (!weather) continue;
    
    let score = 0;
    
    // Temperature score (ideal: 70-85°F)
    if (weather.temp >= 70 && weather.temp <= 85) {
      score += 40;
    } else if (weather.temp >= 60 && weather.temp <= 90) {
      score += 25;
    } else {
      score += 10;
    }
    
    // Rainfall score (lower is better)
    if (weather.rainfall < 2) score += 30;
    else if (weather.rainfall < 5) score += 20;
    else if (weather.rainfall < 8) score += 10;
    
    // Condition score
    if (weather.condition === 'sunny') score += 30;
    else if (weather.condition === 'partly-cloudy') score += 20;
    else score += 5;
    
    totalScore += score;
    months++;
  }
  
  return months > 0 ? Math.round(totalScore / months) : 50;
};

// Calculate crowd score (higher = less crowded = better)
const calculateCrowdScore = (destination: Destination, startDate: Date, endDate: Date): number => {
  const startMonth = getMonth(startDate);
  const endMonth = getMonth(endDate);
  
  let totalCrowd = 0;
  let months = 0;
  
  for (let month = startMonth; month <= endMonth; month++) {
    const weather = destination.weather[month];
    if (!weather) continue;
    
    totalCrowd += weather.crowdLevel;
    months++;
  }
  
  const avgCrowd = months > 0 ? totalCrowd / months : 3;
  
  // Invert: 1 crowd = 100 score, 5 crowd = 20 score
  return Math.round(100 - (avgCrowd - 1) * 20);
};

// Generate a "why this works" insight
const generateInsight = (
  destination: Destination, 
  budgetRatio: number, 
  weatherScore: number, 
  crowdScore: number,
  hasRealFlightData: boolean
): string => {
  const insights: string[] = [];
  
  if (hasRealFlightData) {
    insights.push('Live flight prices');
  }
  
  if (budgetRatio <= 0.6) {
    insights.push('excellent value');
  } else if (budgetRatio <= 0.75) {
    insights.push('great savings potential');
  }
  
  if (weatherScore >= 80) {
    insights.push('perfect weather');
  } else if (weatherScore >= 60) {
    insights.push('pleasant weather');
  }
  
  if (crowdScore >= 80) {
    insights.push('fewer crowds');
  }
  
  if (destination.bestFor.length > 0 && insights.length < 3) {
    insights.push(`ideal for ${destination.bestFor[0].toLowerCase()}`);
  }
  
  return insights.slice(0, 3).join(' • ') || `Discover ${destination.name}'s unique charm`;
};

// Calculate confidence score based on data quality and match
const calculateConfidenceScore = (
  weatherScore: number,
  crowdScore: number,
  budgetRatio: number,
  destination: Destination,
  hasRealFlightData: boolean
): number => {
  // Base score from weather and crowd predictions
  let score = (weatherScore * 0.3) + (crowdScore * 0.2);
  
  // Add points for well-known destinations with reliable data
  const popularDestinations = ['lisbon', 'barcelona', 'tokyo', 'paris', 'rome', 'cancun', 'marrakech'];
  if (popularDestinations.includes(destination.id)) {
    score += 10;
  }
  
  // Real flight data significantly boosts confidence
  if (hasRealFlightData) {
    score += 15;
  }
  
  // Budget match contributes to confidence
  if (budgetRatio <= 0.8) score += 20;
  else if (budgetRatio <= 0.95) score += 10;
  
  // Highlights and tags add confidence
  score += Math.min(destination.highlights.length * 2, 10);
  score += Math.min(destination.tags.length * 2, 10);
  
  return Math.min(98, Math.max(70, Math.round(score)));
};

// Map destination name to airport code
const getDestinationAirportCode = (destination: Destination): string | null => {
  return getAirportCode(destination.name);
};

// Main matching function with optional real flight data
export const matchDestinations = (criteria: MatchCriteriaWithFlights): DestinationMatch[] => {
  const nights = getNights(criteria.startDate, criteria.endDate);
  const { flightData } = criteria;
  
  return destinations
    .map(destination => {
      // Try to get real flight price
      const destCode = getDestinationAirportCode(destination);
      const realFlightResult = destCode && flightData ? flightData.get(destCode) : null;
      const hasRealFlightData = realFlightResult && !realFlightResult.useMock && realFlightResult.options.length > 0;
      
      // Use real flight price if available, otherwise fallback to static cost
      let flightCost: number;
      if (hasRealFlightData && realFlightResult) {
        // Use mid-tier flight (recommended) for calculations
        const midFlight = realFlightResult.options.find(o => o.tier === 'mid');
        flightCost = midFlight?.price || getCheapestPrice(realFlightResult);
      } else {
        flightCost = destination.costs.flight;
      }
      
      // Calculate other costs
      const dailyCost = destination.costs[criteria.tripStyle];
      const accommodationCost = dailyCost * nights * 0.5; // ~50% on accommodation
      const activitiesCost = dailyCost * nights * 0.3;    // ~30% on activities
      const foodCost = dailyCost * nights * 0.2;          // ~20% on food
      
      // Total cost per person then multiply by travelers
      const perPersonCost = flightCost + (dailyCost * nights);
      const estimatedTotalCost = perPersonCost * criteria.travelers;
      
      // Calculate scores
      const weatherScore = calculateWeatherScore(destination, criteria.startDate, criteria.endDate);
      const crowdScore = calculateCrowdScore(destination, criteria.startDate, criteria.endDate);
      
      // Interest matching bonus
      let interestBonus = 0;
      if (criteria.interests && criteria.interests.length > 0) {
        const matchingTags = destination.tags.filter(tag => 
          criteria.interests!.some(interest => 
            interest.toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(interest.toLowerCase())
          )
        );
        interestBonus = Math.min(matchingTags.length * 10, 20);
      }
      
      // Affordability calculation
      const budgetRatio = estimatedTotalCost / criteria.budget;
      let affordability: DestinationMatch['affordability'];
      if (budgetRatio <= 0.6) affordability = 'budget-friendly';
      else if (budgetRatio <= 0.85) affordability = 'good-value';
      else if (budgetRatio <= 1.0) affordability = 'splurge';
      else affordability = 'over-budget';
      
      // Value score calculation
      const costEfficiency = affordability !== 'over-budget' 
        ? Math.max(0, 100 - (budgetRatio * 80)) 
        : 0;
      
      const valueScore = Math.round(
        (costEfficiency * 0.4) + 
        (weatherScore * 0.3) + 
        (crowdScore * 0.2) + 
        interestBonus
      );
      
      // Budget delta (positive = under budget)
      const budgetDelta = criteria.budget - estimatedTotalCost;
      
      // Confidence score
      const confidenceScore = calculateConfidenceScore(
        weatherScore, 
        crowdScore, 
        budgetRatio, 
        destination,
        !!hasRealFlightData
      );
      
      // Generate insight
      const whyThisWorks = generateInsight(
        destination, 
        budgetRatio, 
        weatherScore, 
        crowdScore,
        !!hasRealFlightData
      );
      
      return {
        ...destination,
        valueScore: Math.min(100, Math.max(0, valueScore)),
        estimatedTotalCost,
        dailyCost,
        flightCost,
        accommodationCost: Math.round(accommodationCost * criteria.travelers),
        activitiesCost: Math.round(activitiesCost * criteria.travelers),
        foodCost: Math.round(foodCost * criteria.travelers),
        weatherScore,
        crowdScore,
        confidenceScore,
        affordability,
        budgetDelta: Math.round(budgetDelta),
        whyThisWorks,
        flagEmoji: getFlagEmoji(destination.country),
        pros: destination.pros,
        cons: destination.cons,
      };
    })
    .filter(d => d.affordability !== 'over-budget')
    .sort((a, b) => b.valueScore - a.valueScore);
};

// Get ghost trips (slightly over budget)
export const getGhostTrips = (criteria: MatchCriteriaWithFlights): DestinationMatch[] => {
  const nights = getNights(criteria.startDate, criteria.endDate);
  const { flightData } = criteria;
  
  return destinations
    .map(destination => {
      // Try to get real flight price
      const destCode = getDestinationAirportCode(destination);
      const realFlightResult = destCode && flightData ? flightData.get(destCode) : null;
      const hasRealFlightData = realFlightResult && !realFlightResult.useMock && realFlightResult.options.length > 0;
      
      let flightCost: number;
      if (hasRealFlightData && realFlightResult) {
        const midFlight = realFlightResult.options.find(o => o.tier === 'mid');
        flightCost = midFlight?.price || getCheapestPrice(realFlightResult);
      } else {
        flightCost = destination.costs.flight;
      }
      
      const dailyCost = destination.costs[criteria.tripStyle];
      const accommodationCost = dailyCost * nights * 0.5;
      const activitiesCost = dailyCost * nights * 0.3;
      const foodCost = dailyCost * nights * 0.2;
      const estimatedTotalCost = (flightCost + (dailyCost * nights)) * criteria.travelers;
      
      const weatherScore = calculateWeatherScore(destination, criteria.startDate, criteria.endDate);
      const crowdScore = calculateCrowdScore(destination, criteria.startDate, criteria.endDate);
      const budgetRatio = estimatedTotalCost / criteria.budget;
      const budgetDelta = criteria.budget - estimatedTotalCost;
      const confidenceScore = calculateConfidenceScore(
        weatherScore, 
        crowdScore, 
        budgetRatio, 
        destination,
        !!hasRealFlightData
      );
      const whyThisWorks = generateInsight(destination, budgetRatio, weatherScore, crowdScore, !!hasRealFlightData);
      
      const valueScore = Math.round(
        (Math.max(0, 100 - (budgetRatio * 80)) * 0.4) + 
        (weatherScore * 0.3) + 
        (crowdScore * 0.2)
      );
      
      return {
        ...destination,
        valueScore: Math.min(100, Math.max(0, valueScore)),
        estimatedTotalCost,
        dailyCost,
        flightCost,
        accommodationCost: Math.round(accommodationCost * criteria.travelers),
        activitiesCost: Math.round(activitiesCost * criteria.travelers),
        foodCost: Math.round(foodCost * criteria.travelers),
        weatherScore,
        crowdScore,
        confidenceScore,
        affordability: 'over-budget' as const,
        budgetDelta: Math.round(budgetDelta),
        whyThisWorks,
        flagEmoji: getFlagEmoji(destination.country),
        pros: destination.pros,
        cons: destination.cons,
      };
    })
    .filter(d => {
      const ratio = d.estimatedTotalCost / criteria.budget;
      return ratio > 1.0 && ratio <= 1.25; // 0-25% over budget
    })
    .sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost)
    .slice(0, 3);
};

// Get top recommendations with different criteria
export const getRecommendations = (criteria: MatchCriteriaWithFlights) => {
  const matches = matchDestinations(criteria);
  
  return {
    bestValue: matches.slice(0, 3),
    bestWeather: [...matches].sort((a, b) => b.weatherScore - a.weatherScore).slice(0, 3),
    leastCrowded: [...matches].sort((a, b) => b.crowdScore - a.crowdScore).slice(0, 3),
    cheapest: [...matches].sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost).slice(0, 3),
  };
};

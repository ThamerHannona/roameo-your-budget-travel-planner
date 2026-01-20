import { Destination, DestinationMatch } from '@/types/destination';
import { destinations } from '@/data/destinations';

interface MatchCriteria {
  budget: number;           // Total trip budget
  startDate: Date;
  endDate: Date;
  travelers: number;
  tripStyle: 'budget' | 'mid' | 'luxury';
  interests?: string[];
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

// Main matching function
export const matchDestinations = (criteria: MatchCriteria): DestinationMatch[] => {
  const nights = getNights(criteria.startDate, criteria.endDate);
  const perPersonBudget = criteria.budget / criteria.travelers;
  
  return destinations
    .map(destination => {
      // Calculate costs
      const dailyCost = destination.costs[criteria.tripStyle];
      const flightCost = destination.costs.flight;
      const accommodationCost = dailyCost * nights;
      const estimatedTotalCost = (flightCost + accommodationCost) * criteria.travelers;
      
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
      // Higher score = better value (considering cost, weather, crowds)
      const costEfficiency = affordability !== 'over-budget' 
        ? Math.max(0, 100 - (budgetRatio * 80)) 
        : 0;
      
      const valueScore = Math.round(
        (costEfficiency * 0.4) + 
        (weatherScore * 0.3) + 
        (crowdScore * 0.2) + 
        interestBonus
      );
      
      return {
        ...destination,
        valueScore: Math.min(100, Math.max(0, valueScore)),
        estimatedTotalCost,
        dailyCost,
        flightCost,
        weatherScore,
        crowdScore,
        affordability,
      };
    })
    .filter(d => d.affordability !== 'over-budget')
    .sort((a, b) => b.valueScore - a.valueScore);
};

// Get top recommendations with different criteria
export const getRecommendations = (criteria: MatchCriteria) => {
  const matches = matchDestinations(criteria);
  
  return {
    bestValue: matches.slice(0, 3),
    bestWeather: [...matches].sort((a, b) => b.weatherScore - a.weatherScore).slice(0, 3),
    leastCrowded: [...matches].sort((a, b) => b.crowdScore - a.crowdScore).slice(0, 3),
    cheapest: [...matches].sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost).slice(0, 3),
  };
};

import type { DestinationBudget, BudgetConstraints } from '@/types/budgetConstraints';

export const marrakechBudgetData: DestinationBudget = {
  destination: 'Marrakech, Morocco',
  totalBudget: 5400,
  travelers: 2,
  days: 7,
  constraints: {
    flights: {
      min: 1040,  // $520 per person x 2
      max: 1360,  // $680 per person x 2
      current: 1100,
      flexible: false,
      options: [
        {
          airline: 'TAP',
          flightNumber: 'TP123',
          price: 1040,
          duration: '16h',
          stops: 1,
          layover: 'Lisbon 3h',
        },
        {
          airline: 'United',
          flightNumber: 'UA1347',
          price: 1100,
          duration: '14h 30min',
          stops: 1,
          layover: 'Newark 2h',
        },
        {
          airline: 'Delta',
          flightNumber: 'DL456',
          price: 1360,
          duration: '12h',
          stops: 0,
          direct: true,
        },
      ],
    },
    hotels: {
      min: 400,
      max: 1200,
      current: 648,
      flexible: false,
      tiers: [
        {
          tier: '3★',
          name: 'Traditional Riad',
          pricePerNight: 57,
          totalPrice: 400,
          description: 'Authentic Moroccan guesthouse in Medina',
          amenities: ['Breakfast', 'WiFi', 'Courtyard'],
        },
        {
          tier: '4★',
          name: 'Boutique Riad',
          pricePerNight: 92,
          totalPrice: 648,
          description: 'Stylish riad with rooftop terrace',
          amenities: ['Breakfast', 'WiFi', 'Pool', 'Spa'],
        },
        {
          tier: '5★',
          name: 'Luxury Resort',
          pricePerNight: 171,
          totalPrice: 1200,
          description: '5-star hotel with world-class amenities',
          amenities: ['All meals', 'WiFi', 'Pool', 'Spa', 'Concierge'],
        },
      ],
    },
    activities: {
      min: 300,
      max: 1500,
      current: 972,
      flexible: true,
      tiers: {
        essentials: {
          cost: 300,
          count: 6,
          examples: ['Jardin Majorelle', 'Bahia Palace', 'Souks Tour'],
        },
        balanced: {
          cost: 972,
          count: 12,
          examples: ['Above + Cooking class', 'Desert tour', 'Hammam'],
        },
        premium: {
          cost: 1500,
          count: 18,
          examples: ['All + Hot air balloon', 'Private guide', 'Luxury spa'],
        },
      },
    },
    food: {
      min: 400,
      max: 800,
      current: 594,
      flexible: true,
      perDay: {
        budget: 57,
        mid: 85,
        premium: 114,
      },
    },
    transport: {
      min: 150,
      max: 400,
      current: 286,
      flexible: true,
      options: {
        budget: 150,
        mid: 286,
        premium: 400,
      },
    },
  },
};

// Generate budget data based on destination
export function generateBudgetConstraints(
  destination: string,
  totalBudget: number,
  travelers: number,
  days: number
): DestinationBudget {
  // For now, return scaled Marrakech data
  // In production, this would come from API
  const scale = totalBudget / 5400;
  const base = marrakechBudgetData;

  const scaleConstraint = <T extends { min: number; max: number; current: number }>(
    constraint: T
  ): T => ({
    ...constraint,
    min: Math.round(constraint.min * scale),
    max: Math.round(constraint.max * scale),
    current: Math.round(constraint.current * scale),
  });

  return {
    destination,
    totalBudget,
    travelers,
    days,
    constraints: {
      flights: {
        ...scaleConstraint(base.constraints.flights),
        options: base.constraints.flights.options.map((opt) => ({
          ...opt,
          price: Math.round(opt.price * scale),
        })),
      },
      hotels: {
        ...scaleConstraint(base.constraints.hotels),
        tiers: base.constraints.hotels.tiers.map((tier) => ({
          ...tier,
          pricePerNight: Math.round(tier.pricePerNight * scale),
          totalPrice: Math.round(tier.totalPrice * scale),
        })),
      },
      activities: {
        ...scaleConstraint(base.constraints.activities),
        tiers: {
          essentials: { ...base.constraints.activities.tiers.essentials, cost: Math.round(300 * scale) },
          balanced: { ...base.constraints.activities.tiers.balanced, cost: Math.round(972 * scale) },
          premium: { ...base.constraints.activities.tiers.premium, cost: Math.round(1500 * scale) },
        },
      },
      food: {
        ...scaleConstraint(base.constraints.food),
        perDay: {
          budget: Math.round(base.constraints.food.perDay.budget * scale),
          mid: Math.round(base.constraints.food.perDay.mid * scale),
          premium: Math.round(base.constraints.food.perDay.premium * scale),
        },
      },
      transport: {
        ...scaleConstraint(base.constraints.transport),
        options: {
          budget: Math.round(base.constraints.transport.options.budget * scale),
          mid: Math.round(base.constraints.transport.options.mid * scale),
          premium: Math.round(base.constraints.transport.options.premium * scale),
        },
      },
    },
  };
}

export const budgetPresets = {
  budgetTraveler: {
    name: 'Budget Traveler',
    icon: '🎒',
    description: 'Maximize experiences on a budget',
    adjustments: {
      flights: 'min',
      hotels: 'min',
      activities: 'max',
      food: 'min',
      transport: 'min',
    },
  },
  balanced: {
    name: 'Balanced',
    icon: '⚖️',
    description: 'Best mix of comfort and value',
    adjustments: {
      flights: 'mid',
      hotels: 'mid',
      activities: 'mid',
      food: 'mid',
      transport: 'mid',
    },
  },
  luxury: {
    name: 'Luxury',
    icon: '✨',
    description: 'Premium everything',
    adjustments: {
      flights: 'max',
      hotels: 'max',
      activities: 'max',
      food: 'max',
      transport: 'max',
    },
  },
  foodie: {
    name: 'Foodie',
    icon: '🍽️',
    description: 'Focus on culinary experiences',
    adjustments: {
      flights: 'min',
      hotels: 'min',
      activities: 'mid',
      food: 'max',
      transport: 'mid',
    },
  },
  adventurer: {
    name: 'Adventurer',
    icon: '🏔️',
    description: 'Maximum activities and experiences',
    adjustments: {
      flights: 'min',
      hotels: 'min',
      activities: 'max',
      food: 'mid',
      transport: 'mid',
    },
  },
} as const;

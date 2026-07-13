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

// Generate destination-agnostic placeholder budget data.
// Live SerpAPI flight/hotel results overwrite `options`/`tiers` via
// setFlightOptions / setHotelOptions in the store. Until those arrive, we
// still need reasonable placeholders — but they must NOT be labeled with
// destination-specific text (no "Traditional Riad", no "TAP via Lisbon")
// that would mislead users for cities like Dubrovnik.
export function generateBudgetConstraints(
  destination: string,
  totalBudget: number,
  travelers: number,
  days: number,
  // Number of hotel nights. Defaults to (days - 1) so a 7-day trip = 6 nights.
  // Callers with real dates should pass the exact nights count.
  nights?: number
): DestinationBudget {
  const hotelNights = Math.max(1, nights ?? Math.max(1, days - 1));

  // Rough budget splits (percent of total budget) used only as placeholders
  // before live data arrives.
  const flightBudget = Math.round(totalBudget * 0.35);
  const hotelBudget = Math.round(totalBudget * 0.30);
  const activitiesBudget = Math.round(totalBudget * 0.15);
  const foodBudget = Math.round(totalBudget * 0.15);
  const transportBudget = Math.round(totalBudget * 0.05);

  // Flight placeholder tiers around the flight budget
  const flightMid = flightBudget;
  const flightMin = Math.round(flightMid * 0.85);
  const flightMax = Math.round(flightMid * 1.25);

  // Hotel placeholder tiers — pricePerNight * nights
  const hotelMidPerNight = Math.round(hotelBudget / hotelNights);
  const hotelMinPerNight = Math.round(hotelMidPerNight * 0.6);
  const hotelMaxPerNight = Math.round(hotelMidPerNight * 1.8);

  return {
    destination,
    totalBudget,
    travelers,
    days,
    constraints: {
      flights: {
        min: flightMin,
        max: flightMax,
        current: flightMid,
        flexible: false,
        options: [
          {
            airline: 'Estimated (budget)',
            flightNumber: '—',
            price: flightMin,
            duration: 'Varies',
            stops: 1,
          },
          {
            airline: 'Estimated (standard)',
            flightNumber: '—',
            price: flightMid,
            duration: 'Varies',
            stops: 1,
          },
          {
            airline: 'Estimated (premium)',
            flightNumber: '—',
            price: flightMax,
            duration: 'Varies',
            stops: 0,
            direct: true,
          },
        ],
      },
      hotels: {
        min: hotelMinPerNight * hotelNights,
        max: hotelMaxPerNight * hotelNights,
        current: hotelMidPerNight * hotelNights,
        flexible: false,
        tiers: [
          {
            tier: '3★',
            name: 'Budget hotel (estimated)',
            pricePerNight: hotelMinPerNight,
            totalPrice: hotelMinPerNight * hotelNights,
            description: `${hotelNights} nights • budget stay`,
            amenities: ['WiFi', 'Breakfast'],
          },
          {
            tier: '4★',
            name: 'Comfort hotel (estimated)',
            pricePerNight: hotelMidPerNight,
            totalPrice: hotelMidPerNight * hotelNights,
            description: `${hotelNights} nights • comfort stay`,
            amenities: ['WiFi', 'Breakfast', 'Pool'],
          },
          {
            tier: '5★',
            name: 'Luxury hotel (estimated)',
            pricePerNight: hotelMaxPerNight,
            totalPrice: hotelMaxPerNight * hotelNights,
            description: `${hotelNights} nights • premium stay`,
            amenities: ['WiFi', 'Breakfast', 'Pool', 'Spa', 'Concierge'],
          },
        ],
      },
      activities: {
        min: Math.round(activitiesBudget * 0.5),
        max: Math.round(activitiesBudget * 1.8),
        current: activitiesBudget,
        flexible: true,
        tiers: {
          essentials: { cost: Math.round(activitiesBudget * 0.5), count: Math.max(3, days), examples: ['Top sights', 'Walking tour'] },
          balanced: { cost: activitiesBudget, count: Math.max(5, days * 2), examples: ['Top sights + guided tour + local experience'] },
          premium: { cost: Math.round(activitiesBudget * 1.8), count: Math.max(8, days * 3), examples: ['Everything + private guide + premium experiences'] },
        },
      },
      food: {
        min: Math.round(foodBudget * 0.6),
        max: Math.round(foodBudget * 1.8),
        current: foodBudget,
        flexible: true,
        perDay: {
          budget: Math.round((foodBudget * 0.6) / Math.max(1, days)),
          mid: Math.round(foodBudget / Math.max(1, days)),
          premium: Math.round((foodBudget * 1.8) / Math.max(1, days)),
        },
      },
      transport: {
        min: Math.round(transportBudget * 0.5),
        max: Math.round(transportBudget * 2),
        current: transportBudget,
        flexible: true,
        options: {
          budget: Math.round(transportBudget * 0.5),
          mid: transportBudget,
          premium: Math.round(transportBudget * 2),
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

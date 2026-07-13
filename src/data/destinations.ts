import { Destination } from '@/types/destination';

// Helper to generate weather data.
// Uses a proper annual sinusoid peaking in July (Northern Hemisphere) so
// August/summer values reflect real climate (e.g. Dubrovnik in Aug ~ 85°F,
// not 54°F). Southern-hemisphere destinations aren't in the current set.
const generateWeather = (
  pattern: 'tropical' | 'mediterranean' | 'continental' | 'monsoon' | 'desert' | 'temperate',
  peakMonths: number[]
): Destination['weather'] => {
  const weather: Destination['weather'] = {};

  // Annual cycle: peak in July (month 7), trough in January.
  // yearPhase(month) in [-1, 1], = 1 in July, = -1 in January.
  const yearPhase = (month: number) => Math.sin(((month - 4) * Math.PI) / 6);

  // Climate profile: (base F, amplitude F) so base+amp = summer high.
  const profile: Record<typeof pattern, { base: number; amp: number }> = {
    tropical:      { base: 82, amp: 4 },   // 78–86 year round
    mediterranean: { base: 68, amp: 18 },  // 50 in Jan, 86 in Jul
    continental:   { base: 55, amp: 30 },  // 25 in Jan, 85 in Jul
    monsoon:       { base: 82, amp: 8 },   // 74–90
    desert:        { base: 75, amp: 25 },  // 50 in Jan, 100 in Jul
    temperate:     { base: 58, amp: 20 },  // 38 in Jan, 78 in Jul
  };

  for (let month = 1; month <= 12; month++) {
    const isPeak = peakMonths.includes(month);
    const { base, amp } = profile[pattern];
    const temp = Math.round(base + amp * yearPhase(month));
    const summerMonth = month >= 6 && month <= 9;
    const winterMonth = month === 12 || month <= 2;

    let condition: 'sunny' | 'partly-cloudy' | 'rainy' | 'cold' | 'hot';
    let rainfall = 2;
    switch (pattern) {
      case 'tropical':
        rainfall = summerMonth ? 8 : 2;
        condition = summerMonth ? 'rainy' : 'sunny';
        break;
      case 'mediterranean':
        rainfall = winterMonth ? 4 : summerMonth ? 0.5 : 1.5;
        condition = summerMonth ? 'sunny' : winterMonth ? 'rainy' : 'partly-cloudy';
        break;
      case 'continental':
        rainfall = summerMonth ? 3 : 2;
        condition = winterMonth ? 'cold' : summerMonth ? 'sunny' : 'partly-cloudy';
        break;
      case 'monsoon':
        rainfall = month >= 6 && month <= 9 ? 12 : 1;
        condition = month >= 6 && month <= 9 ? 'rainy' : 'sunny';
        break;
      case 'desert':
        rainfall = 0.3;
        condition = summerMonth ? 'hot' : 'sunny';
        break;
      case 'temperate':
        rainfall = 3;
        condition = winterMonth ? 'cold' : summerMonth ? 'partly-cloudy' : 'partly-cloudy';
        break;
    }

    weather[month] = {
      temp,
      rainfall,
      condition,
      crowdLevel: (isPeak ? 5 : summerMonth ? 4 : 2) as 1 | 2 | 3 | 4 | 5,
    };
  }

  return weather;
};


export const destinations: Destination[] = [
  // EUROPE
  {
    id: 'lisbon',
    name: 'Lisbon',
    country: 'Portugal',
    region: 'Europe',
    imageUrl: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800',
    costs: { budget: 45, mid: 95, luxury: 220, flight: 450 },
    weather: generateWeather('mediterranean', [4, 5, 9, 10]),
    highlights: ['Historic trams', 'Pastéis de Belém', 'Alfama district', 'Atlantic beaches'],
    tags: ['culture', 'food', 'nightlife', 'history'],
    bestFor: ['Solo travelers', 'Digital nomads', 'Foodies'],
    coordinates: { lat: 38.7223, lng: -9.1393 },
    pros: [
      'Exceptional food scene with affordable fine dining',
      'Easy to navigate with historic trams and walkable neighborhoods',
      'One of Europe\'s most affordable capital cities'
    ],
    cons: [
      'Hilly terrain can be challenging for those with mobility issues',
      'Popular tourist destination means crowds at major attractions'
    ],
    hotelOptions: [
      { tier: '3-star', name: 'My Story Hotel Rossio', pricePerNight: 89, rating: 4.2, amenities: ['WiFi', 'Breakfast', 'Central'], neighborhood: 'Baixa' },
      { tier: '4-star', name: 'Hotel Lisboa Plaza', pricePerNight: 145, rating: 4.5, amenities: ['WiFi', 'Spa', 'Restaurant', 'Bar'], neighborhood: 'Avenida da Liberdade' },
      { tier: '5-star', name: 'Four Seasons Hotel Ritz Lisbon', pricePerNight: 420, rating: 4.9, amenities: ['Pool', 'Spa', 'Michelin Restaurant', 'Butler'], neighborhood: 'Marquês de Pombal' }
    ],
    detailedCosts: { flightCost: 450, hotelPerNight: 95, activitiesPerDay: 35, foodPerDay: 45, transportPerDay: 12 }
  },
  {
    id: 'prague',
    name: 'Prague',
    country: 'Czech Republic',
    region: 'Europe',
    imageUrl: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800',
    costs: { budget: 35, mid: 75, luxury: 180, flight: 520 },
    weather: generateWeather('continental', [4, 5, 9, 10, 12]),
    highlights: ['Charles Bridge', 'Old Town Square', 'Prague Castle', 'Cheap beer'],
    tags: ['history', 'architecture', 'nightlife', 'budget'],
    bestFor: ['Budget travelers', 'History buffs', 'Party seekers'],
    coordinates: { lat: 50.0755, lng: 14.4378 },
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Spain',
    region: 'Europe',
    imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
    costs: { budget: 55, mid: 120, luxury: 280, flight: 480 },
    weather: generateWeather('mediterranean', [5, 6, 9, 10]),
    highlights: ['Sagrada Familia', 'La Rambla', 'Beach & city combo', 'Tapas culture'],
    tags: ['beach', 'architecture', 'food', 'nightlife'],
    bestFor: ['Beach lovers', 'Architecture fans', 'Foodies'],
    coordinates: { lat: 41.3874, lng: 2.1686 },
    pros: [
      'Perfect mix of beach and city - you can do both in one day',
      'Gaudí architecture is unlike anywhere else on Earth',
      'Vibrant nightlife and incredible food scene'
    ],
    cons: [
      'Pickpocketing is common in tourist areas',
      'Can be very crowded in summer months'
    ],
    hotelOptions: [
      { tier: '3-star', name: 'Hotel Jazz', pricePerNight: 105, rating: 4.2, amenities: ['Rooftop Pool', 'WiFi', 'Central'], neighborhood: 'Eixample' },
      { tier: '4-star', name: 'Hotel Arts Barcelona', pricePerNight: 280, rating: 4.6, amenities: ['Beach', 'Pool', 'Spa', 'Michelin Restaurant'], neighborhood: 'Barceloneta' },
      { tier: '5-star', name: 'Mandarin Oriental Barcelona', pricePerNight: 550, rating: 4.9, amenities: ['Rooftop Pool', 'Spa', 'Fine Dining', 'Gaudí Views'], neighborhood: 'Passeig de Gràcia' }
    ],
    detailedCosts: { flightCost: 480, hotelPerNight: 120, activitiesPerDay: 45, foodPerDay: 55, transportPerDay: 12 }
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    region: 'Europe',
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    costs: { budget: 75, mid: 180, luxury: 450, flight: 550 },
    weather: generateWeather('temperate', [4, 5, 6, 9, 10]),
    highlights: ['Eiffel Tower', 'Louvre Museum', 'Café culture', 'Fashion & art'],
    tags: ['romance', 'art', 'food', 'culture'],
    bestFor: ['Couples', 'Art lovers', 'Luxury travelers'],
    coordinates: { lat: 48.8566, lng: 2.3522 },
  },
  {
    id: 'rome',
    name: 'Rome',
    country: 'Italy',
    region: 'Europe',
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
    costs: { budget: 60, mid: 140, luxury: 350, flight: 520 },
    weather: generateWeather('mediterranean', [4, 5, 9, 10, 11]),
    highlights: ['Colosseum', 'Vatican City', 'Authentic pasta', 'Ancient history'],
    tags: ['history', 'food', 'art', 'religion'],
    bestFor: ['History buffs', 'Foodies', 'Culture seekers'],
    coordinates: { lat: 41.9028, lng: 12.4964 },
  },
  {
    id: 'amsterdam',
    name: 'Amsterdam',
    country: 'Netherlands',
    region: 'Europe',
    imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800',
    costs: { budget: 65, mid: 150, luxury: 320, flight: 480 },
    weather: generateWeather('temperate', [4, 5, 6, 9]),
    highlights: ['Canal tours', 'Van Gogh Museum', 'Bike culture', 'Tulip season'],
    tags: ['culture', 'art', 'nightlife', 'cycling'],
    bestFor: ['Art lovers', 'Cyclists', 'Liberal travelers'],
    coordinates: { lat: 52.3676, lng: 4.9041 },
  },
  {
    id: 'budapest',
    name: 'Budapest',
    country: 'Hungary',
    region: 'Europe',
    imageUrl: 'https://images.unsplash.com/photo-1541343672885-9be56236c4f3?w=800',
    costs: { budget: 30, mid: 65, luxury: 160, flight: 540 },
    weather: generateWeather('continental', [4, 5, 9, 10, 12]),
    highlights: ['Thermal baths', 'Ruin bars', 'Parliament building', 'Danube views'],
    tags: ['budget', 'nightlife', 'relaxation', 'history'],
    bestFor: ['Budget travelers', 'Party seekers', 'Spa lovers'],
    coordinates: { lat: 47.4979, lng: 19.0402 },
  },
  {
    id: 'dubrovnik',
    name: 'Dubrovnik',
    country: 'Croatia',
    region: 'Europe',
    imageUrl: 'https://images.unsplash.com/photo-1555990538-1e7d53d16b95?w=800',
    costs: { budget: 55, mid: 130, luxury: 300, flight: 580 },
    weather: generateWeather('mediterranean', [5, 6, 9, 10]),
    highlights: ['Old Town walls', 'Game of Thrones locations', 'Adriatic Sea', 'Island hopping'],
    tags: ['beach', 'history', 'sailing', 'romantic'],
    bestFor: ['Couples', 'History buffs', 'Beach lovers'],
    coordinates: { lat: 42.6507, lng: 18.0944 },
  },
  {
    id: 'reykjavik',
    name: 'Reykjavik',
    country: 'Iceland',
    region: 'Europe',
    imageUrl: 'https://images.unsplash.com/photo-1504284769915-3d5b6cdd1d95?w=800',
    costs: { budget: 90, mid: 200, luxury: 450, flight: 400 },
    weather: generateWeather('continental', [6, 7, 8, 12, 1, 2]),
    highlights: ['Northern Lights', 'Blue Lagoon', 'Golden Circle', 'Midnight sun'],
    tags: ['adventure', 'nature', 'unique', 'photography'],
    bestFor: ['Adventure seekers', 'Photographers', 'Nature lovers'],
    coordinates: { lat: 64.1466, lng: -21.9426 },
    pros: [
      'Once-in-a-lifetime Northern Lights and natural wonders',
      'Clean, safe, and incredibly photogenic landscapes',
      'Unique geothermal experiences like the Blue Lagoon'
    ],
    cons: [
      'One of the most expensive destinations in the world',
      'Weather can be unpredictable and harsh'
    ],
    hotelOptions: [
      { tier: '3-star', name: 'Fosshotel Reykjavik', pricePerNight: 165, rating: 4.1, amenities: ['WiFi', 'Restaurant', 'Bar'], neighborhood: 'City Center' },
      { tier: '4-star', name: 'Canopy by Hilton Reykjavik', pricePerNight: 245, rating: 4.6, amenities: ['WiFi', 'Gym', 'Restaurant', 'Rooftop Bar'], neighborhood: 'Downtown' },
      { tier: '5-star', name: 'The Retreat at Blue Lagoon', pricePerNight: 1200, rating: 4.9, amenities: ['Geothermal Spa', 'Restaurant', 'In-water bar', 'Butler'], neighborhood: 'Blue Lagoon' }
    ],
    detailedCosts: { flightCost: 400, hotelPerNight: 200, activitiesPerDay: 120, foodPerDay: 80, transportPerDay: 45 }
  },
  {
    id: 'athens',
    name: 'Athens',
    country: 'Greece',
    region: 'Europe',
    imageUrl: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800',
    costs: { budget: 50, mid: 110, luxury: 280, flight: 580 },
    weather: generateWeather('mediterranean', [4, 5, 9, 10]),
    highlights: ['Acropolis', 'Ancient Agora', 'Plaka neighborhood', 'Greek cuisine'],
    tags: ['history', 'culture', 'food', 'archaeology'],
    bestFor: ['History buffs', 'Culture seekers', 'Foodies'],
    coordinates: { lat: 37.9838, lng: 23.7275 },
    pros: [
      'Unparalleled ancient history and archaeological sites',
      'Delicious Mediterranean cuisine at great prices',
      'Gateway to Greek islands for easy day trips'
    ],
    cons: [
      'Summer heat can be intense (July-August)',
      'Some areas can feel crowded with tourists'
    ],
    hotelOptions: [
      { tier: '3-star', name: 'Plaka Hotel', pricePerNight: 95, rating: 4.3, amenities: ['WiFi', 'Rooftop Terrace', 'Breakfast'], neighborhood: 'Plaka' },
      { tier: '4-star', name: 'Electra Palace Athens', pricePerNight: 185, rating: 4.6, amenities: ['Pool', 'Spa', 'Rooftop Restaurant', 'Acropolis Views'], neighborhood: 'Plaka' },
      { tier: '5-star', name: 'Hotel Grande Bretagne', pricePerNight: 450, rating: 4.8, amenities: ['Pool', 'Spa', 'Michelin Restaurant', 'Butler'], neighborhood: 'Syntagma Square' }
    ],
    detailedCosts: { flightCost: 580, hotelPerNight: 110, activitiesPerDay: 40, foodPerDay: 50, transportPerDay: 15 }
  },
  {
    id: 'santorini',
    name: 'Santorini',
    country: 'Greece',
    region: 'Europe',
    imageUrl: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
    costs: { budget: 70, mid: 180, luxury: 500, flight: 600 },
    weather: generateWeather('mediterranean', [5, 6, 9, 10]),
    highlights: ['White-washed villages', 'Sunset views', 'Volcanic beaches', 'Wine tasting'],
    tags: ['romantic', 'luxury', 'photography', 'beach'],
    bestFor: ['Couples', 'Honeymooners', 'Photographers'],
    coordinates: { lat: 36.3932, lng: 25.4615 },
    pros: [
      'Arguably the most romantic destination in the world',
      'Stunning caldera views and sunsets',
      'Unique volcanic beaches and wineries'
    ],
    cons: [
      'Very expensive during peak season',
      'Overcrowded in July-August'
    ],
    hotelOptions: [
      { tier: '3-star', name: 'Villa Renos', pricePerNight: 120, rating: 4.4, amenities: ['WiFi', 'Pool', 'Breakfast'], neighborhood: 'Fira' },
      { tier: '4-star', name: 'Katikies Chromata', pricePerNight: 280, rating: 4.7, amenities: ['Infinity Pool', 'Spa', 'Restaurant'], neighborhood: 'Imerovigli' },
      { tier: '5-star', name: 'Canaves Oia Epitome', pricePerNight: 850, rating: 4.9, amenities: ['Private Pool', 'Spa', 'Butler', 'Helicopter Pad'], neighborhood: 'Oia' }
    ],
    detailedCosts: { flightCost: 600, hotelPerNight: 180, activitiesPerDay: 60, foodPerDay: 70, transportPerDay: 25 }
  },

  // ASIA
  {
    id: 'bangkok',
    name: 'Bangkok',
    country: 'Thailand',
    region: 'Asia',
    imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
    costs: { budget: 25, mid: 55, luxury: 150, flight: 650 },
    weather: generateWeather('tropical', [11, 12, 1, 2, 3]),
    highlights: ['Street food', 'Grand Palace', 'Floating markets', 'Nightlife'],
    tags: ['budget', 'food', 'temples', 'nightlife'],
    bestFor: ['Budget travelers', 'Foodies', 'Backpackers'],
    coordinates: { lat: 13.7563, lng: 100.5018 },
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    region: 'Asia',
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    costs: { budget: 65, mid: 140, luxury: 350, flight: 850 },
    weather: generateWeather('temperate', [3, 4, 10, 11]),
    highlights: ['Cherry blossoms', 'Tech culture', 'Ramen & sushi', 'Ancient meets modern'],
    tags: ['culture', 'food', 'technology', 'unique'],
    bestFor: ['Culture seekers', 'Tech enthusiasts', 'Foodies'],
    coordinates: { lat: 35.6762, lng: 139.6503 },
    pros: [
      'World\'s best food scene from street ramen to Michelin stars',
      'Perfect blend of ultra-modern and traditional culture',
      'Incredibly safe and efficient public transportation'
    ],
    cons: [
      'Language barrier can be challenging',
      'Peak seasons (cherry blossom, fall foliage) get very crowded'
    ],
    hotelOptions: [
      { tier: '3-star', name: 'Hotel Gracery Shinjuku', pricePerNight: 120, rating: 4.3, amenities: ['WiFi', 'Restaurant', 'Godzilla Statue'], neighborhood: 'Shinjuku' },
      { tier: '4-star', name: 'The Gate Hotel Asakusa', pricePerNight: 195, rating: 4.6, amenities: ['WiFi', 'Rooftop Bar', 'Temple Views'], neighborhood: 'Asakusa' },
      { tier: '5-star', name: 'Park Hyatt Tokyo', pricePerNight: 650, rating: 4.9, amenities: ['Pool', 'Spa', 'New York Bar', 'City Views'], neighborhood: 'Shinjuku' }
    ],
    detailedCosts: { flightCost: 850, hotelPerNight: 140, activitiesPerDay: 50, foodPerDay: 60, transportPerDay: 20 }
  },
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    region: 'Asia',
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    costs: { budget: 30, mid: 70, luxury: 200, flight: 750 },
    weather: generateWeather('tropical', [4, 5, 6, 7, 8, 9]),
    highlights: ['Rice terraces', 'Temple hopping', 'Surf culture', 'Yoga retreats'],
    tags: ['wellness', 'beach', 'culture', 'adventure'],
    bestFor: ['Digital nomads', 'Wellness seekers', 'Surfers'],
    coordinates: { lat: -8.4095, lng: 115.1889 },
  },
  {
    id: 'vietnam',
    name: 'Ho Chi Minh City',
    country: 'Vietnam',
    region: 'Asia',
    imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
    costs: { budget: 20, mid: 45, luxury: 120, flight: 700 },
    weather: generateWeather('tropical', [12, 1, 2, 3, 4]),
    highlights: ['Street food', 'War history', 'Motorbike chaos', 'Coffee culture'],
    tags: ['budget', 'food', 'history', 'adventure'],
    bestFor: ['Budget travelers', 'History buffs', 'Adventurers'],
    coordinates: { lat: 10.8231, lng: 106.6297 },
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    region: 'Asia',
    imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
    costs: { budget: 60, mid: 150, luxury: 400, flight: 900 },
    weather: generateWeather('tropical', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
    highlights: ['Gardens by the Bay', 'Hawker centers', 'Marina Bay Sands', 'Clean & safe'],
    tags: ['modern', 'food', 'family', 'luxury'],
    bestFor: ['Families', 'Foodies', 'Business travelers'],
    coordinates: { lat: 1.3521, lng: 103.8198 },
  },
  {
    id: 'seoul',
    name: 'Seoul',
    country: 'South Korea',
    region: 'Asia',
    imageUrl: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800',
    costs: { budget: 45, mid: 100, luxury: 250, flight: 800 },
    weather: generateWeather('continental', [4, 5, 9, 10]),
    highlights: ['K-pop culture', 'Street food', 'Palaces', 'Nightlife'],
    tags: ['culture', 'food', 'nightlife', 'shopping'],
    bestFor: ['K-pop fans', 'Foodies', 'Young travelers'],
    coordinates: { lat: 37.5665, lng: 126.9780 },
  },

  // NORTH AMERICA
  {
    id: 'mexico-city',
    name: 'Mexico City',
    country: 'Mexico',
    region: 'North America',
    imageUrl: 'https://images.unsplash.com/photo-1518659526054-e52c9e5de51c?w=800',
    costs: { budget: 30, mid: 70, luxury: 180, flight: 300 },
    weather: generateWeather('temperate', [3, 4, 10, 11]),
    highlights: ['Tacos al pastor', 'Ancient pyramids', 'Museums', 'Art scene'],
    tags: ['food', 'culture', 'art', 'history'],
    bestFor: ['Foodies', 'Art lovers', 'History buffs'],
    coordinates: { lat: 19.4326, lng: -99.1332 },
  },
  {
    id: 'new-york',
    name: 'New York City',
    country: 'USA',
    region: 'North America',
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
    costs: { budget: 100, mid: 250, luxury: 600, flight: 150 },
    weather: generateWeather('continental', [4, 5, 9, 10, 12]),
    highlights: ['Broadway', 'Central Park', 'World-class dining', 'Museums'],
    tags: ['culture', 'food', 'art', 'nightlife'],
    bestFor: ['Culture seekers', 'Foodies', 'Theater lovers'],
    coordinates: { lat: 40.7128, lng: -74.0060 },
  },
  {
    id: 'cancun',
    name: 'Cancún',
    country: 'Mexico',
    region: 'North America',
    imageUrl: 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800',
    costs: { budget: 50, mid: 120, luxury: 300, flight: 280 },
    weather: generateWeather('tropical', [12, 1, 2, 3, 4]),
    highlights: ['White sand beaches', 'Mayan ruins', 'All-inclusive resorts', 'Cenotes'],
    tags: ['beach', 'party', 'relaxation', 'history'],
    bestFor: ['Beach lovers', 'Party seekers', 'Families'],
    coordinates: { lat: 21.1619, lng: -86.8515 },
    pros: [
      'World-class all-inclusive resorts with great value',
      'Easy access to Mayan ruins (Chichen Itza, Tulum)',
      'Short flight from US with no passport hassle for some'
    ],
    cons: [
      'Can feel very touristy in hotel zone',
      'Spring break crowds in March-April'
    ],
    hotelOptions: [
      { tier: '3-star', name: 'Hotel NYX Cancun', pricePerNight: 95, rating: 4.2, amenities: ['Pool', 'Beach Access', 'Restaurant'], neighborhood: 'Hotel Zone' },
      { tier: '4-star', name: 'Dreams Sands Cancun', pricePerNight: 220, rating: 4.5, amenities: ['All-Inclusive', 'Spa', 'Multiple Pools', 'Beach'], neighborhood: 'Hotel Zone' },
      { tier: '5-star', name: 'Le Blanc Spa Resort', pricePerNight: 650, rating: 4.9, amenities: ['Adults-Only', 'Spa', 'Butler', 'All-Inclusive'], neighborhood: 'Hotel Zone' }
    ],
    detailedCosts: { flightCost: 280, hotelPerNight: 120, activitiesPerDay: 45, foodPerDay: 50, transportPerDay: 15 }
  },
  {
    id: 'playa-del-carmen',
    name: 'Playa del Carmen',
    country: 'Mexico',
    region: 'North America',
    imageUrl: 'https://images.unsplash.com/photo-1501747315-124a0eaca060?w=800',
    costs: { budget: 40, mid: 95, luxury: 250, flight: 280 },
    weather: generateWeather('tropical', [12, 1, 2, 3, 4]),
    highlights: ['5th Avenue', 'Cenotes', 'Tulum day trips', 'European vibe'],
    tags: ['beach', 'nightlife', 'culture', 'diving'],
    bestFor: ['Couples', 'Digital nomads', 'Beach lovers'],
    coordinates: { lat: 20.6296, lng: -87.0739 },
    pros: [
      'More authentic Mexican feel than Cancún',
      'Walking-friendly downtown with great restaurants',
      'Perfect base for exploring cenotes and Tulum'
    ],
    cons: [
      'Seaweed can be an issue on beaches (varies by season)',
      'Getting crowded due to growing popularity'
    ],
    hotelOptions: [
      { tier: '3-star', name: 'Hotel HM Playa del Carmen', pricePerNight: 75, rating: 4.1, amenities: ['Pool', 'WiFi', 'Restaurant'], neighborhood: 'Centro' },
      { tier: '4-star', name: 'The Reef Playacar', pricePerNight: 165, rating: 4.4, amenities: ['All-Inclusive', 'Beach', 'Pools', 'Spa'], neighborhood: 'Playacar' },
      { tier: '5-star', name: 'Rosewood Mayakoba', pricePerNight: 1100, rating: 4.9, amenities: ['Private Beach', 'Cenote', 'Golf', 'Spa'], neighborhood: 'Mayakoba' }
    ],
    detailedCosts: { flightCost: 280, hotelPerNight: 95, activitiesPerDay: 35, foodPerDay: 40, transportPerDay: 12 }
  },
  {
    id: 'costa-rica',
    name: 'San José',
    country: 'Costa Rica',
    region: 'North America',
    imageUrl: 'https://images.unsplash.com/photo-1518259102261-b40117eabbc9?w=800',
    costs: { budget: 45, mid: 110, luxury: 280, flight: 350 },
    weather: generateWeather('tropical', [12, 1, 2, 3, 4]),
    highlights: ['Cloud forests', 'Volcanoes', 'Wildlife', 'Adventure sports'],
    tags: ['nature', 'adventure', 'wildlife', 'eco-tourism'],
    bestFor: ['Adventure seekers', 'Nature lovers', 'Eco-tourists'],
    coordinates: { lat: 9.9281, lng: -84.0907 },
    pros: [
      'Incredible biodiversity with 5% of world\'s species',
      'Adventure activities: zip-lining, rafting, surfing',
      'Pura Vida lifestyle is genuinely welcoming'
    ],
    cons: [
      'Rainy season (May-November) can limit activities',
      'Driving can be challenging on rural roads'
    ],
    hotelOptions: [
      { tier: '3-star', name: 'Hotel Presidente', pricePerNight: 85, rating: 4.0, amenities: ['WiFi', 'Restaurant', 'Central Location'], neighborhood: 'San José Centro' },
      { tier: '4-star', name: 'Tabacon Thermal Resort', pricePerNight: 280, rating: 4.6, amenities: ['Hot Springs', 'Spa', 'Volcano Views', 'Restaurant'], neighborhood: 'Arenal' },
      { tier: '5-star', name: 'Nayara Tented Camp', pricePerNight: 750, rating: 4.9, amenities: ['Private Hot Springs', 'Butler', 'Wildlife', 'Spa'], neighborhood: 'Arenal' }
    ],
    detailedCosts: { flightCost: 350, hotelPerNight: 110, activitiesPerDay: 55, foodPerDay: 45, transportPerDay: 20 }
  },
  {
    id: 'hawaii',
    name: 'Honolulu',
    country: 'USA',
    region: 'North America',
    imageUrl: 'https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=800',
    costs: { budget: 80, mid: 200, luxury: 500, flight: 450 },
    weather: generateWeather('tropical', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
    highlights: ['Waikiki Beach', 'Pearl Harbor', 'Volcanoes', 'Luaus'],
    tags: ['beach', 'nature', 'relaxation', 'adventure'],
    bestFor: ['Families', 'Honeymooners', 'Nature lovers'],
    coordinates: { lat: 21.3069, lng: -157.8583 },
  },

  // SOUTH AMERICA
  {
    id: 'buenos-aires',
    name: 'Buenos Aires',
    country: 'Argentina',
    region: 'South America',
    imageUrl: 'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=800',
    costs: { budget: 35, mid: 80, luxury: 200, flight: 700 },
    weather: generateWeather('temperate', [3, 4, 9, 10, 11]),
    highlights: ['Tango shows', 'Steak & Malbec', 'European architecture', 'Nightlife'],
    tags: ['culture', 'food', 'nightlife', 'art'],
    bestFor: ['Foodies', 'Dance lovers', 'Culture seekers'],
    coordinates: { lat: -34.6037, lng: -58.3816 },
  },
  {
    id: 'rio',
    name: 'Rio de Janeiro',
    country: 'Brazil',
    region: 'South America',
    imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800',
    costs: { budget: 40, mid: 90, luxury: 250, flight: 650 },
    weather: generateWeather('tropical', [5, 6, 7, 8, 9]),
    highlights: ['Christ the Redeemer', 'Copacabana Beach', 'Carnival', 'Samba'],
    tags: ['beach', 'party', 'culture', 'adventure'],
    bestFor: ['Party seekers', 'Beach lovers', 'Adventure seekers'],
    coordinates: { lat: -22.9068, lng: -43.1729 },
  },
  {
    id: 'cusco',
    name: 'Cusco',
    country: 'Peru',
    region: 'South America',
    imageUrl: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800',
    costs: { budget: 30, mid: 65, luxury: 180, flight: 550 },
    weather: generateWeather('temperate', [5, 6, 7, 8, 9]),
    highlights: ['Machu Picchu', 'Inca history', 'Sacred Valley', 'Altitude adventure'],
    tags: ['history', 'adventure', 'culture', 'trekking'],
    bestFor: ['History buffs', 'Hikers', 'Adventure seekers'],
    coordinates: { lat: -13.5319, lng: -71.9675 },
  },
  {
    id: 'medellin',
    name: 'Medellín',
    country: 'Colombia',
    region: 'South America',
    imageUrl: 'https://images.unsplash.com/photo-1599442917688-0ffa0c0e79d3?w=800',
    costs: { budget: 25, mid: 55, luxury: 140, flight: 380 },
    weather: generateWeather('tropical', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
    highlights: ['Eternal spring weather', 'Nightlife', 'Transformation story', 'Coffee region'],
    tags: ['budget', 'nightlife', 'culture', 'digital-nomad'],
    bestFor: ['Digital nomads', 'Budget travelers', 'Party seekers'],
    coordinates: { lat: 6.2442, lng: -75.5812 },
  },

  // MIDDLE EAST
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'UAE',
    region: 'Middle East',
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
    costs: { budget: 70, mid: 180, luxury: 500, flight: 700 },
    weather: generateWeather('desert', [11, 12, 1, 2, 3, 4]),
    highlights: ['Burj Khalifa', 'Luxury shopping', 'Desert safaris', 'Modern architecture'],
    tags: ['luxury', 'shopping', 'modern', 'adventure'],
    bestFor: ['Luxury travelers', 'Shoppers', 'Architecture fans'],
    coordinates: { lat: 25.2048, lng: 55.2708 },
  },
  {
    id: 'istanbul',
    name: 'Istanbul',
    country: 'Turkey',
    region: 'Middle East',
    imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800',
    costs: { budget: 35, mid: 80, luxury: 200, flight: 550 },
    weather: generateWeather('mediterranean', [4, 5, 9, 10]),
    highlights: ['Hagia Sophia', 'Grand Bazaar', 'Bosphorus cruises', 'Turkish cuisine'],
    tags: ['history', 'food', 'culture', 'shopping'],
    bestFor: ['History buffs', 'Foodies', 'Culture seekers'],
    coordinates: { lat: 41.0082, lng: 28.9784 },
  },
  {
    id: 'marrakech',
    name: 'Marrakech',
    country: 'Morocco',
    region: 'Africa',
    imageUrl: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800',
    costs: { budget: 30, mid: 70, luxury: 200, flight: 500 },
    weather: generateWeather('desert', [3, 4, 5, 10, 11]),
    highlights: ['Medina souks', 'Riads', 'Sahara day trips', 'Moroccan cuisine'],
    tags: ['culture', 'adventure', 'shopping', 'unique'],
    bestFor: ['Culture seekers', 'Photographers', 'Adventure lovers'],
    coordinates: { lat: 31.6295, lng: -7.9811 },
  },

  // CARIBBEAN
  {
    id: 'puerto-rico',
    name: 'San Juan',
    country: 'Puerto Rico',
    region: 'Caribbean',
    imageUrl: 'https://images.unsplash.com/photo-1579687196544-08ae57ab5b9c?w=800',
    costs: { budget: 60, mid: 140, luxury: 350, flight: 200 },
    weather: generateWeather('tropical', [12, 1, 2, 3, 4]),
    highlights: ['Old San Juan', 'Bioluminescent bays', 'El Yunque rainforest', 'No passport needed'],
    tags: ['beach', 'history', 'nature', 'easy-travel'],
    bestFor: ['US travelers', 'Beach lovers', 'History buffs'],
    coordinates: { lat: 18.4655, lng: -66.1057 },
  },
  {
    id: 'jamaica',
    name: 'Montego Bay',
    country: 'Jamaica',
    region: 'Caribbean',
    imageUrl: 'https://images.unsplash.com/photo-1587893904726-8a22b47e3e5b?w=800',
    costs: { budget: 55, mid: 130, luxury: 350, flight: 350 },
    weather: generateWeather('tropical', [12, 1, 2, 3, 4]),
    highlights: ['Reggae culture', 'Jerk cuisine', 'All-inclusive resorts', 'Waterfalls'],
    tags: ['beach', 'music', 'relaxation', 'food'],
    bestFor: ['Beach lovers', 'Music fans', 'Couples'],
    coordinates: { lat: 18.4762, lng: -77.8939 },
  },

  // OCEANIA
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'Australia',
    region: 'Oceania',
    imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
    costs: { budget: 80, mid: 180, luxury: 400, flight: 1100 },
    weather: generateWeather('temperate', [12, 1, 2, 3]),
    highlights: ['Opera House', 'Bondi Beach', 'Harbor Bridge', 'Wildlife'],
    tags: ['beach', 'culture', 'adventure', 'nature'],
    bestFor: ['Adventure seekers', 'Beach lovers', 'Culture seekers'],
    coordinates: { lat: -33.8688, lng: 151.2093 },
  },
  {
    id: 'queenstown',
    name: 'Queenstown',
    country: 'New Zealand',
    region: 'Oceania',
    imageUrl: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800',
    costs: { budget: 70, mid: 160, luxury: 380, flight: 1200 },
    weather: generateWeather('temperate', [12, 1, 2, 6, 7, 8]),
    highlights: ['Bungee jumping', 'Lord of the Rings scenery', 'Skiing', 'Adventure capital'],
    tags: ['adventure', 'nature', 'extreme-sports', 'photography'],
    bestFor: ['Adventure seekers', 'Nature lovers', 'Thrill seekers'],
    coordinates: { lat: -45.0312, lng: 168.6626 },
  },
  {
    id: 'fiji',
    name: 'Nadi',
    country: 'Fiji',
    region: 'Oceania',
    imageUrl: 'https://images.unsplash.com/photo-1589020087579-b34b17f6e2ca?w=800',
    costs: { budget: 60, mid: 150, luxury: 400, flight: 950 },
    weather: generateWeather('tropical', [5, 6, 7, 8, 9, 10]),
    highlights: ['Private islands', 'Snorkeling', 'Bula spirit', 'Overwater bungalows'],
    tags: ['beach', 'relaxation', 'romantic', 'diving'],
    bestFor: ['Honeymooners', 'Divers', 'Relaxation seekers'],
    coordinates: { lat: -17.7765, lng: 177.4356 },
  },

  // AFRICA
  {
    id: 'cape-town',
    name: 'Cape Town',
    country: 'South Africa',
    region: 'Africa',
    imageUrl: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800',
    costs: { budget: 40, mid: 100, luxury: 280, flight: 900 },
    weather: generateWeather('mediterranean', [11, 12, 1, 2, 3]),
    highlights: ['Table Mountain', 'Wine country', 'Penguin beaches', 'Safari nearby'],
    tags: ['nature', 'adventure', 'wine', 'wildlife'],
    bestFor: ['Nature lovers', 'Wine enthusiasts', 'Adventure seekers'],
    coordinates: { lat: -33.9249, lng: 18.4241 },
  },
  {
    id: 'zanzibar',
    name: 'Zanzibar',
    country: 'Tanzania',
    region: 'Africa',
    imageUrl: 'https://images.unsplash.com/photo-1548544149-4835e62ee5b3?w=800',
    costs: { budget: 35, mid: 90, luxury: 250, flight: 850 },
    weather: generateWeather('tropical', [6, 7, 8, 9, 1, 2]),
    highlights: ['Spice tours', 'Stone Town', 'White sand beaches', 'Safari add-on'],
    tags: ['beach', 'culture', 'relaxation', 'unique'],
    bestFor: ['Beach lovers', 'History buffs', 'Honeymoo​ners'],
    coordinates: { lat: -6.1659, lng: 39.2026 },
  },
];

export const getDestinationById = (id: string): Destination | undefined => {
  return destinations.find(d => d.id === id);
};

export const getDestinationsByRegion = (region: Destination['region']): Destination[] => {
  return destinations.filter(d => d.region === region);
};

export const getDestinationsByTag = (tag: string): Destination[] => {
  return destinations.filter(d => d.tags.includes(tag));
};

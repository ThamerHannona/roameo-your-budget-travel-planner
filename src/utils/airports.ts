// Airport code mappings for common cities

export const AIRPORT_CODES: Record<string, string> = {
  // US Cities
  'San Francisco': 'SFO',
  'New York': 'JFK',
  'Los Angeles': 'LAX',
  'Chicago': 'ORD',
  'Miami': 'MIA',
  'Seattle': 'SEA',
  'Boston': 'BOS',
  'Washington': 'DCA',
  'Denver': 'DEN',
  'Atlanta': 'ATL',
  'Dallas': 'DFW',
  'Houston': 'IAH',
  'Phoenix': 'PHX',
  'Philadelphia': 'PHL',
  'Las Vegas': 'LAS',
  'Orlando': 'MCO',
  'San Diego': 'SAN',
  'Minneapolis': 'MSP',
  'Detroit': 'DTW',
  'Portland': 'PDX',
  'Austin': 'AUS',
  'Nashville': 'BNA',
  'Charlotte': 'CLT',
  'Tampa': 'TPA',
  'Salt Lake City': 'SLC',

  // International Destinations - Europe
  'Lisbon': 'LIS',
  'Porto': 'OPO',
  'Barcelona': 'BCN',
  'Madrid': 'MAD',
  'Seville': 'SVQ',
  'Valencia': 'VLC',
  'Rome': 'FCO',
  'Milan': 'MXP',
  'Florence': 'FLR',
  'Venice': 'VCE',
  'Paris': 'CDG',
  'Nice': 'NCE',
  'London': 'LHR',
  'Edinburgh': 'EDI',
  'Amsterdam': 'AMS',
  'Copenhagen': 'CPH',
  'Stockholm': 'ARN',
  'Oslo': 'OSL',
  'Helsinki': 'HEL',
  'Berlin': 'BER',
  'Munich': 'MUC',
  'Frankfurt': 'FRA',
  'Vienna': 'VIE',
  'Prague': 'PRG',
  'Budapest': 'BUD',
  'Krakow': 'KRK',
  'Warsaw': 'WAW',
  'Athens': 'ATH',
  'Santorini': 'JTR',
  'Dublin': 'DUB',
  'Reykjavik': 'KEF',
  'Zurich': 'ZRH',
  'Geneva': 'GVA',
  'Brussels': 'BRU',
  'Dubrovnik': 'DBV',
  'Split': 'SPU',
  'Zagreb': 'ZAG',


  // Africa & Middle East
  'Marrakech': 'RAK',
  'Casablanca': 'CMN',
  'Cairo': 'CAI',
  'Cape Town': 'CPT',
  'Johannesburg': 'JNB',
  'Nairobi': 'NBO',
  'Istanbul': 'IST',
  'Dubai': 'DXB',
  'Abu Dhabi': 'AUH',
  'Tel Aviv': 'TLV',
  'Amman': 'AMM',
  'Medina': 'MED',
  'Zanzibar': 'ZNZ',


  // Asia
  'Tokyo': 'NRT',
  'Osaka': 'KIX',
  'Kyoto': 'KIX', // Uses Osaka airport
  'Seoul': 'ICN',
  'Bangkok': 'BKK',
  'Phuket': 'HKT',
  'Chiang Mai': 'CNX',
  'Singapore': 'SIN',
  'Hong Kong': 'HKG',
  'Taipei': 'TPE',
  'Bali': 'DPS',
  'Jakarta': 'CGK',
  'Kuala Lumpur': 'KUL',
  'Ho Chi Minh City': 'SGN',
  'Hanoi': 'HAN',
  'Manila': 'MNL',
  'Mumbai': 'BOM',
  'Delhi': 'DEL',
  'Goa': 'GOI',
  'Kathmandu': 'KTM',
  'Colombo': 'CMB',
  'Maldives': 'MLE',

  // Americas
  'Cancun': 'CUN',
  'Mexico City': 'MEX',
  'Puerto Vallarta': 'PVR',
  'Cabo San Lucas': 'SJD',
  'Havana': 'HAV',
  'Punta Cana': 'PUJ',
  'San Juan': 'SJU',
  'Lima': 'LIM',
  'Cusco': 'CUZ',
  'Buenos Aires': 'EZE',
  'Rio de Janeiro': 'GIG',
  'Sao Paulo': 'GRU',
  'Santiago': 'SCL',
  'Bogota': 'BOG',
  'Cartagena': 'CTG',
  'Medellin': 'MDE',
  'Quito': 'UIO',
  'Toronto': 'YYZ',
  'Vancouver': 'YVR',
  'Montreal': 'YUL',
  
  // Oceania
  'Sydney': 'SYD',
  'Melbourne': 'MEL',
  'Auckland': 'AKL',
  'Queenstown': 'ZQN',
  'Fiji': 'NAN',
};

// Reverse mapping: code -> city
const CODE_TO_CITY: Record<string, string> = Object.entries(AIRPORT_CODES).reduce(
  (acc, [city, code]) => {
    if (!acc[code]) acc[code] = city; // First city wins for shared codes
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Get airport code from city name (case-insensitive, partial match)
 */
export function getAirportCode(cityName: string): string | null {
  if (!cityName) return null;
  
  const normalized = cityName.trim().toLowerCase();
  
  // Exact match first
  for (const [city, code] of Object.entries(AIRPORT_CODES)) {
    if (city.toLowerCase() === normalized) {
      return code;
    }
  }
  
  // Partial match
  for (const [city, code] of Object.entries(AIRPORT_CODES)) {
    if (city.toLowerCase().includes(normalized) || normalized.includes(city.toLowerCase())) {
      return code;
    }
  }
  
  // Check if input is already an airport code
  if (normalized.length === 3 && normalized.toUpperCase() in CODE_TO_CITY) {
    return normalized.toUpperCase();
  }
  
  return null;
}

/**
 * Get city name from airport code
 */
export function getCityFromCode(code: string): string | null {
  if (!code) return null;
  return CODE_TO_CITY[code.toUpperCase()] || null;
}

/**
 * Validate if a string is a valid airport code
 */
export function isValidAirportCode(code: string): boolean {
  if (!code || code.length !== 3) return false;
  return code.toUpperCase() in CODE_TO_CITY;
}

/**
 * Get all available destination codes
 */
export function getDestinationCodes(): string[] {
  return [...new Set(Object.values(AIRPORT_CODES))];
}

/**
 * Default candidate destinations for discovery
 */
export const CANDIDATE_DESTINATIONS = [
  'LIS', // Lisbon
  'RAK', // Marrakech
  'BCN', // Barcelona
  'BKK', // Bangkok
  'ATH', // Athens
  'PRG', // Prague
  'CUN', // Cancun
  'DUB', // Dublin
  'IST', // Istanbul
  'BUD', // Budapest
  'VIE', // Vienna
  'MXP', // Milan
] as const;

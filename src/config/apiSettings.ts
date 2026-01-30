// API Settings Configuration
// Toggle this to control whether to use real API calls or mock data

export const API_SETTINGS = {
  // Set to true to use mock data (saves API credits)
  // Set to false to use real SerpAPI flight data
  USE_MOCK_FLIGHTS: false,
  
  // Cache duration in milliseconds (5 minutes)
  CACHE_DURATION_MS: 5 * 60 * 1000,
  
  // Maximum concurrent flight searches
  MAX_CONCURRENT_SEARCHES: 4,
} as const;

// Helper to check if we should use mock data
export function shouldUseMockData(): boolean {
  return API_SETTINGS.USE_MOCK_FLIGHTS;
}

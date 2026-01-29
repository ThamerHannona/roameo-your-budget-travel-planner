import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, RotateCcw, ChevronDown, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  CategorySlider, 
  BudgetPieChart, 
  FeedbackPanel, 
  BudgetPresets,
  ComparisonView,
  FlightTierSelector,
  HotelTierSelector,
} from '@/components/budgetAllocation';
import { PaywallModal } from '@/components/paywall';
import { useBudgetConstraintsStore } from '@/stores/budgetConstraintsStore';
import { useTripSearchStore } from '@/stores/tripSearchStore';
import { usePaymentStore } from '@/stores/paymentStore';
import { useFlightSearch } from '@/hooks/useFlightSearch';
import { useHotelSearch } from '@/hooks/useHotelSearch';
import { getAirportCode } from '@/utils/airports';
import { matchDestinations } from '@/lib/destinationMatcher';
import { destinations } from '@/data/destinations';
import { budgetPresets } from '@/data/mockBudgetData';
import type { CategoryKey, FlightOption, HotelTier } from '@/types/budgetConstraints';
import type { DestinationMatch } from '@/types/destination';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

export default function RealTimeBudgetAllocation() {
  const { destinationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showComparison, setShowComparison] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<keyof typeof budgetPresets | null>(null);
  const [destination, setDestination] = useState<DestinationMatch | null>(null);

  const { isPaid, checkPaymentStatus, markAsPaid } = usePaymentStore();

  const tripSearch = useTripSearchStore();
  const {
    destinationBudget,
    recentChanges,
    updateCategory,
    getSelectedFlight,
    getSelectedHotel,
    applyPreset,
    resetToDefaults,
    lockBudget,
    setFlightOptions,
    setHotelOptions,
  } = useBudgetConstraintsStore();

  // Real flight search
  const { 
    results: flightResults, 
    isLoading: flightsLoading, 
    hasMockData: flightsMockData,
    searchFlights 
  } = useFlightSearch();

  // Real hotel search
  const {
    results: hotelResults,
    isLoading: hotelsLoading,
    hasMockData: hotelsMockData,
    search: searchHotels,
  } = useHotelSearch();

  // Load destination
  useEffect(() => {
    if (!destinationId) {
      navigate('/discover');
      return;
    }

    // First check if we have valid dates for matching
    if (tripSearch.dates.start && tripSearch.dates.end) {
      const matches = matchDestinations({
        budget: tripSearch.budget,
        startDate: tripSearch.dates.start,
        endDate: tripSearch.dates.end,
        travelers: tripSearch.travelers,
        tripStyle: 'mid',
      });

      const found = matches.find((d) => d.id === destinationId);
      if (found) {
        setDestination(found);
        return;
      }
    }
    
    // Fallback to destinations data if no match or no dates
    const fallback = destinations.find((d) => d.id === destinationId);
    if (fallback) {
      setDestination({
        ...fallback,
        valueScore: 75,
        estimatedTotalCost: tripSearch.budget * 0.85,
        dailyCost: Math.round((tripSearch.budget * 0.85) / (tripSearch.days || 7)),
        flightCost: 500,
        accommodationCost: 600,
        activitiesCost: 400,
        foodCost: 350,
        weatherScore: 80,
        crowdScore: 70,
        confidenceScore: 75,
        affordability: 'good-value',
        budgetDelta: tripSearch.budget * 0.15,
        whyThisWorks: 'Great value destination',
        flagEmoji: '🌍',
      });
    }
  }, [destinationId, tripSearch, navigate]);

  // Fetch real flight data when destination is loaded
  useEffect(() => {
    if (!destination || !tripSearch.departureCity || !tripSearch.dates.start || !tripSearch.dates.end) {
      return;
    }

    const destinationCode = getAirportCode(destination.name);
    if (!destinationCode) return;

    // Fetch flights for this specific destination
    searchFlights(
      tripSearch.departureCity,
      tripSearch.dates.start,
      tripSearch.dates.end,
      tripSearch.travelers,
      [destinationCode]
    );

    // Format dates for hotel search (YYYY-MM-DD)
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    // Fetch hotels for this destination
    searchHotels(
      destinationCode,
      formatDate(tripSearch.dates.start),
      formatDate(tripSearch.dates.end),
      tripSearch.travelers
    );
  }, [destination, tripSearch.departureCity, tripSearch.dates.start, tripSearch.dates.end, tripSearch.travelers, searchFlights, searchHotels]);

  // Map real flight results to store format
  useEffect(() => {
    if (!destination) return;
    
    const destinationCode = getAirportCode(destination.name);
    if (!destinationCode) return;

    const result = flightResults.get(destinationCode);
    if (!result?.options?.length) return;

    // Map SerpAPI flight options to store format
    const mappedOptions: FlightOption[] = result.options.map((opt, index) => ({
      airline: opt.airline,
      flightNumber: opt.flightNumber,
      price: opt.price,
      duration: opt.duration,
      stops: opt.layovers,
      layover: opt.layoverDuration || undefined,
      direct: opt.layovers === 0,
    }));

    // Sort by price and assign tiers
    const sortedOptions = [...mappedOptions].sort((a, b) => a.price - b.price);
    
    setFlightOptions(sortedOptions);
  }, [destination, flightResults, setFlightOptions]);

  // Map real hotel results to store format
  useEffect(() => {
    if (!destination) return;
    
    const destinationCode = getAirportCode(destination.name);
    if (!destinationCode) return;

    const result = hotelResults.get(destinationCode);
    if (!result?.hotels?.length) return;

    const nights = tripSearch.days || 7;
    
    // Group hotels by rating tier
    const tierMap: Record<string, typeof result.hotels> = {
      '5★': [],
      '4★': [],
      '3★': [],
    };
    
    result.hotels.forEach((hotel) => {
      const rating = hotel.rating >= 5 ? '5★' : hotel.rating >= 4 ? '4★' : '3★';
      tierMap[rating].push(hotel);
    });
    
    // Build tiers from real hotel data
    const mappedTiers: HotelTier[] = [];
    
    (['3★', '4★', '5★'] as const).forEach((tier) => {
      const tieredHotels = tierMap[tier];
      if (tieredHotels.length > 0) {
        // Get average price for this tier
        const avgPrice = Math.round(
          tieredHotels.reduce((sum, h) => sum + h.pricePerNight, 0) / tieredHotels.length
        );
        const totalPrice = avgPrice * nights;
        const bestHotel = tieredHotels[0];
        
        mappedTiers.push({
          tier,
          name: bestHotel.name,
          pricePerNight: avgPrice,
          totalPrice,
          description: `${tier.replace('★', '-star')} accommodation`,
          amenities: bestHotel.amenities || ['WiFi', 'Parking'],
        });
      }
    });
    
    if (mappedTiers.length > 0) {
      setHotelOptions(mappedTiers);
    }
  }, [destination, hotelResults, tripSearch.days, setHotelOptions]);

  const handleCategoryChange = useCallback(
    (category: CategoryKey) => (value: number) => {
      updateCategory(category, value);
      setCurrentPreset(null); // Clear preset when manually adjusting
    },
    [updateCategory]
  );

  const handlePresetSelect = useCallback(
    (preset: keyof typeof budgetPresets) => {
      applyPreset(preset);
      setCurrentPreset(preset);
    },
    [applyPreset]
  );

  const handleReset = useCallback(() => {
    resetToDefaults();
    setCurrentPreset('balanced');
  }, [resetToDefaults]);

  const handleContinue = useCallback(() => {
    // Check if already paid
    const hasPaid = checkPaymentStatus(destinationId || '');
    if (hasPaid) {
      lockBudget();
      navigate(`/trip/${destinationId}/itinerary`);
    } else {
      // Show paywall
      setShowPaywall(true);
    }
  }, [checkPaymentStatus, lockBudget, navigate, destinationId]);

  const handlePaymentSuccess = useCallback(() => {
    markAsPaid(destinationId || '');
    setShowPaywall(false);
    lockBudget();
    
    // Celebration!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    toast({
      title: '🎉 Full Itinerary Unlocked!',
      description: 'All specific details, booking links, and options are now available.',
    });

    navigate(`/trip/${destinationId}/itinerary`);
  }, [markAsPaid, destinationId, lockBudget, toast, navigate]);

  const selectedFlight = getSelectedFlight();
  const selectedHotel = getSelectedHotel();
  const { constraints } = destinationBudget;

  if (!destination) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-display text-lg font-bold text-foreground">
                  Customize Your Trip
                </h1>
                <p className="text-sm text-muted-foreground">
                  {destination.name}, {destination.country}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="hidden sm:flex">
                ${destinationBudget.totalBudget.toLocaleString()} budget
              </Badge>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[1fr,380px] gap-6">
          {/* Left Column - Sliders */}
          <div className="space-y-6">
            {/* Quick Presets */}
            <BudgetPresets onSelect={handlePresetSelect} currentPreset={currentPreset} />

            {/* Flight Tier Selector */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-card border border-border p-5"
            >
              {/* Live/Mock data indicator */}
              <div className="flex items-center justify-end gap-2 mb-3">
                {flightsLoading ? (
                  <Badge variant="outline" className="text-xs animate-pulse">
                    <Wifi className="h-3 w-3 mr-1" />
                    Loading live prices...
                  </Badge>
                ) : flightsMockData ? (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Estimated prices
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-success border-success/30">
                    <Wifi className="h-3 w-3 mr-1" />
                    Live prices
                  </Badge>
                )}
              </div>
              
              <FlightTierSelector
                options={constraints.flights.options}
                selectedPrice={constraints.flights.current}
                onSelect={handleCategoryChange('flights')}
                totalBudget={destinationBudget.totalBudget}
              />
            </motion.div>

            {/* Hotel Tier Selector */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl bg-card border border-border p-5"
            >
              {/* Live/Mock data indicator */}
              <div className="flex items-center justify-end gap-2 mb-3">
                {hotelsLoading ? (
                  <Badge variant="outline" className="text-xs animate-pulse">
                    <Wifi className="h-3 w-3 mr-1" />
                    Loading hotel prices...
                  </Badge>
                ) : hotelsMockData ? (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Estimated prices
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-success border-success/30">
                    <Wifi className="h-3 w-3 mr-1" />
                    Live prices
                  </Badge>
                )}
              </div>
              
              <HotelTierSelector
                tiers={constraints.hotels.tiers}
                selectedPrice={constraints.hotels.current}
                onSelect={handleCategoryChange('hotels')}
                totalBudget={destinationBudget.totalBudget}
                nights={tripSearch.days || 7}
              />
            </motion.div>

            {/* Category Sliders */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">
                  Other Categories
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Reset
                </Button>
              </div>

              <div className="space-y-3">
                <CategorySlider
                  category="activities"
                  constraints={constraints.activities}
                  totalBudget={destinationBudget.totalBudget}
                  onChange={handleCategoryChange('activities')}
                />

                <CategorySlider
                  category="food"
                  constraints={constraints.food}
                  totalBudget={destinationBudget.totalBudget}
                  onChange={handleCategoryChange('food')}
                />

                <CategorySlider
                  category="transport"
                  constraints={constraints.transport}
                  totalBudget={destinationBudget.totalBudget}
                  onChange={handleCategoryChange('transport')}
                />
              </div>
            </div>

            {/* Comparison Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Show recent adjustments</span>
              </div>
              <Switch
                checked={showComparison}
                onCheckedChange={setShowComparison}
              />
            </div>

            {/* Comparison View */}
            <ComparisonView
              changes={recentChanges}
              totalBudget={destinationBudget.totalBudget}
              isVisible={showComparison}
            />
          </div>

          {/* Right Column - Visualization */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-card border border-border p-6"
            >
              <h3 className="text-sm font-medium text-foreground mb-4">
                Budget Breakdown
              </h3>
              <BudgetPieChart
                constraints={constraints}
                totalBudget={destinationBudget.totalBudget}
              />
            </motion.div>

            {/* Feedback Panel */}
            <FeedbackPanel changes={recentChanges} />

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleContinue}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                <Lock className="h-4 w-4 mr-2" />
                Lock Budget & Continue
              </Button>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span>We'll generate your personalized itinerary next</span>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <Button
          onClick={handleContinue}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          <Lock className="h-4 w-4 mr-2" />
          Lock Budget & Continue
        </Button>
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPaymentSuccess={handlePaymentSuccess}
        tripDetails={{
          destination: destination.name,
          country: destination.country,
          days: tripSearch.days || 7,
          totalCost: destinationBudget.totalBudget,
          travelers: tripSearch.travelers,
        }}
      />
    </div>
  );
}
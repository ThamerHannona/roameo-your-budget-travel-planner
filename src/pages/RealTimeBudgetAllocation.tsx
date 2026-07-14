import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, RotateCcw, ChevronDown, Sparkles, Wifi, WifiOff, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
  FlightPicker,
  HotelPicker,
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
import { budgetPresets, generateBudgetConstraints } from '@/data/mockBudgetData';
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

  // Subscribe to primitive slices only — subscribing to the whole store returns
  // a new object identity on every store update and can trigger effect loops.
  const tsBudget = useTripSearchStore((s) => s.budget);
  const tsTravelers = useTripSearchStore((s) => s.travelers);
  const tsDays = useTripSearchStore((s) => s.days);
  const tsDepartureCity = useTripSearchStore((s) => s.departureCity);
  const tsStart = useTripSearchStore((s) => s.dates.start);
  const tsEnd = useTripSearchStore((s) => s.dates.end);
  const tsRegions = useTripSearchStore((s) => s.regions);
  const tripSearch = useMemo(
    () => ({
      budget: tsBudget,
      travelers: tsTravelers,
      days: tsDays,
      departureCity: tsDepartureCity,
      dates: { start: tsStart, end: tsEnd },
      regions: tsRegions,
    }),
    [tsBudget, tsTravelers, tsDays, tsDepartureCity, tsStart, tsEnd, tsRegions]
  );

  const destinationBudget = useBudgetConstraintsStore((s) => s.destinationBudget);
  const recentChanges = useBudgetConstraintsStore((s) => s.recentChanges);
  const updateCategory = useBudgetConstraintsStore((s) => s.updateCategory);
  const applyPreset = useBudgetConstraintsStore((s) => s.applyPreset);
  const resetToDefaults = useBudgetConstraintsStore((s) => s.resetToDefaults);
  const lockBudget = useBudgetConstraintsStore((s) => s.lockBudget);
  const setFlightOptions = useBudgetConstraintsStore((s) => s.setFlightOptions);
  const setHotelOptions = useBudgetConstraintsStore((s) => s.setHotelOptions);
  const setDestinationBudget = useBudgetConstraintsStore((s) => s.setDestinationBudget);

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

  // Load destination — depend on primitive tripSearch fields only so we don't
  // re-run whenever the store object identity changes.
  useEffect(() => {
    if (!destinationId) {
      navigate('/discover');
      return;
    }

    if (tsStart && tsEnd) {
      const matches = matchDestinations({
        budget: tsBudget,
        startDate: tsStart,
        endDate: tsEnd,
        travelers: tsTravelers,
        tripStyle: 'mid',
        regions: tsRegions,
      });

      const found = matches.find((d) => d.id === destinationId);
      if (found) {
        setDestination(found);
        return;
      }
    }

    const fallback = destinations.find((d) => d.id === destinationId);
    if (fallback) {
      setDestination({
        ...fallback,
        valueScore: 75,
        estimatedTotalCost: tsBudget * 0.85,
        dailyCost: Math.round((tsBudget * 0.85) / (tsDays || 7)),
        flightCost: 500,
        accommodationCost: 600,
        activitiesCost: 400,
        foodCost: 350,
        weatherScore: 80,
        crowdScore: 70,
        confidenceScore: 75,
        affordability: 'good-value',
        budgetDelta: tsBudget * 0.15,
        whyThisWorks: 'Great value destination',
        flagEmoji: '🌍',
      });
    }
  }, [destinationId, tsBudget, tsTravelers, tsDays, tsStart, tsEnd, tsRegions, navigate]);

  // Seed the constraints store from the user's REAL trip search. Gate with a
  // ref keyed by (destinationId + budget + travelers + days) so this runs at
  // most ONCE per meaningful change — never re-triggered by our own write to
  // destinationBudget (which was the source of the freeze loop).
  const seedKeyRef = useRef<string | null>(null);
  // Real nights count from trip dates (nights = date-diff in days; a 14-day
  // trip Jul 29 – Aug 11 has 13 nights). Falls back to days-1 if dates missing.
  const realNights = useMemo(() => {
    if (tsStart && tsEnd) {
      const ms = new Date(tsEnd).getTime() - new Date(tsStart).getTime();
      return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
    }
    return Math.max(1, (tsDays || 7) - 1);
  }, [tsStart, tsEnd, tsDays]);

  useEffect(() => {
    if (!destination) return;
    const totalBudget = tsBudget;
    const travelers = tsTravelers || 1;
    const days = tsDays || 7;
    const key = `${destination.id}|${totalBudget}|${travelers}|${days}|${realNights}`;
    if (seedKeyRef.current === key) return;
    seedKeyRef.current = key;

    const seeded = generateBudgetConstraints(
      `${destination.name}, ${destination.country}`,
      totalBudget,
      travelers,
      days,
      realNights,
    );
    setDestinationBudget(seeded);
  }, [destination, tsBudget, tsTravelers, tsDays, realNights, setDestinationBudget]);



  // Fetch real flight data when destination is loaded
  useEffect(() => {
    if (!destination || !tsDepartureCity || !tsStart || !tsEnd) {
      return;
    }

    const destinationCode = getAirportCode(destination.name);
    if (!destinationCode) return;

    searchFlights(tsDepartureCity, tsStart, tsEnd, tsTravelers, [destinationCode]);
    searchHotels(destination.name, tsStart, tsEnd, tsTravelers);
  }, [destination, tsDepartureCity, tsStart, tsEnd, tsTravelers, searchFlights, searchHotels]);

  // Map real flight results to store format
  useEffect(() => {
    if (!destination) return;
    
    const destinationCode = getAirportCode(destination.name);
    if (!destinationCode) return;

    const result = flightResults.get(destinationCode);
    if (!result?.options?.length) return;

    const travelers = tsTravelers || 1;

    // Map SerpAPI flight options to store format — keep FULL list
    const mappedOptions: FlightOption[] = result.options.map((opt) => ({
      id: opt.id,
      airline: opt.airline,
      airlineLogo: opt.airlineLogo,
      flightNumber: opt.flightNumber,
      price: opt.price, // total for all travelers
      pricePerPerson: Math.round(opt.price / travelers),
      duration: opt.duration,
      stops: opt.layovers,
      layover: opt.layoverDuration || undefined,
      layoverCities: opt.layoverCities,
      direct: opt.layovers === 0,
      departureTime: opt.departure?.time,
      arrivalTime: opt.arrival?.time,
      departureAirport: opt.departure?.airport,
      arrivalAirport: opt.arrival?.airport,
      bookingUrl: opt.bookingUrl,
    }));

    const sortedOptions = [...mappedOptions].sort((a, b) => a.price - b.price);
    setFlightOptions(sortedOptions);
  }, [destination, flightResults, tsTravelers, setFlightOptions]);


  // Map real hotel results to store format — FULL list, not just 3 tiers
  useEffect(() => {
    if (!destination) return;

    const result = hotelResults.get(destination.name);
    if (!result?.options?.length) return;

    const mappedTiers: HotelTier[] = result.options.map((hotel) => {
      const stars = hotel.stars || 3;
      const tierLabel: '3★' | '4★' | '5★' = stars >= 5 ? '5★' : stars >= 4 ? '4★' : '3★';
      return {
        id: hotel.id,
        tier: tierLabel,
        stars,
        name: hotel.name,
        pricePerNight: hotel.pricePerNight,
        totalPrice: hotel.totalPrice,
        description: `${stars}-star accommodation`,
        amenities: hotel.amenities || [],
        bookingUrl: hotel.bookingUrl,
        imageUrl: hotel.imageUrl,
        images: hotel.images,
        rating: hotel.rating,
        reviewCount: hotel.reviewCount,
        distance: hotel.distance,
      };
    });

    if (mappedTiers.length > 0) {
      setHotelOptions(mappedTiers);
    }
  }, [destination, hotelResults, setHotelOptions]);


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

  const { constraints } = destinationBudget;

  // Derived values are memoized off destinationBudget only — do NOT write these
  // back into state via useEffect (that was the original re-render loop).
  const selectedFlight = useMemo(
    () => constraints.flights.options.find((o) => o.price === constraints.flights.current) || null,
    [constraints.flights.options, constraints.flights.current]
  );
  const selectedHotel = useMemo(
    () => constraints.hotels.tiers.find((t) => t.totalPrice === constraints.hotels.current) || null,
    [constraints.hotels.tiers, constraints.hotels.current]
  );
  const selectedTotal = useMemo(
    () =>
      constraints.flights.current +
      constraints.hotels.current +
      constraints.activities.current +
      constraints.food.current +
      constraints.transport.current,
    [
      constraints.flights.current,
      constraints.hotels.current,
      constraints.activities.current,
      constraints.food.current,
      constraints.transport.current,
    ]
  );
  const budgetDiff = destinationBudget.totalBudget - selectedTotal;
  const isOverBudget = budgetDiff < 0;
  const hasLiveFlights = constraints.flights.options.length > 0 && !flightsMockData && !flightsLoading;
  const hasLiveHotels = constraints.hotels.tiers.length > 0 && !hotelsMockData && !hotelsLoading;
  const missingDeparture = !tripSearch.departureCity;

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
        {/* Departure city guard */}
        {missingDeparture && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-foreground">No departure city set</p>
              <p className="text-sm text-muted-foreground">
                We can't pull live flight prices without knowing where you're flying from. Numbers below
                are estimates until you set a departure city.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              Set departure
            </Button>
          </div>
        )}

        {/* Live selection vs budget banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 rounded-xl border p-4 ${
            isOverBudget
              ? 'border-destructive/40 bg-destructive/10'
              : 'border-success/30 bg-success/10'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {isOverBudget ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-success" />
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isOverBudget ? 'Selections exceed your budget' : 'Your selections fit your budget'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Live flight: {hasLiveFlights ? '✓' : '…'} · Live hotels: {hasLiveHotels ? '✓' : '…'}
                  {selectedFlight && ` · ${selectedFlight.airline} $${selectedFlight.price.toLocaleString()}`}
                  {selectedHotel && ` · ${selectedHotel.tier} $${selectedHotel.totalPrice.toLocaleString()}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Selected / Budget</p>
              <p className={`font-display text-lg font-bold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
                ${selectedTotal.toLocaleString()}{' '}
                <span className="text-muted-foreground text-sm font-normal">
                  / ${destinationBudget.totalBudget.toLocaleString()}
                </span>
              </p>
              <p className={`text-xs font-medium ${isOverBudget ? 'text-destructive' : 'text-success'}`}>
                {isOverBudget ? `$${Math.abs(budgetDiff).toLocaleString()} over` : `$${budgetDiff.toLocaleString()} remaining`}
              </p>
            </div>
          </div>
        </motion.div>

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
                travelers={tripSearch.travelers}
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
                nights={realNights}
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
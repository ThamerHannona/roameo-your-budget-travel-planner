import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, Scale, Menu, Loader2, RefreshCcw, Plane } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { resolveTripDates } from '@/utils/tripDates';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DestinationCard } from '@/components/discover/DestinationCard';
import { ComparisonModal } from '@/components/discover/ComparisonModal';
import { SearchSummaryHeader } from '@/components/discover/SearchSummaryHeader';
import { StickyComparisonBar } from '@/components/discover/StickyComparisonBar';
import { DiscoverSidebar, DiscoverFiltersState } from '@/components/discover/DiscoverSidebar';
import { DiscoveryMap } from '@/components/discover/DiscoveryMap';
import { MapListToggle } from '@/components/discover/MapListToggle';
import { DateFlexibilityModal } from '@/components/dateFlexibility';
import { GhostTripsSection } from '@/components/ghost';
import { SearchingAnimation } from '@/components/loading';
import { matchDestinations } from '@/lib/destinationMatcher';
import { useTripSearchStore } from '@/stores/tripSearchStore';
import { useSelectedDestinationStore } from '@/stores/selectedDestinationStore';
import { useFlightSearch } from '@/hooks/useFlightSearch';
import { getAirportCode, CANDIDATE_DESTINATIONS } from '@/utils/airports';
import { DestinationMatch } from '@/types/destination';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const defaultFilters: DiscoverFiltersState = {
  maxPrice: 10000,
  minConfidence: 70,
  weatherPreference: 'any',
  crowdTolerance: 'any',
  directFlightsOnly: false,
  sortBy: 'value',
};

export default function Discover() {
  const navigate = useNavigate();
  const tripSearch = useTripSearchStore();
  const { setDestination } = useSelectedDestinationStore();
  const flightSearch = useFlightSearch();
  
  const [filters, setFilters] = useState<DiscoverFiltersState>({
    ...defaultFilters,
    maxPrice: tripSearch.budget,
  });
  const [compareList, setCompareList] = useState<DestinationMatch[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [flexibilityModalOpen, setFlexibilityModalOpen] = useState(false);
  const [selectedFlexDestination, setSelectedFlexDestination] = useState<DestinationMatch | null>(null);
  const [hasSearchedFlights, setHasSearchedFlights] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>(() => {
    if (typeof window === 'undefined') return 'list';
    const saved = window.localStorage.getItem('roamio-discover-view');
    return saved === 'map' || saved === 'list' ? saved : 'list';
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('roamio-discover-view', viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);
  
  // Auto-fetch real flight data when the page loads
  useEffect(() => {
    const startDate = tripSearch.dates.start;
    const endDate = tripSearch.dates.end;
    const departureCity = tripSearch.departureCity;
    
    // Only search if we have valid inputs and haven't already searched
    if (startDate && endDate && departureCity && !hasSearchedFlights && !flightSearch.isLoading) {
      const originCode = getAirportCode(departureCity);
      if (originCode) {
        console.log('Searching real flights from:', departureCity, '→', CANDIDATE_DESTINATIONS);
        flightSearch.searchFlights(
          departureCity,
          startDate,
          endDate,
          tripSearch.travelers,
          [...CANDIDATE_DESTINATIONS]
        );
        setHasSearchedFlights(true);
      }
    }
  }, [tripSearch.dates.start, tripSearch.dates.end, tripSearch.departureCity, tripSearch.travelers, hasSearchedFlights, flightSearch.isLoading]);
  
  // Match destinations based on user criteria + real flight data from Zustand store
  const matches = useMemo(() => {
    const { start: startDate, end: endDate } = resolveTripDates(
      tripSearch.dates.start, tripSearch.dates.end, tripSearch.days,
    );

    
    return matchDestinations({
      budget: tripSearch.budget,
      startDate,
      endDate,
      travelers: tripSearch.travelers,
      tripStyle: tripSearch.travelStyle === 'relaxation' ? 'luxury' : 
                 tripSearch.travelStyle === 'adventure' ? 'budget' : 'mid',
      regions: tripSearch.regions,
      flightData: flightSearch.results.size > 0 ? flightSearch.results : undefined,
    });
  }, [
    tripSearch.budget, 
    tripSearch.dates, 
    tripSearch.days, 
    tripSearch.travelers, 
    tripSearch.travelStyle,
    tripSearch.regions,
    flightSearch.results
  ]);
  
  // Apply sidebar filters
  const filteredDestinations = useMemo(() => {
    let filtered = [...matches];
    
    // Max price filter
    filtered = filtered.filter(d => d.estimatedTotalCost <= filters.maxPrice);
    
    // Confidence filter
    filtered = filtered.filter(d => d.confidenceScore >= filters.minConfidence);
    
    // Weather preference
    if (filters.weatherPreference !== 'any') {
      filtered = filtered.filter(d => {
        const avgTemp = Object.values(d.weather).reduce((sum, w) => sum + w.temp, 0) / 12;
        switch (filters.weatherPreference) {
          case 'sunny':
            return avgTemp >= 75;
          case 'mild':
            return avgTemp >= 60 && avgTemp < 75;
          case 'cool':
            return avgTemp < 60;
          default:
            return true;
        }
      });
    }
    
    // Crowd tolerance
    if (filters.crowdTolerance !== 'any') {
      filtered = filtered.filter(d => {
        switch (filters.crowdTolerance) {
          case 'avoid-crowds':
            return d.crowdScore >= 70;
          case 'moderate':
            return d.crowdScore >= 40 && d.crowdScore < 70;
          case 'dont-mind':
            return true;
          default:
            return true;
        }
      });
    }
    
    // Sorting
    switch (filters.sortBy) {
      case 'price':
        filtered.sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost);
        break;
      case 'confidence':
        filtered.sort((a, b) => b.confidenceScore - a.confidenceScore);
        break;
      case 'flight-time':
        filtered.sort((a, b) => a.flightCost - b.flightCost);
        break;
      case 'value':
      default:
        filtered.sort((a, b) => b.valueScore - a.valueScore);
    }
    
    return filtered;
  }, [matches, filters]);
  
  const handleRefreshFlights = async () => {
    flightSearch.clearCache();
    setHasSearchedFlights(false);
    
    const startDate = tripSearch.dates.start;
    const endDate = tripSearch.dates.end;
    
    if (startDate && endDate && tripSearch.departureCity) {
      await flightSearch.searchFlights(
        tripSearch.departureCity,
        startDate,
        endDate,
        tripSearch.travelers,
        [...CANDIDATE_DESTINATIONS]
      );
      setHasSearchedFlights(true);
    }
  };
  
  const toggleCompare = (destination: DestinationMatch) => {
    setCompareList(prev => {
      const exists = prev.find(d => d.id === destination.id);
      if (exists) {
        return prev.filter(d => d.id !== destination.id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, destination];
    });
  };
  
  const removeFromCompare = (id: string) => {
    setCompareList(prev => prev.filter(d => d.id !== id));
  };
  
  const handleSelectDestination = (destination: DestinationMatch) => {
    setShowComparison(false);
    setDestination(destination);
    navigate(`/trip/${destination.id}/budget`);
  };
  
  const handleFiltersChange = (newFilters: Partial<DiscoverFiltersState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  const resetFilters = () => {
    setFilters({ ...defaultFilters, maxPrice: tripSearch.budget });
  };
  
  const sidebarContent = (
    <DiscoverSidebar
      filters={filters}
      onFiltersChange={handleFiltersChange}
      onReset={resetFilters}
      maxBudget={tripSearch.budget}
    />
  );
  
  // Show loading state when fetching flights
  if (flightSearch.isLoading && !matches.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <SearchingAnimation />
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">Searching real flights...</p>
            <p className="text-sm text-muted-foreground">
              Checking prices from {tripSearch.departureCity || 'your city'} to {CANDIDATE_DESTINATIONS.length} destinations
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo size="sm" />
          </div>
          
          <div className="flex items-center gap-3">
            {/* Flight data status */}
            {flightSearch.results.size > 0 && (
              <div className="hidden md:flex items-center gap-2">
                {flightSearch.hasMockData ? (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Plane className="h-3 w-3" />
                    Estimated prices
                  </Badge>
                ) : (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs gap-1">
                    <Plane className="h-3 w-3" />
                    Live prices
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleRefreshFlights}
                  disabled={flightSearch.isLoading}
                  className="text-xs gap-1"
                >
                  {flightSearch.isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-3 w-3" />
                  )}
                  Refresh
                </Button>
              </div>
            )}
            
            {/* Mobile filter button */}
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="p-4 border-b">
                  <h2 className="font-semibold">Filters</h2>
                </div>
                <div className="p-4">
                  {sidebarContent}
                </div>
              </SheetContent>
            </Sheet>
            
            {compareList.length > 0 && (
              <Button onClick={() => setShowComparison(true)} className="gap-2 hidden md:flex">
                <Scale className="h-4 w-4" />
                Compare ({compareList.length})
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {/* Search Summary */}
        <SearchSummaryHeader
          budget={tripSearch.budget}
          days={tripSearch.days}
          startDate={tripSearch.dates.start}
          endDate={tripSearch.dates.end}
          departureCity={tripSearch.departureCity}
          travelers={tripSearch.travelers}
          resultCount={filteredDestinations.length}
          onEdit={() => navigate('/')}
          isLiveData={hasSearchedFlights}
          hasMockData={flightSearch.hasMockData}
        />
        
        {/* Flight search error */}
        {flightSearch.error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-3"
          >
            <span className="text-yellow-600">⚠️</span>
            <div>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Could not fetch live flight prices. Showing estimated prices instead.
              </p>
              <p className="text-xs text-muted-foreground mt-1">{flightSearch.error}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefreshFlights}
              className="ml-auto"
            >
              Retry
            </Button>
          </motion.div>
        )}
        
        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <MapListToggle
            view={viewMode}
            onChange={setViewMode}
            isLoading={flightSearch.isLoading}
            listCount={filteredDestinations.length}
          />
          
          {compareList.length > 0 && (
            <Button onClick={() => setShowComparison(true)} className="gap-2 md:hidden">
              <Scale className="h-4 w-4" />
              Compare ({compareList.length})
            </Button>
          )}
        </div>
        
        {/* Main Layout */}
        <div className="flex gap-6">
          {/* Sidebar (Desktop) - only show in list view */}
          {viewMode === 'list' && (
            <div className="hidden lg:block w-72 shrink-0">
              {sidebarContent}
            </div>
          )}
          
          {/* Content Area */}
          <div className="flex-1">
            {/* Map View */}
            {viewMode === 'map' && (
              <DiscoveryMap
                destinations={filteredDestinations}
                onSelectDestination={handleSelectDestination}
                isLoading={flightSearch.isLoading && !filteredDestinations.length}
                originCity={tripSearch.departureCity}
              />
            )}
            
            {/* List View */}
            {viewMode === 'list' && (
              <>
                {filteredDestinations.length > 0 ? (
                  <>
                    {/* Loading overlay when refreshing */}
                    {flightSearch.isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3"
                      >
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm">Updating flight prices...</span>
                      </motion.div>
                    )}
                    
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    >
                      <AnimatePresence mode="popLayout">
                        {filteredDestinations.map((destination) => (
                          <motion.div
                            key={destination.id}
                            variants={itemVariants}
                            layout
                          >
                            <DestinationCard
                              destination={destination}
                              isSelected={compareList.some(d => d.id === destination.id)}
                              onSelect={() => handleSelectDestination(destination)}
                              onCompare={() => toggleCompare(destination)}
                              onViewDetails={() => handleSelectDestination(destination)}
                              onFlexibleDates={() => {
                                setSelectedFlexDestination(destination);
                                setFlexibilityModalOpen(true);
                              }}
                              compareCount={compareList.length}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <Compass className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                      No destinations found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your filters or increasing your budget.
                    </p>
                    <Button variant="outline" onClick={resetFilters}>
                      Reset Filters
                    </Button>
                  </motion.div>
                )}
              </>
            )}
            
            {/* Ghost Trips Section - show below map or list */}
            <GhostTripsSection
              budget={tripSearch.budget}
              startDate={resolveTripDates(tripSearch.dates.start, tripSearch.dates.end, tripSearch.days).start}
              endDate={resolveTripDates(tripSearch.dates.start, tripSearch.dates.end, tripSearch.days).end}
              travelers={tripSearch.travelers}
              tripStyle={
                tripSearch.travelStyle === 'relaxation' ? 'luxury' : 
                tripSearch.travelStyle === 'adventure' ? 'budget' : 'mid'
              }
              days={tripSearch.days}
            />
          </div>
        </div>
      </main>
      
      {/* Comparison Modal */}
      <ComparisonModal
        open={showComparison}
        onClose={() => setShowComparison(false)}
        destinations={compareList}
        onSelect={handleSelectDestination}
      />
      
      {/* Date Flexibility Modal */}
      {selectedFlexDestination && (
        <DateFlexibilityModal
          open={flexibilityModalOpen}
          onOpenChange={setFlexibilityModalOpen}
          destinationName={selectedFlexDestination.name}
          currentDates={{
            start: resolveTripDates(tripSearch.dates.start, tripSearch.dates.end, tripSearch.days).start,
            end: resolveTripDates(tripSearch.dates.start, tripSearch.dates.end, tripSearch.days).end,
          }}
          currentPrice={selectedFlexDestination.estimatedTotalCost}
          baseFlightPrice={selectedFlexDestination.flightCost}
          baseHotelPrice={selectedFlexDestination.accommodationCost}
          onUpdateDates={(newDates) => {
            tripSearch.setDates(newDates.start, newDates.end);
            setFlexibilityModalOpen(false);
          }}
        />
      )}
      
      {/* Sticky Comparison Bar */}
      <AnimatePresence>
        {compareList.length > 0 && !showComparison && (
          <StickyComparisonBar
            destinations={compareList}
            onRemove={removeFromCompare}
            onCompare={() => setShowComparison(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

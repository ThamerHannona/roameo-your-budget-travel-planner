import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, Scale, Menu } from 'lucide-react';
import { addDays } from 'date-fns';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DestinationCard } from '@/components/discover/DestinationCard';
import { ComparisonModal } from '@/components/discover/ComparisonModal';
import { SearchSummaryHeader } from '@/components/discover/SearchSummaryHeader';
import { StickyComparisonBar } from '@/components/discover/StickyComparisonBar';
import { DiscoverSidebar, DiscoverFiltersState } from '@/components/discover/DiscoverSidebar';
import { DateFlexibilityModal } from '@/components/dateFlexibility';
import { GhostTripsSection } from '@/components/ghost';
import { matchDestinations } from '@/lib/destinationMatcher';
import { useTripSearchStore } from '@/stores/tripSearchStore';
import { useSelectedDestinationStore } from '@/stores/selectedDestinationStore';
import { DestinationMatch, Destination } from '@/types/destination';
import type { DateRange } from '@/types/dateFlexibility';

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
  
  const [filters, setFilters] = useState<DiscoverFiltersState>({
    ...defaultFilters,
    maxPrice: tripSearch.budget,
  });
  const [compareList, setCompareList] = useState<DestinationMatch[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [flexibilityModalOpen, setFlexibilityModalOpen] = useState(false);
  const [selectedFlexDestination, setSelectedFlexDestination] = useState<DestinationMatch | null>(null);
  
  // Match destinations based on user criteria from Zustand store
  const matches = useMemo(() => {
    const startDate = tripSearch.dates.start || new Date();
    const endDate = tripSearch.dates.end || new Date(Date.now() + tripSearch.days * 24 * 60 * 60 * 1000);
    
    return matchDestinations({
      budget: tripSearch.budget,
      startDate,
      endDate,
      travelers: tripSearch.travelers,
      tripStyle: tripSearch.travelStyle === 'relaxation' ? 'luxury' : 
                 tripSearch.travelStyle === 'adventure' ? 'budget' : 'mid',
    });
  }, [tripSearch.budget, tripSearch.dates, tripSearch.days, tripSearch.travelers, tripSearch.travelStyle]);
  
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
        filtered.sort((a, b) => a.flightCost - b.flightCost); // Using flight cost as proxy
        break;
      case 'value':
      default:
        filtered.sort((a, b) => b.valueScore - a.valueScore);
    }
    
    return filtered;
  }, [matches, filters]);
  
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
    // Navigate to budget allocation page
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
        />
        
        {/* Main Layout */}
        <div className="flex gap-6">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block w-72 shrink-0">
            {sidebarContent}
          </div>
          
          {/* Destination Grid */}
          <div className="flex-1">
            {filteredDestinations.length > 0 ? (
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
            
            {/* Ghost Trips Section */}
            <GhostTripsSection
              budget={tripSearch.budget}
              startDate={tripSearch.dates.start || new Date()}
              endDate={tripSearch.dates.end || addDays(new Date(), tripSearch.days - 1)}
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
            start: tripSearch.dates.start || new Date(),
            end: tripSearch.dates.end || addDays(new Date(), tripSearch.days - 1),
          }}
          currentPrice={selectedFlexDestination.estimatedTotalCost}
          baseFlightPrice={selectedFlexDestination.flightCost}
          baseHotelPrice={selectedFlexDestination.accommodationCost}
          onUpdateDates={(newDates, newPrice) => {
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

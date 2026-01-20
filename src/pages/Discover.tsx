import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, Scale } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { DestinationCard } from '@/components/discover/DestinationCard';
import { ComparisonModal } from '@/components/discover/ComparisonModal';
import { DiscoverFilters } from '@/components/discover/DiscoverFilters';
import { matchDestinations } from '@/lib/destinationMatcher';
import { useTravel } from '@/context/TravelContext';
import { DestinationMatch, Destination } from '@/types/destination';

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

export default function Discover() {
  const navigate = useNavigate();
  const { search } = useTravel();
  
  const [sortBy, setSortBy] = useState<'value' | 'cost' | 'weather' | 'crowd'>('value');
  const [regionFilter, setRegionFilter] = useState<Destination['region'] | 'all'>('all');
  const [compareList, setCompareList] = useState<DestinationMatch[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  
  // Match destinations based on user criteria
  const matches = useMemo(() => {
    if (!search) {
      // Demo mode with default values
      return matchDestinations({
        budget: 3000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        travelers: 2,
        tripStyle: 'mid',
      });
    }
    
    return matchDestinations({
      budget: search.budget,
      startDate: search.departureDate ? new Date(search.departureDate) : new Date(),
      endDate: search.returnDate ? new Date(search.returnDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      travelers: search.travelers || 1,
      tripStyle: (search as any).tripStyle || 'mid',
      interests: (search as any).interests,
    });
  }, [search]);
  
  // Apply filters and sorting
  const filteredDestinations = useMemo(() => {
    let filtered = [...matches];
    
    // Region filter
    if (regionFilter !== 'all') {
      filtered = filtered.filter(d => d.region === regionFilter);
    }
    
    // Sorting
    switch (sortBy) {
      case 'cost':
        filtered.sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost);
        break;
      case 'weather':
        filtered.sort((a, b) => b.weatherScore - a.weatherScore);
        break;
      case 'crowd':
        filtered.sort((a, b) => b.crowdScore - a.crowdScore);
        break;
      case 'value':
      default:
        filtered.sort((a, b) => b.valueScore - a.valueScore);
    }
    
    return filtered;
  }, [matches, sortBy, regionFilter]);
  
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
  
  const handleSelectDestination = (destination: DestinationMatch) => {
    // Store selection and navigate to results
    // For now, just close modal
    setShowComparison(false);
    // TODO: Navigate to itinerary generation with selected destination
  };
  
  return (
    <div className="min-h-screen bg-background">
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
            {compareList.length > 0 && (
              <Button onClick={() => setShowComparison(true)} className="gap-2">
                <Scale className="h-4 w-4" />
                Compare ({compareList.length})
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Compass className="h-4 w-4" />
            Discover Destinations
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            {search ? (
              <>
                {matches.length} destinations for your
                <span className="text-primary"> ${search.budget.toLocaleString()}</span> budget
              </>
            ) : (
              <>
                Explore {matches.length}
                <span className="text-primary"> amazing destinations</span>
              </>
            )}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select up to 3 destinations to compare side-by-side. We've ranked them by value, 
            considering cost, weather, and crowd levels for your dates.
          </p>
        </motion.div>
        
        {/* Filters */}
        <DiscoverFilters
          sortBy={sortBy}
          onSortChange={setSortBy}
          regionFilter={regionFilter}
          onRegionChange={setRegionFilter}
          resultCount={filteredDestinations.length}
        />
        
        {/* Destination Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
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
                  onCompare={() => toggleCompare(destination)}
                  compareCount={compareList.length}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        
        {filteredDestinations.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Compass className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">
              No destinations found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or increasing your budget.
            </p>
          </motion.div>
        )}
      </main>
      
      {/* Comparison Modal */}
      <ComparisonModal
        open={showComparison}
        onClose={() => setShowComparison(false)}
        destinations={compareList}
        onSelect={handleSelectDestination}
      />
      
      {/* Floating Compare Button (Mobile) */}
      <AnimatePresence>
        {compareList.length > 0 && !showComparison && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 md:hidden z-50"
          >
            <Button
              size="lg"
              onClick={() => setShowComparison(true)}
              className="shadow-lg gap-2"
            >
              <Scale className="h-5 w-5" />
              Compare {compareList.length} Destinations
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

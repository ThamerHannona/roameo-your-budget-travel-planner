import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  Users, 
  Plane, 
  Hotel, 
  Map, 
  Utensils, 
  Train, 
  Shield,
  RotateCcw,
  Lightbulb,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useTripSearchStore } from '@/stores/tripSearchStore';
import { useSelectedDestinationStore } from '@/stores/selectedDestinationStore';
import { destinations } from '@/data/destinations';
import { matchDestinations } from '@/lib/destinationMatcher';
import type { BudgetBreakdown } from '@/types/trip';
import { DEFAULT_BUDGET_PERCENTAGES } from '@/types/trip';

const categories = [
  { key: 'flights' as keyof BudgetBreakdown, label: 'Flights', icon: Plane, color: 'bg-primary', description: 'Round-trip airfare' },
  { key: 'accommodation' as keyof BudgetBreakdown, label: 'Accommodation', icon: Hotel, color: 'bg-success', description: 'Hotels, hostels, Airbnb' },
  { key: 'activities' as keyof BudgetBreakdown, label: 'Activities', icon: Map, color: 'bg-warning', description: 'Tours, attractions, experiences' },
  { key: 'food' as keyof BudgetBreakdown, label: 'Food & Dining', icon: Utensils, color: 'bg-destructive', description: 'Restaurants, cafes, groceries' },
  { key: 'transportation' as keyof BudgetBreakdown, label: 'Local Transport', icon: Train, color: 'bg-accent-foreground', description: 'Taxis, metro, rentals' },
  { key: 'buffer' as keyof BudgetBreakdown, label: 'Emergency Buffer', icon: Shield, color: 'bg-muted-foreground', description: 'Unexpected expenses' },
];

export default function BudgetAllocation() {
  const navigate = useNavigate();
  const { destinationId } = useParams<{ destinationId: string }>();
  const tripSearch = useTripSearchStore();
  const { 
    destination, 
    setDestination, 
    budgetBreakdown, 
    setBudgetBreakdown, 
    resetBudgetBreakdown 
  } = useSelectedDestinationStore();

  // Find and set destination on mount
  useEffect(() => {
    if (destinationId) {
      // Match destinations to get full DestinationMatch object
      const startDate = tripSearch.dates.start || new Date();
      const endDate = tripSearch.dates.end || new Date(Date.now() + tripSearch.days * 24 * 60 * 60 * 1000);
      
      const matches = matchDestinations({
        budget: tripSearch.budget,
        startDate,
        endDate,
        travelers: tripSearch.travelers,
        tripStyle: tripSearch.travelStyle === 'relaxation' ? 'luxury' : 
                   tripSearch.travelStyle === 'adventure' ? 'budget' : 'mid',
        regions: tripSearch.regions,
      });
      
      const found = matches.find(m => m.id === destinationId);
      if (found) {
        setDestination(found);
      } else {
        // Fallback: try to find in raw destinations and create minimal match
        const rawDest = destinations.find(d => d.id === destinationId);
        if (!rawDest) {
          navigate('/discover');
        }
      }
    }
  }, [destinationId, tripSearch, setDestination, navigate]);

  const totalBudget = tripSearch.budget;
  const days = tripSearch.days;

  // Calculate dollar amounts for each category
  const categoryAmounts = useMemo(() => {
    const amounts: Record<keyof BudgetBreakdown, number> = {} as any;
    (Object.keys(budgetBreakdown) as (keyof BudgetBreakdown)[]).forEach(key => {
      amounts[key] = Math.round((totalBudget * budgetBreakdown[key]) / 100);
    });
    return amounts;
  }, [budgetBreakdown, totalBudget]);

  // Calculate per-day amounts
  const perDayAmounts = useMemo(() => {
    const perDay: Record<keyof BudgetBreakdown, number> = {} as any;
    (Object.keys(categoryAmounts) as (keyof BudgetBreakdown)[]).forEach(key => {
      perDay[key] = Math.round(categoryAmounts[key] / days);
    });
    return perDay;
  }, [categoryAmounts, days]);

  // Smart recommendations based on destination
  const recommendation = useMemo(() => {
    if (!destination) return null;
    
    const flightPercent = budgetBreakdown.flights;
    const actualFlightCost = destination.flightCost;
    const recommendedFlightPercent = Math.round((actualFlightCost / totalBudget) * 100);
    
    if (flightPercent < recommendedFlightPercent - 5) {
      return {
        type: 'warning' as const,
        message: `Flights to ${destination.name} typically cost ~$${actualFlightCost}. Consider allocating at least ${recommendedFlightPercent}% for flights.`,
      };
    }
    
    if (budgetBreakdown.buffer < 5) {
      return {
        type: 'tip' as const,
        message: 'Pro tip: A 5-10% buffer protects against currency fluctuations and unexpected costs.',
      };
    }
    
    if (budgetBreakdown.activities < 15) {
      return {
        type: 'tip' as const,
        message: `${destination.name} has amazing attractions! Consider allocating more for activities.`,
      };
    }
    
    return {
      type: 'success' as const,
      message: 'Your budget allocation looks balanced for this destination!',
    };
  }, [destination, budgetBreakdown, totalBudget]);

  // Handle slider changes
  const handleSliderChange = (key: keyof BudgetBreakdown, newValue: number) => {
    const oldValue = budgetBreakdown[key];
    const diff = newValue - oldValue;
    
    const otherKeys = Object.keys(budgetBreakdown).filter(k => k !== key) as (keyof BudgetBreakdown)[];
    const otherTotal = otherKeys.reduce((sum, k) => sum + budgetBreakdown[k], 0);
    
    if (otherTotal === 0 || diff === 0) {
      setBudgetBreakdown({ ...budgetBreakdown, [key]: newValue });
      return;
    }

    const newBreakdown = { ...budgetBreakdown, [key]: newValue };
    
    otherKeys.forEach((k) => {
      const proportion = budgetBreakdown[k] / otherTotal;
      const adjustment = Math.round(diff * proportion);
      newBreakdown[k] = Math.max(0, budgetBreakdown[k] - adjustment);
    });

    // Ensure total is exactly 100
    const newTotal = Object.values(newBreakdown).reduce((sum, val) => sum + val, 0);
    if (newTotal !== 100) {
      const adjustment = 100 - newTotal;
      const largestKey = otherKeys.reduce((a, b) => 
        newBreakdown[a] > newBreakdown[b] ? a : b
      );
      newBreakdown[largestKey] = Math.max(0, newBreakdown[largestKey] + adjustment);
    }

    setBudgetBreakdown(newBreakdown);
  };

  const handleContinue = () => {
    // Navigate to day-by-day itinerary
    navigate(`/trip/${destinationId}/itinerary`);
  };

  if (!destination) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading destination...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/discover')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Destination Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Destination Image */}
            <div className="w-full md:w-64 h-40 rounded-xl overflow-hidden flex-shrink-0">
              <img 
                src={destination.imageUrl} 
                alt={destination.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Destination Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{destination.flagEmoji}</span>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  {destination.name}, {destination.country}
                </h1>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>From {tripSearch.departureCity || 'your city'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {tripSearch.dates.start 
                      ? format(tripSearch.dates.start, 'MMM d') 
                      : 'Flexible'} - {days} days
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>{tripSearch.travelers} traveler{tripSearch.travelers > 1 ? 's' : ''}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {destination.whyThisWorks}
              </p>
            </div>

            {/* Budget Summary Card */}
            <div className="w-full md:w-auto glass rounded-xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Total Budget</p>
              <p className="text-3xl font-display font-bold text-foreground">
                ${totalBudget.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                ${Math.round(totalBudget / days)}/day
              </p>
            </div>
          </div>
        </motion.div>

        {/* Budget Allocation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-8"
        >
          {/* Main Sliders */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-semibold text-foreground">
                  Customize Your Budget
                </h2>
                <p className="text-sm text-muted-foreground">
                  Drag sliders to adjust how you want to spend
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetBudgetBreakdown}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            {/* Visual Breakdown Bar */}
            <div className="h-10 rounded-full overflow-hidden flex shadow-inner bg-muted">
              {categories.map((cat) => {
                const percentage = budgetBreakdown[cat.key];
                if (percentage === 0) return null;
                
                return (
                  <motion.div
                    key={cat.key}
                    className={cn(cat.color, 'flex items-center justify-center relative group')}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{ minWidth: percentage > 8 ? '40px' : '0' }}
                  >
                    {percentage >= 12 && (
                      <span className="text-xs font-medium text-white">
                        {percentage}%
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Category Sliders */}
            <div className="space-y-6">
              {categories.map((cat, index) => {
                const Icon = cat.icon;
                const percentage = budgetBreakdown[cat.key];
                const amount = categoryAmounts[cat.key];
                const perDay = perDayAmounts[cat.key];

                return (
                  <motion.div
                    key={cat.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', cat.color)}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <span className="font-medium text-foreground">{cat.label}</span>
                          <p className="text-xs text-muted-foreground">{cat.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-display font-bold text-lg text-foreground">
                          ${amount.toLocaleString()}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          ${perDay}/day • {percentage}%
                        </p>
                      </div>
                    </div>
                    <Slider
                      value={[percentage]}
                      onValueChange={([val]) => handleSliderChange(cat.key, val)}
                      max={80}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Smart Recommendation */}
            {recommendation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className={cn(
                  'p-4 rounded-xl border',
                  recommendation.type === 'warning' && 'bg-warning/10 border-warning/30',
                  recommendation.type === 'tip' && 'bg-primary/10 border-primary/30',
                  recommendation.type === 'success' && 'bg-success/10 border-success/30'
                )}
              >
                <div className="flex items-start gap-3">
                  {recommendation.type === 'warning' && <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />}
                  {recommendation.type === 'tip' && <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />}
                  {recommendation.type === 'success' && <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {recommendation.type === 'warning' ? 'Heads Up' : recommendation.type === 'tip' ? 'Pro Tip' : 'Looking Good!'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {recommendation.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Destination Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-xl p-4 border border-border/50"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-display font-semibold text-foreground">
                  {destination.name} Insights
                </h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Flight Cost</span>
                  <span className="font-medium text-foreground">${destination.flightCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Hotel Rate</span>
                  <span className="font-medium text-foreground">${Math.round(destination.accommodationCost / days)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Daily Food</span>
                  <span className="font-medium text-foreground">${Math.round(destination.foodCost / days)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination Total</span>
                  <span className="font-bold text-foreground">${destination.estimatedTotalCost}</span>
                </div>
                
                <div className="pt-3 border-t border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Your Allocated</span>
                    <span className={cn(
                      'font-bold',
                      totalBudget >= destination.estimatedTotalCost ? 'text-success' : 'text-warning'
                    )}>
                      ${totalBudget}
                    </span>
                  </div>
                  {totalBudget >= destination.estimatedTotalCost && (
                    <p className="text-xs text-success mt-1">
                      ✓ ${totalBudget - destination.estimatedTotalCost} buffer room
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass rounded-xl p-4 border border-border/50"
            >
              <h3 className="font-display font-semibold text-foreground mb-3">
                Top Experiences
              </h3>
              <div className="flex flex-wrap gap-2">
                {destination.highlights.slice(0, 4).map((highlight, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1.5 bg-muted rounded-full text-xs text-muted-foreground"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex justify-center"
        >
          <Button
            size="lg"
            onClick={handleContinue}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-display font-semibold rounded-xl shadow-lg"
          >
            Generate My Itinerary
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </main>
    </div>
  );
}

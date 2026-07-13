import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { TripHeader, DayCard, BudgetPanel, ItineraryMap } from '@/components/itinerary';
import { BookingSummaryPanel } from '@/components/booking';
import { PaywallModal } from '@/components/paywall';
import { useItineraryStore } from '@/stores/itineraryStore';
import { useSelectedDestinationStore } from '@/stores/selectedDestinationStore';
import { useTripSearchStore } from '@/stores/tripSearchStore';
import { useBudgetConstraintsStore } from '@/stores/budgetConstraintsStore';
import { usePaymentStore } from '@/stores/paymentStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { fetchDestinationPOIs } from '@/services/activitiesApi';
import { resolveTripDates } from '@/utils/tripDates';
import confetti from 'canvas-confetti';

type POIStatus = 'idle' | 'loading' | 'ready' | 'failed';

export default function DayByDayItinerary() {
  const navigate = useNavigate();
  const { destinationId } = useParams();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [selectedActivityId, setSelectedActivityId] = useState<string>();
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [poiStatus, setPoiStatus] = useState<POIStatus>('idle');
  const poiFetchedForRef = useRef<string | null>(null);

  const { isPaid, checkPaymentStatus, markAsPaid } = usePaymentStore();

  const { destination: selectedDestination, budgetBreakdown } = useSelectedDestinationStore();
  const { budget, travelers, dates } = useTripSearchStore();
  const { getSelectedFlight, getSelectedHotel, getTotalAllocated } = useBudgetConstraintsStore();
  const {
    days,
    totalBudget,
    destination,
    tripDates,
    initializeItinerary,
    reorderActivities,
    addFreeTime,
    removeActivity,
    getTotalSpent,
  } = useItineraryStore();

  // Seed itinerary immediately when destination changes / URL doesn't match store
  useEffect(() => {
    if (!selectedDestination) return;

    const storedDestinationId = destination.name.toLowerCase().replace(/\s+/g, '-');
    const urlMatchesStored =
      destinationId === storedDestinationId ||
      destination.name.toLowerCase() === destinationId?.toLowerCase();

    if (days.length === 0 || !urlMatchesStored) {
      const { start: startDate, end: endDate } = resolveTripDates(dates.start, dates.end, 5);
      initializeItinerary(
        {
          name: selectedDestination.name,
          country: selectedDestination.country,
          imageUrl: selectedDestination.imageUrl,
          coordinates: selectedDestination.coordinates,
        },
        startDate,
        endDate,
        budget,
        travelers,
      );
      // Force a POI re-fetch for the new destination
      poiFetchedForRef.current = null;
    }
  }, [selectedDestination, destinationId, destination.name, days.length, budget, travelers, dates, initializeItinerary]);

  // Fetch real POIs exactly once per destination, independent of re-renders
  useEffect(() => {
    if (!selectedDestination) return;
    const key = selectedDestination.name.toLowerCase();
    if (poiFetchedForRef.current === key) return;
    poiFetchedForRef.current = key;

    const { start: startDate, end: endDate } = resolveTripDates(dates.start, dates.end, 5);
    setPoiStatus('loading');

    fetchDestinationPOIs(selectedDestination.name)
      .then((pois) => {
        const hasAny =
          pois.attractions.length || pois.restaurants.length || pois.museums.length;
        if (!hasAny) {
          setPoiStatus('failed');
          return;
        }
        initializeItinerary(
          {
            name: selectedDestination.name,
            country: selectedDestination.country,
            imageUrl: selectedDestination.imageUrl,
            coordinates: selectedDestination.coordinates,
          },
          startDate,
          endDate,
          budget,
          travelers,
          pois,
        );
        setPoiStatus('ready');
      })
      .catch((err) => {
        console.warn('Failed to fetch real POIs:', err);
        setPoiStatus('failed');
      });
  }, [selectedDestination, dates, budget, travelers, initializeItinerary]);

  // Wait for store hydration before redirecting
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    // Give store time to hydrate from sessionStorage
    const timer = setTimeout(() => setIsHydrated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if no data after hydration
  useEffect(() => {
    if (isHydrated && !selectedDestination && days.length === 0) {
      navigate('/discover');
    }
  }, [selectedDestination, days.length, navigate, isHydrated]);

  const handlePaymentSuccess = () => {
    markAsPaid(destinationId || '');
    setShowPaywall(false);
    
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

    navigate(`/trip/${destinationId || 'lisbon'}/booking`);
  };

  if (days.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading itinerary...</div>
      </div>
    );
  }

  const selectedDay = days.find(d => d.dayNumber === selectedDayNumber) || days[0];
  const activitiesSpent = getTotalSpent();
  const selectedFlight = getSelectedFlight();
  const selectedHotel = getSelectedHotel();
  const budgetAllocated = getTotalAllocated();
  // Single "selected trip total" used by header + booking summary
  const selectedTripTotal = budgetAllocated > 0 ? budgetAllocated : activitiesSpent;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo size="sm" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[1fr,380px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Trip Header */}
            <TripHeader
              destination={destination}
              tripDates={tripDates}
              totalBudget={totalBudget}
              totalSpent={selectedTripTotal}
              travelers={travelers}
              weather={selectedDay.weather}
            />

            {/* POI status banner */}
            {poiStatus === 'loading' && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                Finding real places in {destination.name}…
              </div>
            )}
            {poiStatus === 'failed' && (
              <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning-foreground">
                <AlertCircle className="h-4 w-4 text-warning" />
                Couldn't load live places for {destination.name} — showing a generic itinerary. Try refreshing.
              </div>
            )}

            {/* Day Cards */}
            <div className="space-y-4">
              <h2 className="text-xl font-display font-bold text-foreground">
                Your Itinerary
              </h2>
              {days.map((day) => (
                <DayCard
                  key={day.id}
                  day={day}
                  isSelected={day.dayNumber === selectedDayNumber}
                  onSelectDay={() => setSelectedDayNumber(day.dayNumber)}
                  onReorderActivities={(src, dest) => reorderActivities(day.id, src, dest)}
                  onAddFreeTime={(activityId) => addFreeTime(day.id, activityId)}
                  onRemoveActivity={(activityId) => removeActivity(day.id, activityId)}
                  onViewActivityOnMap={(activityId) => {
                    setSelectedDayNumber(day.dayNumber);
                    setSelectedActivityId(activityId);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Sidebar - Budget, Booking & Map */}
          <div className={isMobile ? 'order-first' : 'space-y-6'}>
            <div className="lg:sticky lg:top-20 space-y-6">
              {/* Booking Summary Panel */}
              <BookingSummaryPanel
                days={days}
                destination={destination}
                tripDates={tripDates}
                travelers={travelers}
                selectedFlightPrice={selectedFlight?.price ?? 0}
                selectedFlightName={selectedFlight ? `${selectedFlight.airline} · ${selectedFlight.tier}` : undefined}
                selectedHotelPrice={selectedHotel?.totalPrice ?? 0}
                selectedHotelName={selectedHotel?.name}
                selectedTripTotal={selectedTripTotal}
                onProceedToBooking={() => {
                  // Check if already paid
                  const hasPaid = checkPaymentStatus(destinationId || '');
                  if (hasPaid) {
                    navigate(`/trip/${destinationId || 'lisbon'}/booking`);
                  } else {
                    setShowPaywall(true);
                  }
                }}
              />


              {/* Budget Panel */}
              <BudgetPanel
                days={days}
                totalBudget={totalBudget}
                budgetBreakdown={budgetBreakdown as unknown as Record<string, number>}
              />

              {/* Map */}
              {!isMobile && (
                <ItineraryMap
                  day={selectedDay}
                  selectedActivityId={selectedActivityId}
                  onActivitySelect={setSelectedActivityId}
                  className="h-[350px]"
                />
              )}
            </div>
          </div>
        </div>

        {/* Mobile Map - Bottom Sheet Style */}
        {isMobile && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl shadow-xl z-30"
          >
            <div className="mx-auto w-12 h-1.5 bg-muted rounded-full my-3" />
            <ItineraryMap
              day={selectedDay}
              selectedActivityId={selectedActivityId}
              onActivitySelect={setSelectedActivityId}
              className="h-[250px]"
            />
          </motion.div>
        )}
      </main>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPaymentSuccess={handlePaymentSuccess}
        tripDetails={{
          destination: destination.name,
          country: destination.country,
          days: days.length,
          totalCost: selectedTripTotal,
          travelers,
        }}
      />
    </div>
  );
}

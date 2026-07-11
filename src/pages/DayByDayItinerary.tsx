import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { TripHeader, DayCard, BudgetPanel, ItineraryMap } from '@/components/itinerary';
import { BookingSummaryPanel } from '@/components/booking';
import { PaywallModal } from '@/components/paywall';
import { useItineraryStore } from '@/stores/itineraryStore';
import { useSelectedDestinationStore } from '@/stores/selectedDestinationStore';
import { useTripSearchStore } from '@/stores/tripSearchStore';
import { usePaymentStore } from '@/stores/paymentStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { fetchDestinationPOIs } from '@/services/activitiesApi';
import confetti from 'canvas-confetti';

export default function DayByDayItinerary() {
  const navigate = useNavigate();
  const { destinationId } = useParams();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [selectedActivityId, setSelectedActivityId] = useState<string>();
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const { isPaid, checkPaymentStatus, markAsPaid } = usePaymentStore();

  const { destination: selectedDestination, budgetBreakdown } = useSelectedDestinationStore();
  const { budget, travelers, dates } = useTripSearchStore();
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

  // Clear and re-initialize if destination ID doesn't match stored destination
  useEffect(() => {
    // Check if the URL destinationId matches the stored destination
    const storedDestinationId = destination.name.toLowerCase().replace(/\s+/g, '-');
    const urlMatchesStored = destinationId === storedDestinationId || 
                             destination.name.toLowerCase() === destinationId?.toLowerCase();
    
    // If we have a selectedDestination from the store and either:
    // 1. No days exist yet, or
    // 2. The URL doesn't match what's stored (user selected a different destination)
    if (selectedDestination && (days.length === 0 || !urlMatchesStored)) {
      const startDate = dates.start || new Date();
      const endDate = dates.end || new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
      
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
        travelers
      );
    }
  }, [selectedDestination, days.length, budget, travelers, dates, initializeItinerary, destinationId, destination.name]);

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
  const totalSpent = getTotalSpent();

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
              totalSpent={totalSpent}
              travelers={travelers}
              weather={selectedDay.weather}
            />

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
          totalCost: totalSpent,
          travelers,
        }}
      />
    </div>
  );
}

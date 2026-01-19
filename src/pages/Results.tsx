import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Building2, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { BudgetTracker } from '@/components/BudgetTracker';
import { FlightCard } from '@/components/FlightCard';
import { HotelCard } from '@/components/HotelCard';
import { LoadingCard } from '@/components/LoadingCard';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTravel } from '@/context/TravelContext';
import { mockFlights, mockReturnFlights, mockHotels } from '@/data/mockData';
import { Flight, Hotel } from '@/types/travel';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const Results = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { 
    search, 
    selections, 
    selectOutboundFlight, 
    selectReturnFlight, 
    selectHotel,
    getTotalCost,
    getRemainingBudget
  } = useTravel();

  useEffect(() => {
    if (!search) {
      navigate('/');
    }
  }, [search, navigate]);

  // Simulate loading state for API calls
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!search) return null;

  // Calculate nights for hotel pricing
  const departDate = new Date(search.departureDate);
  const returnDate = new Date(search.returnDate);
  const nights = Math.ceil((returnDate.getTime() - departDate.getTime()) / (1000 * 60 * 60 * 24));

  // Filter by budget
  const budgetFlights = mockFlights.filter(f => f.price <= search.budget / 3);
  const budgetReturnFlights = mockReturnFlights.filter(f => f.price <= search.budget / 3);
  const budgetHotels = mockHotels.map(h => ({
    ...h,
    totalPrice: h.pricePerNight * nights,
  })).filter(h => h.totalPrice <= search.budget / 2);

  const handleFlightSelect = (flight: Flight, type: 'outbound' | 'return') => {
    if (type === 'outbound') {
      selectOutboundFlight(selections.outboundFlight?.id === flight.id ? null : flight);
    } else {
      selectReturnFlight(selections.returnFlight?.id === flight.id ? null : flight);
    }
  };

  const handleHotelSelect = (hotel: Hotel) => {
    selectHotel(selections.hotel?.id === hotel.id ? null : hotel);
  };

  const canProceed = selections.outboundFlight && selections.returnFlight && selections.hotel;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            <div className="flex-1 max-w-md mx-8">
              <BudgetTracker />
            </div>
            <Button
              onClick={() => navigate('/itinerary')}
              disabled={!canProceed}
              className="gradient-sunset hover:opacity-90"
            >
              Review Itinerary
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Trip Summary */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="font-medium text-foreground">{search.origin}</span>
            <ArrowRight className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">{search.destination}</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">
              {new Date(search.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(search.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">{nights} nights</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">{search.travelers} traveler{search.travelers > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Flights Column - Left */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plane className="h-5 w-5 text-primary" />
                  Flights
                  {(selections.outboundFlight || selections.returnFlight) && (
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full ml-auto">
                      {(selections.outboundFlight ? 1 : 0) + (selections.returnFlight ? 1 : 0)}/2 selected
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Outbound Flights */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">OUTBOUND</span>
                    {search.origin} → {search.destination}
                  </h3>
                  <ScrollArea className="h-[300px] pr-4">
                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <LoadingCard key={i} type="flight" />
                        ))}
                      </div>
                    ) : budgetFlights.length === 0 ? (
                      <EmptyState type="flight" />
                    ) : (
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-3"
                      >
                        {budgetFlights.map((flight) => {
                          const isAdded = selections.outboundFlight?.id === flight.id;
                          const wouldExceedBudget = getRemainingBudget() - flight.price < 0;
                          return (
                            <FlightCard
                              key={flight.id}
                              flight={flight}
                              type="outbound"
                              isAdded={isAdded}
                              onAdd={(f) => handleFlightSelect(f, 'outbound')}
                              budgetExceeded={wouldExceedBudget}
                            />
                          );
                        })}
                      </motion.div>
                    )}
                  </ScrollArea>
                </div>

                {/* Return Flights */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">RETURN</span>
                    {search.destination} → {search.origin}
                  </h3>
                  <ScrollArea className="h-[300px] pr-4">
                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <LoadingCard key={i} type="flight" />
                        ))}
                      </div>
                    ) : budgetReturnFlights.length === 0 ? (
                      <EmptyState type="flight" message="No return flights found within your budget" />
                    ) : (
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-3"
                      >
                        {budgetReturnFlights.map((flight) => {
                          const isAdded = selections.returnFlight?.id === flight.id;
                          const wouldExceedBudget = getRemainingBudget() - flight.price < 0;
                          return (
                            <FlightCard
                              key={flight.id}
                              flight={flight}
                              type="return"
                              isAdded={isAdded}
                              onAdd={(f) => handleFlightSelect(f, 'return')}
                              budgetExceeded={wouldExceedBudget}
                            />
                          );
                        })}
                      </motion.div>
                    )}
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hotels Column - Right */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Hotels in {search.destination}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({nights} nights)
                  </span>
                  {selections.hotel && (
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full ml-auto">
                      1 selected
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[660px] pr-4">
                  {isLoading ? (
                    <div className="grid gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <LoadingCard key={i} type="hotel" />
                      ))}
                    </div>
                  ) : budgetHotels.length === 0 ? (
                    <EmptyState type="hotel" />
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid gap-4"
                    >
                      {budgetHotels.map((hotel) => (
                        <HotelCard
                          key={hotel.id}
                          hotel={hotel}
                          nights={nights}
                          isSelected={selections.hotel?.id === hotel.id}
                          onSelect={handleHotelSelect}
                        />
                      ))}
                    </motion.div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Floating Summary */}
      {canProceed && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 glass rounded-2xl px-6 py-4 shadow-xl border border-border"
        >
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-2xl font-display font-bold text-primary">${getTotalCost().toLocaleString()}</p>
            </div>
            <Button
              onClick={() => navigate('/itinerary')}
              size="lg"
              className="gradient-sunset hover:opacity-90"
            >
              Review Itinerary
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Results;

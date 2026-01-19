import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Building2, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { BudgetTracker } from '@/components/BudgetTracker';
import { FlightCard } from '@/components/FlightCard';
import { HotelCard } from '@/components/HotelCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const { 
    search, 
    selections, 
    selectOutboundFlight, 
    selectReturnFlight, 
    selectHotel,
    getTotalCost 
  } = useTravel();

  useEffect(() => {
    if (!search) {
      navigate('/');
    }
  }, [search, navigate]);

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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="flights" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="flights" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Flights
              {(selections.outboundFlight || selections.returnFlight) && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {(selections.outboundFlight ? 1 : 0) + (selections.returnFlight ? 1 : 0)}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="hotels" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Hotels
              {selections.hotel && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">1</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flights" className="space-y-8">
            {/* Outbound Flights */}
            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                Outbound Flights
                <span className="text-sm font-normal text-muted-foreground">
                  ({search.origin} → {search.destination})
                </span>
              </h2>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-2 gap-4"
              >
                {budgetFlights.map((flight) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    type="outbound"
                    isSelected={selections.outboundFlight?.id === flight.id}
                    onSelect={(f) => handleFlightSelect(f, 'outbound')}
                  />
                ))}
              </motion.div>
              {budgetFlights.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No flights found within your budget.</p>
              )}
            </section>

            {/* Return Flights */}
            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary rotate-180" />
                Return Flights
                <span className="text-sm font-normal text-muted-foreground">
                  ({search.destination} → {search.origin})
                </span>
              </h2>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-2 gap-4"
              >
                {budgetReturnFlights.map((flight) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    type="return"
                    isSelected={selections.returnFlight?.id === flight.id}
                    onSelect={(f) => handleFlightSelect(f, 'return')}
                  />
                ))}
              </motion.div>
              {budgetReturnFlights.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No return flights found within your budget.</p>
              )}
            </section>
          </TabsContent>

          <TabsContent value="hotels">
            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Hotels in {search.destination}
                <span className="text-sm font-normal text-muted-foreground">
                  ({nights} nights)
                </span>
              </h2>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
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
              {budgetHotels.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No hotels found within your budget.</p>
              )}
            </section>
          </TabsContent>
        </Tabs>
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

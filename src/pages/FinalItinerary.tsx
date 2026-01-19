import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Plane, Building2, Calendar, MapPin, Clock, ArrowRight, Share2, Download, Home } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useTravel } from '@/context/TravelContext';
import { useToast } from '@/hooks/use-toast';

const FinalItinerary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { search, selections, getTotalCost, clearAll } = useTravel();

  useEffect(() => {
    if (!search || !selections.outboundFlight || !selections.returnFlight || !selections.hotel) {
      navigate('/');
    }
  }, [search, selections, navigate]);

  if (!search || !selections.outboundFlight || !selections.returnFlight || !selections.hotel) {
    return null;
  }

  const departDate = new Date(search.departureDate);
  const returnDate = new Date(search.returnDate);
  const nights = Math.ceil((returnDate.getTime() - departDate.getTime()) / (1000 * 60 * 60 * 24));

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Trip to ${search.destination}`,
        text: `Check out my trip to ${search.destination}! Total: $${getTotalCost().toLocaleString()}`,
        url: window.location.href,
      });
    } catch {
      toast({
        title: 'Link copied!',
        description: 'Share link has been copied to your clipboard.',
      });
    }
  };

  const handleNewTrip = () => {
    clearAll();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Confetti/Celebration Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
        <div className="absolute top-20 right-20 w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-32 left-1/4 w-4 h-4 bg-success rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-16 right-1/3 w-2 h-2 bg-warning rounded-full animate-bounce" style={{ animationDelay: '0.7s' }} />
      </div>

      {/* Header */}
      <header className="border-b border-border bg-card relative z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            <Button variant="ghost" onClick={handleNewTrip}>
              <Home className="mr-2 h-4 w-4" />
              New Trip
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-sunset mb-6 shadow-glow animate-pulse-glow">
              <Check className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Your trip is ready! 🎉
            </h1>
            <p className="text-muted-foreground text-lg">
              Here's your complete itinerary for {search.destination}
            </p>
          </motion.div>

          {/* Printable Itinerary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="gradient-sunset p-6 text-primary-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Your Trip</p>
                  <h2 className="text-2xl font-display font-bold">{search.origin} → {search.destination}</h2>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90">Total Cost</p>
                  <p className="text-3xl font-display font-bold">${getTotalCost().toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm opacity-90">
                <span>{new Date(search.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(search.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>•</span>
                <span>{nights} nights</span>
                <span>•</span>
                <span>{search.travelers} traveler{search.travelers > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Outbound Flight */}
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Plane className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-foreground">{selections.outboundFlight.airline}</h3>
                    <span className="font-bold text-primary">${selections.outboundFlight.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(search.departureDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {selections.outboundFlight.departureTime} - {selections.outboundFlight.arrivalTime}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selections.outboundFlight.departure.airport} → {selections.outboundFlight.arrival.airport} • {selections.outboundFlight.duration}
                  </p>
                  <Button variant="link" className="p-0 h-auto mt-2 text-primary">
                    Book on {selections.outboundFlight.airline} →
                  </Button>
                </div>
              </div>

              <hr className="border-border" />

              {/* Hotel */}
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-foreground">{selections.hotel.name}</h3>
                    <span className="font-bold text-primary">${selections.hotel.totalPrice}</span>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selections.hotel.location}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {nights} nights • ${selections.hotel.pricePerNight}/night
                  </p>
                  <div className="flex gap-2 mt-2">
                    {selections.hotel.amenities.slice(0, 3).map((amenity) => (
                      <span key={amenity} className="bg-muted px-2 py-0.5 rounded-full text-xs capitalize">
                        {amenity}
                      </span>
                    ))}
                  </div>
                  <Button variant="link" className="p-0 h-auto mt-2 text-primary">
                    Book on {selections.hotel.name.split(' ')[0]} →
                  </Button>
                </div>
              </div>

              <hr className="border-border" />

              {/* Return Flight */}
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Plane className="h-6 w-6 text-primary rotate-180" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-foreground">{selections.returnFlight.airline}</h3>
                    <span className="font-bold text-primary">${selections.returnFlight.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(search.returnDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {selections.returnFlight.departureTime} - {selections.returnFlight.arrivalTime}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selections.returnFlight.departure.airport} → {selections.returnFlight.arrival.airport} • {selections.returnFlight.duration}
                  </p>
                  <Button variant="link" className="p-0 h-auto mt-2 text-primary">
                    Book on {selections.returnFlight.airline} →
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button onClick={handleShare} size="lg" className="gradient-sunset hover:opacity-90">
              <Share2 className="mr-2 h-5 w-5" />
              Share Itinerary
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.print()}>
              <Download className="mr-2 h-5 w-5" />
              Download PDF
            </Button>
            <Button variant="ghost" size="lg" onClick={handleNewTrip}>
              Plan Another Trip
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default FinalItinerary;

import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Building2, Calendar, MapPin, Clock, ArrowRight, ArrowLeft, Check, ExternalLink } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useTravel } from '@/context/TravelContext';

const Itinerary = () => {
  const navigate = useNavigate();
  const { search, selections, getTotalCost, getRemainingBudget } = useTravel();

  useEffect(() => {
    if (!search || !selections.outboundFlight || !selections.returnFlight || !selections.hotel) {
      navigate('/results');
    }
  }, [search, selections, navigate]);

  if (!search || !selections.outboundFlight || !selections.returnFlight || !selections.hotel) {
    return null;
  }

  const remaining = getRemainingBudget();
  const isUnderBudget = remaining >= 0;

  const departDate = new Date(search.departureDate);
  const returnDate = new Date(search.returnDate);
  const nights = Math.ceil((returnDate.getTime() - departDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            <Link to="/results">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Modify Selection
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Your Trip to {search.destination}
            </h1>
            <p className="text-muted-foreground">
              {new Date(search.departureDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} - {new Date(search.returnDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Budget Summary */}
          <div className={`rounded-2xl p-6 ${isUnderBudget ? 'bg-success/10 border border-success/30' : 'bg-destructive/10 border border-destructive/30'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isUnderBudget ? 'text-success' : 'text-destructive'}`}>
                  {isUnderBudget ? '✨ Under Budget!' : '⚠️ Over Budget'}
                </p>
                <p className="text-2xl font-display font-bold text-foreground">
                  ${getTotalCost().toLocaleString()} <span className="text-base font-normal text-muted-foreground">of ${search.budget.toLocaleString()} budget</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {isUnderBudget ? 'Savings' : 'Overage'}
                </p>
                <p className={`text-2xl font-display font-bold ${isUnderBudget ? 'text-success' : 'text-destructive'}`}>
                  ${Math.abs(remaining).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            {/* Outbound Flight */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl p-6 shadow-md border border-border"
            >
              <div className="flex items-start gap-4">
                <div className="gradient-sunset p-3 rounded-xl">
                  <Plane className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-bold text-lg text-foreground">Outbound Flight</h3>
                    <span className="text-lg font-bold text-primary">${selections.outboundFlight.price}</span>
                  </div>
                  <p className="text-muted-foreground mb-3">{selections.outboundFlight.airline}</p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(search.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{selections.outboundFlight.departureTime} - {selections.outboundFlight.arrivalTime}</span>
                    </div>
                    <span className="text-muted-foreground">({selections.outboundFlight.duration})</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3 text-sm">
                    <span className="font-medium">{selections.outboundFlight.departure.airport}</span>
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <span className="font-medium">{selections.outboundFlight.arrival.airport}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Hotel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl p-6 shadow-md border border-border"
            >
              <div className="flex items-start gap-4">
                <div className="gradient-sunset p-3 rounded-xl">
                  <Building2 className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-bold text-lg text-foreground">{selections.hotel.name}</h3>
                    <span className="text-lg font-bold text-primary">${selections.hotel.totalPrice}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4" />
                    <span>{selections.hotel.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{nights} nights</span>
                    </div>
                    <span className="text-muted-foreground">${selections.hotel.pricePerNight}/night</span>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    {selections.hotel.amenities.slice(0, 4).map((amenity) => (
                      <span key={amenity} className="bg-muted px-2 py-1 rounded-full text-xs text-muted-foreground capitalize">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Return Flight */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl p-6 shadow-md border border-border"
            >
              <div className="flex items-start gap-4">
                <div className="gradient-sunset p-3 rounded-xl">
                  <Plane className="h-6 w-6 text-primary-foreground rotate-180" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-bold text-lg text-foreground">Return Flight</h3>
                    <span className="text-lg font-bold text-primary">${selections.returnFlight.price}</span>
                  </div>
                  <p className="text-muted-foreground mb-3">{selections.returnFlight.airline}</p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(search.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{selections.returnFlight.departureTime} - {selections.returnFlight.arrivalTime}</span>
                    </div>
                    <span className="text-muted-foreground">({selections.returnFlight.duration})</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3 text-sm">
                    <span className="font-medium">{selections.returnFlight.departure.airport}</span>
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <span className="font-medium">{selections.returnFlight.arrival.airport}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Button
              onClick={() => navigate('/final')}
              size="lg"
              className="gradient-sunset hover:opacity-90"
            >
              <Check className="mr-2 h-5 w-5" />
              Confirm Itinerary
            </Button>
            <Button variant="outline" size="lg">
              <ExternalLink className="mr-2 h-5 w-5" />
              Share Trip
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Itinerary;

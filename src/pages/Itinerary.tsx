import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Building2, Calendar, MapPin, Clock, ArrowRight, ArrowLeft, Check, ExternalLink, X, AlertTriangle, Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTravel } from '@/context/TravelContext';

const Itinerary = () => {
  const navigate = useNavigate();
  const { 
    search, 
    selections, 
    getTotalCost, 
    getRemainingBudget,
    selectOutboundFlight,
    selectReturnFlight,
    selectHotel
  } = useTravel();

  useEffect(() => {
    if (!search) {
      navigate('/');
    }
  }, [search, navigate]);

  if (!search) {
    return null;
  }

  const remaining = getRemainingBudget();
  const isUnderBudget = remaining >= 0;
  const hasSelections = selections.outboundFlight || selections.returnFlight || selections.hotel;
  const isComplete = selections.outboundFlight && selections.returnFlight && selections.hotel;

  const departDate = new Date(search.departureDate);
  const returnDate = new Date(search.returnDate);
  const nights = Math.ceil((returnDate.getTime() - departDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate totals
  const flightsTotal = (selections.outboundFlight?.price || 0) + (selections.returnFlight?.price || 0);
  const hotelsTotal = selections.hotel?.totalPrice || 0;

  // Empty State
  if (!hasSelections) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Logo size="sm" />
              <Link to="/results">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Results
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="bg-muted/50 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
              <Sparkles className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                No Items Selected Yet
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Head back to the results page to select flights and a hotel for your trip to {search.destination}.
              </p>
            </div>
            <Button
              onClick={() => navigate('/results')}
              className="gradient-sunset hover:opacity-90"
            >
              Browse Flights & Hotels
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

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
              {departDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} - {returnDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Over Budget Warning */}
          {!isUnderBudget && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Alert variant="destructive" className="border-destructive bg-destructive/10">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle className="font-display font-bold">Over Budget by ${Math.abs(remaining).toLocaleString()}</AlertTitle>
                <AlertDescription>
                  Your current selections exceed your ${search.budget.toLocaleString()} budget. Consider removing some items or choosing more affordable options.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Selected Items */}
          <div className="space-y-4">
            {/* Outbound Flight */}
            {selections.outboundFlight && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl p-6 shadow-md border border-border relative group"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => selectOutboundFlight(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex items-start gap-4">
                  <div className="gradient-sunset p-3 rounded-xl">
                    <Plane className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2 pr-8">
                      <h3 className="font-display font-bold text-lg text-foreground">Outbound Flight</h3>
                      <span className="text-lg font-bold text-primary">${selections.outboundFlight.price}</span>
                    </div>
                    <p className="text-muted-foreground mb-3">{selections.outboundFlight.airline}</p>
                    
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{departDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
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
            )}

            {/* Hotel */}
            {selections.hotel && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl p-6 shadow-md border border-border relative group"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => selectHotel(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex items-start gap-4">
                  <div className="gradient-sunset p-3 rounded-xl">
                    <Building2 className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2 pr-8">
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
                    
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {selections.hotel.amenities.slice(0, 4).map((amenity) => (
                        <span key={amenity} className="bg-muted px-2 py-1 rounded-full text-xs text-muted-foreground capitalize">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Return Flight */}
            {selections.returnFlight && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-xl p-6 shadow-md border border-border relative group"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => selectReturnFlight(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex items-start gap-4">
                  <div className="gradient-sunset p-3 rounded-xl">
                    <Plane className="h-6 w-6 text-primary-foreground rotate-180" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2 pr-8">
                      <h3 className="font-display font-bold text-lg text-foreground">Return Flight</h3>
                      <span className="text-lg font-bold text-primary">${selections.returnFlight.price}</span>
                    </div>
                    <p className="text-muted-foreground mb-3">{selections.returnFlight.airline}</p>
                    
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{returnDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
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
            )}
          </div>

          {/* Budget Breakdown Table */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Budget Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Plane className="h-4 w-4 text-primary" />
                        Flights ({selections.outboundFlight ? 1 : 0} + {selections.returnFlight ? 1 : 0})
                      </div>
                    </TableCell>
                    <TableCell className="text-right">${flightsTotal.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        Hotel ({nights} nights)
                      </div>
                    </TableCell>
                    <TableCell className="text-right">${hotelsTotal.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold text-primary">${getTotalCost().toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-bold">Budget</TableCell>
                    <TableCell className="text-right">${search.budget.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow className={isUnderBudget ? 'text-success' : 'text-destructive'}>
                    <TableCell className="font-bold">{isUnderBudget ? 'Remaining' : 'Over Budget'}</TableCell>
                    <TableCell className="text-right font-bold">${Math.abs(remaining).toLocaleString()}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

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
              disabled={!isComplete}
            >
              <Check className="mr-2 h-5 w-5" />
              Build Final Itinerary
            </Button>
            <Button variant="outline" size="lg">
              <ExternalLink className="mr-2 h-5 w-5" />
              Share Trip
            </Button>
          </motion.div>

          {!isComplete && (
            <p className="text-center text-sm text-muted-foreground">
              Select all items (outbound flight, return flight, and hotel) to build your final itinerary.
            </p>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Itinerary;

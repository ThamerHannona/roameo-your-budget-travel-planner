import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, 
  Hotel, 
  MapPin, 
  ExternalLink, 
  Check, 
  Clock,
  Calendar,
  CreditCard,
  ArrowLeft,
  Download,
  Share2,
  Mail,
  Printer,
  CheckCircle2,
  AlertCircle,
  PartyPopper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/Logo';
import { useItineraryStore } from '@/stores/itineraryStore';
import { useSelectedDestinationStore } from '@/stores/selectedDestinationStore';
import { useTripSearchStore } from '@/stores/tripSearchStore';
import { useBudgetConstraintsStore } from '@/stores/budgetConstraintsStore';
import { cn } from '@/lib/utils';

interface BookingItem {
  id: string;
  type: 'flight' | 'hotel' | 'activity';
  name: string;
  description: string;
  price: number;
  bookingUrl?: string;
  isBooked: boolean;
  date?: string;
  time?: string;
  provider?: string;
}

export default function FinalBooking() {
  const navigate = useNavigate();
  const { destinationId } = useParams();
  const { toast } = useToast();
  const [bookedItems, setBookedItems] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);

  const { days, destination: itineraryDestination, tripDates, totalBudget, initializeItinerary } = useItineraryStore();
  const { destination: selectedDestination } = useSelectedDestinationStore();
  const tripSearch = useTripSearchStore();
  const { destinationBudget, getSelectedFlight, getSelectedHotel } = useBudgetConstraintsStore();
  
  const travelers = tripSearch.travelers || 1;

  // Get the correct destination - prefer selected destination, then itinerary destination
  const destination = selectedDestination ? {
    name: selectedDestination.name,
    country: selectedDestination.country,
    imageUrl: selectedDestination.imageUrl,
    coordinates: selectedDestination.coordinates || { lat: 0, lng: 0 },
  } : itineraryDestination;

  // Sync destination with URL if mismatch
  useEffect(() => {
    if (destinationId && selectedDestination) {
      const urlDestination = destinationId.replace(/-/g, ' ').toLowerCase();
      const storeDestination = selectedDestination.name.toLowerCase();
      
      if (urlDestination !== storeDestination && itineraryDestination.name.toLowerCase() !== storeDestination) {
        // Re-initialize itinerary with correct destination
        const startDate = tripSearch.dates.start || new Date();
        const endDate = tripSearch.dates.end || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        
        initializeItinerary(
          {
            name: selectedDestination.name,
            country: selectedDestination.country,
            imageUrl: selectedDestination.imageUrl,
            coordinates: selectedDestination.coordinates || { lat: 0, lng: 0 },
          },
          startDate,
          endDate,
          destinationBudget.totalBudget,
          travelers
        );
      }
    }
  }, [destinationId, selectedDestination, itineraryDestination.name, initializeItinerary, tripSearch, destinationBudget.totalBudget, travelers]);

  // Get actual selected flight and hotel from budget constraints store
  const selectedFlight = getSelectedFlight();
  const selectedHotel = getSelectedHotel();

  // Get real flight cost (already includes all travelers)
  const flightCost = selectedFlight?.price || destinationBudget.constraints.flights.current || 0;
  
  // Get real hotel cost
  const hotelCost = selectedHotel?.totalPrice || destinationBudget.constraints.hotels.current || 0;

  // Calculate nights
  const nights = Math.ceil(
    (tripDates.end.getTime() - tripDates.start.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Extract bookable items from itinerary
  const bookingItems: BookingItem[] = [];
  // Build proper search URLs with dates and destination
  const formatDateForUrl = (date: Date) => date.toISOString().split('T')[0];
  const departDate = formatDateForUrl(tripDates.start);
  const returnDate = formatDateForUrl(tripDates.end);
  
  const flightSearchUrl = `https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(destination.name)}&d1=${departDate}&d2=${returnDate}&curr=USD`;
  const hotelSearchUrl = `https://www.google.com/travel/hotels?q=hotels+in+${encodeURIComponent(destination.name)}&dates=${departDate}_${returnDate}&guests=${travelers}`;
  
  // Add flight booking with real data
  bookingItems.push({
    id: 'flight-outbound',
    type: 'flight',
    name: `Flight to ${destination.name}`,
    description: selectedFlight 
      ? `${selectedFlight.airline} • ${selectedFlight.duration} • ${selectedFlight.stops === 0 ? 'Direct' : `${selectedFlight.stops} stop(s)`}`
      : 'Round-trip economy • Multiple airlines available',
    price: flightCost,
    bookingUrl: flightSearchUrl,
    isBooked: bookedItems.has('flight-outbound'),
    date: tripDates.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    provider: 'Google Flights',
  });

  // Add hotel booking with real data
  bookingItems.push({
    id: 'hotel-stay',
    type: 'hotel',
    name: selectedHotel ? `${selectedHotel.tier} - ${nights}-night stay` : `${nights}-night hotel stay`,
    description: selectedHotel 
      ? `${selectedHotel.name} • ${selectedHotel.amenities.slice(0, 2).join(', ')}`
      : `${destination.name} • Various options available`,
    price: hotelCost,
    bookingUrl: hotelSearchUrl,
    isBooked: bookedItems.has('hotel-stay'),
    provider: 'Google Hotels',
  });

  // Add activities from itinerary
  days.forEach((day) => {
    day.activities.forEach((activity) => {
      if (activity.bookingUrl && activity.cost > 0 && activity.type !== 'flight' && activity.type !== 'hotel') {
        bookingItems.push({
          id: activity.id,
          type: 'activity',
          name: activity.name,
          description: `${activity.duration} • ${activity.location.name}`,
          price: activity.cost,
          bookingUrl: activity.bookingUrl,
          isBooked: bookedItems.has(activity.id),
          date: day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          time: activity.time,
          provider: 'GetYourGuide',
        });
      }
    });
  });

  // Calculate totals - flight already includes all travelers
  const flightTotal = flightCost;
  const hotelTotal = hotelCost;
  const activityTotal = bookingItems
    .filter(i => i.type === 'activity')
    .reduce((sum, i) => sum + i.price, 0) * travelers;
  const grandTotal = flightTotal + hotelTotal + activityTotal;

  const bookedCount = bookedItems.size;
  const progress = (bookedCount / bookingItems.length) * 100;

  const handleBookItem = (item: BookingItem) => {
    if (item.bookingUrl) {
      window.open(item.bookingUrl, '_blank');
    }
  };

  const handleMarkAsBooked = (itemId: string) => {
    const newBooked = new Set(bookedItems);
    if (newBooked.has(itemId)) {
      newBooked.delete(itemId);
    } else {
      newBooked.add(itemId);
    }
    setBookedItems(newBooked);

    // Check if all items are booked
    if (newBooked.size === bookingItems.length && !showConfetti) {
      setShowConfetti(true);
      toast({
        title: "🎉 All bookings complete!",
        description: "Your trip is fully booked. Have an amazing adventure!",
      });
    }
  };

  const handleExportPDF = () => {
    toast({
      title: "Exporting itinerary...",
      description: "Your PDF will download shortly.",
    });
    // In production, this would generate a real PDF
    window.print();
  };

  const handleEmailItinerary = () => {
    const subject = encodeURIComponent(`My ${destination.name} Trip Itinerary`);
    const body = encodeURIComponent(
      `Check out my upcoming trip to ${destination.name}!\n\n` +
      `Dates: ${tripDates.start.toLocaleDateString()} - ${tripDates.end.toLocaleDateString()}\n` +
      `Total Budget: $${grandTotal.toLocaleString()}\n\n` +
      `View full itinerary: ${window.location.href}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${destination.name} Trip`,
          text: `Check out my trip to ${destination.name}!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Share this link with your travel companions.",
      });
    }
  };

  const getIcon = (type: BookingItem['type']) => {
    switch (type) {
      case 'flight': return Plane;
      case 'hotel': return Hotel;
      case 'activity': return MapPin;
    }
  };

  const getProviderColor = (provider?: string) => {
    switch (provider) {
      case 'Google Flights': return 'bg-blue-500/10 text-blue-600';
      case 'Booking.com': return 'bg-blue-600/10 text-blue-700';
      case 'GetYourGuide': return 'bg-orange-500/10 text-orange-600';
      case 'Viator': return 'bg-green-500/10 text-green-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (days.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">No itinerary found</p>
          <Button onClick={() => navigate('/discover')} className="mt-4">
            Start Planning
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Trip Summary Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-display font-bold mb-2">
            Book Your Trip to {destination.name}
          </h1>
          <p className="text-muted-foreground">
            {tripDates.start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {' '}
            {tripDates.end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {' '} • {travelers} traveler{travelers > 1 ? 's' : ''}
          </p>
        </motion.div>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Booking Progress</span>
              <span className="text-sm text-muted-foreground">
                {bookedCount}/{bookingItems.length} items booked
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            {progress === 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 mt-3 text-green-600"
              >
                <PartyPopper className="h-5 w-5" />
                <span className="font-medium">All bookings complete!</span>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Booking Sections */}
        <div className="space-y-6">
          {/* Flights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-blue-500" />
                Flights
              </CardTitle>
              <CardDescription>Book your round-trip flights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {bookingItems.filter(i => i.type === 'flight').map((item) => (
                <BookingItemRow
                  key={item.id}
                  item={item}
                  isBooked={bookedItems.has(item.id)}
                  onBook={() => handleBookItem(item)}
                  onMarkBooked={() => handleMarkAsBooked(item.id)}
                  getIcon={getIcon}
                  getProviderColor={getProviderColor}
                />
              ))}
            </CardContent>
          </Card>

          {/* Hotels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hotel className="h-5 w-5 text-purple-500" />
                Accommodation
              </CardTitle>
              <CardDescription>Book your hotel or rental</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {bookingItems.filter(i => i.type === 'hotel').map((item) => (
                <BookingItemRow
                  key={item.id}
                  item={item}
                  isBooked={bookedItems.has(item.id)}
                  onBook={() => handleBookItem(item)}
                  onMarkBooked={() => handleMarkAsBooked(item.id)}
                  getIcon={getIcon}
                  getProviderColor={getProviderColor}
                />
              ))}
            </CardContent>
          </Card>

          {/* Activities */}
          {bookingItems.filter(i => i.type === 'activity').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-amber-500" />
                  Activities & Experiences
                </CardTitle>
                <CardDescription>Optional bookings for tours and attractions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {bookingItems.filter(i => i.type === 'activity').map((item) => (
                  <BookingItemRow
                    key={item.id}
                    item={item}
                    isBooked={bookedItems.has(item.id)}
                    onBook={() => handleBookItem(item)}
                    onMarkBooked={() => handleMarkAsBooked(item.id)}
                    getIcon={getIcon}
                    getProviderColor={getProviderColor}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Total & Actions */}
        <Card className="mt-8 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Estimated Total</p>
                <p className="text-3xl font-bold">${grandTotal.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  For {travelers} traveler{travelers > 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={handleEmailItinerary}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email Itinerary
                </Button>
                <Button variant="outline" onClick={handleExportPDF}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print / PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Travel Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Pre-Trip Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: 'Passport valid for 6+ months', icon: '🛂' },
                { label: 'Travel insurance purchased', icon: '🛡️' },
                { label: 'Bank notified of travel', icon: '💳' },
                { label: 'Phone plan/eSIM for abroad', icon: '📱' },
                { label: 'Accommodations confirmed', icon: '🏨' },
                { label: 'Important docs backed up', icon: '📄' },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50">
                  <Checkbox id={`checklist-${index}`} />
                  <label 
                    htmlFor={`checklist-${index}`} 
                    className="text-sm cursor-pointer flex items-center gap-2"
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Booking Item Row Component
function BookingItemRow({
  item,
  isBooked,
  onBook,
  onMarkBooked,
  getIcon,
  getProviderColor,
}: {
  item: BookingItem;
  isBooked: boolean;
  onBook: () => void;
  onMarkBooked: () => void;
  getIcon: (type: BookingItem['type']) => React.ComponentType<{ className?: string }>;
  getProviderColor: (provider?: string) => string;
}) {
  const Icon = getIcon(item.type);
  
  return (
    <motion.div
      layout
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg border transition-all',
        isBooked 
          ? 'bg-green-500/5 border-green-500/30' 
          : 'bg-card hover:border-primary/30'
      )}
    >
      <Checkbox 
        checked={isBooked} 
        onCheckedChange={() => onMarkBooked()}
        className="h-5 w-5"
      />
      
      <div className={cn(
        'p-2 rounded-full',
        item.type === 'flight' && 'bg-blue-500/10 text-blue-500',
        item.type === 'hotel' && 'bg-purple-500/10 text-purple-500',
        item.type === 'activity' && 'bg-amber-500/10 text-amber-500',
      )}>
        <Icon className="h-5 w-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-medium',
            isBooked && 'line-through text-muted-foreground'
          )}>
            {item.name}
          </span>
          {isBooked && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-600 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Booked
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
          {item.date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {item.date}
            </span>
          )}
          {item.time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {item.time}
            </span>
          )}
          {item.provider && (
            <Badge variant="secondary" className={cn('text-xs', getProviderColor(item.provider))}>
              {item.provider}
            </Badge>
          )}
        </div>
      </div>

      <div className="text-right">
        <div className="font-semibold">${item.price}</div>
        {!isBooked && item.bookingUrl && (
          <Button size="sm" variant="outline" onClick={onBook} className="mt-1">
            Book Now
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

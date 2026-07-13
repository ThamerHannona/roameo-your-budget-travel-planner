import { motion } from 'framer-motion';
import { 
  Plane, 
  Hotel, 
  MapPin, 
  ExternalLink, 
  Check, 
  Clock,
  Calendar,
  CreditCard,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { DayPlan } from '@/types/itinerary';

interface BookingItem {
  id: string;
  type: 'flight' | 'hotel' | 'activity';
  name: string;
  description: string;
  price: number;
  bookingUrl?: string;
  isBooked?: boolean;
  date?: string;
  time?: string;
}

interface BookingSummaryPanelProps {
  days: DayPlan[];
  destination: { name: string; country: string };
  tripDates: { start: Date; end: Date };
  travelers: number;
  onProceedToBooking: () => void;
  // Live selections from the budget allocation step. When provided, these
  // take precedence over the (usually $0) placeholder flight/hotel entries
  // in the generated itinerary so the summary matches the trip header.
  selectedFlightPrice?: number;
  selectedFlightName?: string;
  selectedHotelPrice?: number;
  selectedHotelName?: string;
  selectedTripTotal?: number;
}

export function BookingSummaryPanel({
  days,
  destination,
  tripDates,
  travelers,
  onProceedToBooking,
  selectedFlightPrice,
  selectedFlightName,
  selectedHotelPrice,
  selectedHotelName,
  selectedTripTotal,
}: BookingSummaryPanelProps) {
  // Helper to safely format date (handles both Date objects and serialized strings)
  const formatDate = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Extract bookable items from itinerary
  const bookingItems: BookingItem[] = [];
  
  days.forEach((day) => {
    day.activities.forEach((activity) => {
      if (activity.type === 'flight') {
        bookingItems.push({
          id: activity.id,
          type: 'flight',
          name: activity.name,
          description: activity.description,
          price: activity.cost,
          bookingUrl: activity.bookingUrl,
          isBooked: activity.isBooked,
          date: formatDate(day.date),
          time: activity.time,
        });
      } else if (activity.type === 'hotel') {
        bookingItems.push({
          id: activity.id,
          type: 'hotel',
          name: activity.name,
          description: activity.description,
          price: activity.cost,
          bookingUrl: activity.bookingUrl,
          isBooked: activity.isBooked,
        });
      } else if (activity.bookingUrl && activity.cost > 0) {
        bookingItems.push({
          id: activity.id,
          type: 'activity',
          name: activity.name,
          description: `${activity.duration} • ${activity.location.name}`,
          price: activity.cost,
          bookingUrl: activity.bookingUrl,
          isBooked: activity.isBooked,
          date: formatDate(day.date),
          time: activity.time,
        });
      }
    });
  });

  // Prefer live selections for flight/hotel totals; fall back to itinerary sums.
  const itineraryFlightTotal = bookingItems
    .filter(i => i.type === 'flight')
    .reduce((sum, i) => sum + i.price, 0);
  const itineraryHotelTotal = bookingItems
    .filter(i => i.type === 'hotel')
    .reduce((sum, i) => sum + i.price, 0);
  const activityTotal = bookingItems
    .filter(i => i.type === 'activity')
    .reduce((sum, i) => sum + i.price, 0);

  const flightTotal = selectedFlightPrice && selectedFlightPrice > 0 ? selectedFlightPrice : itineraryFlightTotal;
  const hotelTotal = selectedHotelPrice && selectedHotelPrice > 0 ? selectedHotelPrice : itineraryHotelTotal;
  const grandTotal = selectedTripTotal && selectedTripTotal > 0
    ? selectedTripTotal
    : flightTotal + hotelTotal + activityTotal;

  const bookedCount = bookingItems.filter(i => i.isBooked).length;
  const totalBookable =
    (flightTotal > 0 ? 1 : 0) +
    (hotelTotal > 0 ? 1 : 0) +
    bookingItems.filter(i => i.type === 'activity').length;

  const getIcon = (type: BookingItem['type']) => {
    switch (type) {
      case 'flight': return Plane;
      case 'hotel': return Hotel;
      case 'activity': return MapPin;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-primary" />
          Booking Summary
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {destination.name}, {destination.country} • {travelers} traveler{travelers > 1 ? 's' : ''}
        </p>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/50">
            <Plane className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-sm font-medium">${flightTotal.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground truncate" title={selectedFlightName}>
              {selectedFlightName || 'Flights'}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <Hotel className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-sm font-medium">${hotelTotal.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground truncate" title={selectedHotelName}>
              {selectedHotelName || 'Hotels'}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <MapPin className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-sm font-medium">${activityTotal.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Activities</div>
          </div>
        </div>


        <Separator />

        {/* Bookable Items List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {bookingItems.slice(0, 5).map((item, index) => {
            const Icon = getIcon(item.type);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg border',
                  item.isBooked 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-card hover:bg-accent/50 transition-colors'
                )}
              >
                <div className={cn(
                  'p-1.5 rounded-full',
                  item.type === 'flight' && 'bg-blue-500/10 text-blue-500',
                  item.type === 'hotel' && 'bg-purple-500/10 text-purple-500',
                  item.type === 'activity' && 'bg-amber-500/10 text-amber-500',
                )}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.name}</div>
                  {item.date && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {item.date}
                      {item.time && (
                        <>
                          <Clock className="h-3 w-3 ml-1" />
                          {item.time}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium">${item.price}</div>
                  {item.isBooked ? (
                    <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      Booked
                    </Badge>
                  ) : item.bookingUrl ? (
                    <a
                      href={item.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-0.5"
                    >
                      Book <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
          
          {bookingItems.length > 5 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              +{bookingItems.length - 5} more items
            </p>
          )}
        </div>

        <Separator />

        {/* Total & CTA */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Estimated Total</span>
            <span className="text-xl font-bold">${grandTotal.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{bookedCount}/{bookingItems.length} items booked</span>
            <span>For {travelers} traveler{travelers > 1 ? 's' : ''}</span>
          </div>

          <Button 
            onClick={onProceedToBooking} 
            className="w-full gap-2"
            size="lg"
          >
            Proceed to Booking
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

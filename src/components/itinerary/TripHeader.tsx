import { motion } from 'framer-motion';
import { Calendar, Users, DollarSign, Download, Share2, CalendarPlus, MapPin, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { ItineraryState } from '@/types/itinerary';
import { format } from 'date-fns';

interface TripHeaderProps {
  destination: ItineraryState['destination'];
  tripDates: ItineraryState['tripDates'];
  totalBudget: number;
  totalSpent: number;
  travelers: number;
  weather?: { temp: number; condition: string; icon: string };
}

export function TripHeader({
  destination,
  tripDates,
  totalBudget,
  totalSpent,
  travelers,
  weather,
}: TripHeaderProps) {
  const { toast } = useToast();
  const days = Math.ceil(
    (new Date(tripDates.end).getTime() - new Date(tripDates.start).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Trip to ${destination.name}`,
        text: `Check out my ${days}-day trip to ${destination.name}!`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied!',
        description: 'Share link copied to clipboard.',
      });
    }
  };

  const handleDownloadPDF = () => {
    toast({
      title: 'Downloading PDF...',
      description: 'Your itinerary is being prepared.',
    });
    // In a real app, this would generate a PDF
    setTimeout(() => window.print(), 500);
  };

  const handleAddToCalendar = () => {
    // Generate ICS file content
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${format(new Date(tripDates.start), "yyyyMMdd")}
DTEND:${format(new Date(tripDates.end), "yyyyMMdd")}
SUMMARY:Trip to ${destination.name}
DESCRIPTION:${days}-day trip to ${destination.name}, ${destination.country}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-${destination.name.toLowerCase().replace(/\s+/g, '-')}.ics`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Calendar event created!',
      description: 'Import the downloaded file to your calendar.',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden bg-card border border-border shadow-xl"
    >
      {/* Hero Image */}
      <div className="relative h-48 md:h-64">
        <img
          src={destination.imageUrl}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Destination Name */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
            <MapPin className="h-4 w-4" />
            <span>{destination.country}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
            {destination.name}
          </h1>
        </div>

        {/* Weather Badge */}
        {weather && (
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 text-white">
            <span className="text-xl">{weather.icon}</span>
            <span className="font-medium">{weather.temp}°F</span>
          </div>
        )}
      </div>

      {/* Info Bar */}
      <div className="p-4 md:p-6">
        <div className="flex flex-wrap gap-3 md:gap-6 mb-4">
          {/* Dates */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {format(new Date(tripDates.start), 'MMM d')} -{' '}
              {format(new Date(tripDates.end), 'MMM d, yyyy')}
            </span>
            <Badge variant="secondary" className="ml-1">
              {days} days
            </Badge>
          </div>

          {/* Travelers */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">
              {travelers} traveler{travelers > 1 ? 's' : ''}
            </span>
          </div>

          {/* Budget */}
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              ${totalSpent.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              / ${totalBudget.toLocaleString()}
            </span>
            <Badge 
              variant={totalSpent <= totalBudget ? 'default' : 'destructive'}
              className={totalSpent <= totalBudget ? 'bg-success text-success-foreground' : ''}
            >
              {totalSpent <= totalBudget ? 'On Budget' : 'Over Budget'}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleDownloadPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={handleAddToCalendar} variant="outline" size="sm">
            <CalendarPlus className="h-4 w-4 mr-2" />
            Add to Calendar
          </Button>
          <Button onClick={handleShare} size="sm" className="bg-primary">
            <Share2 className="h-4 w-4 mr-2" />
            Share Itinerary
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

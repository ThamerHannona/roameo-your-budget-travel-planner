import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { PaywallItinerary } from '@/components/paywall';
import { useSelectedDestinationStore } from '@/stores/selectedDestinationStore';
import { useTripSearchStore } from '@/stores/tripSearchStore';

export default function PaywallItineraryPage() {
  const navigate = useNavigate();
  const { destinationId } = useParams();
  const { destination } = useSelectedDestinationStore();
  const { travelers, dates } = useTripSearchStore();

  const destinationName = destination?.name || destinationId?.charAt(0).toUpperCase() + destinationId?.slice(1) || 'Lisbon';
  const country = destination?.country || 'Portugal';

  return (
    <div className="min-h-screen bg-background">
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

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <PaywallItinerary
          destination={destinationName}
          country={country}
          travelers={travelers || 2}
          startDate={dates.start || undefined}
        />
      </main>
    </div>
  );
}

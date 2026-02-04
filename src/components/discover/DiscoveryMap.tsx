import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { DestinationMatch } from '@/types/destination';

// Lazy load the map to avoid SSR issues and improve bundle splitting
const DiscoveryMapInner = lazy(() => import('./DiscoveryMapInner'));

interface DiscoveryMapProps {
  destinations: DestinationMatch[];
  onSelectDestination: (destination: DestinationMatch) => void;
  isLoading?: boolean;
  originCity?: string;
}

export function DiscoveryMap(props: DiscoveryMapProps) {
  return (
    <Suspense
      fallback={
        <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-border bg-card flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      }
    >
      <DiscoveryMapInner {...props} />
    </Suspense>
  );
}

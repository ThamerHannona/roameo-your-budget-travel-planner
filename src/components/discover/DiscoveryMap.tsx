import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, List, Loader2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { DestinationMatch } from '@/types/destination';
import { PriceMarker } from './PriceMarker';
import { MapDestinationCard } from './MapDestinationCard';

interface DiscoveryMapProps {
  destinations: DestinationMatch[];
  onSelectDestination: (destination: DestinationMatch) => void;
  isLoading?: boolean;
  originCity?: string;
}

// Component to handle map bounds fitting
function FitBounds({ destinations }: { destinations: DestinationMatch[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (destinations.length === 0) return;
    
    const bounds = L.latLngBounds(
      destinations.map(d => [d.coordinates.lat, d.coordinates.lng] as L.LatLngTuple)
    );
    
    // Add some padding to the bounds
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 });
  }, [destinations, map]);
  
  return null;
}

export function DiscoveryMap({
  destinations,
  onSelectDestination,
  isLoading = false,
  originCity,
}: DiscoveryMapProps) {
  const [selectedDestination, setSelectedDestination] = useState<DestinationMatch | null>(null);
  const [visibleMarkers, setVisibleMarkers] = useState<string[]>([]);
  const mapRef = useRef<L.Map | null>(null);

  // Animate markers appearing one by one
  useEffect(() => {
    if (destinations.length === 0) return;
    
    setVisibleMarkers([]);
    
    destinations.forEach((dest, index) => {
      setTimeout(() => {
        setVisibleMarkers(prev => [...prev, dest.id]);
      }, index * 100); // 100ms delay between each marker
    });
  }, [destinations]);

  const handleMarkerClick = (destination: DestinationMatch) => {
    setSelectedDestination(destination);
    
    // Zoom to the destination
    if (mapRef.current) {
      mapRef.current.flyTo(
        [destination.coordinates.lat, destination.coordinates.lng],
        6,
        { duration: 1.5 }
      );
    }
  };

  const handleCloseCard = () => {
    setSelectedDestination(null);
    
    // Zoom back out to show all markers
    if (mapRef.current && destinations.length > 0) {
      const bounds = L.latLngBounds(
        destinations.map(d => [d.coordinates.lat, d.coordinates.lng] as L.LatLngTuple)
      );
      mapRef.current.flyToBounds(bounds, { padding: [50, 50], maxZoom: 5, duration: 1 });
    }
  };

  const handleSelect = (destination: DestinationMatch) => {
    setSelectedDestination(null);
    onSelectDestination(destination);
  };

  // Get best deals for pulse animation (top 3 by value score)
  const bestDeals = [...destinations]
    .sort((a, b) => b.valueScore - a.valueScore)
    .slice(0, 3)
    .map(d => d.id);

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-border bg-card">
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[1000] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Searching destinations...</p>
            {originCity && (
              <p className="text-sm text-muted-foreground mt-1">
                Finding flights from {originCity}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <MapContainer
        center={[30, 0]}
        zoom={2}
        scrollWheelZoom={true}
        className="w-full h-full"
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <FitBounds destinations={destinations} />
        
        {/* Price Markers */}
        {destinations.map((destination) => (
          <PriceMarker
            key={destination.id}
            destination={destination}
            isVisible={visibleMarkers.includes(destination.id)}
            isBestDeal={bestDeals.includes(destination.id)}
            isSelected={selectedDestination?.id === destination.id}
            onClick={() => handleMarkerClick(destination)}
          />
        ))}
      </MapContainer>

      {/* Destination count badge */}
      <div className="absolute top-4 left-4 z-[1000]">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-background/90 backdrop-blur-sm border border-border rounded-lg px-4 py-2"
        >
          <p className="text-sm font-medium">
            <span className="text-primary">{destinations.length}</span> destinations found
          </p>
        </motion.div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <Button
          size="icon"
          variant="secondary"
          className="h-10 w-10 bg-background/90 backdrop-blur-sm"
          onClick={() => mapRef.current?.zoomIn()}
        >
          +
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-10 w-10 bg-background/90 backdrop-blur-sm"
          onClick={() => mapRef.current?.zoomOut()}
        >
          −
        </Button>
      </div>

      {/* Selected Destination Card */}
      <AnimatePresence>
        {selectedDestination && (
          <MapDestinationCard
            destination={selectedDestination}
            onClose={handleCloseCard}
            onSelect={() => handleSelect(selectedDestination)}
          />
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-background/90 backdrop-blur-sm border border-border rounded-lg px-4 py-3"
        >
          <p className="text-xs font-medium mb-2 text-muted-foreground">Deal Quality</p>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Great (&gt;20%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Good (10-20%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Fair (&lt;10%)</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

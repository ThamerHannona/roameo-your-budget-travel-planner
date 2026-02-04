import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { MapContainer } from 'react-leaflet/MapContainer';
import { TileLayer } from 'react-leaflet/TileLayer';
import { useMap } from 'react-leaflet/hooks';
import { Marker } from 'react-leaflet/Marker';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { DestinationMatch } from '@/types/destination';
import { MapDestinationCard } from './MapDestinationCard';

interface DiscoveryMapInnerProps {
  destinations: DestinationMatch[];
  onSelectDestination: (destination: DestinationMatch) => void;
  isLoading?: boolean;
  originCity?: string;
}

// Get marker color based on savings percentage
function getMarkerColor(destination: DestinationMatch): string {
  const savingsPercent = (destination.budgetDelta / destination.estimatedTotalCost) * 100;
  
  if (savingsPercent >= 20) return '#10b981'; // Green - excellent deal
  if (savingsPercent >= 10) return '#3b82f6'; // Blue - good deal
  return '#f59e0b'; // Yellow - fair deal
}

// Create custom HTML marker icon
function createPriceIcon(
  price: number,
  color: string,
  isBestDeal: boolean,
  isSelected: boolean
): L.DivIcon {
  const formattedPrice = price >= 1000 
    ? `$${(price / 1000).toFixed(1)}k` 
    : `$${Math.round(price)}`;
  
  const size = isBestDeal ? 70 : 60;
  const fontSize = isBestDeal ? '14px' : '12px';
  const pulseClass = isBestDeal ? 'marker-pulse' : '';
  const selectedClass = isSelected ? 'marker-selected' : '';
  
  const html = `
    <div class="price-marker ${pulseClass} ${selectedClass}" style="
      width: ${size}px;
      height: ${size}px;
      background: linear-gradient(135deg, ${color}, ${color}dd);
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s ease;
      transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
    ">
      <span style="
        color: white;
        font-weight: bold;
        font-size: ${fontSize};
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
      ">${formattedPrice}</span>
    </div>
  `;
  
  return L.divIcon({
    html,
    className: 'custom-price-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Component to handle map bounds fitting and capture map instance
function MapController({ 
  destinations, 
  onMapReady 
}: { 
  destinations: DestinationMatch[];
  onMapReady: (map: L.Map) => void;
}) {
  const map = useMap();
  
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  
  useEffect(() => {
    if (destinations.length === 0) return;
    
    const bounds = L.latLngBounds(
      destinations.map(d => [d.coordinates.lat, d.coordinates.lng] as L.LatLngTuple)
    );
    
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 });
  }, [destinations, map]);
  
  return null;
}

// Price marker component
function PriceMarker({
  destination,
  isVisible,
  isBestDeal,
  isSelected,
  onClick,
}: {
  destination: DestinationMatch;
  isVisible: boolean;
  isBestDeal: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const icon = useMemo(() => {
    const color = getMarkerColor(destination);
    return createPriceIcon(
      destination.estimatedTotalCost,
      color,
      isBestDeal,
      isSelected
    );
  }, [destination.estimatedTotalCost, destination.budgetDelta, isBestDeal, isSelected]);

  if (!isVisible) return null;

  return (
    <Marker
      position={[destination.coordinates.lat, destination.coordinates.lng]}
      icon={icon}
      eventHandlers={{
        click: onClick,
      }}
    />
  );
}

export default function DiscoveryMapInner({
  destinations,
  onSelectDestination,
  isLoading = false,
  originCity,
}: DiscoveryMapInnerProps) {
  const [selectedDestination, setSelectedDestination] = useState<DestinationMatch | null>(null);
  const [visibleMarkers, setVisibleMarkers] = useState<string[]>([]);
  const mapRef = useRef<L.Map | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  // Animate markers appearing one by one with proper cleanup
  useEffect(() => {
    if (destinations.length === 0) {
      setVisibleMarkers([]);
      return;
    }
    
    // Clear previous timeouts
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];
    setVisibleMarkers([]);
    
    destinations.forEach((dest, index) => {
      const timeout = setTimeout(() => {
        setVisibleMarkers(prev => [...prev, dest.id]);
      }, index * 100);
      timeoutsRef.current.push(timeout);
    });
    
    return () => {
      timeoutsRef.current.forEach(t => clearTimeout(t));
      timeoutsRef.current = [];
    };
  }, [destinations]);

  const handleMarkerClick = useCallback((destination: DestinationMatch) => {
    setSelectedDestination(destination);
    
    if (mapRef.current) {
      mapRef.current.flyTo(
        [destination.coordinates.lat, destination.coordinates.lng],
        6,
        { duration: 1.5 }
      );
    }
  }, []);

  const handleCloseCard = useCallback(() => {
    setSelectedDestination(null);
    
    if (mapRef.current && destinations.length > 0) {
      const bounds = L.latLngBounds(
        destinations.map(d => [d.coordinates.lat, d.coordinates.lng] as L.LatLngTuple)
      );
      mapRef.current.flyToBounds(bounds, { padding: [50, 50], maxZoom: 5, duration: 1 });
    }
  }, [destinations]);

  const handleSelect = useCallback((destination: DestinationMatch) => {
    setSelectedDestination(null);
    onSelectDestination(destination);
  }, [onSelectDestination]);

  const handleZoomIn = useCallback(() => {
    if (mapRef.current) mapRef.current.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) mapRef.current.zoomOut();
  }, []);

  // Get best deals for pulse animation (top 3 by value score)
  const bestDeals = useMemo(() => 
    [...destinations]
      .sort((a, b) => b.valueScore - a.valueScore)
      .slice(0, 3)
      .map(d => d.id),
    [destinations]
  );

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
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
        />
        
        <MapController destinations={destinations} onMapReady={handleMapReady} />
        
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
          onClick={handleZoomIn}
        >
          +
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-10 w-10 bg-background/90 backdrop-blur-sm"
          onClick={handleZoomOut}
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

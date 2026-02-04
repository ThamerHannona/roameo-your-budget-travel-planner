import { useEffect, useRef } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { DestinationMatch } from '@/types/destination';

interface PriceMarkerProps {
  destination: DestinationMatch;
  isVisible: boolean;
  isBestDeal: boolean;
  isSelected: boolean;
  onClick: () => void;
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
  destination: DestinationMatch,
  isBestDeal: boolean,
  isSelected: boolean
): L.DivIcon {
  const color = getMarkerColor(destination);
  const price = destination.estimatedTotalCost;
  const formattedPrice = price >= 1000 
    ? `$${(price / 1000).toFixed(1)}k` 
    : `$${price}`;
  
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

export function PriceMarker({
  destination,
  isVisible,
  isBestDeal,
  isSelected,
  onClick,
}: PriceMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setIcon(createPriceIcon(destination, isBestDeal, isSelected));
    }
  }, [destination, isBestDeal, isSelected]);

  if (!isVisible) return null;

  return (
    <Marker
      ref={markerRef}
      position={[destination.coordinates.lat, destination.coordinates.lng]}
      icon={createPriceIcon(destination, isBestDeal, isSelected)}
      eventHandlers={{
        click: onClick,
      }}
    />
  );
}

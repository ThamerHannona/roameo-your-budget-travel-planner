import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DayPlan, Activity } from '@/types/itinerary';
import { cn } from '@/lib/utils';

interface ItineraryMapProps {
  day: DayPlan;
  selectedActivityId?: string;
  onActivitySelect?: (activityId: string) => void;
  className?: string;
}

// Mapbox will be loaded dynamically
declare global {
  interface Window {
    mapboxgl?: typeof import('mapbox-gl');
  }
}

export function ItineraryMap({ 
  day, 
  selectedActivityId, 
  onActivitySelect,
  className 
}: ItineraryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Get center from activities
  const getCenter = (): [number, number] => {
    if (day.activities.length === 0) return [-9.1393, 38.7223]; // Lisbon default
    
    const lats = day.activities.map(a => a.location.coordinates.lat);
    const lngs = day.activities.map(a => a.location.coordinates.lng);
    
    return [
      lngs.reduce((a, b) => a + b, 0) / lngs.length,
      lats.reduce((a, b) => a + b, 0) / lats.length,
    ];
  };

  useEffect(() => {
    // Check if Mapbox token is available
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    
    if (!mapboxToken) {
      // Fallback to static map display
      setMapError('Map token not configured');
      return;
    }

    // Dynamically import mapbox-gl
    import('mapbox-gl').then((mapboxgl) => {
      if (!mapContainer.current) return;

      mapboxgl.default.accessToken = mapboxToken;

      map.current = new mapboxgl.default.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: getCenter(),
        zoom: 13,
      });

      map.current.on('load', () => {
        setIsMapLoaded(true);
        addMarkers(mapboxgl.default);
        fitBounds(mapboxgl.default);
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.default.NavigationControl(), 'top-right');
    }).catch(() => {
      setMapError('Failed to load map');
    });

    return () => {
      markers.current.forEach(m => m.remove());
      map.current?.remove();
    };
  }, []);

  const addMarkers = (mapboxgl: typeof import('mapbox-gl').default) => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    day.activities.forEach((activity, index) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg cursor-pointer hover:scale-110 transition-transform border-2 border-white">
          ${index + 1}
        </div>
      `;
      
      el.addEventListener('click', () => {
        onActivitySelect?.(activity.id);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([activity.location.coordinates.lng, activity.location.coordinates.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <h4 class="font-semibold">${activity.name}</h4>
              <p class="text-sm text-gray-600">${activity.time} • ${activity.duration}</p>
            </div>
          `)
        )
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Draw route between activities
    if (day.activities.length > 1) {
      const coordinates = day.activities.map(a => [
        a.location.coordinates.lng,
        a.location.coordinates.lat,
      ]);

      if (map.current.getSource('route')) {
        (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        });
      } else {
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates,
            },
          },
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': 'hsl(var(--primary))',
            'line-width': 3,
            'line-opacity': 0.7,
            'line-dasharray': [2, 2],
          },
        });
      }
    }
  };

  const fitBounds = (mapboxgl: typeof import('mapbox-gl').default) => {
    if (!map.current || day.activities.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    day.activities.forEach(activity => {
      bounds.extend([
        activity.location.coordinates.lng,
        activity.location.coordinates.lat,
      ]);
    });

    map.current.fitBounds(bounds, { padding: 50 });
  };

  // Update markers when day changes
  useEffect(() => {
    if (isMapLoaded) {
      import('mapbox-gl').then((mapboxgl) => {
        addMarkers(mapboxgl.default);
        fitBounds(mapboxgl.default);
      });
    }
  }, [day.id, isMapLoaded]);
  // Highlight selected activity
  useEffect(() => {
    if (!selectedActivityId || !map.current) return;

    const activity = day.activities.find(a => a.id === selectedActivityId);
    if (activity) {
      map.current.flyTo({
        center: [activity.location.coordinates.lng, activity.location.coordinates.lat],
        zoom: 15,
      });
    }
  }, [selectedActivityId]);

  // Fallback static map if no token
  if (mapError) {
    return (
      <div className={cn('bg-muted rounded-xl overflow-hidden', className)}>
        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium text-foreground mb-2">Day {day.dayNumber} Locations</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {day.activities.length} stops planned
          </p>
          <div className="space-y-2 w-full max-w-xs">
            {day.activities.slice(0, 5).map((activity, i) => (
              <button
                key={activity.id}
                onClick={() => onActivitySelect?.(activity.id)}
                className={cn(
                  'w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors',
                  selectedActivityId === activity.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card hover:bg-muted'
                )}
              >
                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                  {i + 1}
                </span>
                <span className="text-sm truncate">{activity.name}</span>
              </button>
            ))}
            {day.activities.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                +{day.activities.length - 5} more locations
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-xl overflow-hidden', className)}>
      <div ref={mapContainer} className="w-full h-full min-h-[300px]" />
      
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="animate-pulse flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading map...</span>
          </div>
        </div>
      )}

      {/* Map Controls Overlay */}
      <div className="absolute top-3 left-3 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 shadow-md"
          onClick={() => {
            import('mapbox-gl').then((mapboxgl) => {
              fitBounds(mapboxgl.default);
            });
          }}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Day Badge */}
      <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
        <p className="text-sm font-medium">Day {day.dayNumber}</p>
        <p className="text-xs text-muted-foreground">{day.activities.length} stops</p>
      </div>
    </div>
  );
}

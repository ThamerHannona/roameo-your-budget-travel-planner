import { motion } from 'framer-motion';
import { Map, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapListToggleProps {
  view: 'map' | 'list';
  onChange: (view: 'map' | 'list') => void;
}

export function MapListToggle({ view, onChange }: MapListToggleProps) {
  return (
    <div className="flex items-center bg-muted rounded-lg p-1">
      <button
        onClick={() => onChange('map')}
        className={cn(
          "relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
          view === 'map' ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {view === 'map' && (
          <motion.div
            layoutId="toggle-bg"
            className="absolute inset-0 bg-primary rounded-md"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <Map className="h-4 w-4 relative z-10" />
        <span className="relative z-10">Map</span>
      </button>
      
      <button
        onClick={() => onChange('list')}
        className={cn(
          "relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
          view === 'list' ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {view === 'list' && (
          <motion.div
            layoutId="toggle-bg"
            className="absolute inset-0 bg-primary rounded-md"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <List className="h-4 w-4 relative z-10" />
        <span className="relative z-10">List</span>
      </button>
    </div>
  );
}

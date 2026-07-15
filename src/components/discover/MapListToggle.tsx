import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Map, List, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapListToggleProps {
  view: 'map' | 'list';
  onChange: (view: 'map' | 'list') => void;
  isLoading?: boolean;
  listCount?: number;
}

export function MapListToggle({ view, onChange, isLoading = false, listCount }: MapListToggleProps) {
  // Local "switching" flash so switching feels instant + reliable even when
  // the underlying view mounts quickly.
  const [switchingTo, setSwitchingTo] = useState<'map' | 'list' | null>(null);

  useEffect(() => {
    if (!switchingTo) return;
    const t = window.setTimeout(() => setSwitchingTo(null), 350);
    return () => window.clearTimeout(t);
  }, [switchingTo]);

  const handleClick = (next: 'map' | 'list') => {
    if (next === view) return;
    setSwitchingTo(next);
    onChange(next);
  };

  const busy = (target: 'map' | 'list') =>
    (switchingTo === target) || (isLoading && view === target);

  return (
    <div
      role="tablist"
      aria-label="Results view"
      className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/60 p-1 shadow-sm backdrop-blur-sm"
    >
      <ToggleButton
        active={view === 'map'}
        busy={busy('map')}
        onClick={() => handleClick('map')}
        icon={<Map className="h-4 w-4" />}
        label="Map"
      />
      <ToggleButton
        active={view === 'list'}
        busy={busy('list')}
        onClick={() => handleClick('list')}
        icon={<List className="h-4 w-4" />}
        label="List"
        badge={typeof listCount === 'number' ? listCount : undefined}
      />
    </div>
  );
}

function ToggleButton({
  active,
  busy,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  busy: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      aria-busy={busy}
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {active && (
        <motion.div
          layoutId="discover-view-toggle-bg"
          className="absolute inset-0 rounded-lg bg-primary shadow-sm"
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        <span>{label}</span>
        {typeof badge === 'number' && (
          <span
            className={cn(
              'ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
              active ? 'bg-white/20 text-primary-foreground' : 'bg-foreground/10 text-foreground'
            )}
          >
            {badge}
          </span>
        )}
      </span>
    </button>
  );
}

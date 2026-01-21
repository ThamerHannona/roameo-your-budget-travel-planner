import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plane,
  Building2,
  Utensils,
  Landmark,
  Bus,
  ShoppingBag,
  Music,
  Clock,
  MapPin,
  ExternalLink,
  GripVertical,
  RefreshCw,
  Plus,
  Trash2,
  LucideIcon,
  Palmtree,
  TreePine,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Activity } from '@/types/itinerary';
import { cn } from '@/lib/utils';

interface ActivityItemProps {
  activity: Activity;
  onSwap?: () => void;
  onAddFreeTime?: () => void;
  onRemove?: () => void;
  onViewOnMap?: () => void;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

const activityIcons: Record<string, LucideIcon> = {
  flight: Plane,
  hotel: Building2,
  restaurant: Utensils,
  attraction: Landmark,
  museum: Ticket,
  tour: Landmark,
  transport: Bus,
  shopping: ShoppingBag,
  nightlife: Music,
  'free-time': Clock,
  beach: Palmtree,
  nature: TreePine,
};

const activityColors: Record<string, string> = {
  flight: 'bg-sky-500',
  hotel: 'bg-violet-500',
  restaurant: 'bg-amber-500',
  attraction: 'bg-emerald-500',
  museum: 'bg-indigo-500',
  tour: 'bg-teal-500',
  transport: 'bg-slate-500',
  shopping: 'bg-pink-500',
  nightlife: 'bg-purple-500',
  'free-time': 'bg-gray-400',
  beach: 'bg-cyan-500',
  nature: 'bg-green-500',
};

export function ActivityItem({
  activity,
  onSwap,
  onAddFreeTime,
  onRemove,
  onViewOnMap,
  isDragging,
  dragHandleProps,
}: ActivityItemProps) {
  const [showTips, setShowTips] = useState(false);
  const Icon = activityIcons[activity.type] || Landmark;
  const iconBgColor = activityColors[activity.type] || 'bg-primary';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'relative flex gap-3 md:gap-4 group',
        isDragging && 'opacity-50'
      )}
    >
      {/* Timeline Line & Dot */}
      <div className="flex flex-col items-center">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md', iconBgColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="w-0.5 flex-1 bg-border mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className={cn(
          'bg-card border border-border rounded-xl p-4 shadow-sm transition-shadow',
          'hover:shadow-md',
          isDragging && 'shadow-lg ring-2 ring-primary'
        )}>
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{activity.time}</span>
                {activity.endTime && <span>- {activity.endTime}</span>}
                <span className="text-muted-foreground/60">•</span>
                <span>{activity.duration}</span>
              </div>
              <h4 className="font-semibold text-foreground">{activity.name}</h4>
            </div>

            {/* Cost Badge */}
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 font-medium',
                activity.isFree
                  ? 'border-success text-success bg-success/10'
                  : 'border-primary text-primary bg-primary/10'
              )}
            >
              {activity.isFree ? 'Free' : `$${activity.cost}`}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-3">{activity.description}</p>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{activity.location.name}</span>
            {(activity.location.googleMapsUrl || onViewOnMap) && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-primary"
                onClick={() => {
                  if (activity.location.googleMapsUrl) {
                    window.open(activity.location.googleMapsUrl, '_blank');
                  } else if (onViewOnMap) {
                    onViewOnMap();
                  }
                }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View on map
              </Button>
            )}
          </div>

          {/* Booking Link */}
          {activity.bookingUrl && (
            <Button
              variant="outline"
              size="sm"
              className="mb-3"
              onClick={() => window.open(activity.bookingUrl, '_blank')}
            >
              Book Now
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          )}

          {/* Tips */}
          {activity.tips && activity.tips.length > 0 && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowTips(!showTips)}
              >
                💡 {showTips ? 'Hide tips' : `${activity.tips.length} tip${activity.tips.length > 1 ? 's' : ''}`}
              </Button>
              {showTips && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 space-y-1"
                >
                  {activity.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary">
                      {tip}
                    </li>
                  ))}
                </motion.ul>
              )}
            </div>
          )}

          {/* Action Buttons - Show on hover */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                className="p-1 cursor-grab hover:bg-muted rounded"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onSwap && (
                  <DropdownMenuItem onClick={onSwap}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Swap activity
                  </DropdownMenuItem>
                )}
                {onAddFreeTime && (
                  <DropdownMenuItem onClick={onAddFreeTime}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add free time after
                  </DropdownMenuItem>
                )}
                {onRemove && (
                  <DropdownMenuItem onClick={onRemove} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

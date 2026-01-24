import { motion } from 'framer-motion';
import { 
  Plane, Hotel, Utensils, Landmark, Camera, Map, Car, ShoppingBag, 
  Music, Coffee, TreePine, Waves, Clock, Lightbulb 
} from 'lucide-react';
import type { GenericActivity } from '@/types/paywall';
import { cn } from '@/lib/utils';

interface GenericActivityCardProps {
  activity: GenericActivity;
  isPaid: boolean;
  index: number;
}

const categoryConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  flight: { icon: Plane, color: 'text-blue-600', bg: 'bg-blue-100' },
  hotel: { icon: Hotel, color: 'text-purple-600', bg: 'bg-purple-100' },
  restaurant: { icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-100' },
  attraction: { icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  museum: { icon: Camera, color: 'text-pink-600', bg: 'bg-pink-100' },
  tour: { icon: Map, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  transport: { icon: Car, color: 'text-slate-600', bg: 'bg-slate-100' },
  shopping: { icon: ShoppingBag, color: 'text-rose-600', bg: 'bg-rose-100' },
  nightlife: { icon: Music, color: 'text-violet-600', bg: 'bg-violet-100' },
  'free-time': { icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-100' },
  nature: { icon: TreePine, color: 'text-green-600', bg: 'bg-green-100' },
  beach: { icon: Waves, color: 'text-sky-600', bg: 'bg-sky-100' },
};

export function GenericActivityCard({ activity, isPaid, index }: GenericActivityCardProps) {
  const config = categoryConfig[activity.category] || categoryConfig.attraction;
  const Icon = config.icon;

  const displayTitle = isPaid && activity.specificName ? activity.specificName : activity.genericTitle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-4 py-4 border-b border-border/50 last:border-0"
    >
      {/* Time */}
      <div className="flex flex-col items-center min-w-[60px]">
        <span className="text-sm font-semibold text-foreground">{activity.time}</span>
        {activity.duration && (
          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3" />
            {activity.duration}
          </span>
        )}
      </div>

      {/* Icon */}
      <div className={cn('flex items-center justify-center w-10 h-10 rounded-full shrink-0', config.bg)}>
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground mb-1">{displayTitle}</h4>
        
        {/* Address - only shown if paid */}
        {isPaid && activity.address && (
          <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
            📍 {activity.address}
          </p>
        )}

        {/* Phone - only shown if paid */}
        {isPaid && activity.phone && (
          <a 
            href={`tel:${activity.phone}`}
            className="text-sm text-primary hover:underline mb-1 flex items-center gap-1"
          >
            📞 {activity.phone}
          </a>
        )}

        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          {activity.genericDescription}
        </p>

        {/* Booking link - only shown if paid */}
        {isPaid && activity.bookingUrl && (
          <a 
            href={activity.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline mb-2"
          >
            📅 Book Now →
          </a>
        )}

        {/* Options - only shown if paid */}
        {isPaid && activity.options && activity.options.length > 1 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Options:</p>
            <div className="grid gap-2">
              {activity.options.map((option, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    'p-2 rounded-lg border text-sm',
                    option.isBestValue 
                      ? 'border-primary/50 bg-primary/5' 
                      : 'border-border bg-muted/30'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {option.name}
                      {option.isBestValue && (
                        <span className="ml-2 text-xs text-primary font-semibold">✓ Best Value</span>
                      )}
                    </span>
                    <span className="font-semibold text-foreground">${option.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {activity.tips.length > 0 && (
          <div className="mt-2 space-y-1">
            {activity.tips.slice(0, isPaid ? undefined : 1).map((tip, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-2 text-sm p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200"
              >
                <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        )}

        {/* Cost badge */}
        <div className="mt-2">
          {activity.isFree ? (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-3 py-1 rounded-full">
              FREE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50 px-3 py-1 rounded-full">
              💰 ${activity.estimatedCost}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  variant?: 'destination' | 'flight' | 'hotel' | 'activity';
}

export function SkeletonCard({ className, variant = 'destination' }: SkeletonCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'rounded-xl border bg-card overflow-hidden',
        className
      )}
    >
      {variant === 'destination' && (
        <>
          {/* Image skeleton */}
          <div className="aspect-[16/10] bg-muted animate-pulse" />
          
          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className="flex items-center justify-between">
              <div className="h-6 w-32 bg-muted rounded animate-pulse" />
              <div className="h-5 w-16 bg-muted rounded animate-pulse" />
            </div>
            
            {/* Badges */}
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
              <div className="h-6 w-24 bg-muted rounded-full animate-pulse" />
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="h-12 bg-muted rounded animate-pulse" />
              <div className="h-12 bg-muted rounded animate-pulse" />
              <div className="h-12 bg-muted rounded animate-pulse" />
            </div>
            
            {/* Price */}
            <div className="flex items-center justify-between pt-2">
              <div className="h-8 w-24 bg-muted rounded animate-pulse" />
              <div className="h-10 w-28 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </>
      )}
      
      {variant === 'flight' && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
            <div className="h-6 w-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-16 bg-muted rounded animate-pulse" />
            <div className="flex-1 h-0.5 bg-muted animate-pulse" />
            <div className="h-10 w-16 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          </div>
        </div>
      )}
      
      {variant === 'hotel' && (
        <>
          <div className="aspect-[16/9] bg-muted animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-5 w-40 bg-muted rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="flex gap-1 pt-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-4 w-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <div className="h-6 w-28 bg-muted rounded animate-pulse" />
              <div className="h-8 w-20 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </>
      )}
      
      {variant === 'activity' && (
        <div className="p-4 flex gap-4">
          <div className="w-20 h-20 bg-muted rounded-lg animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              <div className="h-4 w-12 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function SkeletonGrid({ count = 6, variant = 'destination' }: { count?: number; variant?: SkeletonCardProps['variant'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
}

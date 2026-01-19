import { Card, CardContent } from '@/components/ui/card';

interface LoadingCardProps {
  type: 'flight' | 'hotel';
}

function Shimmer({ className }: { className?: string }) {
  return (
    <div 
      className={`skeleton rounded ${className}`}
      role="progressbar"
      aria-busy="true"
      aria-label="Loading"
    />
  );
}

export function LoadingCard({ type }: LoadingCardProps) {
  return (
    <Card className="overflow-hidden" aria-hidden="true">
      <CardContent className="p-4">
        {type === 'flight' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Shimmer className="h-6 w-20" />
              <Shimmer className="h-4 w-16" />
            </div>
            <div className="flex items-center gap-4">
              <Shimmer className="h-8 w-14" />
              <Shimmer className="h-4 w-24" />
              <Shimmer className="h-8 w-14" />
            </div>
            <div className="flex items-center justify-between">
              <Shimmer className="h-4 w-20" />
              <Shimmer className="h-8 w-20" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Shimmer className="h-32 w-full rounded-lg" />
            <Shimmer className="h-5 w-3/4" />
            <div className="flex items-center gap-2">
              <Shimmer className="h-4 w-4" />
              <Shimmer className="h-4 w-32" />
            </div>
            <div className="flex items-center justify-between">
              <Shimmer className="h-4 w-24" />
              <Shimmer className="h-8 w-20" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
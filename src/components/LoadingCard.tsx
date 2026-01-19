import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingCardProps {
  type: 'flight' | 'hotel';
}

export function LoadingCard({ type }: LoadingCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {type === 'flight' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-14" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-14" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-5 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
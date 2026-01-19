import { motion } from 'framer-motion';
import { Plane, Building2, SearchX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  type: 'flight' | 'hotel';
  message?: string;
}

export function EmptyState({ type, message }: EmptyStateProps) {
  const Icon = type === 'flight' ? Plane : Building2;
  const defaultMessage = type === 'flight' 
    ? 'No flights found within your budget' 
    : 'No hotels found within your budget';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-muted rounded-full blur-xl opacity-50" />
            <div className="relative bg-muted p-4 rounded-full">
              <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <SearchX className="absolute -bottom-1 -right-1 h-5 w-5 text-destructive bg-background rounded-full p-0.5" />
          </div>
          <h3 className="font-display font-semibold text-foreground mb-2">
            No Results
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {message || defaultMessage}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Try adjusting your budget or travel dates
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ScoreBarProps {
  score: number;
  delay?: number;
  showLabel?: boolean;
}

export function ScoreBar({ score, delay = 0.2, showLabel = true }: ScoreBarProps) {
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="flex items-center gap-2 justify-center">
      <div className="w-20 h-2.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, delay }}
          className={cn('h-full rounded-full', getColor(score))}
        />
      </div>
      {showLabel && (
        <span className={cn(
          'text-xs font-semibold min-w-[2rem]',
          score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-muted-foreground'
        )}>
          {score}
        </span>
      )}
    </div>
  );
}

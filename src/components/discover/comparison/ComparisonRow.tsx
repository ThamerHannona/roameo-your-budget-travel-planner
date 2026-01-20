import { cn } from '@/lib/utils';

interface ComparisonRowProps {
  label: string;
  icon?: React.ReactNode;
  values: React.ReactNode[];
  highlightBest?: 'highest' | 'lowest';
  bestIndex?: number;
  className?: string;
}

export function ComparisonRow({ 
  label, 
  icon,
  values, 
  highlightBest,
  bestIndex,
  className 
}: ComparisonRowProps) {
  return (
    <div 
      className={cn("grid gap-4 py-3", className)} 
      style={{ gridTemplateColumns: `160px repeat(${values.length}, 1fr)` }}
    >
      <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </div>
      {values.map((value, i) => (
        <div
          key={i}
          className={cn(
            'text-sm font-medium text-center flex items-center justify-center',
            highlightBest && bestIndex === i && 'text-success font-bold'
          )}
        >
          {value}
        </div>
      ))}
    </div>
  );
}

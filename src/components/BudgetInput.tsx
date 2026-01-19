import { DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface BudgetInputProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
  className?: string;
}

export function BudgetInput({ value, onChange, error, className }: BudgetInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const numValue = parseInt(rawValue) || 0;
    onChange(numValue);
  };

  const formatDisplayValue = (num: number) => {
    return num.toLocaleString('en-US');
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <div className="bg-primary p-2 rounded-lg">
          <DollarSign className="h-5 w-5 text-primary-foreground" />
        </div>
        <label className="text-lg font-display font-semibold text-foreground">
          What's your total budget?
        </label>
      </div>
      
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-primary">
          $
        </span>
        <Input
          type="text"
          inputMode="numeric"
          value={formatDisplayValue(value)}
          onChange={handleChange}
          className={cn(
            'text-3xl font-display font-bold h-16 pl-10 pr-4 text-foreground',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
          placeholder="2,000"
        />
      </div>
      
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          We'll find flights and hotels that fit within your budget
        </p>
      )}
    </div>
  );
}

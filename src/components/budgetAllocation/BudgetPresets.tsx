import { motion } from 'framer-motion';
import { budgetPresets } from '@/data/mockBudgetData';
import { cn } from '@/lib/utils';

interface BudgetPresetsProps {
  onSelect: (presetKey: keyof typeof budgetPresets) => void;
  currentPreset?: keyof typeof budgetPresets | null;
}

export function BudgetPresets({ onSelect, currentPreset }: BudgetPresetsProps) {
  const presetEntries = Object.entries(budgetPresets) as [
    keyof typeof budgetPresets,
    typeof budgetPresets[keyof typeof budgetPresets]
  ][];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Quick Presets</h3>
      <div className="flex flex-wrap gap-2">
        {presetEntries.map(([key, preset], index) => (
          <motion.button
            key={key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(key)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
              'hover:border-primary/50 hover:bg-primary/5',
              currentPreset === key
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border bg-card'
            )}
          >
            <span className="text-lg">{preset.icon}</span>
            <div className="text-left">
              <div className="text-sm font-medium text-foreground">{preset.name}</div>
              <div className="text-[11px] text-muted-foreground hidden sm:block">
                {preset.description}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

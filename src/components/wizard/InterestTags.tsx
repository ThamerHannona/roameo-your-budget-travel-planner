import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TRIP_INTERESTS } from '@/types/trip';

interface InterestTagsProps {
  selected: string[];
  onChange: (interests: string[]) => void;
}

export function InterestTags({ selected, onChange }: InterestTagsProps) {
  const toggleInterest = (interestId: string) => {
    if (selected.includes(interestId)) {
      onChange(selected.filter((id) => id !== interestId));
    } else {
      onChange([...selected, interestId]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Interests</label>
        <span className="text-xs text-muted-foreground">
          {selected.length} selected
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {TRIP_INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest.id);

          return (
            <motion.button
              key={interest.id}
              type="button"
              onClick={() => toggleInterest(interest.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/5'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-base">{interest.icon}</span>
              <span>{interest.label}</span>
            </motion.button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Select your interests to personalize your trip recommendations
      </p>
    </div>
  );
}

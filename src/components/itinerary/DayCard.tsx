import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ActivityItem } from './ActivityItem';
import type { DayPlan } from '@/types/itinerary';
import { getDayTotals } from '@/data/lisbonItinerary';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DayCardProps {
  day: DayPlan;
  isSelected: boolean;
  onSelectDay: () => void;
  onReorderActivities: (sourceIndex: number, destinationIndex: number) => void;
  onAddFreeTime: (afterActivityId: string) => void;
  onRemoveActivity: (activityId: string) => void;
  onViewActivityOnMap: (activityId: string) => void;
}

export function DayCard({
  day,
  isSelected,
  onSelectDay,
  onReorderActivities,
  onAddFreeTime,
  onRemoveActivity,
  onViewActivityOnMap,
}: DayCardProps) {
  const [showProTips, setShowProTips] = useState(false);
  const { spent, remaining } = getDayTotals(day);
  const spentPercentage = Math.min((spent / day.dailyBudget) * 100, 100);
  const isOverBudget = spent > day.dailyBudget;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    onReorderActivities(result.source.index, result.destination.index);
  };

  const dayOfWeek = format(new Date(day.date), 'EEEE');
  const formattedDate = format(new Date(day.date), 'MMMM d');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'border rounded-2xl overflow-hidden transition-all',
        isSelected ? 'border-primary bg-card shadow-lg' : 'border-border bg-card/50'
      )}
    >
      {/* Day Header - Always visible, clickable on mobile */}
      <button
        onClick={onSelectDay}
        className="w-full p-4 md:p-6 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Day Number Badge */}
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex flex-col items-center justify-center font-bold">
              <span className="text-xs uppercase opacity-80">Day</span>
              <span className="text-lg leading-none">{day.dayNumber}</span>
            </div>

            {/* Date & Weather */}
            <div>
              <h3 className="font-semibold text-foreground">
                {dayOfWeek}
              </h3>
              <p className="text-sm text-muted-foreground">{formattedDate}</p>
            </div>

            {/* Weather */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-xl">{day.weather.icon}</span>
              <span>{day.weather.temp}°F</span>
            </div>
          </div>

          {/* Budget Summary */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm">
                <span className="font-medium text-foreground">${spent}</span>
                <span className="text-muted-foreground"> / ${day.dailyBudget}</span>
              </p>
              <p className={cn(
                'text-xs',
                isOverBudget ? 'text-destructive' : 'text-success'
              )}>
                {isOverBudget ? `-$${Math.abs(remaining)} over` : `$${remaining} remaining`}
              </p>
            </div>

            <ChevronDown className={cn(
              'h-5 w-5 text-muted-foreground transition-transform md:hidden',
              isSelected && 'rotate-180'
            )} />
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="mt-4">
          <Progress 
            value={spentPercentage} 
            className={cn(
              'h-2',
              isOverBudget && '[&>div]:bg-destructive'
            )}
          />
        </div>
      </button>

      {/* Day Content - Expandable on mobile, always visible on desktop */}
      <AnimatePresence>
        {(isSelected || window.innerWidth >= 768) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 md:px-6 pb-6">
              {/* Activities Timeline */}
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId={`day-${day.id}`}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-0"
                    >
                      {day.activities.map((activity, index) => (
                        <Draggable
                          key={activity.id}
                          draggableId={activity.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                            >
                              <ActivityItem
                                activity={activity}
                                isDragging={snapshot.isDragging}
                                dragHandleProps={provided.dragHandleProps as unknown as Record<string, unknown> | undefined}
                                onAddFreeTime={() => onAddFreeTime(activity.id)}
                                onRemove={() => onRemoveActivity(activity.id)}
                                onViewOnMap={() => onViewActivityOnMap(activity.id)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* Pro Tips */}
              {day.proTips.length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowProTips(!showProTips)}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Pro Tips for Day {day.dayNumber}
                    </span>
                    {showProTips ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>

                  <AnimatePresence>
                    {showProTips && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 space-y-2 overflow-hidden"
                      >
                        {day.proTips.map((tip, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3"
                          >
                            <span className="text-amber-500">💡</span>
                            {tip}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

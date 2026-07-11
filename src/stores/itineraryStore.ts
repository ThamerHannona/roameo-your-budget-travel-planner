import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DayPlan, Activity, ItineraryState } from '@/types/itinerary';
import { createLisbonItinerary, createGenericItinerary, getTripTotals, type GenericItineraryPOIs } from '@/data/lisbonItinerary';

interface ItineraryActions {
  initializeItinerary: (
    destination: ItineraryState['destination'],
    startDate: Date,
    endDate: Date,
    totalBudget: number,
    travelers: number,
    pois?: GenericItineraryPOIs
  ) => void;
  swapActivity: (dayId: string, activityId: string, newActivity: Activity) => void;
  reorderActivities: (dayId: string, sourceIndex: number, destinationIndex: number) => void;
  addFreeTime: (dayId: string, afterActivityId: string) => void;
  removeActivity: (dayId: string, activityId: string) => void;
  getSelectedDay: (dayNumber: number) => DayPlan | undefined;
  getTotalSpent: () => number;
  getCategoryTotals: () => Record<string, number>;
  clear: () => void;
}

const initialState: ItineraryState = {
  days: [],
  totalBudget: 0,
  totalSpent: 0,
  destination: {
    name: '',
    country: '',
    imageUrl: '',
    coordinates: { lat: 0, lng: 0 },
  },
  tripDates: {
    start: new Date(),
    end: new Date(),
  },
  travelers: 1,
};

export const useItineraryStore = create<ItineraryState & ItineraryActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      initializeItinerary: (destination, startDate, endDate, totalBudget, travelers, pois) => {
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const dailyBudget = Math.round(totalBudget / days);
        
        // Use Lisbon-specific itinerary for Lisbon, generic for other destinations
        let itineraryDays: DayPlan[];
        if (destination.name.toLowerCase() === 'lisbon' && !pois) {
          itineraryDays = createLisbonItinerary(startDate, dailyBudget);
        } else {
          itineraryDays = createGenericItinerary(destination, startDate, days, dailyBudget, pois);
        }
        
        const { totalSpent } = getTripTotals(itineraryDays);

        set({
          days: itineraryDays,
          totalBudget,
          totalSpent,
          destination,
          tripDates: { start: startDate, end: endDate },
          travelers,
        });
      },

      swapActivity: (dayId, activityId, newActivity) => {
        set((state) => ({
          days: state.days.map((day) =>
            day.id === dayId
              ? {
                  ...day,
                  activities: day.activities.map((activity) =>
                    activity.id === activityId ? newActivity : activity
                  ),
                }
              : day
          ),
        }));
      },

      reorderActivities: (dayId, sourceIndex, destinationIndex) => {
        set((state) => ({
          days: state.days.map((day) => {
            if (day.id !== dayId) return day;

            const activities = [...day.activities];
            const [removed] = activities.splice(sourceIndex, 1);
            activities.splice(destinationIndex, 0, removed);

            return { ...day, activities };
          }),
        }));
      },

      addFreeTime: (dayId, afterActivityId) => {
        set((state) => ({
          days: state.days.map((day) => {
            if (day.id !== dayId) return day;

            const activityIndex = day.activities.findIndex((a) => a.id === afterActivityId);
            if (activityIndex === -1) return day;

            const prevActivity = day.activities[activityIndex];
            const freeTimeActivity: Activity = {
              id: `${dayId}-free-${Date.now()}`,
              time: prevActivity.endTime || prevActivity.time,
              endTime: undefined,
              type: 'free-time',
              name: 'Free Time',
              description: 'Relax, explore on your own, or rest at the hotel.',
              cost: 0,
              duration: '1h',
              location: prevActivity.location,
              isFree: true,
            };

            const activities = [...day.activities];
            activities.splice(activityIndex + 1, 0, freeTimeActivity);

            return { ...day, activities };
          }),
        }));
      },

      removeActivity: (dayId, activityId) => {
        set((state) => ({
          days: state.days.map((day) =>
            day.id === dayId
              ? { ...day, activities: day.activities.filter((a) => a.id !== activityId) }
              : day
          ),
        }));
      },

      getSelectedDay: (dayNumber) => {
        return get().days.find((day) => day.dayNumber === dayNumber);
      },

      getTotalSpent: () => {
        const { days } = get();
        return days.reduce(
          (total, day) => total + day.activities.reduce((sum, a) => sum + a.cost, 0),
          0
        );
      },

      getCategoryTotals: () => {
        const { days } = get();
        return getTripTotals(days).byCategory;
      },

      clear: () => set({ ...initialState }),
    }),
    {
      name: 'roamio-itinerary',
      partialize: (state) => ({
        days: state.days,
        totalBudget: state.totalBudget,
        destination: state.destination,
        tripDates: state.tripDates,
        travelers: state.travelers,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          // Rehydrate dates when loading from storage
          if (parsed?.state?.tripDates) {
            parsed.state.tripDates = {
              start: new Date(parsed.state.tripDates.start),
              end: new Date(parsed.state.tripDates.end),
            };
          }
          if (parsed?.state?.days) {
            parsed.state.days = parsed.state.days.map((day: DayPlan) => ({
              ...day,
              date: new Date(day.date),
            }));
          }
          return parsed;
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

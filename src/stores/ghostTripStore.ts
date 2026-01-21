import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TrackedTrip {
  destinationId: string;
  destinationName: string;
  targetPrice: number;
  email: string;
  createdAt: Date;
}

interface GhostTripState {
  trackedTrips: TrackedTrip[];
  expandedUnlockId: string | null;
}

interface GhostTripActions {
  trackTrip: (trip: Omit<TrackedTrip, 'createdAt'>) => void;
  untrackTrip: (destinationId: string) => void;
  isTracking: (destinationId: string) => boolean;
  setExpandedUnlock: (id: string | null) => void;
}

export const useGhostTripStore = create<GhostTripState & GhostTripActions>()(
  persist(
    (set, get) => ({
      trackedTrips: [],
      expandedUnlockId: null,

      trackTrip: (trip) => {
        const exists = get().trackedTrips.find(t => t.destinationId === trip.destinationId);
        if (exists) return;
        
        set((state) => ({
          trackedTrips: [
            ...state.trackedTrips,
            { ...trip, createdAt: new Date() }
          ]
        }));
      },

      untrackTrip: (destinationId) => {
        set((state) => ({
          trackedTrips: state.trackedTrips.filter(t => t.destinationId !== destinationId)
        }));
      },

      isTracking: (destinationId) => {
        return get().trackedTrips.some(t => t.destinationId === destinationId);
      },

      setExpandedUnlock: (id) => {
        set({ expandedUnlockId: id });
      },
    }),
    {
      name: 'roamio-ghost-trips',
      partialize: (state) => ({ trackedTrips: state.trackedTrips }),
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PaymentState {
  isPaid: boolean;
  paidTrips: string[];
  checkPaymentStatus: (destination: string) => boolean;
  markAsPaid: (destination: string) => void;
  resetPayment: () => void;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      isPaid: false,
      paidTrips: [],

      checkPaymentStatus: (destination: string) => {
        const { paidTrips } = get();
        return paidTrips.includes(destination.toLowerCase());
      },

      markAsPaid: (destination: string) => {
        set((state) => {
          const normalizedDestination = destination.toLowerCase();
          if (state.paidTrips.includes(normalizedDestination)) {
            return { isPaid: true };
          }
          return {
            isPaid: true,
            paidTrips: [...state.paidTrips, normalizedDestination],
          };
        });
      },

      resetPayment: () => {
        set({ isPaid: false, paidTrips: [] });
      },
    }),
    {
      name: 'roamio-payments',
    }
  )
);

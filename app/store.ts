import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FunnelData {
  eventSegment?: string;
  specificType?: string;
  adultCount?: number;
  childCount?: number;
  childAge?: number;
  dateRange?: { from: string; to: string };
  roomCounts?: Record<string, number>;
  wantsMeals?: boolean;
  firstMeal?: string;
  lastMeal?: string;
  activities?: Record<string, number>;
}

interface FunnelStore {
  data: FunnelData;
  setSegment: (segment: string) => void;
  setData: (newData: Partial<FunnelData>) => void;
  reset: () => void;
}

export const useFunnelStore = create<FunnelStore>()(
  persist(
    (set) => ({
      data: {
        roomCounts: {},
        activities: {},
        adultCount: 1,
        childCount: 0,
        childAge: 5,
        wantsMeals: false
      },
      setSegment: (segment) => set((state) => ({ 
        data: { ...state.data, eventSegment: segment } 
      })),
      setData: (newData) => set((state) => ({ 
        data: { ...state.data, ...newData } 
      })),
      reset: () => set({ 
        data: { roomCounts: {}, activities: {}, adultCount: 1, childCount: 0, wantsMeals: false } 
      }),
    }),
    { name: 'funnel-storage' }
  )
);
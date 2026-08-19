import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SlotConfig {
  normalMultipliers: number[];
  freeSpinMultipliers: number[];
  scatterRequirements: {
    scatters: number;
    spinsAwarded: number;
  }[];
}

interface SlotStore {
  config: SlotConfig;
  updateConfig: (newConfig: Partial<SlotConfig>) => void;
}

export const useSlotStore = create<SlotStore>()(
  persist(
    (set) => ({
      config: {
        normalMultipliers: [1, 2, 3, 5, 10],
        freeSpinMultipliers: [2, 4, 6, 10],
        scatterRequirements: [
          { scatters: 3, spinsAwarded: 10 },
          { scatters: 4, spinsAwarded: 15 },
          { scatters: 5, spinsAwarded: 20 },
        ],
      },
      updateConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),
    }),
    {
      name: 'slot-config-storage',
    }
  )
);

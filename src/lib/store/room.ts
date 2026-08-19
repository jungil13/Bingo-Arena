import { create } from 'zustand';

export interface RoomConfig {
  id: string;
  name: string;
  drawSpeed: number;
  aiCount: number;
  maxPlayers: number;
  entry: number;
  prize: number;
  hostId?: string;
}

interface RoomStore {
  pendingRoom: RoomConfig | null;
  setPendingRoom: (room: RoomConfig | null) => void;
  activeRooms: RoomConfig[];
  setActiveRooms: (rooms: RoomConfig[]) => void;
}

import { persist } from 'zustand/middleware';

export const useRoomStore = create<RoomStore>()(
  persist(
    (set) => ({
      pendingRoom: null,
      setPendingRoom: (room) => set({ pendingRoom: room }),
      activeRooms: [],
      setActiveRooms: (rooms) => set({ activeRooms: rooms }),
    }),
    {
      name: 'room-store',
    }
  )
);

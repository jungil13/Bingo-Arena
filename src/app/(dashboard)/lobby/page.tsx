'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Trophy, ArrowRight, Plus, X, Sliders, Zap, Clock, ChevronDown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useRoomStore } from '@/lib/store/room';
import type { RoomConfig } from '@/lib/store/room';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth';

const PRESET_ROOMS: RoomConfig[] = [
  {
    id: 'beginner-room',
    name: 'Beginner Room',
    drawSpeed: 8000,
    aiCount: 5,
    maxPlayers: 20,
    entry: 100,
    prize: 500,
  },
  {
    id: 'standard-room',
    name: 'Standard Room',
    drawSpeed: 6000,
    aiCount: 8,
    maxPlayers: 30,
    entry: 500,
    prize: 2500,
  },
  {
    id: 'premium-room',
    name: 'Premium Room',
    drawSpeed: 4000,
    aiCount: 12,
    maxPlayers: 50,
    entry: 2000,
    prize: 10000,
  },
];

const ROOM_COLORS = [
  { bg: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/30', accent: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  { bg: 'from-violet-500/20 to-violet-500/5', border: 'border-violet-500/30', accent: 'text-violet-400', badge: 'bg-violet-500/20 text-violet-300' },
  { bg: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/30', accent: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
];

const SPEED_OPTIONS = [
  { label: 'Slow (10s)', value: 10000 },
  { label: 'Normal (6s)', value: 6000 },
  { label: 'Fast (4s)', value: 4000 },
  { label: 'Ultra (2s)', value: 2000 },
];

export default function LobbyPage() {
  const router = useRouter();
  const { setPendingRoom, activeRooms, setActiveRooms } = useRoomStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customName, setCustomName] = useState('My Room');
  const [customAICount, setCustomAICount] = useState(6);
  const [customSpeed, setCustomSpeed] = useState(6000);
  const authUserId = useAuthStore(state => state.user?.id);
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    if (authUserId) {
      setUserId(authUserId);
    } else {
      let guestId = sessionStorage.getItem('bingo-guest-id');
      if (!guestId) {
        guestId = 'guest-' + Math.random().toString(36).slice(2, 9);
        sessionStorage.setItem('bingo-guest-id', guestId);
      }
      setUserId(guestId);
    }
  }, [authUserId]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase.channel('global-lobby', {
      config: { presence: { key: 'lobby' } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const rooms: RoomConfig[] = [];
      for (const presenceKey in state) {
        for (const p of state[presenceKey] as any[]) {
          if (p.room) {
            rooms.push(p.room);
          }
        }
      }
      // Deduplicate rooms by ID
      const uniqueRooms = Array.from(new Map(rooms.map(r => [r.id, r])).values());
      setActiveRooms(uniqueRooms);
    }).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setActiveRooms]);

  const handleJoin = (room: RoomConfig) => {
    setPendingRoom(room);
    router.push(`/game/${room.id}`);
  };

  const handleCreateRoom = () => {
    const room: RoomConfig = {
      id: `custom-${Date.now()}`,
      name: customName || 'My Room',
      drawSpeed: customSpeed,
      aiCount: customAICount,
      maxPlayers: 50,
      entry: 0,
      prize: 0,
      hostId: userId,
    };
    setPendingRoom(room);
    router.push(`/game/${room.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="font-outfit text-3xl font-bold mb-1">Bingo Lobby</h1>
          <p className="text-muted-foreground text-sm">Pick a room or create your own and compete for points!</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-[0_0_20px_rgba(176,38,255,0.3)] hover:shadow-[0_0_30px_rgba(176,38,255,0.5)] transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Room
        </motion.button>
      </div>

      {/* Room Grid */}
      <div className="grid md:grid-cols-3 gap-5">
        {[...activeRooms, ...PRESET_ROOMS].map((room, index) => {
          const colors = ROOM_COLORS[index % ROOM_COLORS.length];
          const fakePlayers = [12, 21, 37][index % 3];
          return (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`relative glass-card rounded-2xl overflow-hidden border ${colors.border} group cursor-pointer`}
              onClick={() => handleJoin(room)}
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${colors.bg} pointer-events-none`} />

              <div className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-5">
                  <h3 className="font-outfit text-xl font-bold">{room.name}</h3>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
                    Waiting
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <StatRow icon={<Star className={`w-4 h-4 ${colors.accent}`} />} label="Points Prize" value={room.prize > 0 ? `⭐ ${room.prize.toLocaleString()} pts` : 'Free'} />
                  <StatRow icon={<Users className="w-4 h-4 text-muted-foreground" />} label="Players" value={`${fakePlayers} / ${room.maxPlayers}`} />
                  <StatRow icon={<Clock className="w-4 h-4 text-muted-foreground" />} label="Draw Speed" value={SPEED_OPTIONS.find(s => s.value === room.drawSpeed)?.label ?? '6s'} />
                </div>

                {/* Player fill bar */}
                <div className="w-full h-1.5 bg-background/60 rounded-full overflow-hidden mb-5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(fakePlayers / room.maxPlayers) * 100}%` }}
                    transition={{ delay: index * 0.08 + 0.4, duration: 0.6 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>

                <button className="w-full py-3 rounded-xl font-bold text-sm bg-primary/90 hover:bg-primary text-white flex items-center justify-center gap-2 transition-colors group-hover:shadow-[0_0_20px_rgba(176,38,255,0.4)]">
                  Join Room <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* How to Play */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-10 glass-card rounded-2xl p-6 border border-white/5"
      >
        <h2 className="font-outfit text-lg font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" /> How to Play
        </h2>
        <div className="grid sm:grid-cols-4 gap-4 text-sm text-muted-foreground">
          {[
            { step: '1', text: 'Join or create a room' },
            { step: '2', text: 'Numbers are drawn automatically' },
            { step: '3', text: 'Tap matching numbers on your card' },
            { step: '4', text: 'Get 5 in a row to win BINGO!' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center shrink-0">{step}</div>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="bg-card border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-outfit text-xl font-bold">Create Room</h2>
                <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Room Name */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Room Name</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    maxLength={24}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="My Bingo Room"
                  />
                </div>

                {/* AI Count (difficulty) */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4" /> Difficulty: <span className="text-white font-bold">{customAICount <= 4 ? 'Easy' : customAICount <= 9 ? 'Normal' : 'Hard'}</span>
                  </label>
                  <input
                    type="range"
                    min={2}
                    max={14}
                    value={customAICount}
                    onChange={e => setCustomAICount(Number(e.target.value))}
                    className="w-full accent-primary h-2 rounded-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Easy</span>
                    <span>Hard</span>
                  </div>
                </div>

                {/* Draw Speed */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Sliders className="w-4 h-4" /> Draw Speed
                  </label>
                  <div className="relative">
                    <select
                      value={customSpeed}
                      onChange={e => setCustomSpeed(Number(e.target.value))}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none focus:outline-none focus:border-primary/50 transition-colors pr-10"
                    >
                      {SPEED_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateRoom}
                className="mt-6 w-full py-4 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(176,38,255,0.3)]"
              >
                Start Game →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground flex items-center gap-2">{icon}{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

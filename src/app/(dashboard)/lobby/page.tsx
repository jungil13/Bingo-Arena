'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useRoomStore } from '@/lib/store/room';
import type { RoomConfig } from '@/lib/store/room';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import { useWalletStore } from '@/lib/store/wallet';
import { hasLeftGame } from '@/lib/utils';
import {
  Users, Clock, Plus, X, Zap, Gamepad2, Star,
  ChevronRight, Layers, Bell
} from 'lucide-react';

/* ── Types ── */
type GameCategory = 'All' | 'Bingo' | 'Slots';

/* ── Constants ── */
const PRESET_ROOMS: RoomConfig[] = [
  { id: 'beginner-room', name: 'Beginner Room', drawSpeed: 8000, aiCount: 5,  maxPlayers: 20, entry: 100,  prize: 500   },
  { id: 'standard-room', name: 'Standard Room', drawSpeed: 6000, aiCount: 8,  maxPlayers: 30, entry: 500,  prize: 2500  },
  { id: 'premium-room',  name: 'Premium Room',  drawSpeed: 4000, aiCount: 12, maxPlayers: 50, entry: 2000, prize: 10000 },
];

const SPEED_OPTIONS = [
  { label: 'Slow (8s)',   value: 8000 },
  { label: 'Normal (6s)', value: 6000 },
  { label: 'Fast (4s)',   value: 4000 },
  { label: 'Ultra (2s)', value: 2000 },
];

const SPEED_LABEL: Record<number, string> = { 8000: '8s', 6000: '6s', 4000: '4s', 2000: '2s' };

const ROOM_GRADIENTS = [
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  'linear-gradient(135deg,#7c3aed,#4c1d95)',
];

/* ── Game catalogue ── */
interface GameCard {
  id: string; title: string; category: GameCategory;
  tag?: string; tagColor?: string; href?: string;
  description: string; gradient: string; emoji: string;
}

const GAME_CATALOGUE: GameCard[] = [
  {
    id: 'super-ace', title: 'Super Ace', category: 'Slots',
    tag: 'HOT', tagColor: 'bg-red-500', href: '/super-ace',
    description: 'Cascading reels · Multipliers · Scatters',
    gradient: 'from-violet-600 to-purple-800', emoji: '🃏',
  },
];

const CATEGORIES: GameCategory[] = ['All', 'Bingo', 'Slots'];

/* ── Create Room Modal ── */
function CreateRoomModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (room: RoomConfig) => void;
}) {
  const { user } = useAuthStore();
  const [name, setName]         = useState('');
  const [speed, setSpeed]       = useState(6000);
  const [maxPlayers, setMax]    = useState(20);
  const [entry, setEntry]       = useState(100);
  const [aiCount, setAiCount]   = useState(5);

  const prize = entry;  // Prize = Entry fee (1:1)

  const handleCreate = () => {
    if (!name.trim()) return;
    const id = `custom-${Date.now()}`;
    onCreate({
      id, name: name.trim(), drawSpeed: speed,
      aiCount, maxPlayers, entry, prize,
      hostId: user?.id,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-white" />
            <h2 className="font-bold text-white text-base">Create Bingo Room</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Room Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Room Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30}
              placeholder="e.g. Friday Night Bingo"
              className="w-full bg-gray-50 border border-gray-200 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none transition-colors"
            />
          </div>

          {/* Draw Speed */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Draw Speed</label>
            <div className="grid grid-cols-4 gap-2">
              {SPEED_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSpeed(opt.value)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    speed === opt.value
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                >
                  {opt.label.split(' ')[0]}<br />
                  <span className="font-normal">{opt.label.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Max Players: <span className="text-purple-600">{maxPlayers}</span>
              </label>
              <input type="range" min={5} max={50} value={maxPlayers}
                onChange={e => setMax(+e.target.value)}
                className="w-full accent-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                AI Bots: <span className="text-purple-600">{aiCount}</span>
              </label>
              <input type="range" min={0} max={20} value={aiCount}
                onChange={e => setAiCount(+e.target.value)}
                className="w-full accent-purple-600"
              />
            </div>
          </div>

          {/* Entry Fee */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Entry Fee (pts)
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 flex-wrap">
                {[50, 100, 500, 1000, 2000].map(v => (
                  <button key={v} onClick={() => setEntry(v)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      entry === v
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500 hover:bg-purple-50 hover:text-purple-600'
                    }`}
                  >
                    {v.toLocaleString()}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={entry || ''}
                onChange={e => setEntry(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Or type custom amount..."
                className="w-full bg-gray-50 border border-gray-200 focus:border-purple-400 rounded-xl px-4 py-2 text-sm text-gray-800 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Prize preview */}
          <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold text-purple-700">Your Prize if you Win</span>
            </div>
            <span className="font-bold text-purple-700">{prize.toLocaleString()} pts</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            Create Room
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Page ── */
export default function LobbyPage() {
  const router = useRouter();
  const { setPendingRoom, activeRooms, setActiveRooms } = useRoomStore();
  const { balance } = useWalletStore();
  const [category, setCategory] = useState<GameCategory>('All');
  const [mounted, setMounted]   = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  type LobbyEvent = { id: string; name: string; type: 'online' | 'playing_super_ace' | 'playing_bingo' | 'big_win'; amount?: number };
  const [lobbyEvents, setLobbyEvents] = useState<LobbyEvent[]>([]);
  const { user } = useAuthStore();
  const [guestId] = useState(() => `guest-${Math.random().toString(36).slice(2, 10)}`);

  const addEvent = (event: Omit<LobbyEvent, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setLobbyEvents(prev => [...prev, { ...event, id }]);
    setTimeout(() => {
      setLobbyEvents(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    
    // Clean up any existing channel with the same name to prevent hot-reload/strict-mode errors
    supabase.getChannels().forEach(c => {
      if (c.topic === 'realtime:global-lobby') {
        supabase.removeChannel(c);
      }
    });

    const channel = supabase.channel('global-lobby', { config: { presence: { key: 'lobby' } } });
    
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const rooms: RoomConfig[] = [];
      for (const key in state) {
        for (const p of state[key] as any[]) {
          if (p.room) rooms.push(p.room);
        }
      }
      setActiveRooms(Array.from(new Map(rooms.map(r => [r.id, r])).values()));
    });

    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      for (const p of newPresences) {
        if (p.isLobbyUser && p.name && (!user || p.userId !== user.id)) {
          addEvent({ name: p.name, type: 'online' });
        }
      }
    });

    // Listen for cross-client broadcasts
    channel.on('broadcast', { event: 'game_activity' }, ({ payload }) => {
      if (payload.name && (!user || payload.userId !== user.id)) {
        addEvent({ name: payload.name, type: payload.game === 'Bingo' ? 'playing_bingo' : 'playing_super_ace' });
      }
    });

    channel.on('broadcast', { event: 'big_win' }, ({ payload }) => {
      if (payload.name && (!user || payload.userId !== user.id)) {
        addEvent({ name: payload.name, type: 'big_win', amount: payload.amount });
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const myName = user?.username || `Guest-${Math.random().toString(36).slice(2, 6)}`;
        await channel.track({ isLobbyUser: true, name: myName, userId: user?.id || guestId, activity: 'Lobby' });
      }
    });
    
    return () => { supabase.removeChannel(channel); };
  }, [setActiveRooms, user]);

  const handleJoinRoom = (room: RoomConfig) => {
    if (balance < room.entry) {
      alert(`Not enough points! You need ${room.entry.toLocaleString()} points to join this room.`);
      return;
    }
    setPendingRoom(room);
    router.push(`/game/${room.id}`);
  };

  const handleCreateRoom = (room: RoomConfig) => {
    if (balance < room.entry) {
      alert(`Not enough points! You need ${room.entry.toLocaleString()} points to create this room.`);
      return;
    }
    setShowCreate(false);
    setPendingRoom(room);
    router.push(`/game/${room.id}`);
  };

  const allRoomsMap = new Map([...PRESET_ROOMS, ...activeRooms].map(r => [r.id, r]));
  const allRooms = Array.from(allRoomsMap.values());
  const showBingo = category === 'All' || category === 'Bingo';
  const showSlots = category === 'All' || category === 'Slots';

  if (!mounted) return null;

  return (
    <>
      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateRoomModal
            onClose={() => setShowCreate(false)}
            onCreate={handleCreateRoom}
          />
        )}
      </AnimatePresence>

      {/* Online Toasts */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-8 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {lobbyEvents.map(event => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`text-white px-4 py-2.5 rounded-xl shadow-lg border flex items-center gap-2 pointer-events-auto ${
                event.type === 'big_win' 
                  ? 'bg-amber-500 border-amber-400' 
                  : event.type === 'playing_super_ace'
                  ? 'bg-orange-600 border-orange-500'
                  : 'bg-purple-600 border-purple-500'
              }`}
            >
              {event.type === 'online' && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
              {event.type === 'big_win' && <span className="text-lg">🎰</span>}
              {event.type === 'playing_super_ace' && <span className="text-lg">🃏</span>}
              {event.type === 'playing_bingo' && <span className="text-lg">🎯</span>}
              
              <span className="text-sm font-bold">{event.name}</span>
              
              <span className="text-sm opacity-90">
                {event.type === 'online' && 'is online'}
                {event.type === 'playing_super_ace' && 'is playing Super Ace'}
                {event.type === 'playing_bingo' && 'is playing Bingo'}
                {event.type === 'big_win' && (
                  <span className="font-black text-white ml-1">
                    just won ₱{event.amount?.toLocaleString()}!
                  </span>
                )}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="min-h-full pb-20 md:pb-6">

        {/* Hero */}
        <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#1a0028 0%,#3b0764 50%,#1a0028 100%)', minHeight: 160 }}>
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
          <div className="relative z-10 px-4 md:px-8 py-8 flex items-center justify-between max-w-5xl">
            <div>
              <p className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> Now Live
              </p>
              <h1 className="font-bold text-white text-2xl md:text-3xl leading-tight mb-1.5">
                Bingo Arena <span className="text-purple-400">Game Hub</span>
              </h1>
              <p className="text-purple-200/70 text-sm">Play Bingo &amp; Super Ace · Win Points</p>
            </div>
            <Gamepad2 className="w-16 h-16 text-purple-300/40 hidden sm:block" />
          </div>
        </div>

        {/* Ticker */}
        <div className="bg-purple-50 border-b border-purple-200 px-4 py-2 flex items-center gap-2 overflow-hidden">
          <Bell className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
          <p className="text-xs text-purple-700 font-medium whitespace-nowrap overflow-hidden">
            Welcome to Bingo Arena! &nbsp;|&nbsp; Claim your daily bonus of 10,000 points in the Wallet page! &nbsp;|&nbsp; More games coming soon!
          </p>
        </div>

        <div className="px-4 md:px-8 pt-5 max-w-5xl mx-auto">

          {/* Category tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                  category === cat
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-purple-300 hover:text-purple-600'
                }`}
              >
                {cat === 'Bingo' ? 'Bingo' : cat === 'Slots' ? 'Slots' : 'All Games'}
              </button>
            ))}
          </div>

          {/* Slots */}
          {showSlots && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-purple-500" />
                <h2 className="font-bold text-gray-800 text-base">Slot Games</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {GAME_CATALOGUE.filter(g => g.category === 'Slots').map((game, i) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => game.href && router.push(game.href)}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <div className={`bg-gradient-to-br ${game.gradient} aspect-[4/3] flex items-center justify-center relative`}>
                      <span className="text-5xl">{game.emoji}</span>
                      {game.tag && (
                        <span className={`absolute top-2 left-2 text-[10px] font-black text-white px-1.5 py-0.5 rounded-md ${game.tagColor}`}>
                          {game.tag}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="font-bold text-gray-800 text-sm">{game.title}</p>
                      <p className="text-gray-400 text-[10px] mt-0.5">{game.description}</p>
                      <div className="mt-2 w-full py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold text-center">
                        Play Now
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Coming soon */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-dashed border-gray-200 opacity-50 pointer-events-none">
                  <div className="bg-gray-50 aspect-[4/3] flex flex-col items-center justify-center gap-1">
                    <Plus className="w-6 h-6 text-gray-300" />
                    <span className="text-[11px] text-gray-400 font-semibold">Coming Soon</span>
                  </div>
                  <div className="p-2.5">
                    <p className="font-bold text-gray-300 text-sm">New Slot</p>
                    <p className="text-gray-200 text-[10px] mt-0.5">Stay tuned!</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Bingo */}
          {showBingo && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <h2 className="font-bold text-gray-800 text-base">Bingo Rooms</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{allRooms.length} live</span>
                </div>
                {/* Create Room Button */}
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Room
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {allRooms.map((room, i) => {
                  const left       = hasLeftGame(room.id);
                  const inProgress = room.status === 'IN_PROGRESS' || room.status === 'STARTING';
                  const disabled   = left || inProgress;
                  return (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all"
                    >
                      {/* Colour header */}
                      <div
                        className="px-4 py-3 flex items-center justify-between"
                        style={{ background: ROOM_GRADIENTS[i % ROOM_GRADIENTS.length] }}
                      >
                        <p className="font-bold text-white text-sm">{room.name}</p>
                        {left ? (
                          <span className="text-[10px] font-bold bg-red-500/80 text-white px-2 py-0.5 rounded-full">Left</span>
                        ) : inProgress ? (
                          <span className="text-[10px] font-bold bg-blue-400/80 text-white px-2 py-0.5 rounded-full">Live</span>
                        ) : (
                          <span className="text-[10px] font-bold bg-white/30 text-white px-2 py-0.5 rounded-full">Waiting</span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="px-4 py-3 space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {SPEED_LABEL[room.drawSpeed] ?? '6s'} draw</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Max {room.maxPlayers}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-gray-400">Entry</p>
                            <p className="font-bold text-gray-800 text-sm flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400" /> {room.entry.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400">Prize</p>
                            <p className="font-bold text-purple-600 text-sm flex items-center gap-1 justify-end">
                              <Star className="w-3 h-3 text-yellow-400" /> {room.prize.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Active Players */}
                        {room.activePlayers && room.activePlayers.length > 0 && (
                          <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-gray-500 font-semibold bg-gray-50 px-1.5 py-0.5 rounded-md">Players:</span>
                            <span className="text-xs font-bold text-purple-600 truncate">
                              {room.activePlayers.join(', ')} {room.activePlayers.length === 1 ? 'is playing here' : 'are playing here'}
                            </span>
                          </div>
                        )}

                        <button
                          disabled={disabled}
                          onClick={() => handleJoinRoom(room)}
                          className="w-full py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                          style={{
                            background: disabled ? '#e5e7eb' : 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                            color: disabled ? '#9ca3af' : 'white',
                          }}
                        >
                          {left ? 'Already Left' : inProgress ? 'In Progress' : <>Join Room <ChevronRight className="w-3.5 h-3.5" /></>}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

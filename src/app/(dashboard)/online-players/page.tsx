'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import { Users, Gamepad2, Compass, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

interface OnlineUser {
  userId: string;
  name: string;
  activity: 'Lobby' | 'Super Ace' | 'Bingo' | 'Offline';
}

export default function OnlinePlayersPage() {
  const { user } = useAuthStore();
  const [guestId] = useState(() => `guest-${Math.random().toString(36).slice(2, 10)}`);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Clean up any existing channel with the same name
    supabase.getChannels().forEach(c => {
      if (c.topic === 'realtime:global-lobby') {
        supabase.removeChannel(c);
      }
    });

    const channel = supabase.channel('global-lobby', { config: { presence: { key: 'lobby' } } });
    
    const syncState = () => {
      const state = channel.presenceState();
      const list: OnlineUser[] = [];
      const seen = new Set<string>();

      for (const key in state) {
        for (const p of state[key] as any[]) {
          // Ensure we extract valid lobby users
          if (p.isLobbyUser && p.name && p.userId) {
            const uniqueKey = `${p.userId}-${p.activity || 'Lobby'}`;
            if (!seen.has(p.userId)) {
              seen.add(p.userId);
              list.push({
                userId: p.userId,
                name: p.name,
                activity: p.activity || 'Lobby',
              });
            }
          }
        }
      }
      setOnlineUsers(list);
      setLoading(false);
    };

    channel.on('presence', { event: 'sync' }, syncState);
    channel.on('presence', { event: 'join' }, syncState);
    channel.on('presence', { event: 'leave' }, syncState);

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const myName = user?.username || `Guest-${Math.random().toString(36).slice(2, 6)}`;
        await channel.track({
          isLobbyUser: true,
          name: myName,
          userId: user?.id || guestId,
          activity: 'Lobby', // On this page, they are browsing online players from the lobby area
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const totalCount = onlineUsers.length;
  const lobbyCount = onlineUsers.filter(u => u.activity === 'Lobby').length;
  const superAceCount = onlineUsers.filter(u => u.activity === 'Super Ace').length;
  const bingoCount = onlineUsers.filter(u => u.activity === 'Bingo').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-600" />
          Online Players
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Real-time listing of active players and their current games.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Online', value: totalCount, icon: Radio, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'In Lobby', value: lobbyCount, icon: Compass, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Super Ace', value: superAceCount, icon: Gamepad2, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Playing Bingo', value: bingoCount, icon: Gamepad2, color: 'text-pink-600', bg: 'bg-pink-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            key={label}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col gap-2"
          >
            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-black text-gray-800">{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Players List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800">Active Players List</h2>
          <span className="px-2.5 py-1 bg-green-50 text-[10px] font-bold text-green-600 uppercase tracking-wider rounded-full flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Live Sync
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            Connecting to global server...
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            No online players found.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {onlineUsers.map((p) => {
              const initial = p.name.charAt(0).toUpperCase();
              
              return (
                <div key={p.userId} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-white font-black text-sm shadow-sm">
                      {initial}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{p.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">ID: {p.userId.slice(0, 8)}...</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${
                      p.activity === 'Super Ace'
                        ? 'bg-orange-50 border-orange-100 text-orange-600'
                        : p.activity === 'Bingo'
                        ? 'bg-pink-50 border-pink-100 text-pink-600'
                        : 'bg-blue-50 border-blue-100 text-blue-600'
                    }`}>
                      {p.activity === 'Super Ace' && '🎰 Playing Super Ace'}
                      {p.activity === 'Bingo' && '🎯 Playing Bingo'}
                      {p.activity === 'Lobby' && '🧭 Browsing Lobby'}
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 ring-4 ring-green-100 animate-pulse shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

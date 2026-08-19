'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, Gamepad2, Coins, Trophy, Settings, Activity, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const [activeGame, setActiveGame] = useState<any>(null);

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link href="/lobby" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="font-outfit font-bold text-white text-xl">B</span>
            </div>
            <span className="font-outfit font-bold tracking-tight text-xl neon-text-purple">BINGO ARENA</span>
          </Link>
          <span className="px-3 py-1 bg-white/10 text-xs font-bold uppercase tracking-wider rounded-full ml-4">
            Admin Panel
          </span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <StatCard icon={<Users />} label="Total Players" value="1,248" />
          <StatCard icon={<Gamepad2 />} label="Active Games" value="3" color="text-green-400" />
          <StatCard icon={<Activity />} label="Games Today" value="142" />
          <StatCard icon={<Coins />} label="Coins Distributed" value="1.2M" color="text-gold" />
          <StatCard icon={<Trophy />} label="Total Winners" value="89" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="font-outfit text-2xl font-bold">Active Games</h2>
            
            <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-muted-foreground text-sm uppercase tracking-wider">
                  <tr>
                    <th className="p-4 font-medium">Room</th>
                    <th className="p-4 font-medium">Players</th>
                    <th className="p-4 font-medium">Prize</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <GameRow name="Beginner Room" players="12/50" prize="500" status="Waiting" />
                  <GameRow name="Standard Room" players="48/50" prize="2,500" status="In Progress" color="text-green-400" />
                  <GameRow name="Premium Room" players="50/50" prize="10,000" status="Winner Pending" color="text-gold" />
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="font-outfit text-2xl font-bold">Game Control</h2>
            
            <div className="glass-card rounded-2xl p-6 border border-primary/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Selected Room</p>
                  <p className="font-bold text-lg">Standard Room</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Current Number</p>
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(176,38,255,0.5)]">
                    42
                  </div>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <Button className="w-full rounded-xl bg-accent hover:bg-accent/90 text-white font-bold">
                    Draw Next Number
                  </Button>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="rounded-xl border-white/10">
                      Pause
                    </Button>
                    <Button variant="outline" className="rounded-xl border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                      End Game
                    </Button>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-muted-foreground mb-2">Settings</p>
                  <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                    <span className="text-sm font-medium">Draw Interval</span>
                    <span className="text-sm font-bold text-primary">5 seconds</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Slot Config */}
            <SlotConfigControl />
          </div>
        </div>
      </div>
    </div>
  );
}

import { useSlotStore } from '@/lib/store/slotStore';

function SlotConfigControl() {
  const { config, updateConfig } = useSlotStore();
  
  return (
    <div className="space-y-6 mt-8">
      <h2 className="font-outfit text-2xl font-bold">Slot Config</h2>
      
      <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Normal Multipliers (comma separated)</p>
          <input 
            type="text" 
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            value={config.normalMultipliers.join(', ')}
            onChange={(e) => {
              const vals = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
              if (vals.length > 0) updateConfig({ normalMultipliers: vals });
            }}
          />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">Free Spin Multipliers (comma separated)</p>
          <input 
            type="text" 
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            value={config.freeSpinMultipliers.join(', ')}
            onChange={(e) => {
              const vals = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
              if (vals.length > 0) updateConfig({ freeSpinMultipliers: vals });
            }}
          />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">Scatter Config (Scatters:Spins, ...)</p>
          <input 
            type="text" 
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            value={config.scatterRequirements.map(r => `${r.scatters}:${r.spinsAwarded}`).join(', ')}
            onChange={(e) => {
              const pairs = e.target.value.split(',').map(s => {
                const parts = s.split(':');
                if (parts.length === 2) {
                  const scatters = parseInt(parts[0].trim());
                  const spinsAwarded = parseInt(parts[1].trim());
                  if (!isNaN(scatters) && !isNaN(spinsAwarded)) return { scatters, spinsAwarded };
                }
                return null;
              }).filter(Boolean) as { scatters: number, spinsAwarded: number }[];
              if (pairs.length > 0) updateConfig({ scatterRequirements: pairs });
            }}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color = "text-white" }: { icon: React.ReactNode, label: string, value: string, color?: string }) {
  return (
    <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function GameRow({ name, players, prize, status, color = "text-white" }: { name: string, players: string, prize: string, status: string, color?: string }) {
  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="p-4 font-medium">{name}</td>
      <td className="p-4 text-muted-foreground">{players}</td>
      <td className="p-4 font-bold text-gold">{prize}</td>
      <td className={`p-4 font-medium ${color}`}>{status}</td>
      <td className="p-4 text-right">
        <Button size="sm" variant="outline" className="rounded-lg border-primary/50 text-primary hover:bg-primary/10">
          Control
        </Button>
      </td>
    </tr>
  );
}

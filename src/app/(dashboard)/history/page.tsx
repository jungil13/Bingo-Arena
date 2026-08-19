'use client';

import { motion } from 'framer-motion';
import { History as HistoryIcon, Trophy, Coins } from 'lucide-react';

const MOCK_HISTORY = [
  {
    id: 'game-1',
    roomName: 'Standard Room',
    entry: 500,
    result: 'Won',
    prize: 2500,
    date: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'game-2',
    roomName: 'Beginner Room',
    entry: 100,
    result: 'Lost',
    prize: 0,
    date: new Date(Date.now() - 86400000).toISOString(),
  }
];

export default function HistoryPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-outfit text-3xl font-bold mb-2">Game History</h1>
        <p className="text-muted-foreground">Review your past games and results.</p>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="divide-y divide-white/5">
          {MOCK_HISTORY.map((game, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={game.id} 
              className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-white/5 transition-colors gap-4"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  game.result === 'Won' ? 'bg-gold/20 text-gold' : 'bg-white/5 text-muted-foreground'
                }`}>
                  {game.result === 'Won' ? <Trophy className="w-6 h-6" /> : <HistoryIcon className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-bold text-lg">{game.roomName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Coins className="w-3 h-3" /> Entry: {game.entry} coins
                    <span className="mx-2">•</span>
                    {new Date(game.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t border-white/5 md:border-0 pt-4 md:pt-0">
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                  game.result === 'Won' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {game.result}
                </span>
                {game.result === 'Won' && (
                  <span className="text-gold font-bold mt-2">
                    +{game.prize.toLocaleString()}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { Trophy, LayoutGrid, Coins, CalendarDays, XCircle } from 'lucide-react';

const MOCK_HISTORY = [
  {
    id: 'game-1',
    game: 'Bingo',
    roomName: 'Standard Room',
    entry: 500,
    result: 'Won',
    prize: 2500,
    date: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'game-2',
    game: 'Bingo',
    roomName: 'Beginner Room',
    entry: 100,
    result: 'Lost',
    prize: 0,
    date: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'game-3',
    game: 'Super Ace',
    roomName: 'Slots',
    entry: 50,
    result: 'Won',
    prize: 320,
    date: new Date(Date.now() - 172800000).toISOString(),
  },
];

export default function HistoryPage() {
  const wins  = MOCK_HISTORY.filter(g => g.result === 'Won').length;
  const total = MOCK_HISTORY.length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Game History</h1>
        <p className="text-sm text-gray-400 mt-0.5">Review your past game results.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Games Played', value: total, icon: LayoutGrid, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Wins',         value: wins,  icon: Trophy,     color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Win Rate',     value: `${total ? Math.round((wins/total)*100) : 0}%`, icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center"
          >
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* History list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800">Recent Games</h2>
          <span className="text-xs text-gray-400">{total} games</span>
        </div>

        <div className="space-y-2">
          {MOCK_HISTORY.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
            >
              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                game.result === 'Won' ? 'bg-yellow-50' : 'bg-gray-100'
              }`}>
                {game.result === 'Won'
                  ? <Trophy className="w-5 h-5 text-yellow-500" />
                  : <XCircle className="w-5 h-5 text-gray-400" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-gray-800 text-sm truncate">{game.roomName}</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-600 flex-shrink-0">
                    {game.game}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                  <CalendarDays className="w-3 h-3" />
                  <span>{new Date(game.date).toLocaleDateString()}</span>
                  <span className="mx-1">·</span>
                  <Coins className="w-3 h-3" />
                  <span>Entry: {game.entry.toLocaleString()}</span>
                </div>
              </div>

              {/* Result */}
              <div className="flex-shrink-0 text-right">
                <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  game.result === 'Won'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-500'
                }`}>
                  {game.result}
                </span>
                {game.result === 'Won' && (
                  <p className="text-sm font-bold text-green-600 mt-1">+{game.prize.toLocaleString()}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

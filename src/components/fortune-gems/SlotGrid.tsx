import { motion, AnimatePresence } from 'framer-motion';
import { Grid, SymbolType, WinResult } from '@/lib/fortune-gems/engine';

interface SlotGridProps {
  grid: Grid | null;
  wins: WinResult[];
  isShuffling: boolean;
  onReelsStopped: () => void;
}

export function SlotGrid({ grid, wins, isShuffling, onReelsStopped }: SlotGridProps) {
  if (!grid) return <div className="h-64 w-full bg-black/50 animate-pulse rounded-lg" />;

  const cols = grid.length;
  const rows = grid[0].length;

  return (
    <div className="relative aspect-square w-full max-w-[300px] mx-auto p-1.5 bg-gradient-to-b from-[#2c1000] to-[#1a0510] rounded-xl border-4 border-yellow-600 shadow-[0_0_20px_rgba(202,138,4,0.3)]">
      <div className="grid grid-cols-3 gap-1.5 h-full">
        {grid.map((col, cIndex) => (
          <div key={`col-${cIndex}`} className="flex flex-col gap-1.5 relative overflow-hidden bg-black/40 rounded-lg shadow-inner">
            <AnimatePresence mode="popLayout" onExitComplete={cIndex === cols - 1 ? onReelsStopped : undefined}>
              {col.map((cell, rIndex) => {
                const isWinningCell = wins.some(w => w.positions.some(p => p.col === cIndex && p.row === rIndex));
                
                return (
                  <motion.div
                    key={isShuffling ? `shuffle-${cIndex}-${rIndex}-${Math.random()}` : cell.id}
                    initial={isShuffling ? { y: -100, opacity: 0 } : false}
                    animate={{ y: 0, opacity: 1 }}
                    exit={isShuffling ? { y: 100, opacity: 0 } : undefined}
                    transition={{ 
                      type: 'spring', 
                      damping: 15, 
                      stiffness: 100, 
                      delay: isShuffling ? cIndex * 0.1 : 0 
                    }}
                    className={`flex-1 flex items-center justify-center rounded-lg relative ${
                      isWinningCell ? 'z-10 shadow-[0_0_15px_rgba(255,255,255,0.8)]' : ''
                    }`}
                    style={{
                      background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
                      border: isWinningCell ? '2px solid rgba(255, 215, 0, 0.8)' : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <SymbolRenderer type={cell.type} isWinning={isWinningCell} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function SymbolRenderer({ type, isWinning }: { type: SymbolType; isWinning: boolean }) {
  let content: string = type;
  let colorClass = 'text-white';
  
  switch (type) {
    case 'GOLDEN': content = '💎'; colorClass = 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]'; break;
    case 'DIAMOND': content = '💎'; colorClass = 'text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]'; break;
    case 'AMETHYST': content = '🟣'; colorClass = 'text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]'; break;
    case 'SAPPHIRE': content = '🔵'; colorClass = 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]'; break;
    case 'EMERALD': content = '🟢'; colorClass = 'text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]'; break;
    case 'RUBY': content = '🔴'; colorClass = 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'; break;
    case 'WILD': content = 'WILD'; colorClass = 'text-orange-400 font-black italic drop-shadow-[0_0_5px_rgba(251,146,60,1)]'; break;
    case 'BONUS': content = 'BONUS'; colorClass = 'text-pink-500 font-black drop-shadow-[0_0_5px_rgba(236,72,153,1)]'; break;
    case 'LUCKY_GEM': content = '🍀'; colorClass = 'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,1)]'; break;
    case 'A': colorClass = 'text-red-400 font-black'; break;
    case 'K': colorClass = 'text-yellow-400 font-black'; break;
    case 'Q': colorClass = 'text-purple-400 font-black'; break;
    case 'J': colorClass = 'text-blue-400 font-black'; break;
  }

  return (
    <motion.div
      animate={isWinning ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] } : {}}
      transition={{ repeat: isWinning ? Infinity : 0, duration: 1 }}
      className={`text-3xl md:text-4xl ${colorClass}`}
    >
      {content}
    </motion.div>
  );
}

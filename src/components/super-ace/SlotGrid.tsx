'use client';

import { Grid, WinResult } from '@/lib/super-ace/engine';
import { CardSymbol } from './CardSymbol';
import { motion, AnimatePresence } from 'framer-motion';

interface SlotGridProps {
  grid: Grid;
  wins: WinResult[];
}

export function SlotGrid({ grid, wins }: SlotGridProps) {
  const cols = grid.length;

  const winningPositions = new Set<string>();
  wins.forEach(win => {
    win.positions.forEach(p => winningPositions.add(`${p.col},${p.row}`));
  });

  return (
    /* Wooden-frame style outer border matching Jili look */
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg,#2c1a0e 0%,#3d2410 50%,#2c1a0e 100%)',
        padding: '3px',
      }}
    >
      {/* Inner dark bezel */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'linear-gradient(180deg,#0a0014 0%,#12001e 100%)', padding: '6px' }}
      >
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((col, cIndex) => (
            <div key={`col-${cIndex}`} className="flex flex-col gap-1">
              <AnimatePresence>
                {col.map((cell, rIndex) => {
                  const isWinning = winningPositions.has(`${cIndex},${rIndex}`);
                  return (
                    <motion.div
                      key={cell.id}
                      initial={{ y: -60, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 28,
                        mass: 0.7,
                      }}
                      // Fixed cell height that's tight and compact
                      className="aspect-[3/4] w-full"
                    >
                      <CardSymbol
                        type={cell.type}
                        isGolden={cell.isGolden}
                        isWinning={isWinning}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';

interface MultiplierBarProps {
  currentMultiplier: number;
}

const MULTIPLIERS = [1, 2, 3, 5];

export function MultiplierBar({ currentMultiplier }: MultiplierBarProps) {
  return (
    <div
      className="flex items-center justify-between rounded-xl px-2 py-1 mb-2"
      style={{
        background: 'linear-gradient(180deg,#3d2410 0%,#2c1a0e 100%)',
        border: '1.5px solid #5a3820',
      }}
    >
      {/* Left label */}
      <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider shrink-0 mr-1">Combo</span>

      {/* Multiplier pills */}
      <div className="flex gap-1 flex-1 justify-around">
        {MULTIPLIERS.map((m) => {
          const isActive = m <= currentMultiplier && currentMultiplier > 1;
          const isCurrent = m === currentMultiplier;
          return (
            <motion.div
              key={m}
              animate={{
                scale: isCurrent ? 1.15 : 1,
              }}
              className="flex items-center justify-center rounded-md px-2 py-0.5 min-w-[32px]"
              style={{
                background: isCurrent
                  ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                  : isActive
                  ? 'rgba(245,158,11,0.25)'
                  : 'rgba(255,255,255,0.05)',
                border: isCurrent ? '1px solid #fbbf24' : '1px solid transparent',
                boxShadow: isCurrent ? '0 0 8px rgba(245,158,11,0.6)' : undefined,
              }}
            >
              <span
                className="text-xs font-black"
                style={{ color: isCurrent ? '#fff' : isActive ? '#fbbf24' : '#6b7280' }}
              >
                x{m}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Right label */}
      <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider shrink-0 ml-1">Win More</span>
    </div>
  );
}

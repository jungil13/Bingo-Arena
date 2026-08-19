'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface FreeSpinsOverlayProps {
  /** Number of free spins being awarded */
  spinsAwarded: number;
  /** Number of scatter symbols that triggered it */
  scatterCount: number;
  /** Called when the player taps "GO" to start free spins */
  onStart: () => void;
}

const FREE_SPIN_STYLE = `
@keyframes fs-particle {
  0%   { transform: translate(0,0) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translate(var(--tx),var(--ty)) scale(0) rotate(var(--tr)); opacity: 0; }
}
@keyframes fs-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes fs-pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(251,191,36,0.8); }
  70%  { box-shadow: 0 0 0 28px rgba(251,191,36,0); }
  100% { box-shadow: 0 0 0 0 rgba(251,191,36,0); }
}
`;

let fsInjected = false;
function injectFsStyle() {
  if (fsInjected || typeof document === 'undefined') return;
  fsInjected = true;
  const s = document.createElement('style');
  s.textContent = FREE_SPIN_STYLE;
  document.head.appendChild(s);
}

/* ── Burst particle ── */
function BurstParticle({ angle, color, distance }: { angle: number; color: string; distance: number }) {
  const tx = `${Math.cos((angle * Math.PI) / 180) * distance}px`;
  const ty = `${Math.sin((angle * Math.PI) / 180) * distance}px`;
  const tr = `${Math.random() > 0.5 ? 360 : -360}deg`;

  return (
    <span
      className="absolute text-base pointer-events-none select-none"
      style={{
        color,
        top: '50%',
        left: '50%',
        '--tx': tx,
        '--ty': ty,
        '--tr': tr,
        animation: `fs-particle 1.1s ease-out forwards`,
      } as React.CSSProperties}
    >
      ✦
    </span>
  );
}

const PARTICLE_COLORS = ['#fbbf24', '#fde68a', '#f59e0b', '#fff', '#facc15', '#fef3c7'];

export function FreeSpinsOverlay({ spinsAwarded, scatterCount, onStart }: FreeSpinsOverlayProps) {
  useEffect(() => { injectFsStyle(); }, []);

  const angles = Array.from({ length: 24 }, (_, i) => i * 15);

  return (
    <motion.div
      key="free-spins-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl overflow-hidden"
      style={{ background: 'rgba(5,0,15,0.92)', backdropFilter: 'blur(6px)' }}
    >
      {/* Background glow orb */}
      <div
        className="absolute"
        style={{
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(245,158,11,0.25) 0%,transparent 70%)',
        }}
      />

      {/* Burst particles */}
      <div className="absolute" style={{ top: '50%', left: '50%' }}>
        {angles.map((angle, i) => (
          <BurstParticle
            key={i}
            angle={angle}
            color={PARTICLE_COLORS[i % PARTICLE_COLORS.length]}
            distance={80 + (i % 3) * 30}
          />
        ))}
      </div>

      {/* Scatter count badge */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', bounce: 0.5 }}
        className="mb-3 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase"
        style={{
          background: 'rgba(245,158,11,0.2)',
          border: '1.5px solid rgba(245,158,11,0.6)',
          color: '#fbbf24',
        }}
      >
        {scatterCount} × Super Ace
      </motion.div>

      {/* Main title */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.25, type: 'spring', stiffness: 280, damping: 18 }}
        className="text-center mb-2"
      >
        <div
          className="text-4xl sm:text-5xl font-black leading-none"
          style={{
            background: 'linear-gradient(135deg,#fef08a,#fbbf24,#f59e0b,#fde68a)',
            backgroundSize: '300% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'fs-shimmer 2s linear infinite',
            filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.8))',
          }}
        >
          FREE SPINS!
        </div>
        <div className="text-lg font-bold text-amber-200 mt-1 tracking-widest">🎰 SUPER ACE BONUS 🎰</div>
      </motion.div>

      {/* Spins count */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.45, type: 'spring', bounce: 0.6 }}
        className="flex flex-col items-center my-4"
      >
        <div
          className="w-24 h-24 rounded-full flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(135deg,#92400e,#b45309,#d97706,#f59e0b)',
            border: '3px solid #fbbf24',
            animation: 'fs-pulse-ring 1.2s ease-out infinite',
          }}
        >
          <span className="text-4xl font-black text-white leading-none">{spinsAwarded}</span>
          <span className="text-[10px] font-bold text-amber-100 uppercase tracking-widest">spins</span>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-sm text-amber-300/80 mb-5 font-medium"
      >
        Wilds are multiplied during free spins!
      </motion.p>

      {/* GO button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.93 }}
        onClick={onStart}
        className="px-10 py-3.5 rounded-full font-black text-lg text-black tracking-widest uppercase"
        style={{
          background: 'linear-gradient(135deg,#fef08a,#fbbf24,#f59e0b)',
          border: '2px solid #fde68a',
          boxShadow: '0 0 24px 6px rgba(251,191,36,0.5)',
        }}
      >
        GO! ▶
      </motion.button>
    </motion.div>
  );
}

/* ── Free Spins HUD (shown during free spins) ── */
interface FreeSpinsHUDProps {
  spinsRemaining: number;
  totalFreeWin: number;
  currentMultiplier: number;
}

export function FreeSpinsHUD({ spinsRemaining, totalFreeWin, currentMultiplier }: FreeSpinsHUDProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-4 py-2 rounded-xl mb-2"
      style={{
        background: 'linear-gradient(135deg,rgba(92,40,0,0.9),rgba(180,83,9,0.85))',
        border: '1.5px solid rgba(251,191,36,0.5)',
        boxShadow: '0 0 16px rgba(245,158,11,0.3)',
      }}
    >
      <div className="flex flex-col items-center">
        <span className="text-[9px] uppercase tracking-widest text-amber-200/70 font-bold">Free Spins</span>
        <span
          className="text-2xl font-black text-white leading-none"
          style={{ textShadow: '0 0 10px rgba(251,191,36,0.8)' }}
        >
          {spinsRemaining}
        </span>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-amber-300 font-black text-sm tracking-widest">🎰 SUPER ACE BONUS</div>
        <div className="text-xs font-bold text-amber-100 bg-amber-500/20 px-2 rounded-full border border-amber-500/40">
          Combo: x{currentMultiplier}
        </div>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[9px] uppercase tracking-widest text-amber-200/70 font-bold">Win</span>
        <span
          className="text-xl font-black leading-none"
          style={{ color: '#fbbf24', textShadow: '0 0 8px rgba(251,191,36,0.7)' }}
        >
          {totalFreeWin.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
}

/* ── Free Spins Complete ── */
interface FreeSpinsCompleteProps {
  totalWin: number;
  onContinue: () => void;
}

export function FreeSpinsComplete({ totalWin, onContinue }: FreeSpinsCompleteProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto rounded-2xl overflow-hidden"
      style={{ background: 'rgba(5,0,15,0.92)', backdropFilter: 'blur(6px)' }}
    >
      <div className="text-center p-6 space-y-6">
        <h2 className="text-3xl font-black text-amber-300 drop-shadow-md">FREE SPINS COMPLETE</h2>
        
        <div>
          <p className="text-sm font-bold text-amber-400/70 uppercase tracking-widest mb-2">Total Win</p>
          <p
            className="font-outfit text-5xl font-black text-amber-400"
            style={{ textShadow: '0 0 20px rgba(251,191,36,0.8)' }}
          >
            ₱{totalWin.toLocaleString()}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.93 }}
          onClick={onContinue}
          className="px-10 py-3 rounded-full font-black text-sm text-black tracking-widest uppercase mt-4"
          style={{
            background: 'linear-gradient(135deg,#fef08a,#fbbf24,#f59e0b)',
            border: '2px solid #fde68a',
            boxShadow: '0 0 24px 6px rgba(251,191,36,0.5)',
          }}
        >
          Return to Game
        </motion.button>
      </div>
    </motion.div>
  );
}

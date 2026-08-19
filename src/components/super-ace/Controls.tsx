'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

interface ControlsProps {
  bet: number;
  setBet: (val: number) => void;
  onSpin: () => void;
  isSpinning: boolean;
  totalWin: number;
  balance: number;
  /** Optional: free spins remaining (hides spin btn label when > 0) */
  freeSpinsRemaining?: number;
}

const BET_OPTIONS = [2, 5, 10, 20, 50, 100, 500, 1000];

const RIPPLE_STYLE = `
@keyframes spin-ripple {
  0%   { transform: scale(0.5); opacity: 0.8; }
  100% { transform: scale(2.4); opacity: 0; }
}
@keyframes btn-idle-pulse {
  0%, 100% { box-shadow: 0 0 14px 4px rgba(251,191,36,0.45), inset 0 -3px 8px rgba(0,0,0,0.35); }
  50%       { box-shadow: 0 0 28px 10px rgba(251,191,36,0.7), inset 0 -3px 8px rgba(0,0,0,0.35); }
}
@keyframes win-countup {
  0%   { transform: translateY(8px); opacity: 0; }
  100% { transform: translateY(0);   opacity: 1; }
}
`;

let rippleInjected = false;
function injectRippleStyle() {
  if (rippleInjected || typeof document === 'undefined') return;
  rippleInjected = true;
  const s = document.createElement('style');
  s.textContent = RIPPLE_STYLE;
  document.head.appendChild(s);
}

/** Smoothly counts a number up from 0 to target */
function useCountUp(target: number, duration = 600): number {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) { setDisplay(0); return; }
    const start = Date.now();
    const from = 0;

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}

export function Controls({
  bet,
  setBet,
  onSpin,
  isSpinning,
  totalWin,
  balance,
  freeSpinsRemaining = 0,
}: ControlsProps) {
  useEffect(() => { injectRippleStyle(); }, []);

  const idx = BET_OPTIONS.indexOf(bet);
  const [rippling, setRippling] = useState(false);
  const displayWin = useCountUp(totalWin);

  const prevBalance = useRef(balance);
  const [balanceDelta, setBalanceDelta] = useState<number | null>(null);

  // Flash delta when balance changes
  useEffect(() => {
    const delta = balance - prevBalance.current;
    if (delta !== 0) {
      setBalanceDelta(delta);
      const t = setTimeout(() => setBalanceDelta(null), 1800);
      prevBalance.current = balance;
      return () => clearTimeout(t);
    }
  }, [balance]);

  const prevBet = () => { if (idx > 0) setBet(BET_OPTIONS[idx - 1]); };
  const nextBet = () => { if (idx < BET_OPTIONS.length - 1) setBet(BET_OPTIONS[idx + 1]); };

  const handleSpin = () => {
    if (isSpinning || balance < bet) return;
    setRippling(true);
    setTimeout(() => setRippling(false), 500);
    onSpin();
  };

  const isFreeSpinMode = freeSpinsRemaining > 0;

  return (
    <div
      className="rounded-b-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg,#1a0a00 0%,#0d0500 100%)',
        borderTop: '2px solid #3d2410',
      }}
    >
      {/* WIN row */}
      <div
        className="flex items-center justify-center py-1.5 gap-2"
        style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid #3d2410' }}
      >
        <span className="text-[11px] text-amber-400/70 font-bold uppercase tracking-widest">WIN</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={totalWin}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="text-lg font-black font-outfit"
            style={{
              color: totalWin > 0 ? '#fbbf24' : '#6b7280',
              textShadow: totalWin > 0 ? '0 0 14px rgba(251,191,36,0.8)' : undefined,
            }}
          >
            {totalWin > 0 ? displayWin.toLocaleString() : '0.000'}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-3 px-3 py-2">

        {/* Left: Bet selector */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">
            {isFreeSpinMode ? 'Free Spin' : 'Bet'}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={prevBet}
              disabled={isSpinning || idx === 0 || isFreeSpinMode}
              className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 transition flex items-center justify-center"
            >
              <ChevronLeft className="w-3 h-3 text-amber-300" />
            </button>
            <div
              className="px-2 py-0.5 rounded-md text-sm font-black text-amber-300 min-w-[46px] text-center"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {isFreeSpinMode ? 'FREE' : bet.toLocaleString()}
            </div>
            <button
              onClick={nextBet}
              disabled={isSpinning || idx === BET_OPTIONS.length - 1 || balance < BET_OPTIONS[idx + 1] || isFreeSpinMode}
              className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 transition flex items-center justify-center"
            >
              <ChevronRight className="w-3 h-3 text-amber-300" />
            </button>
          </div>
        </div>

        {/* Center: Spin Button */}
        <div className="relative flex-shrink-0">
          {/* Ripple ring */}
          <AnimatePresence>
            {rippling && (
              <motion.div
                key="ripple"
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 2.4, opacity: 0 }}
                exit={{}}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full border-2 border-amber-400 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Idle glow blob */}
          <div
            className="absolute inset-0 rounded-full blur-md"
            style={{ background: 'rgba(251,191,36,0.45)' }}
          />

          <motion.button
            whileHover={!isSpinning && balance >= bet ? { scale: 1.07 } : {}}
            whileTap={!isSpinning && balance >= bet ? { scale: 0.91 } : {}}
            disabled={isSpinning || (!isFreeSpinMode && balance < bet)}
            onClick={handleSpin}
            className="relative disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div
              className="relative w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: isFreeSpinMode
                  ? 'linear-gradient(160deg,#fde68a,#f59e0b,#b45309)'
                  : 'linear-gradient(160deg,#fde68a,#f59e0b,#b45309)',
                border: isFreeSpinMode ? '3px solid #fde68a' : '3px solid #fde68a',
                animation: !isSpinning ? 'btn-idle-pulse 2s ease-in-out infinite' : undefined,
                boxShadow: isSpinning
                  ? 'inset 0 -3px 8px rgba(0,0,0,0.35)'
                  : undefined,
              }}
            >
              {isSpinning ? (
                <RotateCw className="w-7 h-7 text-black animate-spin" />
              ) : isFreeSpinMode ? (
                <div className="flex flex-col items-center">
                  <span className="text-black font-black text-[10px] leading-none">FREE</span>
                  <div
                    className="w-6 h-6 rounded-full border-4 border-black/60 flex items-center justify-center mt-0.5"
                    style={{ background: 'rgba(0,0,0,0.15)' }}
                  >
                    <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-black/70 ml-0.5" />
                  </div>
                </div>
              ) : (
                <div
                  className="w-7 h-7 rounded-full border-4 border-black/60 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.15)' }}
                >
                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-black/70 ml-0.5" />
                </div>
              )}
            </div>
          </motion.button>
        </div>

        {/* Right: Balance */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Balance</span>
          <div className="flex items-center gap-1 relative">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-sm font-black text-white">{balance.toLocaleString()}</span>
            {/* Delta flash */}
            <AnimatePresence>
              {balanceDelta !== null && (
                <motion.span
                  key={balanceDelta}
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -18 }}
                  exit={{}}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                  className="absolute -top-5 left-0 right-0 text-center text-[11px] font-black pointer-events-none"
                  style={{ color: balanceDelta > 0 ? '#4ade80' : '#f87171' }}
                >
                  {balanceDelta > 0 ? `+${balanceDelta}` : balanceDelta}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Balance bar */}
      <div
        className="px-3 pb-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex justify-center">
          <span className="text-[10px] text-gray-600 font-medium">
            Balance: <span className="text-amber-500/80">{balance.toLocaleString()}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Grid, WinResult } from '@/lib/super-ace/engine';
import { CardSymbol } from './CardSymbol';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface SlotGridProps {
  grid: Grid;
  wins: WinResult[];
  isShuffling?: boolean;
  /** Called once all reels have finished stopping */
  onReelsStopped?: () => void;
}

/** How many "ghost" rows blur past before the real symbols snap in */
const BLUR_ROWS = 8;
/** ms between each reel stopping (left → right stagger) */
const REEL_STAGGER_MS = 160;
/** Duration of the fast-scroll phase per reel */
const SPIN_DURATION_MS = 520;

/* ── Win line beam ── */
const WIN_BEAM_STYLE = `
@keyframes beam-sweep {
  0%   { transform: translateX(-100%); opacity: 0.9; }
  100% { transform: translateX(400%);  opacity: 0; }
}
@keyframes coin-fall {
  0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
  100% { transform: translateY(140px) rotate(720deg); opacity: 0; }
}
@keyframes reel-blur-scroll {
  0%   { transform: translateY(0); }
  100% { transform: translateY(-100%); }
}
`;

let beamInjected = false;
function injectBeamStyle() {
  if (beamInjected || typeof document === 'undefined') return;
  beamInjected = true;
  const s = document.createElement('style');
  s.textContent = WIN_BEAM_STYLE;
  document.head.appendChild(s);
}

/* ── Coin particle that falls from top of a cell ── */
function CoinParticle({ left, delay }: { left: string; delay: string }) {
  return (
    <span
      className="absolute top-0 text-yellow-400 text-sm pointer-events-none select-none"
      style={{ left, animation: `coin-fall 1s ${delay} ease-in forwards` }}
    >
      🪙
    </span>
  );
}

/* ── Win beam that sweeps across a winning row ── */
function WinBeam() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-20"
    >
      <div
        className="absolute top-0 h-full w-1/4"
        style={{
          background: 'linear-gradient(90deg,transparent,rgba(255,215,0,0.55),transparent)',
          animation: 'beam-sweep 0.7s ease-in-out',
        }}
      />
    </div>
  );
}

/* ── Spinning reel column ── */
interface ReelColumnProps {
  col: import('@/lib/super-ace/engine').GridCell[];
  colIndex: number;
  isSpinning: boolean;
  rowHeight: number;
  wins: WinResult[];
  onStopped: () => void;
}

function ReelColumn({ col, colIndex, isSpinning, rowHeight, wins, onStopped }: ReelColumnProps) {
  const [spinning, setSpinning] = useState(false);
  const [showResult, setShowResult] = useState(true);
  const stoppedRef = useRef(false);

  const winningRows = new Set<number>();
  wins.forEach(w => w.positions.forEach(p => { if (p.col === colIndex) winningRows.add(p.row); }));

  useEffect(() => {
    if (!isSpinning) return;

    stoppedRef.current = false;
    setShowResult(false);
    setSpinning(true);

    // Stop this reel after stagger delay
    const stopDelay = SPIN_DURATION_MS + colIndex * REEL_STAGGER_MS;
    const stopTimer = setTimeout(() => {
      setSpinning(false);
      setShowResult(true);
      if (!stoppedRef.current) {
        stoppedRef.current = true;
        onStopped();
      }
    }, stopDelay);

    return () => clearTimeout(stopTimer);
  }, [isSpinning, colIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="relative overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateRows: `repeat(${col.length}, ${rowHeight}px)`,
        gap: '4px',
      }}
    >
      {/* Spinning blur overlay */}
      <AnimatePresence>
        {spinning && (
          <motion.div
            key="spin-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="absolute inset-0 z-10 pointer-events-none rounded-lg overflow-hidden"
            style={{ background: 'rgba(10,0,20,0.55)' }}
          >
            {/* Blur stripes scrolling downward */}
            {Array.from({ length: BLUR_ROWS }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-full"
                style={{
                  height: `${rowHeight}px`,
                  top: `${i * (rowHeight + 4)}px`,
                  background: i % 2 === 0
                    ? 'linear-gradient(160deg,#1a0a30,#2d1a50)'
                    : 'linear-gradient(160deg,#0a001a,#1a0a30)',
                  borderRadius: 8,
                  filter: 'blur(1.5px)',
                }}
                animate={{ y: [0, rowHeight + 4, 0] }}
                transition={{
                  duration: 0.12 + i * 0.01,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ))}
            {/* Speed lines */}
            <div
              className="absolute inset-0"
              style={{
                background: 'repeating-linear-gradient(180deg,transparent,transparent 18px,rgba(255,255,255,0.04) 18px,rgba(255,255,255,0.04) 20px)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actual symbols — revealed after spinning stops */}
      {col.map((cell, rIndex) => {
        const isWinning = winningRows.has(rIndex);
        const isBigWin = isWinning && wins.some(w =>
          w.positions.some(p => p.col === colIndex && p.row === rIndex) && w.payout > 50
        );
        return (
          <motion.div
            key={`${colIndex}-${rIndex}-${cell.id}`}
            style={{ gridRow: rIndex + 1 }}
            initial={false}
            animate={
              showResult && !spinning
                ? { y: 0, opacity: 1, scale: 1 }
                : { y: 0, opacity: 0, scale: 0.9 }
            }
            transition={
              showResult
                ? {
                    type: 'spring',
                    stiffness: 380,
                    damping: 22,
                    mass: 0.6,
                    delay: 0.02,
                  }
                : { duration: 0.05 }
            }
            className="relative"
          >
            <CardSymbol
              type={cell.type}
              isGolden={cell.isGolden}
              isWinning={isWinning}
            />
            {isWinning && <WinBeam />}
            {/* Coin rain on big wins */}
            {isBigWin && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
                {['15%','35%','55%','75%'].map((l, i) => (
                  <CoinParticle key={i} left={l} delay={`${i * 0.12}s`} />
                ))}
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Bottom shadow to give depth */}
      <div
        className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none z-5"
        style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.35),transparent)' }}
      />
    </div>
  );
}

export function SlotGrid({ grid, wins, isShuffling = false, onReelsStopped }: SlotGridProps) {
  const cols = grid.length;
  const rows = grid[0]?.length ?? 4;
  const ROW_HEIGHT = 100;

  useEffect(() => { injectBeamStyle(); }, []);

  // Track how many reels have stopped
  const stoppedCount = useRef(0);
  const totalReels = cols;

  useEffect(() => {
    stoppedCount.current = 0;
  }, [isShuffling]);

  const handleReelStopped = () => {
    stoppedCount.current += 1;
    if (stoppedCount.current >= totalReels && onReelsStopped) {
      // Small extra delay so the last reel's bounce settles
      setTimeout(onReelsStopped, 200);
    }
  };

  return (
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
        {/* Reel separator lines (vertical chrome dividers) */}
        <div
          className="relative"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: '4px',
          }}
        >
          {grid.map((col, cIndex) => (
            <ReelColumn
              key={cIndex}
              col={col}
              colIndex={cIndex}
              isSpinning={isShuffling}
              rowHeight={ROW_HEIGHT}
              wins={wins}
              onStopped={handleReelStopped}
            />
          ))}

          {/* Horizontal win-line guides (subtle) */}
          {[0, 1, 2, 3].map(r => (
            <div
              key={`line-${r}`}
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: r * (ROW_HEIGHT + 4) + ROW_HEIGHT / 2,
                height: '1px',
                background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)',
              }}
            />
          ))}
        </div>

        {/* Top & bottom glare bands */}
        <div
          className="absolute top-0 left-0 right-0 h-6 pointer-events-none rounded-t-xl"
          style={{ background: 'linear-gradient(to bottom,rgba(255,255,255,0.07),transparent)' }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none rounded-b-xl"
          style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.5),transparent)' }}
        />
      </div>

      {/* Outer frame glow when spinning */}
      <AnimatePresence>
        {isShuffling && (
          <motion.div
            key="spin-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: '0 0 24px 6px rgba(245,158,11,0.35), inset 0 0 12px rgba(245,158,11,0.1)' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

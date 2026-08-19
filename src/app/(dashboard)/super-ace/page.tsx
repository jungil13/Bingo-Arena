'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  generateGrid,
  generateDudGrid,
  generateScatterGrid,
  evaluateWins,
  cascadeGrid,
  Grid,
  WinResult,
  freeSpinsForScatters,
  countScatters,
} from '@/lib/super-ace/engine';
import { SlotGrid } from '@/components/super-ace/SlotGrid';
import { Controls } from '@/components/super-ace/Controls';
import { MultiplierBar } from '@/components/super-ace/MultiplierBar';
import { FreeSpinsOverlay, FreeSpinsHUD, FreeSpinsComplete } from '@/components/super-ace/FreeSpinsOverlay';
import { useWalletStore } from '@/lib/store/wallet';
import { useSlotStore } from '@/lib/store/slotStore';
import { useAuthStore } from '@/lib/store/auth';
import { createClient } from '@/lib/supabase/client';
import { useAudio } from '@/lib/hooks/useAudio';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

type GamePhase =
  | 'idle'
  | 'spinning'       // reels are spinning
  | 'evaluating'     // win evaluation + cascade
  | 'scatter_intro'  // showing free-spins overlay
  | 'free_spin'      // free-spin round active
  | 'free_spin_end'  // showing free-spins complete summary
  | 'big_win';       // big-win celebration

export default function SuperAcePage() {
  const { config } = useSlotStore();
  const { balance, deductFunds, addFunds } = useWalletStore();
  const { user } = useAuthStore();
  const [guestId] = useState(() => `guest-${Math.random().toString(36).slice(2, 10)}`);
  const channelRef = useRef<any>(null);

  const [bet, setBet] = useState(10);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [isShuffling, setIsShuffling] = useState(false);

  const [multiplierIndex, setMultiplierIndex] = useState(0);
  const [currentWins, setCurrentWins] = useState<WinResult[]>([]);
  const [totalWin, setTotalWin] = useState(0);
  const [showBigWin, setShowBigWin] = useState(false);

  // Free-spins state
  const [freeSpinsTotal, setFreeSpinsTotal] = useState(0);
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState(0);
  const [freeSpinsWin, setFreeSpinsWin] = useState(0);
  const [pendingFreeSpins, setPendingFreeSpins] = useState(0); // from scatter trigger
  const [scatterCount, setScatterCount] = useState(0);

  const { playShuffleBeep, playMark, playBingo, playLose, startMusic, stopMusic, announce } = useAudio(true);

  const isSpinning = phase === 'spinning' || phase === 'evaluating' || phase === 'free_spin' || phase === 'scatter_intro';
  const isFreeSpinMode = freeSpinsRemaining > 0 && phase === 'free_spin';

  // Resolve callback ref (used to unblock spin loop after reels stop)
  const reelStopResolveRef = useRef<(() => void) | null>(null);

  /** Wait for all reels to stop before proceeding */
  const waitForReels = useCallback((): Promise<void> => {
    return new Promise(resolve => {
      reelStopResolveRef.current = resolve;
    });
  }, []);

  const handleReelsStopped = useCallback(() => {
    reelStopResolveRef.current?.();
    reelStopResolveRef.current = null;
  }, []);

  useEffect(() => {
    setGrid(generateGrid());
    startMusic();

    const supabase = createClient();
    const channel = supabase.channel('global-lobby', { config: { presence: { key: 'lobby' } } });
    channelRef.current = channel;

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const myName = user?.username || `Guest-${Math.random().toString(36).slice(2, 6)}`;
        channel.send({
          type: 'broadcast',
          event: 'game_activity',
          payload: { name: myName, userId: user?.id, game: 'Super Ace' }
        });
        await channel.track({
          isLobbyUser: true,
          name: myName,
          userId: user?.id || guestId,
          activity: 'Super Ace',
        });
      }
    });

    return () => {
      stopMusic();
      supabase.removeChannel(channel);
    };
  }, [startMusic, stopMusic, user]);

  /* ── Core spin logic ── */
  const runSpin = useCallback(async (isFreeSpinRound = false) => {
    const currentBet = isFreeSpinRound ? bet : bet;

    if (!isFreeSpinRound) {
      const success = deductFunds(currentBet, 'Super Ace Bet');
      if (!success) return;
    }

    setPhase('spinning');
    setMultiplierIndex(0);
    if (!isFreeSpinRound) {
      setTotalWin(0);
      setFreeSpinsWin(0);
    }
    setCurrentWins([]);
    setShowBigWin(false);

    // Start reel animations
    setIsShuffling(true);

    // Play shuffle sounds during spin
    const shuffleInterval = setInterval(() => playShuffleBeep(), 80);

    // ── Spin outcome probabilities ────────────────────────────────────
    // 40% dud  (no win, no scatter)
    // 20% scatter trigger (guaranteed 3 scatters → free spins)
    // 40% normal spin (wilds boosted to ~15% per cell to help complete BINGO lines)
    let finalGrid;
    if (!isFreeSpinRound) {
      const roll = Math.random();
      if (roll < 0.40) {
        finalGrid = generateDudGrid(5, 4);              // 40% → dud
      } else if (roll < 0.60) {
        finalGrid = generateScatterGrid(5, 4);          // 20% → scatter trigger
      } else {
        finalGrid = generateGrid(5, 4, false, true);    // 40% → normal spin WITH wild boost
      }
    } else {
      finalGrid = generateGrid(5, 4, true, false);      // free spin round — normal grid, no wild boost
    }
    setGrid(finalGrid);

    // Wait for all 5 reels to stop (SlotGrid fires onReelsStopped)
    await waitForReels();
    clearInterval(shuffleInterval);
    setIsShuffling(false);

    // Short pause, then evaluate
    await new Promise(r => setTimeout(r, 120));
    setPhase('evaluating');

    // Check for scatter / free spins trigger
    const sc = countScatters(finalGrid);
    if (sc >= 3 && !isFreeSpinRound) {
      // Find matching scatter requirement, default to 0 if not configured
      const req = config.scatterRequirements.slice().reverse().find(r => sc >= r.scatters);
      if (req) {
        const spinsAwarded = req.spinsAwarded;
        setScatterCount(sc);
        setPendingFreeSpins(spinsAwarded);
        setPhase('scatter_intro');
        return; // wait for player to tap GO
      }
    }

    await evaluateAndCascade(finalGrid, 0, isFreeSpinRound ? freeSpinsWin : 0, isFreeSpinRound);
  }, [bet, deductFunds, freeSpinsWin, playShuffleBeep, waitForReels]); // eslint-disable-line react-hooks/exhaustive-deps

  const evaluateAndCascade = async (
    currentGrid: Grid,
    mIndex: number,
    currentTotal: number,
    isFreeRound: boolean,
  ) => {
    const activeMultiplierStages = isFreeRound ? config.freeSpinMultipliers : config.normalMultipliers;
    const activeMultiplier = activeMultiplierStages[mIndex] || activeMultiplierStages[activeMultiplierStages.length - 1];
    const { wins } = evaluateWins(currentGrid, bet);

    if (wins.length > 0) {
      playMark();
      const roundWin = Math.floor(wins.reduce((sum, w) => sum + w.payout, 0) * activeMultiplier);
      const newTotal = currentTotal + roundWin;

      setCurrentWins(wins);
      setTotalWin(newTotal);
      if (isFreeRound) setFreeSpinsWin(newTotal);
      await new Promise(r => setTimeout(r, 1200));

      const nextGrid = cascadeGrid(currentGrid, wins, isFreeRound);
      setGrid(nextGrid);
      setCurrentWins([]);
      await new Promise(r => setTimeout(r, 450));

      const nextMIndex = Math.min(mIndex + 1, activeMultiplierStages.length - 1);
      if (nextMIndex > mIndex) announce(`${activeMultiplierStages[nextMIndex]} times`);
      setMultiplierIndex(nextMIndex);
      await evaluateAndCascade(nextGrid, nextMIndex, newTotal, isFreeRound);
    } else {
      // Round over
      if (currentTotal > 0) {
        if (!isFreeRound) {
          addFunds(currentTotal, 'Super Ace Win');
        }
        if (currentTotal > bet * 5) {
          playBingo();
          setShowBigWin(true);
          
          if (channelRef.current) {
            const myName = user?.username || `Guest-${Math.random().toString(36).slice(2, 6)}`;
            channelRef.current.send({
              type: 'broadcast',
              event: 'big_win',
              payload: { name: myName, userId: user?.id, amount: currentTotal, game: 'Super Ace' }
            });
          }

          setTimeout(() => setShowBigWin(false), 2800);
        } else {
          playMark();
        }
      } else {
        if (!isFreeRound) playLose();
      }

      // Continue free spins if any remain
      if (isFreeRound) {
        setFreeSpinsRemaining(prev => {
          const next = prev - 1;
          if (next <= 0) {
            // Free spins done — pay out accumulated win
            const accumulated = currentTotal;
            if (accumulated > 0) addFunds(accumulated, 'Super Ace Free Spins Win');
            setPhase('free_spin_end');
          } else {
            // Auto-trigger next free spin
            setTimeout(() => runSpin(true), 900);
            setPhase('free_spin');
          }
          return next;
        });
      } else {
        setPhase('idle');
      }
    }
  };

  const handleSpin = () => {
    if (isSpinning || balance < bet) return;
    runSpin(false);
  };

  const handleFreeSpinStart = () => {
    const awarded = pendingFreeSpins;
    setFreeSpinsTotal(awarded);
    setFreeSpinsRemaining(awarded);
    setFreeSpinsWin(0);
    setPendingFreeSpins(0);
    setPhase('free_spin');
    runSpin(true);
  };

  if (!grid) return null;

  return (
    <div className="h-full w-full overflow-y-auto bg-[#1a0a2e] p-2 md:p-4 flex flex-col items-center justify-start xl:justify-center">
      {/* Flex row: game on left, paytable on right (stacks on mobile) */}
      <div className="flex flex-col lg:flex-row items-start gap-3 w-full max-w-[720px] mx-auto">

        {/* ── Game Card (left / main) ── */}
        <div className="w-full max-w-[420px] mx-auto lg:mx-0 flex flex-col relative">

          {/* ── Header ── */}
          <div
            className="flex items-center justify-between px-3 py-2 rounded-t-2xl"
            style={{
              background: 'linear-gradient(180deg,#3d1a00 0%,#2c1000 100%)',
              borderBottom: '2px solid #5a3820',
            }}
          >
            <Link href="/lobby" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition">
              <ChevronLeft className="w-4 h-4 text-amber-300" />
            </Link>

            <div className="text-center">
              <h1 className="font-outfit text-lg font-black text-amber-300 tracking-widest uppercase leading-none">
                SuperAce
              </h1>
              {isFreeSpinMode && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest"
                >
                  Free Spin {freeSpinsTotal - freeSpinsRemaining + 1} / {freeSpinsTotal}
                </motion.p>
              )}
            </div>

            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-amber-900"
              style={{ background: 'linear-gradient(135deg,#fde68a,#f59e0b)' }}
            >
              ★
            </div>
          </div>

          {/* ── Free Spins HUD (shown during free spin bonus) ── */}
          <AnimatePresence>
            {isFreeSpinMode && (
              <div className="px-2 pt-2" style={{ background: '#1a0510' }}>
                <FreeSpinsHUD
                  spinsRemaining={freeSpinsRemaining}
                  totalFreeWin={freeSpinsWin}
                  currentMultiplier={config.freeSpinMultipliers[multiplierIndex] || config.freeSpinMultipliers[config.freeSpinMultipliers.length - 1]}
                />
              </div>
            )}
          </AnimatePresence>

          {/* ── Multiplier Bar ── */}
          {!isFreeSpinMode && (
            <div className="px-2 pt-2" style={{ background: '#1a0510' }}>
              <MultiplierBar currentMultiplier={config.normalMultipliers[multiplierIndex] || config.normalMultipliers[config.normalMultipliers.length - 1]} multipliers={config.normalMultipliers} />
            </div>
          )}

          {/* ── Slot Grid ── */}
          <div className="px-2 pb-2 relative" style={{ background: '#1a0510' }}>
            <SlotGrid
              grid={grid}
              wins={currentWins}
              isShuffling={isShuffling}
              onReelsStopped={handleReelsStopped}
            />

            {/* Scatter / Free Spins intro overlay */}
            <AnimatePresence>
              {phase === 'scatter_intro' && pendingFreeSpins > 0 && (
                <FreeSpinsOverlay
                  spinsAwarded={pendingFreeSpins}
                  scatterCount={scatterCount}
                  onStart={handleFreeSpinStart}
                />
              )}
            </AnimatePresence>

            {/* Free Spins Complete modal */}
            <AnimatePresence>
              {phase === 'free_spin_end' && (
                <FreeSpinsComplete
                  totalWin={freeSpinsWin}
                  onContinue={() => setPhase('idle')}
                />
              )}
            </AnimatePresence>

            {/* Big Win overlay */}
            <AnimatePresence>
              {showBigWin && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.3 }}
                  className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none rounded-2xl overflow-hidden"
                >
                  <div
                    className="text-center px-8 py-6 rounded-2xl"
                    style={{
                      background: 'rgba(0,0,0,0.85)',
                      border: '2.5px solid #fbbf24',
                      boxShadow: '0 0 50px rgba(251,191,36,0.6)',
                    }}
                  >
                    <p className="text-xs font-bold text-amber-400/70 uppercase tracking-widest mb-1">
                      {isFreeSpinMode ? '🎰 Free Spin Win!' : '🎰 Big Win!'}
                    </p>
                    <p
                      className="font-outfit text-4xl font-black"
                      style={{ color: '#fbbf24', textShadow: '0 0 20px rgba(251,191,36,0.8)' }}
                    >
                      +{totalWin.toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Controls ── */}
          <Controls
            bet={bet}
            setBet={setBet}
            onSpin={handleSpin}
            isSpinning={isSpinning}
            totalWin={totalWin}
            balance={balance}
            freeSpinsRemaining={freeSpinsRemaining}
          />
        </div>

        {/* ── Paytable (right side on desktop, below on mobile) ── */}
        <div className="w-full lg:w-[270px] shrink-0 space-y-2">

          {/* Card: How to Win */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.06]">
              <h3 className="text-[11px] font-semibold text-white/90 tracking-wide uppercase">How to Win</h3>
            </div>
            <div className="px-4 py-3 space-y-2">
              <p className="text-[10px] text-white/40 leading-relaxed">
                Fill an entire <span className="text-white/70 font-medium">row</span>, <span className="text-white/70 font-medium">column</span>, or <span className="text-white/70 font-medium">diagonal</span> with the same symbol.
              </p>
              <div className="space-y-1.5">
                {([
                  { icon: '➡️', label: 'Row', desc: '5 symbols across', mult: '×2', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
                  { icon: '⬇️', label: 'Column', desc: '4 symbols down', mult: '×3', bg: 'bg-blue-500/10', text: 'text-blue-400' },
                  { icon: '↘️', label: 'Diagonal', desc: '4 symbols diagonal', mult: '×5', bg: 'bg-amber-500/10', text: 'text-amber-400' },
                ] as const).map(({ icon, label, desc, mult, bg, text }) => (
                  <div key={label} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.04]">
                    <span className="text-xs">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-white/80">{label}</p>
                      <p className="text-[9px] text-white/30">{desc}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${bg} ${text}`}>{mult}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card: Symbol Values */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.06]">
              <h3 className="text-[11px] font-semibold text-white/90 tracking-wide uppercase">Symbol Values</h3>
              <p className="text-[9px] text-white/30 mt-0.5">Multiplied by your bet amount</p>
            </div>
            <div className="px-2 py-2">
              {/* Table header */}
              <div className="grid grid-cols-[28px_1fr_40px_40px_40px] gap-1 px-2 pb-1.5 mb-1 border-b border-white/[0.04]">
                <span className="text-[8px] text-white/25 font-medium" />
                <span className="text-[8px] text-white/25 font-medium" />
                <span className="text-[8px] text-white/25 font-medium text-center">Row</span>
                <span className="text-[8px] text-white/25 font-medium text-center">Col</span>
                <span className="text-[8px] text-white/25 font-medium text-center">Diag</span>
              </div>
              {/* Symbol rows */}
              {([
                { icon: 'J',  name: 'Jack',    color: '#3a86ff', base: 1  },
                { icon: 'Q',  name: 'Queen',   color: '#e63946', base: 2  },
                { icon: 'K',  name: 'King',    color: '#7c3aed', base: 3  },
                { icon: 'A',  name: 'Ace',     color: '#b45309', base: 5  },
                { icon: '♣',  name: 'Club',    color: '#22c55e', base: 8  },
                { icon: '♦',  name: 'Diamond', color: '#ec4899', base: 10 },
                { icon: '♥',  name: 'Heart',   color: '#ef4444', base: 15 },
                { icon: '♠',  name: 'Spade',   color: '#6366f1', base: 25 },
              ] as const).map(({ icon, name, color, base }, i) => (
                <div
                  key={icon}
                  className={`grid grid-cols-[28px_1fr_40px_40px_40px] gap-1 items-center px-2 py-1 rounded-md ${
                    i % 2 === 0 ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <span className="text-sm font-black text-center leading-none" style={{ color }}>{icon}</span>
                  <span className="text-[9px] text-white/50 font-medium truncate">{name}</span>
                  <span className="text-[10px] font-bold text-center" style={{ color }}>×{base * 2}</span>
                  <span className="text-[10px] font-bold text-center" style={{ color }}>×{base * 3}</span>
                  <span className="text-[10px] font-bold text-center" style={{ color }}>×{base * 5}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Special Symbols */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.06]">
              <h3 className="text-[11px] font-semibold text-white/90 tracking-wide uppercase">Special Symbols</h3>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-start gap-3 rounded-lg px-3 py-2 bg-violet-500/[0.06] border border-violet-500/[0.12]">
                <span className="text-lg leading-none mt-0.5">⚡</span>
                <div>
                  <p className="text-[10px] font-bold text-violet-400">WILD</p>
                  <p className="text-[9px] text-white/40 leading-relaxed">Substitutes for any symbol to help complete a winning line.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg px-3 py-2 bg-amber-500/[0.06] border border-amber-500/[0.12]">
                <span className="text-lg leading-none mt-0.5">⭐</span>
                <div>
                  <p className="text-[10px] font-bold text-amber-400">SCATTER ×3</p>
                  <p className="text-[9px] text-white/40 leading-relaxed">Land 3 or more anywhere on the grid to trigger 10 Free Spins!</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

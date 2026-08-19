'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  generateGrid,
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
    return () => stopMusic();
  }, [startMusic, stopMusic]);

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

    // Generate the final grid while reels "spin"
    const finalGrid = generateGrid(5, 4, isFreeSpinRound);
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
    <div className="min-h-screen flex items-center justify-center bg-[#1a0a2e]">
      {/* Portrait card — max width 420px */}
      <div className="w-full max-w-[420px] mx-auto flex flex-col relative">

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
    </div>
  );
}

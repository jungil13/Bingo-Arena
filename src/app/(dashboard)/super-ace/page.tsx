'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateGrid, evaluateWins, cascadeGrid, Grid, WinResult } from '@/lib/super-ace/engine';
import { SlotGrid } from '@/components/super-ace/SlotGrid';
import { Controls } from '@/components/super-ace/Controls';
import { MultiplierBar } from '@/components/super-ace/MultiplierBar';
import { useWalletStore } from '@/lib/store/wallet';
import { useAudio } from '@/lib/hooks/useAudio';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const MULTIPLIER_STAGES = [1, 2, 3, 5];

export default function SuperAcePage() {
  const { balance, deductFunds, addFunds } = useWalletStore();
  const [bet, setBet] = useState(10);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const [multiplierIndex, setMultiplierIndex] = useState(0);
  const [currentWins, setCurrentWins] = useState<WinResult[]>([]);
  const [totalWin, setTotalWin] = useState(0);
  const [showBigWin, setShowBigWin] = useState(false);

  const { playShuffleBeep, playMark, playBingo, playLose } = useAudio(true);

  useEffect(() => {
    setGrid(generateGrid());
  }, []);

  const handleSpin = async () => {
    if (isSpinning || balance < bet) return;

    const success = deductFunds(bet, 'Super Ace Bet');
    if (!success) return;

    setIsSpinning(true);
    setMultiplierIndex(0);
    setTotalWin(0);
    setCurrentWins([]);
    setShowBigWin(false);

    // Rapid shuffle animation
    for (let i = 0; i < 6; i++) {
      playShuffleBeep();
      setGrid(generateGrid());
      await new Promise(r => setTimeout(r, 90));
    }

    const finalGrid = generateGrid();
    setGrid(finalGrid);
    await evaluateAndCascade(finalGrid, 0, 0);
  };

  const evaluateAndCascade = async (currentGrid: Grid, mIndex: number, currentTotal: number) => {
    const activeMultiplier = MULTIPLIER_STAGES[mIndex];
    const wins = evaluateWins(currentGrid, bet);

    if (wins.length > 0) {
      playMark();
      const roundWin = Math.floor(wins.reduce((sum, w) => sum + w.payout, 0) * activeMultiplier);
      const newTotal = currentTotal + roundWin;

      setCurrentWins(wins);
      setTotalWin(newTotal);
      await new Promise(r => setTimeout(r, 1100));

      const nextGrid = cascadeGrid(currentGrid, wins);
      setGrid(nextGrid);
      setCurrentWins([]);
      await new Promise(r => setTimeout(r, 500));

      const nextMIndex = Math.min(mIndex + 1, MULTIPLIER_STAGES.length - 1);
      setMultiplierIndex(nextMIndex);
      await evaluateAndCascade(nextGrid, nextMIndex, newTotal);
    } else {
      if (currentTotal > 0) {
        addFunds(currentTotal, 'Super Ace Win');
        if (currentTotal > bet * 5) {
          playBingo();
          setShowBigWin(true);
          setTimeout(() => setShowBigWin(false), 2500);
        } else {
          playMark();
        }
      } else {
        playLose();
      }
      setIsSpinning(false);
    }
  };

  if (!grid) return null;

  return (
    /* Game page — fill remaining viewport area with neutral dark background */
    <div
      className="min-h-screen flex items-center justify-center bg-[#1a0a2e]"
    >
      {/* Portrait card — max width 420px, full height on mobile */}
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
          </div>

          {/* Coin icon placeholder */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-amber-900"
            style={{ background: 'linear-gradient(135deg,#fde68a,#f59e0b)' }}
          >
            ★
          </div>
        </div>

        {/* ── Multiplier Bar ── */}
        <div className="px-2 pt-2" style={{ background: '#1a0510' }}>
          <MultiplierBar currentMultiplier={MULTIPLIER_STAGES[multiplierIndex]} />
        </div>

        {/* ── Slot Grid ── */}
        <div className="px-2 pb-2 relative" style={{ background: '#1a0510' }}>
          <SlotGrid grid={grid} wins={currentWins} />

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
                    background: 'rgba(0,0,0,0.82)',
                    border: '2px solid #fbbf24',
                    boxShadow: '0 0 40px rgba(251,191,36,0.5)',
                  }}
                >
                  <p className="text-xs font-bold text-amber-400/70 uppercase tracking-widest mb-1">🎰 Big Win!</p>
                  <p className="font-outfit text-4xl font-black text-amber-400">+{totalWin.toLocaleString()}</p>
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
        />
      </div>
    </div>
  );
}

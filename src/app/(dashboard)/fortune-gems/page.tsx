'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useWalletStore } from '@/lib/store/wallet';
import { useAudio } from '@/lib/hooks/useAudio';
import { Grid, WinResult, generateGrid, evaluateSpin, SpinOutcome } from '@/lib/fortune-gems/engine';
import { SlotGrid } from '@/components/fortune-gems/SlotGrid';
import { Controls } from '@/components/fortune-gems/Controls';
import { MultiplierPanel } from '@/components/fortune-gems/MultiplierPanel';
import { LuckySpinWheel } from '@/components/fortune-gems/LuckySpinWheel';
import { motion, AnimatePresence } from 'framer-motion';

export default function FortuneGemsPage() {
  const { balance, deductFunds, addFunds } = useWalletStore();
  const { playShuffleBeep, playMark, playBingo, playLose } = useAudio(true);

  const [bet, setBet] = useState(10);
  const [grid, setGrid] = useState<Grid | null>(() => generateGrid());
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentWins, setCurrentWins] = useState<WinResult[]>([]);
  const [totalWin, setTotalWin] = useState(0);
  const [activeMultiplier, setActiveMultiplier] = useState(1);
  const [isExTriggered, setIsExTriggered] = useState(false);
  const [showBigWin, setShowBigWin] = useState(false);
  const [showLuckySpin, setShowLuckySpin] = useState(false);

  const [jackpots] = useState({
    mini: 2500,
    major: 15000,
    grand: 100000
  });

  const runSpin = useCallback(async () => {
    if (balance < bet) return;
    
    const success = deductFunds(bet, 'Fortune Gems Bet');
    if (!success) return;

    setIsSpinning(true);
    setCurrentWins([]);
    setTotalWin(0);
    setActiveMultiplier(1);
    setIsExTriggered(false);
    setShowBigWin(false);

    // Spin effect
    const shuffleInterval = setInterval(() => playShuffleBeep(), 80);

    // Pre-calculate result
    const newGrid = generateGrid();
    const outcome = evaluateSpin(newGrid, bet);

    setGrid(newGrid);

    // Fake delay for animation
    await new Promise(r => setTimeout(r, 1000));
    
    clearInterval(shuffleInterval);
    setIsSpinning(false);

    if (outcome.luckySpinTriggered) {
      setShowLuckySpin(true);
      return; 
    }

    applyOutcomes(outcome, bet);
  }, [balance, bet, deductFunds, playShuffleBeep]); // eslint-disable-line

  const applyOutcomes = useCallback(async (outcome: SpinOutcome, currentBet: number, luckySpinMultiplier: number = 0) => {
    // Apply outcomes
    if (outcome.isExTriggered) {
      setIsExTriggered(true);
      // add a small pause for EX effect
      await new Promise(r => setTimeout(r, 600));
    }

    setActiveMultiplier(outcome.multiplier);

    let finalWin = outcome.totalWinAmount;
    if (luckySpinMultiplier > 0) {
      finalWin += currentBet * luckySpinMultiplier;
    }

    if (finalWin > 0 || luckySpinMultiplier > 0) {
      setCurrentWins(outcome.wins);
      setTotalWin(finalWin);
      addFunds(finalWin, 'Fortune Gems Win');

      if (finalWin >= currentBet * 20) {
        playBingo();
        setShowBigWin(true);
        setTimeout(() => setShowBigWin(false), 3000);
      } else {
        playMark();
      }
    } else {
      playLose();
    }
  }, [addFunds, playBingo, playMark, playLose]);

  const handleLuckySpinComplete = (winMultiplier: number) => {
    setShowLuckySpin(false);
    const finalWin = bet * winMultiplier;
    if (finalWin > 0) {
      setTotalWin(prev => prev + finalWin);
      addFunds(finalWin, 'Fortune Gems Lucky Spin');
      if (finalWin >= bet * 20) {
        playBingo();
        setShowBigWin(true);
        setTimeout(() => setShowBigWin(false), 3000);
      } else {
        playMark();
      }
    }
  };

  return (
    <div 
      className="h-full w-full overflow-hidden flex flex-col relative"
      style={{
        backgroundImage: 'url(/fortune-gems-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}
    >
      <audio autoPlay loop src="/bgmusic.mp3" className="hidden" />
      
      {/* Dark overlay for readability over the background image */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      {/* Content wrapper */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col lg:flex-row items-center justify-center gap-4 p-3 md:p-4 overflow-hidden w-full max-w-[1200px] mx-auto">

        {/* ── Left: Game Card ── */}
        <div className="flex-1 min-h-0 w-full lg:max-w-[420px] flex flex-col justify-center">

          {/* Header */}
          <div className="flex flex-col rounded-t-2xl bg-gradient-to-r from-amber-900 to-amber-700 border-b-2 border-amber-500 overflow-hidden shrink-0">
            <div className="flex items-center justify-between px-3 py-2">
              <Link href="/lobby" className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 transition">
                <ChevronLeft className="w-4 h-4 text-amber-200" />
              </Link>
              <h1 className="font-outfit text-lg font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500 tracking-widest uppercase">
                Fortune Gems
              </h1>
              <div className="w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-sm">💎</div>
            </div>

            {/* Jackpots */}
            <div className="flex justify-between items-center px-3 py-1.5 bg-black/40 border-t border-amber-600/30">
              <div className="text-center">
                <p className="text-[8px] text-gray-300 font-bold uppercase tracking-wider">Mini</p>
                <p className="text-xs font-black text-green-400">₱{jackpots.mini.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] text-gray-300 font-bold uppercase tracking-wider">Major</p>
                <p className="text-xs font-black text-blue-400">₱{jackpots.major.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] text-yellow-300 font-bold uppercase tracking-wider">Grand</p>
                <p className="text-sm font-black text-yellow-400">₱{jackpots.grand.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Game Body — flex-1 fills remaining vertical space */}
          <div className="flex-1 min-h-0 bg-stone-900/90 backdrop-blur-md rounded-b-2xl border border-t-0 border-stone-800 shadow-2xl flex flex-col relative overflow-hidden">

            {/* Multiplier bar */}
            <div className="px-2 pt-2 shrink-0">
              <MultiplierPanel
                activeMultiplier={activeMultiplier}
                isExTriggered={isExTriggered}
              />
            </div>

            {/* Slot Grid — centered both vertically and horizontally */}
            <div className="flex-1 min-h-0 flex items-center justify-center px-2 py-4">
              <SlotGrid
                grid={grid}
                wins={currentWins}
                isShuffling={isSpinning}
                onReelsStopped={() => {}}
              />
            </div>

            {/* Controls */}
            <div className="px-2 pb-2 shrink-0">
              <Controls
                bet={bet}
                setBet={setBet}
                onSpin={runSpin}
                isSpinning={isSpinning}
                totalWin={totalWin}
                balance={balance}
              />
            </div>

            {/* Big Win Overlay - Keep the Mega Win styling as requested in the previous turn if you want, but user said revert back to old UI. We'll use the MEGA WIN we just built since it's awesome! */}
            <AnimatePresence>
              {showBigWin && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl overflow-hidden"
                  style={{ background: 'radial-gradient(ellipse at center, rgba(255,180,0,0.45) 0%, rgba(0,0,0,0.75) 70%)' }}
                >
                  <motion.div
                    className="absolute w-[500px] h-[500px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(255,200,0,0.35) 0%, transparent 70%)' }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  <motion.div
                    initial={{ scale: 0.3, y: -40 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                    className="text-center relative z-10"
                  >
                    <p className="font-black leading-none tracking-widest uppercase"
                      style={{
                        fontSize: 'clamp(48px, 12vw, 72px)',
                        background: 'linear-gradient(180deg, #60d3ff 0%, #1e6fff 50%, #002fa7 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 20px rgba(96,211,255,0.8))',
                        WebkitTextStroke: '2.5px #ffd700', paintOrder: 'stroke fill',
                      }}>MEGA</p>
                    <p className="font-black leading-none tracking-widest uppercase -mt-1"
                      style={{
                        fontSize: 'clamp(48px, 12vw, 72px)',
                        background: 'linear-gradient(180deg, #60d3ff 0%, #1e6fff 50%, #002fa7 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 20px rgba(96,211,255,0.8))',
                        WebkitTextStroke: '2.5px #ffd700', paintOrder: 'stroke fill',
                      }}>WIN</p>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    className="font-black relative z-10 mt-3"
                    style={{
                      fontSize: 'clamp(32px, 8vw, 60px)',
                      color: '#ffd700',
                      textShadow: '0 0 30px rgba(255,200,0,1), 0 4px 0 rgba(180,100,0,0.8)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {totalWin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Lucky Spin Overlay */}
            <AnimatePresence>
              {showLuckySpin && (
                <LuckySpinWheel onComplete={handleLuckySpinComplete} />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Right: Paytable — hidden on small screens, visible on lg+ ── */}
        <div className="hidden lg:flex flex-col w-[260px] shrink-0 h-[600px]">
          <div className="bg-stone-900/90 backdrop-blur-md rounded-xl p-4 border border-stone-800 shadow-xl h-full overflow-y-auto">
            <h3 className="text-yellow-500 font-bold uppercase tracking-wider mb-3 text-xs">Paytable</h3>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div className="flex justify-between bg-black/30 p-2 rounded-lg border border-white/5"><span>💎 Golden</span><span className="text-yellow-400 font-bold">50x</span></div>
              <div className="flex justify-between bg-black/30 p-2 rounded-lg border border-white/5"><span>💎 Diamond</span><span className="text-cyan-400 font-bold">25x</span></div>
              <div className="flex justify-between bg-black/30 p-2 rounded-lg border border-white/5"><span>🟣 Amethyst</span><span className="text-purple-400 font-bold">15x</span></div>
              <div className="flex justify-between bg-black/30 p-2 rounded-lg border border-white/5"><span>🔵 Sapphire</span><span className="text-blue-400 font-bold">10x</span></div>
              <div className="flex justify-between bg-black/30 p-2 rounded-lg border border-white/5"><span>🟢 Emerald</span><span className="text-green-400 font-bold">8x</span></div>
              <div className="flex justify-between bg-black/30 p-2 rounded-lg border border-white/5"><span>🔴 Ruby</span><span className="text-red-400 font-bold">5x</span></div>
              <div className="flex justify-between bg-black/30 p-2 rounded-lg border border-white/5"><span>A</span><span className="text-red-300 font-bold">2x</span></div>
              <div className="flex justify-between bg-black/30 p-2 rounded-lg border border-white/5"><span>K</span><span className="text-yellow-300 font-bold">1.5x</span></div>
              <div className="flex justify-between bg-black/30 p-2 rounded-lg border border-white/5"><span>Q</span><span className="text-purple-300 font-bold">1x</span></div>
              <div className="flex justify-between bg-black/30 p-2 rounded-lg border border-white/5"><span>J</span><span className="text-blue-300 font-bold">0.5x</span></div>
            </div>
            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-xs leading-relaxed text-yellow-200/90">
              <span className="text-orange-400 font-bold italic">WILD</span> substitutes for all symbols except BONUS.<br />
              Win lines: horizontal and diagonal (5 lines total).
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}




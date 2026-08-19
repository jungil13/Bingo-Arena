'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCw, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

interface ControlsProps {
  bet: number;
  setBet: (val: number) => void;
  onSpin: () => void;
  isSpinning: boolean;
  totalWin: number;
  balance: number;
}

const BET_OPTIONS = [2, 5, 10, 20, 50, 100, 500, 1000];

export function Controls({ bet, setBet, onSpin, isSpinning, totalWin, balance }: ControlsProps) {
  const idx = BET_OPTIONS.indexOf(bet);

  const prevBet = () => {
    if (idx > 0) setBet(BET_OPTIONS[idx - 1]);
  };
  const nextBet = () => {
    if (idx < BET_OPTIONS.length - 1) setBet(BET_OPTIONS[idx + 1]);
  };

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
        <span
          className="text-lg font-black font-outfit"
          style={{
            color: totalWin > 0 ? '#fbbf24' : '#6b7280',
            textShadow: totalWin > 0 ? '0 0 12px rgba(251,191,36,0.7)' : undefined,
          }}
        >
          {totalWin > 0 ? totalWin.toLocaleString() : '0.000'}
        </span>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-3 px-3 py-2">

        {/* Left: Bet selector */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Bet</span>
          <div className="flex items-center gap-1">
            <button
              onClick={prevBet}
              disabled={isSpinning || idx === 0}
              className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 transition flex items-center justify-center"
            >
              <ChevronLeft className="w-3 h-3 text-amber-300" />
            </button>
            <div
              className="px-2 py-0.5 rounded-md text-sm font-black text-amber-300 min-w-[46px] text-center"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {bet.toLocaleString()}
            </div>
            <button
              onClick={nextBet}
              disabled={isSpinning || idx === BET_OPTIONS.length - 1 || balance < BET_OPTIONS[idx + 1]}
              className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 transition flex items-center justify-center"
            >
              <ChevronRight className="w-3 h-3 text-amber-300" />
            </button>
          </div>
        </div>

        {/* Center: Spin Button */}
        <motion.button
          whileHover={!isSpinning && balance >= bet ? { scale: 1.06 } : {}}
          whileTap={!isSpinning && balance >= bet ? { scale: 0.93 } : {}}
          disabled={isSpinning || balance < bet}
          onClick={onSpin}
          className="relative flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 rounded-full blur-md bg-amber-400/50" />
          <div
            className="relative w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(160deg,#fde68a,#f59e0b,#b45309)',
              border: '3px solid #fde68a',
              boxShadow: 'inset 0 -3px 8px rgba(0,0,0,0.35)',
            }}
          >
            {isSpinning ? (
              <RotateCw className="w-7 h-7 text-black animate-spin" />
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

        {/* Right: Balance & Auto */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Balance</span>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-sm font-black text-white">{balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Balance full-width bar */}
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

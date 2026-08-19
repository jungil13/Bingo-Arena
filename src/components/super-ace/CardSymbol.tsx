'use client';

import { SymbolType } from '@/lib/super-ace/engine';
import { motion } from 'framer-motion';

interface CardSymbolProps {
  type: SymbolType;
  isGolden?: boolean;
  isWinning?: boolean;
}

const SUIT_CONFIG: Partial<Record<SymbolType, { icon: string; color: string; label: string }>> = {
  SPADE:   { icon: '♠', color: '#1a1a2e', label: 'A' },
  HEART:   { icon: '♥', color: '#e63946', label: 'A' },
  CLUB:    { icon: '♣', color: '#1a1a2e', label: 'A' },
  DIAMOND: { icon: '♦', color: '#e63946', label: 'A' },
};

const FACE_CONFIG: Partial<Record<SymbolType, { label: string; color: string; bg: string }>> = {
  J: { label: 'J', color: '#3a86ff', bg: 'linear-gradient(135deg,#dbeafe,#eff6ff)' },
  Q: { label: 'Q', color: '#e63946', bg: 'linear-gradient(135deg,#fee2e2,#fff5f5)' },
  K: { label: 'K', color: '#7c3aed', bg: 'linear-gradient(135deg,#ede9fe,#f5f3ff)' },
  A: { label: 'A', color: '#b45309', bg: 'linear-gradient(135deg,#fef3c7,#fffbeb)' },
};

export function CardSymbol({ type, isGolden, isWinning }: CardSymbolProps) {
  const isSpecial = type === 'WILD' || type === 'SCATTER';
  const suitCfg = SUIT_CONFIG[type];
  const faceCfg = FACE_CONFIG[type];

  /* ── WILD ── */
  if (type === 'WILD') {
    return (
      <motion.div
        key="wild"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{
          scale: isWinning ? [1, 1.08, 1] : 1,
          opacity: 1,
        }}
        transition={{ duration: 0.3, repeat: isWinning ? Infinity : 0, repeatType: 'loop' }}
        className="w-full h-full rounded-xl overflow-hidden flex flex-col items-center justify-center relative shadow-lg"
        style={{
          background: 'linear-gradient(160deg,#4f46e5,#7c3aed,#9333ea)',
          boxShadow: isWinning ? '0 0 18px 4px rgba(147,51,234,0.85)' : undefined,
        }}
      >
        <div className="text-[10px] sm:text-xs font-black text-purple-200 tracking-widest uppercase mb-0.5">Wild</div>
        <div className="text-xl sm:text-2xl font-black text-white drop-shadow">★</div>
        {isWinning && <div className="absolute inset-0 bg-white/10 rounded-xl animate-pulse" />}
      </motion.div>
    );
  }

  /* ── SCATTER ── */
  if (type === 'SCATTER') {
    return (
      <motion.div
        key="scatter"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{
          scale: isWinning ? [1, 1.08, 1] : 1,
          opacity: 1,
        }}
        transition={{ duration: 0.3, repeat: isWinning ? Infinity : 0, repeatType: 'loop' }}
        className="w-full h-full rounded-xl overflow-hidden flex flex-col items-center justify-center relative shadow-lg"
        style={{
          background: 'linear-gradient(160deg,#b45309,#d97706,#f59e0b)',
          boxShadow: isWinning ? '0 0 18px 4px rgba(245,158,11,0.85)' : undefined,
        }}
      >
        <div className="text-[10px] sm:text-xs font-black text-amber-100 tracking-widest uppercase mb-0.5">Scatter</div>
        <div className="text-xl sm:text-2xl font-black text-white drop-shadow">✦</div>
        {isWinning && <div className="absolute inset-0 bg-white/10 rounded-xl animate-pulse" />}
      </motion.div>
    );
  }

  /* ── SUIT CARDS (♠♥♣♦) ── */
  if (suitCfg) {
    const isRed = type === 'HEART' || type === 'DIAMOND';
    const cardBg = isGolden
      ? 'linear-gradient(135deg,#fef08a,#fde047,#facc15)'
      : 'linear-gradient(160deg,#f8fafc,#e2e8f0)';
    return (
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{
          scale: isWinning ? [1, 1.08, 1] : 1,
          opacity: 1,
        }}
        transition={{ duration: 0.3, repeat: isWinning ? Infinity : 0, repeatType: 'loop' }}
        className="w-full h-full rounded-xl overflow-hidden flex flex-col items-center justify-center relative shadow-md"
        style={{
          background: cardBg,
          border: isWinning ? '2px solid #fbbf24' : isGolden ? '2px solid #f59e0b' : '1.5px solid rgba(0,0,0,0.12)',
          boxShadow: isWinning ? '0 0 16px 3px rgba(251,191,36,0.8)' : undefined,
        }}
      >
        {/* Top-left corner */}
        <div className="absolute top-0.5 left-1 flex flex-col items-center leading-none">
          <span className="text-[9px] sm:text-[10px] font-bold" style={{ color: suitCfg.color }}>
            {suitCfg.label}
          </span>
          <span className="text-[9px] sm:text-[10px]" style={{ color: isRed ? '#e63946' : suitCfg.color }}>
            {suitCfg.icon}
          </span>
        </div>
        {/* Center suit */}
        <div
          className="text-2xl sm:text-3xl md:text-4xl font-black"
          style={{ color: isRed ? '#e63946' : suitCfg.color, textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}
        >
          {suitCfg.icon}
        </div>
        {isWinning && <div className="absolute inset-0 bg-yellow-300/20 rounded-xl animate-pulse" />}
      </motion.div>
    );
  }

  /* ── FACE CARDS (J Q K A) ── */
  if (faceCfg) {
    const cardBg = isGolden
      ? 'linear-gradient(135deg,#fef08a,#fde047,#facc15)'
      : faceCfg.bg;
    return (
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{
          scale: isWinning ? [1, 1.08, 1] : 1,
          opacity: 1,
        }}
        transition={{ duration: 0.3, repeat: isWinning ? Infinity : 0, repeatType: 'loop' }}
        className="w-full h-full rounded-xl overflow-hidden flex flex-col items-center justify-center relative shadow-md"
        style={{
          background: cardBg,
          border: isWinning ? '2px solid #fbbf24' : isGolden ? '2px solid #f59e0b' : '1.5px solid rgba(0,0,0,0.12)',
          boxShadow: isWinning ? '0 0 16px 3px rgba(251,191,36,0.8)' : undefined,
        }}
      >
        {/* Top label */}
        <div className="absolute top-0.5 left-1 text-[9px] sm:text-[10px] font-black" style={{ color: faceCfg.color }}>
          {faceCfg.label}
        </div>
        {/* Big center letter */}
        <div
          className="text-2xl sm:text-3xl md:text-4xl font-black leading-none"
          style={{ color: faceCfg.color, textShadow: '0 1px 3px rgba(0,0,0,0.18)' }}
        >
          {faceCfg.label}
        </div>
        {isGolden && !isWinning && (
          <div className="absolute inset-0 bg-yellow-400/10 rounded-xl" />
        )}
        {isWinning && <div className="absolute inset-0 bg-yellow-300/20 rounded-xl animate-pulse" />}
      </motion.div>
    );
  }

  return null;
}

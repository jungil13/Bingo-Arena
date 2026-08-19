'use client';

import { SymbolType } from '@/lib/super-ace/engine';
import { motion, useAnimationControls } from 'framer-motion';
import { useEffect } from 'react';

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

const FACE_CONFIG: Partial<Record<SymbolType, { label: string; color: string; bg: string; winGlow: string }>> = {
  J: { label: 'J', color: '#3a86ff', bg: 'linear-gradient(135deg,#dbeafe,#eff6ff)', winGlow: 'rgba(58,134,255,0.7)' },
  Q: { label: 'Q', color: '#e63946', bg: 'linear-gradient(135deg,#fee2e2,#fff5f5)', winGlow: 'rgba(230,57,70,0.7)' },
  K: { label: 'K', color: '#7c3aed', bg: 'linear-gradient(135deg,#ede9fe,#f5f3ff)', winGlow: 'rgba(124,58,237,0.7)' },
  A: { label: 'A', color: '#b45309', bg: 'linear-gradient(135deg,#fef3c7,#fffbeb)', winGlow: 'rgba(180,83,9,0.7)' },
};

/* ── Shine sweep keyframe (injected once) ── */
const SHINE_STYLE = `
@keyframes card-shine {
  0%   { transform: translateX(-100%) rotate(25deg); }
  100% { transform: translateX(250%) rotate(25deg); }
}
@keyframes scatter-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes scatter-pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(251,191,36,0.7), 0 0 24px 6px rgba(251,191,36,0.5); }
  70%  { box-shadow: 0 0 0 14px rgba(251,191,36,0), 0 0 24px 6px rgba(251,191,36,0.5); }
  100% { box-shadow: 0 0 0 0 rgba(251,191,36,0), 0 0 24px 6px rgba(251,191,36,0.5); }
}
@keyframes wild-arc {
  0%   { box-shadow: 0 0 0 0 rgba(139,92,246,0.8), 0 0 20px 4px rgba(139,92,246,0.5); }
  50%  { box-shadow: 0 0 0 8px rgba(139,92,246,0.2), 0 0 28px 8px rgba(139,92,246,0.7); }
  100% { box-shadow: 0 0 0 0 rgba(139,92,246,0), 0 0 20px 4px rgba(139,92,246,0.5); }
}
@keyframes golden-sparkle {
  0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
  50%       { opacity: 1; transform: scale(1) rotate(180deg); }
}
@keyframes float-star {
  0%   { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-32px) scale(0); opacity: 0; }
}
`;

let shineInjected = false;
function injectShineStyle() {
  if (shineInjected || typeof document === 'undefined') return;
  shineInjected = true;
  const s = document.createElement('style');
  s.textContent = SHINE_STYLE;
  document.head.appendChild(s);
}

/* ── Sparkle dots for golden cards ── */
function GoldenSparkles() {
  const dots = [
    { top: '8%',  left: '12%', delay: '0s'    },
    { top: '72%', left: '80%', delay: '0.4s'  },
    { top: '55%', left: '8%',  delay: '0.7s'  },
    { top: '18%', left: '78%', delay: '1.1s'  },
  ];
  return (
    <>
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute text-yellow-300 text-[9px] pointer-events-none select-none"
          style={{
            top: d.top, left: d.left,
            animation: `golden-sparkle 1.6s ${d.delay} ease-in-out infinite`,
          }}
        >✦</span>
      ))}
    </>
  );
}

/* ── Floating stars when scatter lands ── */
function ScatterStars() {
  return (
    <>
      {['10%','50%','85%','30%','70%'].map((left, i) => (
        <span
          key={i}
          className="absolute bottom-2 text-yellow-200 text-[10px] pointer-events-none select-none"
          style={{
            left,
            animation: `float-star 1.2s ${(i * 0.18).toFixed(2)}s ease-out infinite`,
          }}
        >★</span>
      ))}
    </>
  );
}

export function CardSymbol({ type, isGolden, isWinning }: CardSymbolProps) {
  useEffect(() => { injectShineStyle(); }, []);

  const isSpecial = type === 'WILD' || type === 'SCATTER';
  const suitCfg = SUIT_CONFIG[type];
  const faceCfg = FACE_CONFIG[type];

  /* ─────────── SCATTER / SUPER ACE ─────────── */
  if (type === 'SCATTER') {
    return (
      <motion.div
        key="scatter"
        initial={{ scale: 0.7, opacity: 0, rotateY: -90 }}
        animate={{
          scale: isWinning ? [1, 1.1, 0.97, 1.04, 1] : 1,
          opacity: 1,
          rotateY: 0,
        }}
        transition={{
          opacity: { duration: 0.25 },
          rotateY: { duration: 0.4, ease: 'easeOut' },
          scale: isWinning
            ? { duration: 0.6, repeat: Infinity, repeatType: 'loop' }
            : { duration: 0.35, ease: 'backOut' },
        }}
        className="w-full h-full rounded-xl overflow-hidden flex flex-col items-center justify-center relative"
        style={{
          background: 'linear-gradient(160deg,#92400e,#b45309,#d97706,#f59e0b,#fbbf24)',
          backgroundSize: '300% 100%',
          animation: 'scatter-shimmer 2.5s linear infinite',
          border: isWinning ? '2.5px solid #fde68a' : '2px solid #f59e0b',
          boxShadow: isWinning
            ? undefined
            : '0 0 12px 2px rgba(251,191,36,0.5)',
          animationName: isWinning ? 'scatter-pulse-ring' : 'scatter-shimmer',
        }}
      >
        {/* Foil overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.22) 50%,transparent 70%)',
            backgroundSize: '200% 100%',
            animation: 'scatter-shimmer 2s linear infinite',
          }}
        />

        <div className="text-[9px] sm:text-[10px] font-black text-amber-100 tracking-widest uppercase mb-0.5 z-10">
          Super Ace
        </div>
        <div
          className="text-2xl sm:text-3xl font-black z-10 drop-shadow-lg"
          style={{ color: '#fff', textShadow: '0 0 12px rgba(251,191,36,1), 0 2px 4px rgba(0,0,0,0.5)' }}
        >
          A
        </div>
        <div className="text-[10px] sm:text-xs font-black text-amber-200 z-10">✦✦✦</div>

        {isWinning && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ animation: 'scatter-pulse-ring 1s ease-out infinite' }}
          />
        )}
        <ScatterStars />
      </motion.div>
    );
  }

  /* ─────────── WILD ─────────── */
  if (type === 'WILD') {
    return (
      <motion.div
        key="wild"
        initial={{ scale: 0.7, opacity: 0, rotateY: 90 }}
        animate={{
          scale: isWinning ? [1, 1.1, 0.97, 1.04, 1] : 1,
          opacity: 1,
          rotateY: 0,
        }}
        transition={{
          opacity: { duration: 0.25 },
          rotateY: { duration: 0.4, ease: 'easeOut' },
          scale: isWinning
            ? { duration: 0.55, repeat: Infinity, repeatType: 'loop' }
            : { duration: 0.35, ease: 'backOut' },
        }}
        className="w-full h-full rounded-xl overflow-hidden flex flex-col items-center justify-center relative"
        style={{
          background: 'linear-gradient(160deg,#312e81,#4f46e5,#7c3aed,#9333ea,#a855f7)',
          border: isWinning ? '2.5px solid #c4b5fd' : '2px solid #7c3aed',
          boxShadow: isWinning
            ? '0 0 0 0 rgba(139,92,246,0)'
            : '0 0 12px 3px rgba(139,92,246,0.5)',
          animationName: isWinning ? 'wild-arc' : undefined,
          animation: isWinning ? 'wild-arc 0.9s ease-in-out infinite' : undefined,
        }}
      >
        {/* Electric shine */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg,transparent 25%,rgba(196,181,253,0.3) 50%,transparent 75%)',
            backgroundSize: '200% 100%',
            animation: 'scatter-shimmer 1.8s linear infinite',
          }}
        />

        <div className="text-[9px] sm:text-[10px] font-black text-purple-200 tracking-widest uppercase mb-0.5 z-10">Wild</div>
        <div
          className="text-xl sm:text-2xl font-black text-white z-10"
          style={{ textShadow: '0 0 14px rgba(196,181,253,0.9)' }}
        >
          ⚡
        </div>
        <div className="text-[9px] font-black text-purple-300 tracking-widest z-10">WILD</div>

        {isWinning && (
          <div className="absolute inset-0 bg-purple-400/15 rounded-xl pointer-events-none animate-pulse" />
        )}
      </motion.div>
    );
  }

  /* ─────────── SUIT CARDS (♠♥♣♦) ─────────── */
  if (suitCfg) {
    const isRed = type === 'HEART' || type === 'DIAMOND';
    const cardBg = isGolden
      ? 'linear-gradient(135deg,#fef08a,#fde047,#facc15,#eab308)'
      : 'linear-gradient(160deg,#f8fafc,#e2e8f0)';
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0, rotateX: -30 }}
        animate={{
          scale: isWinning ? [1, 1.08, 0.98, 1.04, 1] : 1,
          opacity: 1,
          rotateX: 0,
        }}
        transition={{
          opacity: { duration: 0.2 },
          rotateX: { duration: 0.35, ease: 'easeOut' },
          scale: isWinning
            ? { duration: 0.55, repeat: Infinity, repeatType: 'loop' }
            : { duration: 0.3, ease: 'backOut' },
        }}
        className="w-full h-full rounded-xl overflow-hidden flex flex-col items-center justify-center relative"
        style={{
          background: cardBg,
          border: isWinning
            ? '2.5px solid #fbbf24'
            : isGolden
            ? '2px solid #f59e0b'
            : '1.5px solid rgba(0,0,0,0.12)',
          boxShadow: isWinning
            ? `0 0 18px 5px ${isRed ? 'rgba(230,57,70,0.6)' : 'rgba(30,30,60,0.6)'}, 0 0 36px 8px rgba(251,191,36,0.4)`
            : isGolden
            ? '0 0 12px 3px rgba(251,191,36,0.4)'
            : undefined,
        }}
      >
        {/* Card shine sweep */}
        <div
          className="absolute top-0 left-0 w-6 h-full pointer-events-none"
          style={{
            background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)',
            animation: 'card-shine 2.5s ease-in-out infinite',
            animationDelay: `${Math.random() * 2}s`,
          }}
        />

        {/* Top-left corner */}
        <div className="absolute top-0.5 left-1 flex flex-col items-center leading-none z-10">
          <span className="text-[9px] sm:text-[10px] font-bold" style={{ color: suitCfg.color }}>
            {suitCfg.label}
          </span>
          <span className="text-[9px] sm:text-[10px]" style={{ color: isRed ? '#e63946' : suitCfg.color }}>
            {suitCfg.icon}
          </span>
        </div>

        {/* Center suit */}
        <div
          className="text-2xl sm:text-3xl md:text-4xl font-black z-10"
          style={{
            color: isRed ? '#e63946' : suitCfg.color,
            textShadow: isWinning
              ? `0 0 12px ${isRed ? '#e63946' : '#1a1a2e'}`
              : '0 1px 2px rgba(0,0,0,0.15)',
          }}
        >
          {suitCfg.icon}
        </div>

        {isGolden && <GoldenSparkles />}
        {isWinning && <div className="absolute inset-0 bg-yellow-300/20 rounded-xl animate-pulse pointer-events-none" />}
      </motion.div>
    );
  }

  /* ─────────── FACE CARDS (J Q K A) ─────────── */
  if (faceCfg) {
    const cardBg = isGolden
      ? 'linear-gradient(135deg,#fef08a,#fde047,#facc15,#eab308)'
      : faceCfg.bg;
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0, rotateX: -30 }}
        animate={{
          scale: isWinning ? [1, 1.08, 0.98, 1.04, 1] : 1,
          opacity: 1,
          rotateX: 0,
        }}
        transition={{
          opacity: { duration: 0.2 },
          rotateX: { duration: 0.35, ease: 'easeOut' },
          scale: isWinning
            ? { duration: 0.55, repeat: Infinity, repeatType: 'loop' }
            : { duration: 0.3, ease: 'backOut' },
        }}
        className="w-full h-full rounded-xl overflow-hidden flex flex-col items-center justify-center relative"
        style={{
          background: cardBg,
          border: isWinning
            ? `2.5px solid ${faceCfg.color}`
            : isGolden
            ? '2px solid #f59e0b'
            : '1.5px solid rgba(0,0,0,0.12)',
          boxShadow: isWinning
            ? `0 0 20px 6px ${faceCfg.winGlow}, 0 0 36px 10px rgba(251,191,36,0.2)`
            : isGolden
            ? '0 0 12px 3px rgba(251,191,36,0.4)'
            : undefined,
        }}
      >
        {/* Card shine sweep */}
        <div
          className="absolute top-0 left-0 w-6 h-full pointer-events-none"
          style={{
            background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)',
            animation: 'card-shine 2.8s ease-in-out infinite',
          }}
        />

        {/* Top label */}
        <div
          className="absolute top-0.5 left-1 text-[9px] sm:text-[10px] font-black z-10"
          style={{ color: isGolden ? '#92400e' : faceCfg.color }}
        >
          {faceCfg.label}
        </div>

        {/* Big center letter */}
        <div
          className="text-3xl sm:text-4xl md:text-5xl font-black leading-none z-10"
          style={{
            color: isGolden ? '#92400e' : faceCfg.color,
            textShadow: isWinning
              ? `0 0 14px ${faceCfg.winGlow}`
              : '0 1px 3px rgba(0,0,0,0.18)',
          }}
        >
          {faceCfg.label}
        </div>

        {isGolden && <GoldenSparkles />}
        {isWinning && <div className="absolute inset-0 bg-yellow-300/20 rounded-xl animate-pulse pointer-events-none" />}
      </motion.div>
    );
  }

  return null;
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LuckySpinWheelProps {
  onComplete: (winMultiplier: number) => void;
}

const REWARDS = [
  { label: '2x', value: 2, color: '#facc15' },
  { label: '5x', value: 5, color: '#38bdf8' },
  { label: '10x', value: 10, color: '#a855f7' },
  { label: '20x', value: 20, color: '#ef4444' },
  { label: '50x', value: 50, color: '#22c55e' },
  { label: '100x', value: 100, color: '#f97316' },
  { label: 'Jackpot', value: 500, color: '#fbbf24' },
  { label: 'Try Again', value: 0, color: '#94a3b8' },
];

export function LuckySpinWheel({ onComplete }: LuckySpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedReward, setSelectedReward] = useState<number | null>(null);

  const startSpin = () => {
    if (spinning) return;
    setSpinning(true);

    // Determine result (mocking server logic here)
    const rand = Math.random();
    let resultIndex = 0;
    if (rand < 0.05) resultIndex = 6; // Jackpot
    else if (rand < 0.15) resultIndex = 5; // 100x
    else if (rand < 0.30) resultIndex = 4; // 50x
    else if (rand < 0.50) resultIndex = 3; // 20x
    else if (rand < 0.70) resultIndex = 2; // 10x
    else if (rand < 0.85) resultIndex = 1; // 5x
    else if (rand < 0.95) resultIndex = 0; // 2x
    else resultIndex = 7; // Try Again

    const segmentAngle = 360 / REWARDS.length;
    // Calculate exact angle to stop at the center of the winning segment
    const targetAngle = 360 * 5 + (360 - (resultIndex * segmentAngle));

    setRotation(targetAngle);

    setTimeout(() => {
      setSelectedReward(REWARDS[resultIndex].value);
      setTimeout(() => {
        onComplete(REWARDS[resultIndex].value);
      }, 3000);
    }, 5000); // 5 seconds spin animation
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm rounded-2xl overflow-hidden">
      <div className="relative flex flex-col items-center justify-center w-full h-full p-4">
        
        <h2 className="text-3xl font-black text-yellow-400 mb-8 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
          Lucky Spin!
        </h2>

        {/* Wheel Container */}
        <div className="relative w-[280px] h-[280px]">
          {/* Pointer */}
          <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 w-8 h-8 z-10 text-red-500 text-3xl drop-shadow-md">
            ▼
          </div>

          <motion.div
            className="w-full h-full rounded-full border-4 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.5)] overflow-hidden relative"
            animate={{ rotate: rotation }}
            transition={{ duration: 5, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {REWARDS.map((reward, i) => {
              const rotateAngle = i * (360 / REWARDS.length);
              return (
                <div
                  key={i}
                  className="absolute top-0 left-1/2 w-[140px] h-[140px] origin-bottom-left"
                  style={{
                    transform: `rotate(${rotateAngle}deg) skewY(${90 - (360 / REWARDS.length)}deg)`,
                    backgroundColor: reward.color,
                    borderRight: '2px solid rgba(0,0,0,0.2)'
                  }}
                >
                  <div
                    className="absolute bottom-4 left-4 text-white font-black text-sm uppercase drop-shadow-md"
                    style={{ transform: `skewY(-${90 - (360 / REWARDS.length)}deg) rotate(22.5deg)` }}
                  >
                    {reward.label}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        <button
          onClick={startSpin}
          disabled={spinning}
          className="mt-12 px-8 py-3 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-black text-xl tracking-wider shadow-lg active:scale-95 disabled:opacity-50 transition-transform"
        >
          {spinning ? 'SPINNING...' : 'TAP TO SPIN'}
        </button>

        <AnimatePresence>
          {selectedReward !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/80"
            >
              <div className="text-center">
                <p className="text-yellow-400 font-bold text-2xl uppercase tracking-widest mb-2">You Won</p>
                <p className="text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
                  {selectedReward > 0 ? `${selectedReward}x Bet!` : 'Nothing!'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
      </div>
    </div>
  );
}

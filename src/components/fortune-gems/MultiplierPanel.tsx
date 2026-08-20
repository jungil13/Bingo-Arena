import { motion, AnimatePresence } from 'framer-motion';

interface MultiplierPanelProps {
  activeMultiplier: number;
  isExTriggered: boolean;
}

const MULTIPLIERS = [1, 2, 3, 5, 10, 25, 50];

export function MultiplierPanel({ activeMultiplier, isExTriggered }: MultiplierPanelProps) {
  return (
    <div className="flex flex-row items-center gap-1.5 p-2 bg-black/60 rounded-xl border border-gray-800 shadow-2xl w-full shrink-0 overflow-hidden relative mb-3">
      
      {/* EX Animation overlay */}
      <AnimatePresence>
        {isExTriggered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-yellow-500/20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-32 h-32 absolute border-4 border-yellow-400 rounded-full border-t-transparent border-b-transparent"
            />
            <span className="text-yellow-400 font-black text-2xl drop-shadow-md z-30 transform -rotate-12">EX!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-[10px] text-center font-bold text-gray-400 uppercase tracking-widest border-r border-gray-700 pr-2 mr-1 shrink-0">
        Mult
      </div>
      
      {/* Render multipliers from top to bottom (highest to lowest) */}
      {[...MULTIPLIERS].reverse().map((mult) => {
        const isActive = activeMultiplier === mult;
        
        return (
          <div
            key={mult}
            className={`flex-1 flex items-center justify-center rounded-md border transition-all duration-300 relative py-1 ${
              isActive
                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.6)] z-10 scale-105'
                : 'bg-gray-900 border-gray-700 text-gray-600 opacity-60'
            }`}
          >
            <span className={`font-black ${isActive ? 'text-black text-base' : 'text-xs'}`}>
              {mult}×
            </span>
            
            {/* Active Glow */}
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-md border-2 border-white/50"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

import { motion } from 'framer-motion';

interface ControlsProps {
  bet: number;
  setBet: (b: number) => void;
  onSpin: () => void;
  isSpinning: boolean;
  totalWin: number;
  balance: number;
}

export function Controls({ bet, setBet, onSpin, isSpinning, totalWin, balance }: ControlsProps) {
  const BET_OPTIONS = [5, 10, 20, 50, 100];

  return (
    <div className="w-full p-4 rounded-xl bg-gradient-to-t from-gray-900 to-gray-800 border border-gray-700 shadow-xl flex flex-col gap-4">
      {/* HUD Info */}
      <div className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-gray-700">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Balance</span>
          <span className="text-sm font-black text-white">₱{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        
        <div className="flex flex-col items-center flex-1 mx-4">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Win</span>
          <motion.span
            key={totalWin}
            initial={{ scale: 1.5, color: '#fbbf24' }}
            animate={{ scale: 1, color: totalWin > 0 ? '#fbbf24' : '#9ca3af' }}
            className="text-lg font-black"
          >
            ₱{totalWin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </motion.span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Bet</span>
          <span className="text-sm font-black text-amber-400">₱{bet.toLocaleString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Bet Selection */}
        <div className="flex-1 flex gap-1 bg-black/30 p-1 rounded-lg overflow-x-auto no-scrollbar">
          {BET_OPTIONS.map(val => (
            <button
              key={val}
              disabled={isSpinning}
              onClick={() => setBet(val)}
              className={`flex-1 min-w-[40px] py-2 rounded font-bold text-xs transition-colors ${
                bet === val 
                  ? 'bg-amber-500 text-black shadow-inner' 
                  : 'text-gray-400 hover:bg-white/10 disabled:opacity-50'
              }`}
            >
              {val}
            </button>
          ))}
        </div>

        {/* Spin Button */}
        <button
          disabled={isSpinning || balance < bet}
          onClick={onSpin}
          className="relative w-20 h-20 shrink-0 rounded-full flex items-center justify-center font-black text-2xl uppercase tracking-wider disabled:opacity-50 transition-transform active:scale-95"
          style={{
            background: 'linear-gradient(145deg, #16a34a, #15803d)',
            boxShadow: '0 8px 0 #14532d, inset 0 4px 10px rgba(255,255,255,0.3)',
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.4)',
          }}
        >
          {isSpinning ? '...' : 'SPIN'}
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, TrendingDown, Gift, Star,
  ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import { useWalletStore } from '@/lib/store/wallet';

export default function WalletPage() {
  const { balance, transactions, redeemDailyBonus } = useWalletStore();
  const [mounted, setMounted] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const handleRedeem = () => {
    const ok = redeemDailyBonus();
    setRedeemMsg(ok ? 'Daily bonus claimed!' : 'Already claimed today.');
    setTimeout(() => setRedeemMsg(null), 3000);
  };

  const totalWon  = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalSpent = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

  if (!mounted) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Wallet</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your virtual points and transactions.</p>
      </div>

      {/* Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg,#6d28d9 0%,#7c3aed 50%,#4f46e5 100%)' }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              <Wallet className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Virtual Points</span>
            </div>
            <Star className="w-5 h-5 text-yellow-300" />
          </div>
          <p className="text-sm font-medium text-white/70 mb-1">Current Balance</p>
          <p className="text-4xl font-bold tracking-tight">{balance.toLocaleString()}</p>
          <p className="text-xs text-white/50 mt-1">pts</p>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Earned', value: totalWon, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Total Spent',  value: totalSpent, icon: TrendingDown, color: 'text-red-500',  bg: 'bg-red-50',   border: 'border-red-100' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-2xl border ${border} p-4 shadow-sm`}
          >
            <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value.toLocaleString()}</p>
          </motion.div>
        ))}
      </div>

      {/* Daily Bonus */}
      <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Gift className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">Daily Bonus</p>
            <p className="text-xs text-gray-400">Claim 10,000 pts once per day</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleRedeem}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            Claim
          </button>
          {redeemMsg && (
            <p className={`text-[10px] font-medium ${redeemMsg.includes('claimed!') ? 'text-green-500' : 'text-red-400'}`}>
              {redeemMsg}
            </p>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800">Transactions</h2>
          <span className="text-xs text-gray-400">{transactions.length} records</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            transactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {tx.type === 'credit'
                    ? <ArrowDownRight className="w-4 h-4 text-green-600" />
                    : <ArrowUpRight className="w-4 h-4 text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{tx.reason}</p>
                  <p className="text-[11px] text-gray-400">
                    {new Date(tx.date).toLocaleDateString()} · {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${tx.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'credit' ? '+' : '-'}{tx.amount.toLocaleString()}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

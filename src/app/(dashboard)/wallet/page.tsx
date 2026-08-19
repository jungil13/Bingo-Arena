'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Gift, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth';

// Mock Transactions
const MOCK_TRANSACTIONS = [
  { id: 'tx-1', type: 'debit', amount: 100, reason: 'Joined Beginner Room', date: new Date().toISOString() },
  { id: 'tx-2', type: 'credit', amount: 500, reason: 'Game Prize', date: new Date(Date.now() - 3600000).toISOString() },
  { id: 'tx-3', type: 'credit', amount: 10000, reason: 'Welcome Bonus', date: new Date(Date.now() - 86400000).toISOString() },
];

export default function WalletPage() {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState(10400); // 10000 + 500 - 100
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);

  const handleGetDemoCoins = () => {
    setBalance(prev => prev + 1000);
    setTransactions(prev => [
      {
        id: `tx-${Date.now()}`,
        type: 'credit',
        amount: 1000,
        reason: 'Daily Demo Bonus',
        date: new Date().toISOString()
      },
      ...prev
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-outfit text-3xl font-bold mb-2">Virtual Wallet</h1>
        <p className="text-muted-foreground">Manage your virtual coins and view transaction history.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 glass-card rounded-2xl p-8 border border-primary/30 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-8">
              <span className="text-muted-foreground font-medium flex items-center gap-2">
                <WalletIcon className="w-5 h-5 text-primary" /> Current Balance
              </span>
              <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium border border-white/10">
                Virtual Coins
              </div>
            </div>
            
            <div>
              <div className="text-5xl font-outfit font-bold neon-text-gold text-gold tracking-tight mb-2">
                {balance.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Updated just now</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground text-sm font-medium">Total Won</span>
              <ArrowUpRight className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              500 <span className="text-sm text-muted-foreground font-normal">coins</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground text-sm font-medium">Total Played</span>
              <ArrowDownRight className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              100 <span className="text-sm text-muted-foreground font-normal">coins</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex justify-between items-center mt-12 mb-6">
        <h2 className="font-outfit text-2xl font-bold">Transaction History</h2>
        <Button 
          onClick={handleGetDemoCoins}
          className="bg-accent hover:bg-accent/80 text-white rounded-full font-medium"
        >
          <Gift className="w-4 h-4 mr-2" />
          Get Demo Coins
        </Button>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="divide-y divide-white/5">
          {transactions.map((tx) => (
            <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === 'credit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {tx.type === 'credit' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-medium">{tx.reason}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className={`font-bold text-lg ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                {tx.type === 'credit' ? '+' : '-'}{tx.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
